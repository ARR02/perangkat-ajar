"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export default function NavLink({ href, icon: Icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active ? "text-white" : "text-[var(--muted)] hover:text-white"
      )}
    >
      {active && (
        <span className="absolute inset-0 rounded-xl border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.08)]" />
      )}
      <Icon
        className={cn(
          "relative h-4 w-4 shrink-0 transition",
          active ? "text-[#22d3ee]" : "text-[var(--muted)] group-hover:text-[#22d3ee]"
        )}
      />
      <span className="relative">{label}</span>
    </Link>
  );
}