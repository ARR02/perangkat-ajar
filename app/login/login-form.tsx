"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("guru@sekolah.sch.id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string) => {
    const targetEmail = (loginEmail || email).trim();
    if (!targetEmail) {
      setError("Email tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: targetEmail,
        password: "demo",
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError(result?.error || "Gagal login. Pastikan database aktif.");
      }
    } catch {
      setError("Terjadi kesalahan sistem saat otentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-gray-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </span>
            <span className="font-bold text-gray-900 text-lg">Perangkat Ajar AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke Ruang Kerja</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gunakan akun email pendidik Anda untuk mengakses seluruh fitur perangkat ajar.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Akun Guru
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="contoh: guru@sekolah.sch.id"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 shadow-sm transition"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard →"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">
            Pilihan Akun Uji Coba Cepat
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("guru@sekolah.sch.id");
                handleLogin("guru@sekolah.sch.id");
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Guru (Demo Default)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("informatika@sma1.sch.id");
                handleLogin("informatika@sma1.sch.id");
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Guru Informatika
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
