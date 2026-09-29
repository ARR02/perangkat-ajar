import { db } from "@/database";

export interface ConsistencyResult {
  status: "passed" | "warning" | "failed";
  issues: Array<{
    type: string;
    message: string;
    impact: "none" | "low" | "medium" | "high";
    affectedDocuments?: string[];
  }>;
}

const FIXABLE_ISSUES: Record<string, { docKey: string; reason: string }> = {
  TP_CP_MISMATCH: { docKey: "TP", reason: "TP dibuat ulang agar merujuk elemen CP yang ada" },
  CP_MISSING_FOR_TP: { docKey: "CP", reason: "CP dibuat karena TP sudah terlanjur ada" },
  ATP_TP_MISSING: { docKey: "ATP", reason: "ATP dibuat ulang agar merujuk TP yang ada" },
  KKTP_TP_MISSING: { docKey: "KKTP", reason: "KKTP dibuat ulang agar merujuk TP yang ada" },
  MODUL_ATP_MISSING: { docKey: "MODUL_AJAR", reason: "Modul Ajar dibuat ulang agar merujuk ATP yang ada" },
  LKPD_MODUL_MISSING: { docKey: "LKPD", reason: "LKPD dibuat ulang agar merujuk Modul Ajar yang ada" },
};

const DEP_ORDER = ["CP", "TP", "ATP", "KKTP", "PROTA", "PROSEM", "MODUL_AJAR", "LKPD"];

export interface FixPlanItem {
  docKey: string;
  reason: string;
}

/**
 * Memetakan issue konsistensi ke dokumen yang perlu dibuat ulang (regenerate).
 * Hanya perbaikan non-destruktif — tidak menghapus data. Diurutkan sesuai
 * rantai dependensi (CP → TP → ATP → ...) supaya referensi anak lahir dari
 * induk yang terbaru.
 */
export function getFixPlan(issues: ConsistencyResult["issues"]): FixPlanItem[] {
  const reasons = new Map<string, string>();
  for (const issue of issues) {
    const fix = FIXABLE_ISSUES[issue.type];
    if (fix && !reasons.has(fix.docKey)) reasons.set(fix.docKey, fix.reason);
  }
  return DEP_ORDER.filter((k) => reasons.has(k)).map((docKey) => ({
    docKey,
    reason: reasons.get(docKey)!,
  }));
}

/**
 * Menjalankan Consistency Engine pada satu Curriculum Master.
 */
export async function runConsistencyCheck(projectId: string): Promise<ConsistencyResult> {
  const masterRaw = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!masterRaw) {
    return {
      status: "failed",
      issues: [{ type: "MISSING_CURRICULUM", message: "Curriculum Master tidak ditemukan.", impact: "high" }],
    };
  }

  const issues: ConsistencyResult["issues"] = [];

  const cp = masterRaw.cp as { elements?: Array<{ element: string }> } | null;
  const cpElements = cp?.elements?.map((e) => e.element) ?? [];
  const tps = (masterRaw.learningObjectives as Array<{ id: string; relatedCPElement: string }>) ?? [];
  const atps = (masterRaw.learningSequences as Array<{ id: string; tpId: string }>) ?? [];
  const kktps = (masterRaw.assessmentCriteria as Array<{ id: string; tpId: string }>) ?? [];
  const modules = (masterRaw.modules as Array<{ id: string; atpId: string }>) ?? [];
  const prota = (masterRaw.annualProgram as Array<{ allocatedHours: number }>) ?? [];
  const lkpd = (masterRaw.worksheets as Array<{ id: string; modulId: string }>) ?? [];

  // 1. CP → TP
  if (cpElements.length > 0) {
    for (const tp of tps) {
      if (!cpElements.includes(tp.relatedCPElement)) {
        issues.push({
          type: "TP_CP_MISMATCH",
          message: `TP '${tp.id}' merujuk CP '${tp.relatedCPElement}' yang tidak ada dalam CP Master.`,
          impact: "high",
          affectedDocuments: [tp.id],
        });
      }
    }
  } else if (tps.length > 0) {
    issues.push({
      type: "CP_MISSING_FOR_TP",
      message: "CP tidak tersedia tetapi TP sudah dibuat.",
      impact: "medium",
    });
  }

  // 2. TP → ATP
  const tpIds = new Set(tps.map((t) => t.id));
  for (const atp of atps) {
    if (!tpIds.has(atp.tpId)) {
      issues.push({
        type: "ATP_TP_MISSING",
        message: `ATP '${atp.id}' merujuk TP '${atp.tpId}' yang tidak ditemukan.`,
        impact: "high",
        affectedDocuments: [atp.id],
      });
    }
  }

  // 3. TP → KKTP
  for (const kk of kktps) {
    if (!tpIds.has(kk.tpId)) {
      issues.push({
        type: "KKTP_TP_MISSING",
        message: `KKTP '${kk.id}' merujuk TP '${kk.tpId}' yang tidak ditemukan.`,
        impact: "high",
        affectedDocuments: [kk.id],
      });
    }
  }

  // 4. ATP → Modul Ajar
  const atpIds = new Set(atps.map((a) => a.id));
  for (const mod of modules) {
    if (!atpIds.has(mod.atpId)) {
      issues.push({
        type: "MODUL_ATP_MISSING",
        message: `Modul Ajar '${mod.id}' merujuk ATP '${mod.atpId}' yang tidak ada.`,
        impact: "medium",
        affectedDocuments: [mod.id],
      });
    }
  }

  // 5. ATP → PROTA (total alokasi jam melebihi batas wajar tahunan)
  const protaTotal = prota.reduce((sum, p) => sum + (p.allocatedHours ?? 0), 0);
  const maxAnnualHours = (masterRaw.weeklyHours || 4) * 36;
  if (protaTotal > maxAnnualHours) {
    issues.push({
      type: "PROTA_ALLOC_EXCESS",
      message: `Total alokasi PROTA (${protaTotal} JP) melebihi batas perkiraan tahunan (${maxAnnualHours} JP).`,
      impact: "low",
    });
  }

  // 6. Modul → LKPD
  const modulIds = new Set(modules.map((m) => m.id));
  for (const w of lkpd) {
    if (!modulIds.has(w.modulId)) {
      issues.push({
        type: "LKPD_MODUL_MISSING",
        message: `LKPD '${w.id}' merujuk Modul Ajar '${w.modulId}' yang tidak ada.`,
        impact: "high",
        affectedDocuments: [w.id],
      });
    }
  }

  const status: ConsistencyResult["status"] = issues.some((i) => i.impact === "high")
    ? "failed"
    : issues.length > 0
      ? "warning"
      : "passed";

  return { status, issues };
}
