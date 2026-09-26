import type { CPElement } from "@/types/curriculum-master";
import { db } from "@/database";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { providerFromEnv, buildMasterSummary } from "../ai/provider";
import type { Result } from "@/lib/zod";
import { Ok, Fail } from "@/lib/zod";

const schema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    phase: { type: "string" },
    elements: {
      type: "array",
      items: {
        type: "object",
        properties: { element: { type: "string" }, capaianPembelajaran: { type: "string" } },
        required: ["element", "capaianPembelajaran"],
      },
      minItems: 1,
    },
    generalContext: { type: "string" },
    needsReview: { type: "boolean" },
  },
  required: ["subject", "phase", "elements"],
};

export async function generateCP(projectId: string): Promise<Result<{ needsReview: boolean; generatedElements: number }>> {
  const masterRaw = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!masterRaw) return Fail("Curriculum Master tidak ditemukan.");

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
    cp: null,
    learningObjectives: [],
    learningSequences: [],
    assessmentCriteria: [],
    annualProgram: [],
    semesterProgram: [],
    modules: [],
    worksheets: [],
    version: masterRaw.version,
  });

  const prompt = `Anda ahli Kurikulum Merdeka. Buat CP untuk ${masterRaw.subject} Fase ${masterRaw.phase}.\n${masterSummary}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();

  try {
    const res = await provider.generateStructured<{ subject: string; phase: string; elements: CPElement[]; needsReview?: boolean; generalContext?: string }>({
      input: prompt,
      schema,
    });

    const durationMs = Date.now() - start;
    const elements = res.output.elements || [];
    const needsReview = !!res.output.needsReview || elements.length === 0;

    await db.curriculumContext.update({
      where: { projectId },
      data: {
        cp: {
          subject: res.output.subject,
          phase: res.output.phase,
          elements,
          learningOutcomes: [],
          generalContext: res.output.generalContext || "",
        },
        version: { increment: 1 },
      },
    });

    await db.aiGenerationLog.create({
      data: { projectId, provider: provider.name, model: res.model, operation: "GENERATE_CP", status: "SUCCESS", requestId, durationMs, metadata: { generatedElements: elements.length } as Prisma.InputJsonValue },
    });

    return Ok({ needsReview, generatedElements: elements.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({ data: { projectId, provider: "unknown", operation: "GENERATE_CP", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start } });
    return Fail(`Gagal generate CP: ${msg}`);
  }
}
