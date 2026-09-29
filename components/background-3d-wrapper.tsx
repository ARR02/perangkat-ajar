"use client";

import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("@/components/background-3d"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 -z-10 bg-transparent opacity-40"></div>
});

export default function Background3DWrapper() {
  return <Background3D />;
}
