import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-gray-50 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              P
            </span>
            <span className="font-bold text-gray-900 text-base">Perangkat Ajar AI</span>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition"
              >
                Masuk Dashboard →
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition"
              >
                Login / Masuk Demo
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3.5 py-1 text-xs font-semibold text-blue-800 mb-6">
          <span>✨ Kurikulum Merdeka AI Platform</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight max-w-3xl mx-auto leading-tight">
          Otomasi Penyusunan <span className="text-blue-600">Perangkat Ajar</span> Lengkap & Terintegrasi
        </h1>

        <p className="mt-5 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Dari <strong>Capaian Pembelajaran (CP)</strong> hingga <strong>Modul Ajar & LKPD</strong> dalam satu alur terstruktur. Dilengkapi validasi konsistensi otomatis dan ekspor siap pakai ke format Word (.docx).
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={session?.user ? "/projects/new" : "/login"}
            className="w-full sm:w-auto rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
          >
            Mulai Buat Perangkat Ajar →
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Lihat Ruang Kerja Demo
          </Link>
        </div>

        {/* 8-Step Pipeline */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Alur Penyusunan Terintegrasi</h2>
            <p className="text-sm text-gray-500 mt-1">
              Prinsip <em>&quot;Generate once, reuse everywhere&quot;</em> menjamin konsistensi seluruh dokumen turunan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {flowSteps.map((step, idx) => (
              <div
                key={step.code}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {step.code}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">Tahap {idx + 1}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{step.title}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-6">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-bold text-blue-950 text-base">Structured JSON IR</h3>
            <p className="mt-2 text-xs text-blue-900/80 leading-relaxed">
              AI menghasilkan representasi data terstruktur yang tervalidasi skema Zod sebelum dirender atau diekspor.
            </p>
          </div>

          <div className="rounded-xl bg-green-50/60 border border-green-100 p-6">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-bold text-green-950 text-base">Consistency Engine</h3>
            <p className="mt-2 text-xs text-green-900/80 leading-relaxed">
              Mendeteksi otomatis ketidakcocokan kode TP, keterikatan alur ATP, dan beban alokasi jam belajar PROTA/PROSEM.
            </p>
          </div>

          <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-6">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-bold text-purple-950 text-base">Ekspor Word (.DOCX) Resmi</h3>
            <p className="mt-2 text-xs text-purple-900/80 leading-relaxed">
              Hasil generate langsung dikonversi menjadi berkas DOCX terformat rapi dengan tabel identitas dan struktur standar sekolah.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-gray-400">
          Perangkat Ajar AI © {new Date().getFullYear()} · Platform Otomasi Kurikulum Merdeka
        </div>
      </footer>
    </div>
  );
}
