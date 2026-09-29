import Link from "next/link";
import { auth } from "@/lib/auth";
import TiltCard from "@/components/tilt-card";
import { ArrowRight, BrainCircuit, FileSearch, FileText, Layers, Sparkles, Zap } from "lucide-react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/scroll-reveal";

import Background3DWrapper from "@/components/background-3d-wrapper";

const flowSteps = [
  { code: "CP", title: "Capaian Pembelajaran", desc: "Elemen & capaian resmi per fase kurikulum." },
  { code: "TP", title: "Tujuan Pembelajaran", desc: "Penurunan kompetensi & lingkup materi spesifik." },
  { code: "ATP", title: "Alur Tujuan Pembelajaran", desc: "Sekuens logis kronologis & alokasi jam tatap muka." },
  { code: "KKTP", title: "Kriteria Ketercapaian", desc: "Rubrik & instrumen asesmen ketercapaian tujuan." },
  { code: "PROTA", title: "Program Tahunan", desc: "Matriks distribusi materi selama satu tahun ajaran." },
  { code: "PROSEM", title: "Program Semester", desc: "Pemetaan mingguan per bulan untuk kegiatan KBM." },
  { code: "Modul", title: "Modul Ajar (RPP Plus)", desc: "Langkah pembelajaran lengkap + Profil Pelajar Pancasila." },
  { code: "LKPD", title: "Lembar Kerja Siswa", desc: "Instruksi kerja, lembar penugasan, dan refleksi." },
];

const features = [
  {
    icon: BrainCircuit,
    accent: "text-[#22d3ee]",
    title: "Structured JSON IR",
    desc: "AI menghasilkan representasi data terstruktur yang tervalidasi skema Zod sebelum dirender atau diekspor.",
  },
  {
    icon: FileSearch,
    accent: "text-[#4ade80]",
    title: "Consistency Engine",
    desc: "Mendeteksi otomatis ketidakcocokan kode TP, keterikatan alur ATP, dan beban alokasi jam PROTA/PROSEM.",
  },
  {
    icon: FileText,
    accent: "text-[#c084fc]",
    title: "Ekspor Word (.DOCX) Resmi",
    desc: "Hasil generate langsung dikonversi menjadi berkas DOCX terformat rapi dengan tabel identitas standar sekolah.",
  },
];

const stats = [
  { value: "8", label: "Dokumen Otomatis" },
  { value: "1", label: "Sumber Kebenaran" },
  { value: "6", label: "Fase Kurikulum" },
  { value: ".DOCX", label: "Format Ekspor" },
];

export default async function HomePage() {
  const session = await auth();
  const startHref = session?.user ? "/projects/new" : "/login";

  return (
    <div className="relative flex min-h-screen flex-col">
      <Background3DWrapper />
      <div className="grid-floor pointer-events-none -z-[1] opacity-60" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(5,7,15,0.6)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c5cff] to-[#22d3ee] text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(124,92,255,0.9)]">
              P
            </span>
            <span className="text-base font-bold text-white">Perangkat Ajar AI</span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-[var(--muted)] md:flex">
            <a href="#alur" className="transition hover:text-white">Alur</a>
            <a href="#kemampuan" className="transition hover:text-white">Kemampuan</a>
            <a href="#mulai" className="transition hover:text-white">Mulai</a>
          </nav>

          <Link href={session?.user ? "/dashboard" : "/login"} className="btn-neon !px-4 !py-2 !text-xs">
            {session?.user ? "Masuk Dashboard" : "Login / Demo"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-20">
        <Reveal>
          <div className="text-center">
            <span className="chip">
              <Sparkles className="h-3.5 w-3.5" />
              Kurikulum Merdeka AI Platform
            </span>

            <h1 className="text-glow mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Otomasi Penyusunan <span className="text-gradient">Perangkat Ajar</span> Lengkap &amp; Terintegrasi
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
              Dari <strong className="text-white">Capaian Pembelajaran (CP)</strong> hingga{" "}
              <strong className="text-white">Modul Ajar &amp; LKPD</strong> dalam satu alur terstruktur. Dilengkapi
              validasi konsistensi otomatis dan ekspor siap pakai ke format Word.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={startHref} className="btn-neon w-full sm:w-auto">
                <Zap className="h-4 w-4" />
                Mulai Buat Perangkat Ajar
              </Link>
              <Link href="/dashboard" className="btn-ghost w-full sm:w-auto">
                Lihat Ruang Kerja Demo
              </Link>
            </div>
          </div>
        </Reveal>

        <StaggerContainer className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="glass holo-card h-full rounded-2xl px-5 py-6 text-center">
                <p className="stat-num text-3xl font-extrabold md:text-4xl">{stat.value}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <section id="alur" className="mt-24 scroll-mt-20">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">Alur Penyusunan Terintegrasi</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Prinsip <em className="text-[#22d3ee] not-italic">generate once, reuse everywhere</em> menjaga
                konsistensi seluruh dokumen turunan.
              </p>
            </div>
          </Reveal>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map((step, idx) => (
              <StaggerItem key={step.code}>
                <TiltCard className="h-full p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md border border-[rgba(34,211,238,0.32)] bg-[rgba(34,211,238,0.12)] px-2 py-0.5 text-xs font-bold text-[#7dd3fc]">
                      {step.code}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--muted)]">Tahap {idx + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{step.desc}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section id="kemampuan" className="mt-24 scroll-mt-20">
          <StaggerContainer className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <TiltCard className="h-full p-6">
                  <feature.icon className={`h-7 w-7 ${feature.accent}`} />
                  <h3 className="mt-3 text-base font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{feature.desc}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section id="mulai" className="mt-24 scroll-mt-20">
          <Reveal>
            <TiltCard className="p-10 text-center">
              <Layers className="mx-auto h-8 w-8 text-[#22d3ee]" />
              <h2 className="mt-4 text-2xl font-bold text-white">Siap menyusun perangkat ajar hari ini?</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
                Masuk ke ruang kerja, pilih paket dokumen, lalu biarkan AI menyusun draf yang konsisten dengan
                kurikulum sekolah Anda.
              </p>
              <Link href={startHref} className="btn-neon mt-7">
                Buka Ruang Kerja
                <ArrowRight className="h-4 w-4" />
              </Link>
            </TiltCard>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-[var(--muted)]">
          Perangkat Ajar AI © {new Date().getFullYear()} · Platform Otomasi Kurikulum Merdeka
        </div>
      </footer>
    </div>
  );
}