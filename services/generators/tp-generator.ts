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
    objectives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          element: { type: "string" },
          relatedCPElement: { type: "string" },
          description: { type: "string" },
          competency: { type: "string" },
          scopeOfMaterial: { type: "string" },
        },
        required: ["id", "code", "relatedCPElement", "description"],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["objectives"],
};

export async function generateTP(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
  const masterRaw = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!masterRaw) return Fail("Curriculum Master tidak ditemukan.");
  const cp = masterRaw.cp as any;
  if (!cp?.elements?.length) return Fail("CP belum tersedia. Buat CP terlebih dahulu.");

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
    cp,
    learningObjectives: [],
    learningSequences: [],
    assessmentCriteria: [],
    annualProgram: [],
    semesterProgram: [],
    modules: [],
    worksheets: [],
    version: masterRaw.version,
  });

  const prompt = `Turunkan Capaian Pembelajaran (CP) berikut menjadi Tujuan Pembelajaran (TP) yang terukur (Kompetensi + Lingkup Materi).\nFormat ID: TP-01, TP-02, dst.\nKode: misal 8.1, 8.2, dst.\nPastikan relatedCPElement dan element sama dengan salah satu Elemen CP berikut: ${cp.elements.map((e: any) => `"${e.element}"`).join(", ")}.\n\n${masterSummary}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();
  try {
    const res = await provider.generateStructured<{ objectives: any[]; needsReview?: boolean }>({ input: prompt, schema });
    const rawObjectives = res.output.objectives || [];

    const availableElements = cp.elements.map((e: any) => e.element);

    const objectives = rawObjectives.map((tp, index) => {
      const matchedElement = availableElements.find((e: string) => e === tp.relatedCPElement || e === tp.element) || availableElements[index % availableElements.length];
      return {
        id: tp.id || `TP-${String(index + 1).padStart(2, "0")}`,
        code: tp.code || `${masterRaw.grade}.${index + 1}`,
        element: tp.element || matchedElement,
        relatedCPElement: matchedElement,
        description: tp.description || `Memahami dan menerapkan materi kompetensi ${index + 1}`,
        competency: tp.competency || "Memahami dan Menerapkan",
        scopeOfMaterial: tp.scopeOfMaterial || "Materi Pokok",
      };
    });

    await db.curriculumContext.update({ where: { projectId }, data: { learningObjectives: objectives as Prisma.InputJsonValue, version: { increment: 1 } } });
    await db.aiGenerationLog.create({ data: { projectId, provider: provider.name, model: res.model, operation: "GENERATE_TP", status: "SUCCESS", requestId, durationMs: Date.now() - start, metadata: { count: objectives.length } as Prisma.InputJsonValue } });
    return Ok({ needsReview: !!res.output.needsReview, generated: objectives.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({ data: { projectId, provider: "unknown", operation: "GENERATE_TP", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start } });
    return Fail(`Gagal TP: ${msg}`);
  }
}
