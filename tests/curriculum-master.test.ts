import assert from "node:assert";
import { validateCurriculumMaster } from "../services/curriculum-master";
import { CurriculumMaster } from "../types/curriculum-master";

const validMock: CurriculumMaster = {
  school: { name: "SMA Nusantara" },
  teacher: { name: "Guru Budi" },
  curriculum: "Kurikulum Merdeka",
  phase: "E",
  grade: "10",
  semester: "1",
  academicYear: "2024/2025",
  subject: "Informatika",
  weeklyHours: 3,
  cp: {
    subject: "Informatika",
    phase: "E",
    elements: [
      { element: "Berpikir Komputasional", capaianPembelajaran: "Memahami algoritma dasar." },
    ],
    learningOutcomes: [],
  },
  learningObjectives: [
    {
      id: "TP-01",
      code: "10.1",
      element: "Berpikir Komputasional",
      relatedCPElement: "Berpikir Komputasional",
      description: "Menerapkan algoritma pencarian.",
    },
  ],
  learningSequences: [
    {
      id: "ATP-01",
      order: 1,
      tpId: "TP-01",
      tpDescription: "Menerapkan algoritma pencarian.",
      materialScope: "Searching Algorithm",
      allocatedHours: 4,
      semester: "1",
    },
  ],
  assessmentCriteria: [
    {
      id: "KKTP-01",
      tpId: "TP-01",
      indicators: ["Mampu menjelaskan langkah pencarian linier"],
      achievementCriteria: "Dapat menerapkan pencarian biner",
      assessmentEvidence: "Hasil tugas pemrograman",
      achievementCategory: "Baik",
      instruments: ["Rubrik Praktik"],
    },
  ],
  annualProgram: [
    {
      no: 1,
      atpId: "ATP-01",
      materialTopic: "Searching Algorithm",
      allocatedHours: 4,
      semester: "1",
    },
  ],
  semesterProgram: [
    {
      no: 1,
      atpId: "ATP-01",
      materialTopic: "Searching Algorithm",
      allocatedHours: 4,
      monthAllocations: {
        Juli: [2, 2, 0, 0],
      },
    },
  ],
  modules: [
    {
      id: "MODUL-01",
      atpId: "ATP-01",
      title: "Modul Algoritma Pencarian",
      allocation: "4 JP",
      targetStudents: "Reguler",
      learningModel: "PBL",
      pancasilaProfile: ["Bernalar Kritis"],
      coreActivities: {
        opening: ["Apersepsi"],
        main: ["Diskusi kelompok"],
        closing: ["Refleksi"],
      },
      assessments: { formative: "Kuis harian" },
      mediaAndResources: ["Buku Siswa"],
      needsReview: false,
    },
  ],
  worksheets: [
    {
      id: "LKPD-01",
      modulId: "MODUL-01",
      title: "LKPD Binary Search",
      instructions: ["Kerjakan bersama kelompok"],
      activities: [
        {
          step: 1,
          instruction: "Lakukan pencarian data",
          questions: ["Berapa jumlah langkah yang dibutuhkan?"],
        },
      ],
      reflectionQuestions: ["Apa kendala yang dihadapi?"],
    },
  ],
  version: 1,
};

// Test 1: Valid Curriculum Master passes
const result1 = validateCurriculumMaster(validMock);
assert.strictEqual(result1.success, true, "Valid Curriculum Master must pass validation");

// Test 2: Invalid relationship (ATP references non-existent TP)
const invalidAtpMock = JSON.parse(JSON.stringify(validMock));
invalidAtpMock.learningSequences[0].tpId = "TP-999-NOT-FOUND";
const result2 = validateCurriculumMaster(invalidAtpMock);
assert.strictEqual(result2.success, false, "Invalid ATP TP dependency must fail validation");

// Test 3: Invalid relationship (KKTP references non-existent TP)
const invalidKktpMock = JSON.parse(JSON.stringify(validMock));
invalidKktpMock.assessmentCriteria[0].tpId = "TP-NON-EXISTENT";
const result3 = validateCurriculumMaster(invalidKktpMock);
assert.strictEqual(result3.success, false, "Invalid KKTP TP dependency must fail validation");

console.log("All Curriculum Master validation unit tests PASSED successfully!");
