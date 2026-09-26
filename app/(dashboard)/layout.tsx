import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <aside className="w-64 border-r border-gray-200 bg-white p-6 flex flex-col justify-between">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              P
            </span>
            <div>
              <span className="block text-base font-bold text-gray-900 leading-none">
                Perangkat Ajar
              </span>
              <span className="block text-[11px] font-semibold text-blue-600 uppercase tracking-wider mt-0.5">
                AI Platform
              </span>
            </div>
          </Link>

          <nav className="space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <span>📁</span>
              <span>Proyek Saya</span>
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <span>📄</span>
              <span>Pustaka Dokumen</span>
            </Link>
            <Link
              href="/schools"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <span>🏫</span>
              <span>Data Sekolah</span>
            </Link>
            <Link
              href="/templates"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <span>📐</span>
              <span>Template Dokumen</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {session?.user?.name || "Guru"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {session?.user?.email || "guru@sekolah.sch.id"}
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="mt-3 block w-full rounded-lg border border-gray-200 px-3 py-1.5 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Ganti Akun / Logout
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-7xl">{children}</main>
    </div>
  );
}
