import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/services/project";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Halo, {session.user.name || "Bapak/Ibu Guru"} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Selamat datang di Platform Otomasi Perangkat Ajar Kurikulum Merdeka.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <span>+ Buat Perangkat Ajar Baru</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Proyek Perangkat</span>
          <span className="mt-2 block text-3xl font-extrabold text-blue-900">{stats.projectsCount}</span>
          <span className="mt-1 block text-xs text-blue-600">Total paket ajar aktif</span>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50/50 p-5">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Dokumen Siap</span>
          <span className="mt-2 block text-3xl font-extrabold text-green-900">{stats.totalDocumentsReady}</span>
          <span className="mt-1 block text-xs text-green-600">CP, TP, ATP, Modul, dll</span>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-5">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Satuan Pendidikan</span>
          <span className="mt-2 block text-3xl font-extrabold text-purple-900">{stats.schoolsCount || 1}</span>
          <span className="mt-1 block text-xs text-purple-600">Sekolah binaan terdaftar</span>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Template Tersedia</span>
          <span className="mt-2 block text-3xl font-extrabold text-amber-900">{Math.max(stats.templatesCount, 1)}</span>
          <span className="mt-1 block text-xs text-amber-600">Standar Kurikulum Merdeka</span>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-base font-bold text-gray-900">Proyek Perangkat Ajar Terbaru</h2>
          <Link href="/projects" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            Lihat Semua →
          </Link>
        </div>

        {stats.recentProjects.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Belum ada proyek. Klik tombol &ldquo;Buat Perangkat Ajar Baru&rdquo; di atas untuk memulai.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentProjects.map((project) => (
              <div key={project.id} className="py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {project.context?.subject || "Mata Pelajaran"} · Kelas {project.context?.grade} (Fase {project.context?.phase})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {project.school?.name} · T.A. {project.context?.academicYear} · Semester {project.context?.semester}
                  </p>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Buka Proyek →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
