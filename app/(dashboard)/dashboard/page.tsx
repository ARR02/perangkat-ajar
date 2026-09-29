import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/services/project";
import { ArrowRight, FileStack, FolderOpen, Library, Plus, ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const stats = await getDashboardStats(session.user.id);

  const cards = [
    {
      label: "Proyek Perangkat",
      value: stats.projectsCount,
      hint: "Total paket ajar aktif",
      icon: FolderOpen,
      accent: "text-[#22d3ee]",
    },
    {
      label: "Proyek Konsisten",
      value: `${stats.consistencySummary.passed}/${stats.projectsCount}`,
      hint: "Lolos cek konsistensi",
      icon: ShieldCheck,
      accent: "text-[#4ade80]",
    },
    {
      label: "Dokumen Siap",
      value: stats.totalDocumentsReady,
      hint: "CP, TP, ATP, Modul, dll",
      icon: FileStack,
      accent: "text-[#4ade80]",
    },
    {
      label: "Satuan Pendidikan",
      value: stats.schoolsCount || 1,
      hint: "Sekolah binaan terdaftar",
      icon: Library,
      accent: "text-[#c084fc]",
    },
    {
      label: "Template Tersedia",
      value: Math.max(stats.templatesCount, 1),
      hint: "Standar Kurikulum Merdeka",
      icon: FileStack,
      accent: "text-[#fbbf24]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Halo, {session.user.name || "Bapak/Ibu Guru"}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Selamat datang di Platform Otomasi Perangkat Ajar Kurikulum Merdeka.
          </p>
        </div>
        <Link href="/projects/new" className="btn-neon">
          <Plus className="h-4 w-4" />
          Buat Perangkat Ajar Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="glass holo-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                {card.label}
              </span>
              <card.icon className={`h-4 w-4 ${card.accent}`} />
            </div>
            <span className="stat-num mt-2 block text-4xl font-extrabold">{card.value}</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">{card.hint}</span>
          </div>
        ))}
      </div>

      <div className="glass holo-card rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h2 className="text-base font-bold text-white">Proyek Perangkat Ajar Terbaru</h2>
          <Link href="/projects" className="flex items-center gap-1 text-xs font-semibold text-[#7dd3fc] hover:text-white">
            Lihat Semua
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.recentProjects.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            Belum ada proyek. Klik tombol &ldquo;Buat Perangkat Ajar Baru&rdquo; di atas untuk memulai.
          </p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {stats.recentProjects.map((project) => {
              const cStatus = stats.recentConsistency.get(project.id);
              const statusCls =
                cStatus === "passed"
                  ? "text-[#4ade80]"
                  : cStatus === "warning"
                    ? "text-[#fbbf24]"
                    : "text-[#fb7185]";
              const statusLabel =
                cStatus === "passed"
                  ? "✓ Konsisten"
                  : cStatus === "warning"
                    ? "⚠ Perlu review"
                    : "✗ Inkonsisten";
              return (
                <div key={project.id} className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {project.context?.subject || "Mata Pelajaran"} · Kelas {project.context?.grade} (Fase{" "}
                      {project.context?.phase})
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {project.school?.name} · T.A. {project.context?.academicYear} · Semester{" "}
                      {project.context?.semester}
                    </p>
                    <span className={`mt-1 block text-[11px] font-semibold ${statusCls}`}>
                      {statusLabel}
                    </span>
                  </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[rgba(34,211,238,0.5)]"
                >
                  Buka Proyek
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}