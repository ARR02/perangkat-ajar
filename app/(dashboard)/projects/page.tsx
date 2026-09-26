/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProjects } from "@/services/project";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const projects = await getProjects(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Proyek Perangkat Ajar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola seluruh paket kurikulum dan dokumen pembelajaran yang telah dibuat.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <span>+ Buat Proyek Baru</span>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl mb-3">
            📚
          </div>
          <h3 className="text-base font-semibold text-gray-900">Belum ada proyek perangkat ajar</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Mulai buat perangkat ajar pertama Anda dengan Kurikulum Merdeka dan AI.
          </p>
          <div className="mt-6">
            <Link
              href="/projects/new"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Mulai Proyek Baru
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const context = project.context;
            let readyCount = 0;
            if (context) {
              if (context.cp && (context.cp as any).elements?.length) readyCount++;
              if (Array.isArray(context.learningObjectives) && context.learningObjectives.length) readyCount++;
              if (Array.isArray(context.learningSequences) && context.learningSequences.length) readyCount++;
              if (Array.isArray(context.assessmentCriteria) && context.assessmentCriteria.length) readyCount++;
              if (Array.isArray(context.annualProgram) && context.annualProgram.length) readyCount++;
              if (Array.isArray(context.semesterProgram) && context.semesterProgram.length) readyCount++;
              if (Array.isArray(context.modules) && context.modules.length) readyCount++;
              if (Array.isArray(context.worksheets) && context.worksheets.length) readyCount++;
            }

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Fase {context?.phase || "D"} · Kelas {context?.grade || "VIII"}
                    </span>
                    <span>T.A. {context?.academicYear || "2026/2027"}</span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {context?.subject || "Mata Pelajaran"}
                  </h2>

                  <p className="text-xs text-gray-600 mt-1">
                    {project.school?.name || "Sekolah"} · Guru: {project.teacher?.name || "Guru"}
                  </p>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Kelengkapan Dokumen:</span>
                      <span className="font-bold text-gray-800">{readyCount} / 8 Dokumen</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(readyCount / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs text-gray-400">
                    Versi {context?.version || 1}
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Buka Ruang Kerja →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
