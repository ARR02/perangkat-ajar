import { env } from "@/lib/env";
import type { CurriculumMaster } from "@/types/curriculum-master";

export interface StructuredRequest {
  input: string;
  schema: object;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface StructuredResponse<T = Record<string, unknown>> {
  output: T;
  model: string;
  durationMs: number;
}

export interface AIProvider {
  name: string;
  generateStructured<T>(req: StructuredRequest): Promise<StructuredResponse<T>>;
}

let geminiProviderPromise: Promise<AIProvider> | null = null;

async function loadGeminiProvider(): Promise<AIProvider> {
  const mod = await import("./gemini-provider");
  return new mod.GeminiProvider();
}

export async function providerFromEnv(): Promise<AIProvider> {
  const provider = env.AI_PROVIDER?.toLowerCase();
  if (provider === "gemini") {
    if (!geminiProviderPromise) geminiProviderPromise = loadGeminiProvider();
    return geminiProviderPromise;
  }

  return {
    name: "stub",
    async generateStructured<T>(): Promise<StructuredResponse<T>> {
      throw new Error(
        `Provider AI belum terkonfigurasi atau tidak didukung (${env.AI_PROVIDER}). Harap atur AI_PROVIDER & AI_API_KEY pada server.`
      );
    },
  };
}

export function buildMasterSummary(master: CurriculumMaster) {
  const parts = [
    `Sekolah: ${master.school.name}`,
    `Guru: ${master.teacher.name}`,
    `Kurikulum: ${master.curriculum}`,
    `Fase: ${master.phase}`,
    `Kelas: ${master.grade}`,
    `Semester: ${master.semester}`,
    `Tahun Ajaran: ${master.academicYear}`,
    `Mata Pelajaran: ${master.subject}`,
    `JP/Minggu: ${master.weeklyHours}`,
  ];

  if (master.cp) {
    parts.push(
      `CP:\n${master.cp.elements.map((e, i) => `${i + 1}. [${e.element}] ${e.capaianPembelajaran}`).join("\n")}`
    );
  }

  return parts.join("\n");
}