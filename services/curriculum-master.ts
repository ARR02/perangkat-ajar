import { Prisma } from "@prisma/client";
import { db } from "@/database";
import {
  CurriculumMaster,
  CurriculumMasterSchema,
} from "@/types/curriculum-master";

export class CurriculumConsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurriculumConsistencyError";
  }
}

/**
 * Validates the in-memory or raw CurriculumMaster object with Zod and logical dependency checks.
 */
export function validateCurriculumMaster(data: unknown): {
  success: boolean;
  data?: CurriculumMaster;
  errors?: string[];
} {
  const parseResult = CurriculumMasterSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      errors: parseResult.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ),
    };
  }

  const master = parseResult.data;
  const logicalErrors: string[] = [];

  // Check 1: TPs must refer to valid CP elements if CP exists
  if (master.cp && master.learningObjectives.length > 0) {
    const validElements = new Set(master.cp.elements.map((e) => e.element));
    for (const tp of master.learningObjectives) {
      if (!validElements.has(tp.relatedCPElement)) {
        logicalErrors.push(
          `TP '${tp.id}' mereferensikan elemen CP '${tp.relatedCPElement}' yang tidak ada dalam CP Master.`
        );
      }
    }
  }

  // Check 2: ATPs must reference valid TPs
  if (master.learningSequences.length > 0) {
    const validTpIds = new Set(master.learningObjectives.map((tp) => tp.id));
    for (const atp of master.learningSequences) {
      if (!validTpIds.has(atp.tpId)) {
        logicalErrors.push(
          `ATP '${atp.id}' mereferensikan TP '${atp.tpId}' yang tidak ditemukan dalam daftar TP.`
        );
      }
    }
  }

  // Check 3: KKTPs must reference valid TPs
  if (master.assessmentCriteria.length > 0) {
    const validTpIds = new Set(master.learningObjectives.map((tp) => tp.id));
    for (const kktp of master.assessmentCriteria) {
      if (!validTpIds.has(kktp.tpId)) {
        logicalErrors.push(
          `KKTP '${kktp.id}' mereferensikan TP '${kktp.tpId}' yang tidak ditemukan dalam daftar TP.`
        );
      }
    }
  }

  // Check 4: Modul Ajar must reference valid ATPs
  if (master.modules.length > 0) {
    const validAtpIds = new Set(master.learningSequences.map((atp) => atp.id));
    for (const modul of master.modules) {
      if (!validAtpIds.has(modul.atpId)) {
        logicalErrors.push(
          `Modul Ajar '${modul.id}' mereferensikan ATP '${modul.atpId}' yang tidak ditemukan dalam ATP.`
        );
      }
    }
  }

  // Check 5: LKPD must reference valid Modul
  if (master.worksheets.length > 0) {
    const validModulIds = new Set(master.modules.map((m) => m.id));
    for (const lkpd of master.worksheets) {
      if (!validModulIds.has(lkpd.modulId)) {
        logicalErrors.push(
          `LKPD '${lkpd.id}' mereferensikan Modul '${lkpd.modulId}' yang tidak ditemukan dalam Modul Ajar.`
        );
      }
    }
  }

  if (logicalErrors.length > 0) {
    return {
      success: false,
      data: master,
      errors: logicalErrors,
    };
  }

  return { success: true, data: master };
}

/**
 * Retrieves the unified CurriculumMaster for a project.
 */
export async function getCurriculumMaster(
  projectId: string
): Promise<CurriculumMaster | null> {
  const context = await db.curriculumContext.findUnique({
    where: { projectId },
    include: {
      project: {
        include: {
          school: true,
          teacher: true,
        },
      },
    },
  });

  if (!context) return null;

  const rawMaster = {
    projectId: context.projectId,
    school: {
      id: context.project.school.id,
      name: context.project.school.name,
    },
    teacher: {
      id: context.project.teacher.id,
      name: context.project.teacher.name,
    },
    curriculum: context.curriculum,
    phase: context.phase,
    grade: context.grade,
    semester: context.semester,
    academicYear: context.academicYear,
    subject: context.subject,
    weeklyHours: context.weeklyHours || 4,
    cp: context.cp as CurriculumMaster["cp"],
    learningObjectives:
      (context.learningObjectives as unknown as CurriculumMaster["learningObjectives"]) || [],
    learningSequences:
      (context.learningSequences as unknown as CurriculumMaster["learningSequences"]) || [],
    assessmentCriteria:
      (context.assessmentCriteria as unknown as CurriculumMaster["assessmentCriteria"]) || [],
    annualProgram:
      (context.annualProgram as unknown as CurriculumMaster["annualProgram"]) || [],
    semesterProgram:
      (context.semesterProgram as unknown as CurriculumMaster["semesterProgram"]) || [],
    modules: (context.modules as unknown as CurriculumMaster["modules"]) || [],
    worksheets: (context.worksheets as unknown as CurriculumMaster["worksheets"]) || [],
    version: context.version,
    updatedAt: context.updatedAt.toISOString(),
  };

  const validation = validateCurriculumMaster(rawMaster);
  return validation.data || (rawMaster as CurriculumMaster);
}

/**
 * Updates the unified Curriculum Master atomically with validation.
 */
export async function updateCurriculumMaster(
  projectId: string,
  partialData: Partial<CurriculumMaster>
): Promise<{ success: boolean; data?: CurriculumMaster; errors?: string[] }> {
  const current = await getCurriculumMaster(projectId);
  if (!current) {
    return { success: false, errors: ["Proyek kurikulum tidak ditemukan."] };
  }

  const merged = {
    ...current,
    ...partialData,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };

  const validation = validateCurriculumMaster(merged);
  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  await db.curriculumContext.update({
    where: { projectId },
    data: {
      curriculum: merged.curriculum,
      phase: merged.phase,
      grade: merged.grade,
      semester: merged.semester,
      academicYear: merged.academicYear,
      subject: merged.subject,
      weeklyHours: merged.weeklyHours,
      cp: (merged.cp as Prisma.InputJsonValue) || {},
      learningObjectives: merged.learningObjectives as Prisma.InputJsonValue,
      learningSequences: merged.learningSequences as Prisma.InputJsonValue,
      assessmentCriteria: merged.assessmentCriteria as Prisma.InputJsonValue,
      annualProgram: merged.annualProgram as Prisma.InputJsonValue,
      semesterProgram: merged.semesterProgram as Prisma.InputJsonValue,
      modules: merged.modules as Prisma.InputJsonValue,
      worksheets: merged.worksheets as Prisma.InputJsonValue,
      version: merged.version,
    },
  });

  return { success: true, data: merged };
}

/**
 * Summarizes the status and dependency relations for all connected documents in a project.
 */
export async function getRelatedDocuments(projectId: string) {
  const master = await getCurriculumMaster(projectId);
  if (!master) return null;

  return {
    projectId,
    hasCP: !!master.cp && master.cp.elements.length > 0,
    tpCount: master.learningObjectives.length,
    atpCount: master.learningSequences.length,
    kktpCount: master.assessmentCriteria.length,
    protaCount: master.annualProgram.length,
    prosemCount: master.semesterProgram.length,
    modulCount: master.modules.length,
    lkpdCount: master.worksheets.length,
    version: master.version,
    updatedAt: master.updatedAt,
  };
}
