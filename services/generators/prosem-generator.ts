/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { providerFromEnv, buildMasterSummary } from "../ai/provider";
import type { Result } from "@/lib/zod";
import { Ok, Fail } from "@/lib/zod";

const schema = {
  type: "object",
  properties: {
    program: {
      type: "array",
      items: {
        type: "object",
        properties: {
          no: { type: "number" },
          atpId: { type: "string" },
          materialTopic: { type: "string" },
          allocatedHours: { type: "number" },
          monthAllocations: {
            type: "object",
            description: "Alokasi jam per minggu dalam setiap bulan, contoh: { 'Juli': [2, 2, 0, 0], 'Agustus': [0, 0, 2, 2] }",
          },
        },
        required: ["no", "atpId", "materialTopic", "allocatedHours"],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["program"],
};

export async function generateProsem(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
  const master = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!master) return Fail("Curriculum Master tidak ditemukan.");

  const atps = (master.learningSequences as any[]) || [];
  if (!atps.length) return Fail("ATP belum tersedia. Buat ATP terlebih dahulu.");

  const prota = (master.annualProgram as any[]) || [];

  const summary = buildMasterSummary({
    school: master.school as { name: string },
    teacher: master.teacher as { name: string },
    subject: master.subject,
    phase: master.phase,
    grade: master.grade,
    semester: master.semester,
    academicYear: master.academicYear,
    weeklyHours: master.weeklyHours ?? 4,
    curriculum: master.curriculum,
    cp: master.cp as any,
    learningObjectives: master.learningObjectives as any[],
    learningSequences: atps,
    assessmentCriteria: master.assessmentCriteria as any[],
    annualProgram: prota,
    semesterProgram: [],
    modules: [],
    worksheets: [],
    version: master.version,
  });

  const isSem1 = master.semester === "1" || master.semester.toLowerCase().includes("ganjil");
  const defaultMonths = isSem1
    ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];

  const prompt = `Buat Program Semester (PROSEM) Kurikulum Merdeka untuk ${master.subject} Kelas ${master.grade} Semester ${master.semester}.\nDistribusikan jam pelajaran ATP ke dalam bulan: ${defaultMonths.join(", ")} dengan rincian per minggu (4 minggu per bulan).\n\n${summary}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();
  try {
    const res = await provider.generateStructured<{ program: any[]; needsReview?: boolean }>({
      input: prompt,
      schema,
    });
    const rawProgram = res.output.program || [];

    const program = rawProgram.map((item, index) => {
      const matchingAtp = atps.find((a) => a.id === item.atpId) || atps[index % atps.length];
      const hours = Number(item.allocatedHours) || matchingAtp?.allocatedHours || master.weeklyHours || 2;

      // Pastikan monthAllocations memiliki format Record<string, number[]>
      let monthAllocations: Record<string, number[]> = {};
      if (item.monthAllocations && typeof item.monthAllocations === "object" && !Array.isArray(item.monthAllocations)) {
        for (const [m, weeks] of Object.entries(item.monthAllocations)) {
          if (Array.isArray(weeks)) {
            monthAllocations[m] = weeks.map((w) => Number(w) || 0);
          }
        }
      }

      // Default jika kosong
      if (Object.keys(monthAllocations).length === 0) {
        monthAllocations = {};
        const activeMonth = defaultMonths[index % defaultMonths.length];
        defaultMonths.forEach((m) => {
          monthAllocations[m] = m === activeMonth ? [Math.ceil(hours / 2), Math.floor(hours / 2), 0, 0] : [0, 0, 0, 0];
        });
      }

      return {
        no: Number(item.no) || index + 1,
        atpId: matchingAtp ? matchingAtp.id : item.atpId,
        materialTopic: item.materialTopic || matchingAtp?.materialScope || matchingAtp?.tpDescription || `Topik ${index + 1}`,
        allocatedHours: hours,
        monthAllocations,
      };
    });

    await db.curriculumContext.update({
      where: { projectId },
      data: { semesterProgram: program as Prisma.InputJsonValue, version: { increment: 1 } },
    });
    await db.aiGenerationLog.create({
      data: {
        projectId,
        provider: provider.name,
        model: res.model,
        operation: "GENERATE_PROSEM",
        status: "SUCCESS",
        requestId,
        durationMs: Date.now() - start,
        metadata: { count: program.length } as Prisma.InputJsonValue,
      },
    });
    return Ok({ needsReview: !!res.output.needsReview, generated: program.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({
      data: { projectId, provider: "unknown", operation: "GENERATE_PROSEM", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start },
    });
    return Fail(`Gagal PROSEM: ${msg}`);
  }
}