import assert from "node:assert";
import {
  CPSchema,
  TPSchema,
  ATPSchema,
  KKTPSchema,
  ProtaItemSchema,
  ProsemItemSchema,
  ModulAjarSchema,
  LKPDSchema,
  CurriculumMasterSchema,
} from "../types/curriculum-master";

console.log("Running Generator Schema Integrity tests...");

// 1. CP Schema
const cpTest = CPSchema.safeParse({
  subject: "Informatika",
  phase: "E",
  elements: [
    { element: "Berpikir Komputasional", capaianPembelajaran: "Memahami computational thinking." },
  ],
  learningOutcomes: [],
});
assert.strictEqual(cpTest.success, true, "CP Schema validation failed");

// 2. TP Schema
const tpTest = TPSchema.safeParse({
  id: "TP-01",
  code: "10.1",
  element: "Berpikir Komputasional",
  relatedCPElement: "Berpikir Komputasional",
  description: "Menjelaskan algoritma pencarian biner",
  competency: "Menjelaskan",
  scopeOfMaterial: "Algoritma Pencarian",
});
assert.strictEqual(tpTest.success, true, "TP Schema validation failed");

// 3. ATP Schema
const atpTest = ATPSchema.safeParse({
  id: "ATP-01",
  order: 1,
  tpId: "TP-01",
  tpDescription: "Menjelaskan algoritma pencarian biner",
  materialScope: "Algoritma Pencarian",
  allocatedHours: 4,
  semester: "1",
  assessmentPlan: "Formatif",
  pedagogicalApproach: "Problem Based Learning",
});
assert.strictEqual(atpTest.success, true, "ATP Schema validation failed");

// 4. KKTP Schema
const kktpTest = KKTPSchema.safeParse({
  id: "KKTP-01",
  tpId: "TP-01",
  indicators: ["Mampu menyusun langkah pencarian"],
  achievementCriteria: "Ketuntasan 75%",
  assessmentEvidence: "Tugas lembar kerja",
  achievementCategory: "Baik",
  instruments: ["Rubrik Penilaian"],
});
assert.strictEqual(kktpTest.success, true, "KKTP Schema validation failed");

// 5. PROTA Schema
const protaTest = ProtaItemSchema.safeParse({
  no: 1,
  atpId: "ATP-01",
  materialTopic: "Algoritma Pencarian",
  allocatedHours: 4,
  semester: "1",
});
assert.strictEqual(protaTest.success, true, "PROTA Schema validation failed");

// 6. PROSEM Schema
const prosemTest = ProsemItemSchema.safeParse({
  no: 1,
  atpId: "ATP-01",
  materialTopic: "Algoritma Pencarian",
  allocatedHours: 4,
  monthAllocations: {
    Juli: [2, 2, 0, 0],
    Agustus: [0, 0, 0, 0],
  },
});
assert.strictEqual(prosemTest.success, true, "PROSEM Schema validation failed");

// 7. Modul Ajar Schema
const modulTest = ModulAjarSchema.safeParse({
  id: "MODUL-01",
  atpId: "ATP-01",
  title: "Modul Ajar Pencarian Data",
  allocation: "4 JP",
  targetStudents: "Reguler",
  learningModel: "Problem-Based Learning",
  pancasilaProfile: ["Bernalar Kritis", "Gotong Royong"],
  coreActivities: {
    opening: ["Salam dan doa", "Apersepsi"],
    main: ["Eksplorasi data", "Diskusi kelompok"],
    closing: ["Refleksi dan kesimpulan"],
  },
  assessments: {
    diagnostic: "Tes lisan awal",
    formative: "Observasi diskusi",
    summative: "Kuis akhir",
  },
  mediaAndResources: ["Modul PDF", "Laptop"],
  needsReview: false,
});
assert.strictEqual(modulTest.success, true, "Modul Ajar Schema validation failed");

// 8. LKPD Schema
const lkpdTest = LKPDSchema.safeParse({
  id: "LKPD-01",
  modulId: "MODUL-01",
  title: "LKPD Algoritma Pencarian",
  instructions: ["Kerjakan secara kelompok", "Tuliskan hasil pada tabel"],
  activities: [
    {
      step: 1,
      instruction: "Lakukan pencarian angka 45 pada array",
      questions: ["Berapa perbandingan yang dilakukan?"],
    },
  ],
  reflectionQuestions: ["Apa yang kalian pelajari hari ini?"],
});
assert.strictEqual(lkpdTest.success, true, "LKPD Schema validation failed");

// 9. Full Curriculum Master Schema
const masterTest = CurriculumMasterSchema.safeParse({
  school: { name: "SMA Negeri 1" },
  teacher: { name: "Budi Santoso" },
  curriculum: "Kurikulum Merdeka",
  phase: "E",
  grade: "X",
  semester: "1",
  academicYear: "2026/2027",
  subject: "Informatika",
  weeklyHours: 4,
  cp: cpTest.data,
  learningObjectives: [tpTest.data],
  learningSequences: [atpTest.data],
  assessmentCriteria: [kktpTest.data],
  annualProgram: [protaTest.data],
  semesterProgram: [prosemTest.data],
  modules: [modulTest.data],
  worksheets: [lkpdTest.data],
  version: 1,
});
assert.strictEqual(masterTest.success, true, "Full CurriculumMaster Schema validation failed");

console.log("All 8 generator schemas and full CurriculumMaster validated successfully!");
