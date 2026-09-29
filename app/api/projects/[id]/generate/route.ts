import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/database";
import { generateCP } from "@/services/generators/cp-generator";
import { generateTP } from "@/services/generators/tp-generator";
import { generateATP } from "@/services/generators/atp-generator";
import { generateKKTP } from "@/services/generators/kktp-generator";
import { generateProta } from "@/services/generators/prota-generator";
import { generateProsem } from "@/services/generators/prosem-generator";
import { generateModul } from "@/services/generators/modul-generator";
import { generateLkpd } from "@/services/generators/lkpd-generator";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.curriculumProject.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true } });
  if (!project) {
    return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json();
  const type = body?.type;

  const generators: Record<string, (projectId: string) => Promise<{ ok: boolean; data?: unknown; error?: string }>> = {
    CP: generateCP,
    TP: generateTP,
    ATP: generateATP,
    KKTP: generateKKTP,
    PROTA: generateProta,
    PROSEM: generateProsem,
    MODUL_AJAR: generateModul,
    LKPD: generateLkpd,
  };

  if (typeof type !== "string" || !(type in generators)) {
    return NextResponse.json({ error: "Type dokumen tidak didukung" }, { status: 400 });
  }

  try {
    const result = await generators[type](projectId);

    if (result.ok) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (err) {
    console.error("GENERATE ERROR:", err);
    return NextResponse.json({ success: false, error: "Gagal generate dokumen" }, { status: 500 });
  }
}