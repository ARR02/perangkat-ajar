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
    sequences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          order: { type: "number" },
          tpId: { type: "string" },
          tpDescription: { type: "string" },
          materialScope: { type: "string" },
          allocatedHours: { type: "number" },
          semester: { type: "string" },
          assessmentPlan: { type: "string" },
          pedagogicalApproach: { type: "string" },
        },
        required: ["id", "order", "tpId", "materialScope", "allocatedHours"],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["sequences"],
};

export async function generateATP(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
  const masterRaw = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!masterRaw) return Fail("Curriculum Master tidak ditemukan.");
  const tps = (masterRaw.learningObjectives as any[]) || [];
  if (!tps.length) return Fail("TP belum tersedia.");

  const masterSummary = buildMasterSummary({
    school: masterRaw.school as { name: string },
    teacher: masterRaw.teacher as { name: string },
    subject: masterRaw.subject,
    phase: masterRaw.phase,
    grade: masterRaw.grade,
    semester: masterRaw.semester,
    academicYear: masterRaw.academicYear,
    weeklyHours: masterRaw.weeklyHours ?? 4,
    curriculum: masterRaw.curriculum,
    cp: masterRaw.cp as any,
    learningObjectives: tps,
    learningSequences: [],
    assessmentCriteria: [],
    annualProgram: [],
    semesterProgram: [],
    modules: [],
    worksheets: [],
    version: masterRaw.version,
  });

  const prompt = `Urutkan Tujuan Pembelajaran (TP) berikut menjadi Alur Tujuan Pembelajaran (ATP) yang logis dan kronologis. ID format ATP-01, ATP-02, dst.\nDaftar TP:\n${tps.map((t) => `${t.id}: ${t.description}`).join("\n")}\n\n${masterSummary}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();
  try {
    const res = await provider.generateStructured<{ sequences: any[]; needsReview?: boolean }>({ input: prompt, schema });
    const rawSequences = res.output.sequences || [];
    
    // Normalisasi dan lengkapi referensi TP
    const sequences = rawSequences.map((seq, index) => {
      const matchingTp = tps.find((t) => t.id === seq.tpId) || tps[index % tps.length];
      return {
        id: seq.id || `ATP-${String(index + 1).padStart(2, "0")}`,
        order: Number(seq.order) || index + 1,
        tpId: matchingTp ? matchingTp.id : seq.tpId,
        tpDescription: seq.tpDescription || (matchingTp ? matchingTp.description : ""),
        materialScope: seq.materialScope || (matchingTp ? matchingTp.scopeOfMaterial || matchingTp.description : "Materi Pembelajaran"),
        allocatedHours: Number(seq.allocatedHours) || masterRaw.weeklyHours || 2,
        semester: seq.semester || masterRaw.semester || "1",
        assessmentPlan: seq.assessmentPlan || "Formatif dan Sumatif",
        pedagogicalApproach: seq.pedagogicalApproach || "Konstruktivisme & Diskusi Terbimbing",
      };
    });

    await db.curriculumContext.update({ where: { projectId }, data: { learningSequences: sequences as Prisma.InputJsonValue, version: { increment: 1 } } });
    await db.aiGenerationLog.create({ data: { projectId, provider: provider.name, model: res.model, operation: "GENERATE_ATP", status: "SUCCESS", requestId, durationMs: Date.now() - start, metadata: { count: sequences.length } as Prisma.InputJsonValue } });
    return Ok({ needsReview: !!res.output.needsReview, generated: sequences.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({ data: { projectId, provider: "unknown", operation: "GENERATE_ATP", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start } });
    return Fail(`Gagal ATP: ${msg}`);
  }
}
