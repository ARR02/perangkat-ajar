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
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          atpId: { type: "string" },
          title: { type: "string" },
          allocation: { type: "string" },
          targetStudents: { type: "string" },
          learningModel: { type: "string" },
          pancasilaProfile: { type: "array", items: { type: "string" } },
          coreActivities: {
            type: "object",
            properties: {
              opening: { type: "array", items: { type: "string" } },
              main: { type: "array", items: { type: "string" } },
              closing: { type: "array", items: { type: "string" } },
            },
            required: ["opening", "main", "closing"],
          },
          assessments: {
            type: "object",
            properties: {
              diagnostic: { type: "string" },
              formative: { type: "string" },
              summative: { type: "string" },
            },
          },
          mediaAndResources: { type: "array", items: { type: "string" } },
          needsReview: { type: "boolean" },
        },
        required: ["id", "atpId", "title", "allocation", "learningModel", "coreActivities"],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["modules"],
};

export async function generateModul(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
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
    annualProgram: master.annualProgram as any[],
    semesterProgram: master.semesterProgram as any[],
    modules: [],
    worksheets: [],
    version: master.version,
  });

  const prompt = `Buat Modul Ajar (RPP Plus) Kurikulum Merdeka yang komprehensif untuk setiap alur ATP berikut.\nSetiap modul harus memiliki langkah pembelajaran (Pendahuluan/Opening, Inti/Main, Penutup/Closing), Profil Pelajar Pancasila, Asesmen (Diagnostik, Formatif, Sumatif), serta Media & Sumber Belajar.\nFormat ID Modul: MODUL-01, MODUL-02, dst.\n\nDaftar ATP:\n${atps.map((a) => `${a.id}: ${a.materialScope || a.tpDescription} (${a.allocatedHours || 2} JP)`).join("\n")}\n\n${summary}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();
  try {
    const res = await provider.generateStructured<{ modules: any[]; needsReview?: boolean }>({
      input: prompt,
      schema,
    });
    const rawModules = res.output.modules || [];

    const modules = rawModules.map((item, index) => {
      const matchingAtp = atps.find((a) => a.id === item.atpId) || atps[index % atps.length];
      const hours = matchingAtp?.allocatedHours || master.weeklyHours || 2;
      
      const opening = Array.isArray(item.coreActivities?.opening) && item.coreActivities.opening.length > 0
        ? item.coreActivities.opening
        : ["Guru membuka pembelajaran dengan salam, berdoa, dan memeriksa kehadiran siswa.", "Guru menyampaikan apersepsi dan tujuan pembelajaran hari ini."];
      
      const main = Array.isArray(item.coreActivities?.main) && item.coreActivities.main.length > 0
        ? item.coreActivities.main
        : ["Siswa mengeksplorasi materi secara mandiri dan berkelompok.", "Diskusi kelompok memecahkan masalah kontekstual yang diberikan guru.", "Presentasi hasil karya dan tanggapan antar kelompok."];
      
      const closing = Array.isArray(item.coreActivities?.closing) && item.coreActivities.closing.length > 0
        ? item.coreActivities.closing
        : ["Guru bersama siswa membuat kesimpulan dan refleksi pembelajaran.", "Pemberian tindak lanjut/tugas serta penutup dengan doa."];

      return {
        id: item.id || `MODUL-${String(index + 1).padStart(2, "0")}`,
        atpId: matchingAtp ? matchingAtp.id : item.atpId,
        title: item.title || `Modul Ajar: ${matchingAtp?.materialScope || matchingAtp?.tpDescription || `Pertemuan ${index + 1}`}`,
        allocation: item.allocation || `${hours} JP (${hours * 40} Menit)`,
        targetStudents: item.targetStudents || "Reguler / Tipikal",
        learningModel: item.learningModel || "Problem-Based Learning (PBL)",
        pancasilaProfile: Array.isArray(item.pancasilaProfile) && item.pancasilaProfile.length > 0
          ? item.pancasilaProfile
          : ["Bernalar Kritis", "Gotong Royong", "Mandiri"],
        coreActivities: {
          opening,
          main,
          closing,
        },
        assessments: {
          diagnostic: item.assessments?.diagnostic || "Pertanyaan pemantik lisan sebelum materi",
          formative: item.assessments?.formative || "Observasi diskusi & lembar LKPD",
          summative: item.assessments?.summative || "Tes tertulis di akhir lingkup materi",
        },
        mediaAndResources: Array.isArray(item.mediaAndResources) && item.mediaAndResources.length > 0
          ? item.mediaAndResources
          : ["Slide Presentasi / Modul Digital", "Lembar Kerja Peserta Didik (LKPD)", "Buku Paket Kemendikbud"],
        needsReview: !!item.needsReview || false,
      };
    });

    await db.curriculumContext.update({
      where: { projectId },
      data: { modules: modules as Prisma.InputJsonValue, version: { increment: 1 } },
    });
    await db.aiGenerationLog.create({
      data: {
        projectId,
        provider: provider.name,
        model: res.model,
        operation: "GENERATE_MODUL",
        status: "SUCCESS",
        requestId,
        durationMs: Date.now() - start,
        metadata: { count: modules.length } as Prisma.InputJsonValue,
      },
    });
    return Ok({ needsReview: !!res.output.needsReview, generated: modules.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({
      data: { projectId, provider: "unknown", operation: "GENERATE_MODUL", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start },
    });
    return Fail(`Gagal Modul Ajar: ${msg}`);
  }
}