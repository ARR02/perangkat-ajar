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
  const { type } = body;

  try {
    let result;
    switch (type) {
      case "CP":
        result = await generateCP(projectId);
        break;
      case "TP":
        result = await generateTP(projectId);
        break;
      case "ATP":
        result = await generateATP(projectId);
        break;
      case "KKTP":
        result = await generateKKTP(projectId);
        break;
      case "PROTA":
        result = await generateProta(projectId);
        break;
      case "PROSEM":
        result = await generateProsem(projectId);
        break;
      case "Modul Ajar":
        result = await generateModul(projectId);
        break;
      case "LKPD":
        result = await generateLkpd(projectId);
        break;
      default:
        return NextResponse.json({ error: "Type dokumen tidak didukung" }, { status: 400 });
    }

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