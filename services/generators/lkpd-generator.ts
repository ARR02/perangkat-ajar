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
    worksheets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          modulId: { type: "string" },
          title: { type: "string" },
          instructions: { type: "array", items: { type: "string" } },
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "number" },
                instruction: { type: "string" },
                questions: { type: "array", items: { type: "string" } },
              },
              required: ["step", "instruction", "questions"],
            },
          },
          reflectionQuestions: { type: "array", items: { type: "string" } },
        },
        required: ["id", "modulId", "title", "instructions", "activities"],
      },
      minItems: 1,
    },
    needsReview: { type: "boolean" },
  },
  required: ["worksheets"],
};

export async function generateLkpd(projectId: string): Promise<Result<{ needsReview: boolean; generated: number }>> {
  const master = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!master) return Fail("Curriculum Master tidak ditemukan.");

  const modules = (master.modules as any[]) || [];
  if (!modules.length) return Fail("Modul Ajar belum tersedia. Buat Modul Ajar terlebih dahulu.");

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
    learningSequences: master.learningSequences as any[],
    assessmentCriteria: master.assessmentCriteria as any[],
    annualProgram: master.annualProgram as any[],
    semesterProgram: master.semesterProgram as any[],
    modules,
    worksheets: [],
    version: master.version,
  });

  const prompt = `Buat Lembar Kerja Peserta Didik (LKPD) yang menarik dan aplikatif berdasarkan Modul Ajar berikut.\nSetiap LKPD harus memiliki petunjuk pengerjaan (instructions), langkah-langkah aktivitas penugasan (activities: step, instruction, questions), dan pertanyaan refleksi (reflectionQuestions).\nFormat ID LKPD: LKPD-01, LKPD-02, dst.\n\nDaftar Modul:\n${modules.map((m) => `${m.id}: ${m.title}`).join("\n")}\n\n${summary}`;

  const provider = await providerFromEnv();
  const requestId = randomUUID();
  const start = Date.now();
  try {
    const res = await provider.generateStructured<{ worksheets: any[]; needsReview?: boolean }>({
      input: prompt,
      schema,
    });
    const rawWorksheets = res.output.worksheets || [];

    const worksheets = rawWorksheets.map((item, index) => {
      const matchingModul = modules.find((m) => m.id === item.modulId) || modules[index % modules.length];
      
      const instructions = Array.isArray(item.instructions) && item.instructions.length > 0
        ? item.instructions
        : [
            "Bacalah setiap instruksi dengan saksama bersama kelompokmu.",
            "Diskusikan dan jawab setiap pertanyaan pada kolom yang disediakan.",
            "Tanyakan kepada guru jika ada langkah yang kurang dipahami.",
          ];

      const rawActivities = Array.isArray(item.activities) ? item.activities : [];
      const activities = rawActivities.length > 0
        ? rawActivities.map((act: any, actIdx: number) => ({
            step: Number(act.step) || actIdx + 1,
            instruction: act.instruction || (typeof act === "string" ? act : "Lakukan penyelidikan materi"),
            questions: Array.isArray(act.questions) && act.questions.length > 0
              ? act.questions
              : ["Jelaskan hasil analisis yang kalian peroleh!"],
          }))
        : [
            {
              step: 1,
              instruction: "Amati studi kasus atau permasalahan yang disajikan.",
              questions: ["Identifikasi masalah utama yang terjadi pada kasus tersebut!"],
            },
            {
              step: 2,
              instruction: "Rumuskan solusi alternatif berdasarkan pemahaman konsep.",
              questions: ["Strategi apa yang paling tepat untuk menyelesaikan masalah tersebut?"],
            },
          ];

      const reflectionQuestions = Array.isArray(item.reflectionQuestions) && item.reflectionQuestions.length > 0
        ? item.reflectionQuestions
        : [
            "Apa hal terpenting yang kalian pelajari hari ini?",
            "Bagian mana yang paling menantang dan bagaimana kalian mengatasinya?",
          ];

      return {
        id: item.id || `LKPD-${String(index + 1).padStart(2, "0")}`,
        modulId: matchingModul ? matchingModul.id : item.modulId,
        title: item.title || `LKPD: ${matchingModul?.title || `Aktivitas Belajar ${index + 1}`}`,
        instructions,
        activities,
        reflectionQuestions,
      };
    });

    await db.curriculumContext.update({
      where: { projectId },
      data: { worksheets: worksheets as Prisma.InputJsonValue, version: { increment: 1 } },
    });
    await db.aiGenerationLog.create({
      data: {
        projectId,
        provider: provider.name,
        model: res.model,
        operation: "GENERATE_LKPD",
        status: "SUCCESS",
        requestId,
        durationMs: Date.now() - start,
        metadata: { count: worksheets.length } as Prisma.InputJsonValue,
      },
    });
    return Ok({ needsReview: !!res.output.needsReview, generated: worksheets.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.aiGenerationLog.create({
      data: { projectId, provider: "unknown", operation: "GENERATE_LKPD", status: "ERROR", requestId, errorCode: msg.slice(0, 256), durationMs: Date.now() - start },
    });
    return Fail(`Gagal LKPD: ${msg}`);
  }
}