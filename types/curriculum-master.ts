import { z } from "zod";

export const SchoolIdentitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama sekolah wajib diisi"),
  npsn: z.string().optional(),
  address: z.string().optional(),
  principalName: z.string().optional(),
  principalNip: z.string().optional(),
});

export const TeacherIdentitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama guru wajib diisi"),
  nip: z.string().optional(),
  subjectSpecialization: z.string().optional(),
});

export const CPElementSchema = z.object({
  element: z.string().min(1, "Nama elemen wajib diisi"),
  capaianPembelajaran: z.string().min(1, "Deskripsi CP wajib diisi"),
});

export const CPSchema = z.object({
  subject: z.string().min(1),
  phase: z.string().min(1),
  elements: z.array(CPElementSchema).min(1, "Minimal 1 elemen CP diperlukan"),
  learningOutcomes: z.array(z.string()).default([]),
  generalContext: z.string().optional(),
});

export const TPSchema = z.object({
  id: z.string().min(1), // e.g. "TP-01"
  element: z.string(),
  code: z.string(),
  description: z.string().min(1, "Tujuan Pembelajaran wajib diisi"),
  competency: z.string().optional(),
  scopeOfMaterial: z.string().optional(),
  relatedCPElement: z.string(),
});

export const ATPSchema = z.object({
  id: z.string().min(1), // e.g. "ATP-01"
  order: z.number().int().positive(),
  tpId: z.string().min(1), // Reference to TP id
  tpDescription: z.string(),
  materialScope: z.string(),
  allocatedHours: z.number().nonnegative().default(2),
  semester: z.string().default("1"),
  assessmentPlan: z.string().optional(),
  pedagogicalApproach: z.string().optional(),
});

export const KKTPSchema = z.object({
  id: z.string().min(1),
  tpId: z.string().min(1),
  indicators: z.array(z.string()).min(1),
  achievementCriteria: z.string().min(1),
  assessmentEvidence: z.string().min(1),
  achievementCategory: z.enum(["Perlu Bimbingan", "Cukup", "Baik", "Sangat Baik"]),
  instruments: z.array(z.string()).default(["Rubrik", "Tes Tertulis"]),
});

export const ProtaItemSchema = z.object({
  no: z.number().int().positive(),
  atpId: z.string(),
  materialTopic: z.string(),
  allocatedHours: z.number().nonnegative(),
  semester: z.string(),
});

export const ProsemItemSchema = z.object({
  no: z.number().int().positive(),
  atpId: z.string(),
  materialTopic: z.string(),
  allocatedHours: z.number().nonnegative(),
  monthAllocations: z.record(z.string(), z.array(z.number())), // e.g. { "Juli": [2, 2, 0, 0] }
});

export const ModulAjarSchema = z.object({
  id: z.string().min(1),
  atpId: z.string().min(1),
  title: z.string().min(1),
  allocation: z.string(),
  targetStudents: z.string().default("Reguler"),
  learningModel: z.string().default("Problem-Based Learning"),
  pancasilaProfile: z.array(z.string()).default(["Bernalar Kritis", "Gotong Royong"]),
  coreActivities: z.object({
    opening: z.array(z.string()),
    main: z.array(z.string()),
    closing: z.array(z.string()),
  }),
  assessments: z.object({
    diagnostic: z.string().optional(),
    formative: z.string().optional(),
    summative: z.string().optional(),
  }),
  mediaAndResources: z.array(z.string()).default([]),
  customSections: z.record(z.string(), z.unknown()).optional(),
  needsReview: z.boolean().default(false),
});

export const LKPDSchema = z.object({
  id: z.string().min(1),
  modulId: z.string().min(1),
  title: z.string().min(1),
  instructions: z.array(z.string()),
  activities: z.array(
    z.object({
      step: z.number(),
      instruction: z.string(),
      questions: z.array(z.string()),
    })
  ),
  reflectionQuestions: z.array(z.string()).default([]),
});

export const CurriculumMasterSchema = z.object({
  projectId: z.string().optional(),
  school: SchoolIdentitySchema,
  teacher: TeacherIdentitySchema,
  curriculum: z.string().default("Kurikulum Merdeka"),
  phase: z.string().min(1, "Fase wajib dipilih"),
  grade: z.string().min(1, "Kelas wajib dipilih"),
  semester: z.string().min(1, "Semester wajib dipilih"),
  academicYear: z.string().min(1, "Tahun ajaran wajib diisi"),
  subject: z.string().min(1, "Mata pelajaran wajib diisi"),
  weeklyHours: z.number().positive().default(4),
  cp: CPSchema.nullable().default(null),
  learningObjectives: z.array(TPSchema).default([]),
  learningSequences: z.array(ATPSchema).default([]),
  assessmentCriteria: z.array(KKTPSchema).default([]),
  annualProgram: z.array(ProtaItemSchema).default([]),
  semesterProgram: z.array(ProsemItemSchema).default([]),
  modules: z.array(ModulAjarSchema).default([]),
  worksheets: z.array(LKPDSchema).default([]),
  version: z.number().int().positive().default(1),
  updatedAt: z.string().optional(),
});

export type SchoolIdentity = z.infer<typeof SchoolIdentitySchema>;
export type TeacherIdentity = z.infer<typeof TeacherIdentitySchema>;
export type CPElement = z.infer<typeof CPElementSchema>;
export type CP = z.infer<typeof CPSchema>;
export type TP = z.infer<typeof TPSchema>;
export type ATP = z.infer<typeof ATPSchema>;
export type KKTP = z.infer<typeof KKTPSchema>;
export type ProtaItem = z.infer<typeof ProtaItemSchema>;
export type ProsemItem = z.infer<typeof ProsemItemSchema>;
export type ModulAjar = z.infer<typeof ModulAjarSchema>;
export type LKPD = z.infer<typeof LKPDSchema>;
export type CurriculumMaster = z.infer<typeof CurriculumMasterSchema>;
