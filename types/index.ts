export * from "./curriculum";
export * from "./document";

export interface IdentityContext {
  schoolName: string;
  teacherName: string;
  subject: string;
  phase: string;
  gradeClass: string;
  academicYear: string;
  semester: "1" | "2" | "Ganjil" | "Genap";
  timeAllocation: string;
}

export type DocumentType =
  | "CP"
  | "TP"
  | "ATP"
  | "KKTP"
  | "PROTA"
  | "PROSEM"
  | "MODUL_AJAR"
  | "LKPD";

export type DocumentStatus =
  | "DRAFT"
  | "GENERATING"
  | "READY"
  | "NEEDS_REVIEW"
  | "FAILED"
  | "ARCHIVED";
