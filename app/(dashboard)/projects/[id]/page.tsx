import { getCurriculumMaster } from "@/services/curriculum-master";
import { runConsistencyCheck } from "@/services/consistency";
import { DocumentGrid } from "./document-grid";
import Link from "next/link";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const master = await getCurriculumMaster(id);

  if (!master) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border">
        <h2 className="text-lg font-bold text-gray-900">Proyek tidak ditemukan</h2>
        <p className="text-sm text-gray-500 mt-1">Proyek mungkin telah dihapus atau URL tidak valid.</p>
        <Link href="/projects" className="mt-4 inline-block text-sm font-semibold text-blue-600">
          ← Kembali ke Daftar Proyek
        </Link>
      </div>
    );
  }

  const consistency = await runConsistencyCheck(id);

  const documents = [
    {
      key: "CP" as const,
      label: "Capaian Pembelajaran (CP)",
      ready: !!master.cp && (master.cp.elements || []).length > 0,
      dependsOn: null,
      count: master.cp?.elements?.length || 0,
    },
    {
      key: "TP" as const,
      label: "Tujuan Pembelajaran (TP)",
      ready: master.learningObjectives.length > 0,
      dependsOn: "CP",
      count: master.learningObjectives.length,
    },
    {
      key: "ATP" as const,
      label: "Alur Tujuan Pembelajaran (ATP)",
      ready: master.learningSequences.length > 0,
      dependsOn: "TP",
      count: master.learningSequences.length,
    },
    {
      key: "KKTP" as const,
      label: "Kriteria Ketercapaian TP (KKTP)",
      ready: master.assessmentCriteria.length > 0,
      dependsOn: "TP",
      count: master.assessmentCriteria.length,
    },
    {
      key: "PROTA" as const,
      label: "Program Tahunan (PROTA)",
      ready: master.annualProgram.length > 0,
      dependsOn: "ATP",
      count: master.annualProgram.length,
    },
    {
      key: "PROSEM" as const,
      label: "Program Semester (PROSEM)",
      ready: master.semesterProgram.length > 0,
      dependsOn: "PROTA",
      count: master.semesterProgram.length,
    },
    {
      key: "MODUL_AJAR" as const,
      label: "Modul Ajar (RPP Plus)",
      ready: master.modules.length > 0,
      dependsOn: "ATP",
      count: master.modules.length,
    },
    {
      key: "LKPD" as const,
      label: "Lembar Kerja Siswa (LKPD)",
      ready: master.worksheets.length > 0,
      dependsOn: "Modul Ajar",
      count: master.worksheets.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <Link href="/projects" className="hover:text-blue-600 transition">
              Proyek
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-700">Ruang Kerja</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {master.subject} · Kelas {master.grade} (Fase {master.phase})
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {master.school.name} · Penyusun: {master.teacher.name} · Semester {master.semester} · T.A. {master.academicYear} · {master.weeklyHours} JP/Minggu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="rounded-lg border bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            ← Kembali
          </Link>
        </div>
      </div>

      <DocumentGrid
        projectId={id}
        documents={documents}
        master={master}
        consistency={consistency}
      />
    </div>
  );
}