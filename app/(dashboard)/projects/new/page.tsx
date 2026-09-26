"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    schoolName: "SMA Negeri 1 Nusantara",
    teacherName: "Budi Santoso, S.Pd.",
    subject: "Informatika",
    phase: "E",
    grade: "X",
    semester: "1",
    academicYear: "2026/2027",
    weeklyHours: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          weeklyHours: Number(formData.weeklyHours),
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/projects/${data.id}`);
      } else {
        setError(data.error || "Gagal membuat proyek baru.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan saat membuat proyek.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/projects" className="text-xs font-semibold text-blue-600 hover:underline">
          ← Kembali ke Daftar Proyek
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Buat Paket Perangkat Ajar Baru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi identitas kurikulum untuk memulai otomasi penyusunan CP, TP, ATP, KKTP, PROTA, PROSEM, Modul Ajar, dan LKPD.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Satuan Pendidikan *
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              placeholder="Contoh: SMA Negeri 1 Jakarta"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Guru Penyusun *
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              placeholder="Nama lengkap & gelar"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Mata Pelajaran *
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Contoh: Informatika, Matematika, Bahasa Indonesia"
            required
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Fase Kurikulum
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:border-blue-500 focus:outline-none"
              value={formData.phase}
              onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
            >
              <option value="A">Fase A (SD 1-2)</option>
              <option value="B">Fase B (SD 3-4)</option>
              <option value="C">Fase C (SD 5-6)</option>
              <option value="D">Fase D (SMP 7-9)</option>
              <option value="E">Fase E (SMA 10)</option>
              <option value="F">Fase F (SMA 11-12)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Tingkat / Kelas
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              placeholder="Contoh: X, XI, VII, IV"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Semester
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:border-blue-500 focus:outline-none"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            >
              <option value="1">1 (Ganjil)</option>
              <option value="2">2 (Genap)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              JP / Minggu
            </label>
            <input
              type="number"
              min="1"
              max="12"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
              value={formData.weeklyHours}
              onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) || 2 })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Tahun Ajaran
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            placeholder="Format: 2026/2027"
            required
          />
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
          <Link
            href="/projects"
            className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {loading ? "Menyiapkan Proyek..." : "Simpan & Masuk Ruang Kerja →"}
          </button>
        </div>
      </form>
    </div>
  );
}
