import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveTemplate, detectTemplateFields } from "@/services/template";
import { db } from "@/database";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Template file dibutuhkan" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    const extracted = await detectTemplateFields(buffer, filename);

    const school = await db.school.findFirst({ where: { ownerId: session.user.id } });
    if (!school) return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 400 });

    const docType = mapDocumentType(filename);
    const template = await saveTemplate(
      school.id,
      filename,
      docType,
      extracted as unknown as Record<string, unknown>,
      extracted.sections.flatMap((s, si) =>
        s.fields.map((f, fi) => ({
          key: f.key,
          label: f.label,
          fieldType: f.fieldType,
          required: false,
          position: si * 100 + fi,
        }))
      )
    );

    return NextResponse.json({ templateId: template.id, preview: extracted });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function mapDocumentType(filename: string): "CP" | "TP" | "ATP" | "KKTP" | "PROTA" | "PROSEM" | "MODUL_AJAR" | "LKPD" {
  const lower = filename.toLowerCase();
  if (lower.includes("modul")) return "MODUL_AJAR";
  if (lower.includes("lkpd")) return "LKPD";
  return "MODUL_AJAR";
}