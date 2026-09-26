/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { getProjects } from "@/services/project";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const projects = await getProjects(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pustaka Dokumen Pembelajaran</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau seluruh berkas dan dokumen yang telah di-generate dalam setiap proyek kurikulum.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">Belum ada proyek atau dokumen yang dibuat.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const context = project.context;
            if (!context) return null;

            const docsStatus = [
              { key: "CP", name: "CP", ready: !!context.cp && !!(context.cp as any).elements?.length },
              { key: "TP", name: "TP", ready: Array.isArray(context.learningObjectives) && context.learningObjectives.length > 0 },
              { key: "ATP", name: "ATP", ready: Array.isArray(context.learningSequences) && context.learningSequences.length > 0 },
              { key: "KKTP", name: "KKTP", ready: Array.isArray(context.assessmentCriteria) && context.assessmentCriteria.length > 0 },
              { key: "PROTA", name: "PROTA", ready: Array.isArray(context.annualProgram) && context.annualProgram.length > 0 },
              { key: "PROSEM", name: "PROSEM", ready: Array.isArray(context.semesterProgram) && context.semesterProgram.length > 0 },
              { key: "MODUL_AJAR", name: "Modul Ajar", ready: Array.isArray(context.modules) && context.modules.length > 0 },
              { key: "LKPD", name: "LKPD", ready: Array.isArray(context.worksheets) && context.worksheets.length > 0 },
            ];

            return (
              <div key={project.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {context.subject} — Kelas {context.grade} (Fase {context.phase})
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {project.school.name} · Semester {context.semester} · {context.academicYear}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                  >
                    Buka Editor Project →
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {docsStatus.map((doc) => (
                    <div
                      key={doc.key}
                      className={`rounded-lg p-3 border text-xs flex flex-col justify-between ${
                        doc.ready
                          ? "bg-green-50/60 border-green-200 text-green-900"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="font-bold">{doc.name}</span>
                      <span className="mt-2 text-[11px] font-medium">
                        {doc.ready ? "✓ Sudah Tersedia" : "— Belum Dibuat"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
