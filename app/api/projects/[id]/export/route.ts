import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportDocument } from "@/services/export";
import { db } from "@/database";
import type { DocumentType } from "@prisma/client";

const documentTypes = new Set<DocumentType>(["CP", "TP", "ATP", "KKTP", "PROTA", "PROSEM", "MODUL_AJAR", "LKPD"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const project = await db.curriculumProject.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
  const body = await request.json();
  const { documentType, version = 1, format = "DOCX" } = body as {
    documentType?: string;
    version?: number;
    format?: string;
  };

  if (!documentType || !documentTypes.has(documentType as DocumentType)) {
    return NextResponse.json({ error: "documentType tidak valid" }, { status: 400 });
  }
  if (!Number.isInteger(version) || version < 1) {
    return NextResponse.json({ error: "version tidak valid" }, { status: 400 });
  }
  if (format !== "DOCX") {
    return NextResponse.json({ error: "Format yang tersedia: DOCX" }, { status: 400 });
  }

  const result = await exportDocument(projectId, documentType as DocumentType, version, "DOCX");
  if (!result.success || !result.buffer) {
    return NextResponse.json({ success: false, error: result.error || "Gagal membuat file DOCX", filename: result.filename }, { status: 404 });
  }
  const arrayBuffer = result.buffer.buffer.slice(result.buffer.byteOffset, result.buffer.byteOffset + result.buffer.byteLength) as ArrayBuffer;
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}