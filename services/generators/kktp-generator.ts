/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { providerFromEnv } from "../ai/provider";
import type { Result } from "@/lib/zod";
import { Ok, Fail } from "@/lib/zod";

const schema = {
  type: "object",
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          tpId: { type: "string" },
          indicators: { type: "array", items: { type: "string" } },
          achievementCriteria: { type: "string" },
          assessmentEvidence: { type: "string" },
          achievementCategory: {
            type: "string",
            enum: ["Perlu Bimbingan", "Cukup", "Baik", "Sangat Baik"],
          },
          instruments: { type: "array", items: { type: "string" } },
        },
        required: [
          "id",
          "tpId",
          "indicators",
          "achievementCriteria",
          "assessmentEvidence",
          "achievementCategory",
        ],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["criteria"],
};

export async function generateKKTP(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
  const masterRaw = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!masterRaw) return Fail("Curriculum Master tidak ditemukan.");
  const tps = (masterRaw.learningObjectives as any[]) || [];
  if (!tps.length) return Fail("TP belum tersedia.");

  const prompt = `Buat Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis Kurikulum Merdeka untuk setiap TP berikut. ID format KKTP-01, KKTP-02, dst.\nKategori capaian pilih salah satu: 'Perlu Bimbingan', 'Cukup', 'Baik', 'Sangat Baik'.\nDaftar TP:\n${tps.map((t) => `${t.id}: ${t.description}`).join("\n")}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();
  try {
    const res = await provider.generateStructured<{ criteria: any[]; needsReview?: boolean }>({ input: prompt, schema });
    const rawCriteria = res.output.criteria || [];

    const allowedCategories = new Set(["Perlu Bimbingan", "Cukup", "Baik", "Sangat Baik"]);

    const criteria = rawCriteria.map((item, index) => {
      const matchingTp = tps.find((t) => t.id === item.tpId) || tps[index % tps.length];
      const indicators = Array.isArray(item.indicators) && item.indicators.length > 0
        ? item.indicators
        : [`Mampu menguasai materi ${matchingTp?.description || "terkait"}`];
      const category = allowedCategories.has(item.achievementCategory)
        ? item.achievementCategory
        : "Baik";

      return {
        id: item.id || `KKTP-${String(index + 1).padStart(2, "0")}`,
        tpId: matchingTp ? matchingTp.id : item.tpId,
        indicators,
        achievementCriteria: item.achievementCriteria || `Peserta didik mencapai indikator dengan kriteria ketuntasan minimal 75%.`,
        assessmentEvidence: item.assessmentEvidence || `Hasil tes formatif dan unjuk kerja siswa.`,
        achievementCategory: category,
        instruments: Array.isArray(item.instruments) && item.instruments.length > 0
          ? item.instruments
          : ["Rubrik Penilaian", "Tes Tertulis"],
      };
    });

    await db.curriculumContext.update({ where: { projectId }, data: { assessmentCriteria: criteria as Prisma.InputJsonValue, version: { increment: 1 } } });
    await db.aiGenerationLog.create({ data: { projectId, provider: provider.name, model: res.model, operation: "GENERATE_KKTP", status: "SUCCESS", requestId, durationMs: Date.now() - start, metadata: { count: criteria.length } as Prisma.InputJsonValue } });
    return Ok({ needsReview: !!res.output.needsReview, generated: criteria.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({ data: { projectId, provider: "unknown", operation: "GENERATE_KKTP", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start } });
    return Fail(`Gagal KKTP: ${msg}`);
  }
}
