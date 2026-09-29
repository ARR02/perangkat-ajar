import Link from "next/link";
import { auth } from "@/lib/auth";
import NavLink from "@/components/nav-link";
import { FileStack, FolderOpen, LayoutDashboard, Library, LogOut, School } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderOpen, label: "Proyek Saya" },
  { href: "/documents", icon: Library, label: "Pustaka Dokumen" },
  { href: "/schools", icon: School, label: "Data Sekolah" },
  { href: "/templates", icon: FileStack, label: "Template Dokumen" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <aside className="glass sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[var(--line)] p-6">
        <div>
          <Link href="/dashboard" className="mb-8 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#22d3ee] text-base font-bold text-white shadow-[0_10px_24px_-10px_rgba(124,92,255,0.95)]">
              P
            </span>
            <span>
              <span className="block text-base font-bold leading-none text-white">Perangkat Ajar</span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[#22d3ee]">
                AI Platform
              </span>
            </span>
          </Link>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </nav>
        </div>

        <div className="border-t border-[var(--line)] pt-4">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.1)] text-xs font-bold text-[#7dd3fc]">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">
                {session?.user?.name || "Guru"}
              </span>
              <span className="block truncate text-[11px] text-[var(--muted)]">
                {session?.user?.email || "guru@sekolah.sch.id"}
              </span>
            </span>
          </div>
          <Link
            href="/login"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[rgba(34,211,238,0.5)] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Ganti Akun
          </Link>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}