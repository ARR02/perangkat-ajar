"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
};

/** Card that tracks the pointer and tilts in 3D. CSS handles the rest. */
export default function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    el.style.transform = [
      "perspective(900px)",
      `rotateX(${(-offsetY * 10).toFixed(2)}deg)`,
      `rotateY(${(offsetX * 12).toFixed(2)}deg)`,
      "translateY(-6px)",
    ].join(" ");
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn("glass holo-card rounded-2xl", className)}
    >
      {children}
    </div>
  );
}