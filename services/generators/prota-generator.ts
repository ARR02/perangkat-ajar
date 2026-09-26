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
          semester: { type: "string" },
        },
        required: ["no", "atpId", "materialTopic", "allocatedHours", "semester"],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["program"],
};

export async function generateProta(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
  const master = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!master) return Fail("Curriculum Master tidak ditemukan.");

  const atps = (master.learningSequences as any[]) || [];
  if (!atps.length) return Fail("ATP belum tersedia. Silakan buat ATP terlebih dahulu.");

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
    annualProgram: [],
    semesterProgram: [],
    modules: [],
    worksheets: [],
    version: master.version,
  });

  const prompt = `Buat Program Tahunan (PROTA) Kurikulum Merdeka untuk mata pelajaran ${master.subject} Kelas ${master.grade} Tahun Ajaran ${master.academicYear}.\nAlokasikan setiap ATP ke dalam semester 1 dan 2 beserta jam pelajarannya.\nDaftar ATP yang harus dialokasikan:\n${atps.map((a) => `${a.id}: ${a.materialScope || a.tpDescription} (${a.allocatedHours || 2} JP)`).join("\n")}\n\n${summary}`;

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
      return {
        no: Number(item.no) || index + 1,
        atpId: matchingAtp ? matchingAtp.id : item.atpId,
        materialTopic: item.materialTopic || matchingAtp?.materialScope || matchingAtp?.tpDescription || `Topik Pembelajaran ${index + 1}`,
        allocatedHours: Number(item.allocatedHours) || matchingAtp?.allocatedHours || master.weeklyHours || 2,
        semester: item.semester ? String(item.semester) : (index < atps.length / 2 ? "1" : "2"),
      };
    });

    await db.curriculumContext.update({ where: { projectId }, data: { annualProgram: program as Prisma.InputJsonValue, version: { increment: 1 } } });
    await db.aiGenerationLog.create({ data: { projectId, provider: provider.name, model: res.model, operation: "GENERATE_PROTA", status: "SUCCESS", requestId, durationMs: Date.now() - start, metadata: { count: program.length } as Prisma.InputJsonValue } });
    return Ok({ needsReview: !!res.output.needsReview, generated: program.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({ data: { projectId, provider: "unknown", operation: "GENERATE_PROTA", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start } });
    return Fail(`Gagal PROTA: ${msg}`);
  }
}
