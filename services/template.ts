/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database";
import type { Template, DocumentType, Prisma } from "@prisma/client";

export interface ExtractedField {
  key: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  staticText?: string;
  position: { sectionId: string; index: number };
  confidence?: number;
}

export interface ExtractedSection {
  id: string;
  title: string;
  fields: ExtractedField[];
}

export interface ExtractedTemplate {
  sections: ExtractedSection[];
  metadata: { source: string; pageCount?: number };
}

/**
 * Simulasi parsing template dari file (DOCX/PDF).
 * Dalam produksi, gunakan pustaka anti-crawl seperti python-docx, pdf2image + Tesseract.
 */
export function parseTemplateFile(buffer: Buffer, filename: string): ExtractedTemplate {
  // Simulasi: Excel/JSON siap pakai
  if (filename.endsWith(".json")) {
    const data = JSON.parse(buffer.toString()) as ExtractedTemplate;
    return data;
  }

  // Mock extraction: menghasilkan field generik dan section
  return {
    sections: [
      {
        id: "informasi_umum",
        title: "I. Informasi Umum",
        fields: [
          { key: "school_name", label: "Nama Sekolah", fieldType: "school_identity", position: { sectionId: "informasi_umum", index: 0 }, confidence: 1 },
          { key: "kompetensi_awal", label: " Kompetensi Awal", fieldType: "free_text", position: { sectionId: "informasi_umum", index: 1 }, confidence: 0.9 },
        ],
      },
      {
        id: "tujuan_pembelajaran",
        title: "II. Tujuan Pembelajaran",
        fields: [
          { key: "tp", label: "Tujuan Pembelajaran", fieldType: "source_tp", position: { sectionId: "tujuan_pembelajaran", index: 0 }, confidence: 0.8 },
        ],
      },
      {
        id: "kegiatan_pembelajaran",
        title: "III. Kegiatan Pembelajaran",
        fields: [
          { key: "activity_ai_generated", label: "Aktivitas Pembelajaran", fieldType: "ai_generated", position: { sectionId: "kegiatan_pembelajaran", index: 0 }, confidence: 0.7 },
        ],
      },
    ],
    metadata: { source: filename, pageCount: filename.endsWith(".pdf") ? 2 : 1 },
  };
}

/**
 * Mengubah ExtractedTemplate menjadi array rows yang siap simpan
 */
export function flattenTemplate(template: ExtractedTemplate): Array<{ key: string; sectionId: string; label: string; fieldType: string; position: number }> {
  return template.sections.flatMap((section, si) =>
    section.fields.map((field, fi) => ({
      key: field.key,
      sectionId: section.id,
      label: field.label,
      fieldType: field.fieldType,
      position: si * 100 + fi, // urutan sederhana
    }))
  );
}

/**
 * Menyimpan template dan field secara atomik
 */
export async function saveTemplate(
  schoolId: string,
  name: string,
  documentType: DocumentType,
  schema: any,
  fields: Array<{ key: string; label: string; fieldType: string; required: boolean; position: number; config?: any }>
): Promise<Template> {
  return db.$transaction(async (tx) => {
    const template = await tx.template.create({
      data: {
        schoolId,
        name,
        documentType,
        version: 1,
        schemaJson: schema as Prisma.InputJsonValue,
        fields: {
          create: fields.map((f) => ({
            key: f.key,
            label: f.label,
            fieldType: f.fieldType,
            required: f.required ?? false,
            position: f.position,
            configJson: f.config === undefined ? undefined : (f.config as Prisma.InputJsonValue),
          })),
        },
      },
      include: { fields: true },
    });
    return template;
  });
}

/**
 * Mengambil template terbaru yang aktif untuk sekolah dan tipe dokumen tertentu
 */
export async function getActiveTemplate(schoolId: string, documentType: DocumentType): Promise<Template | null> {
  return db.template.findFirst({
    where: { schoolId, documentType, version: 1 },
    include: { fields: { orderBy: { position: "asc" } } },
  });
}

/**
 * Jalankan AI detection untuk template yang diupload
 */
export async function detectTemplateFields(buffer: Buffer, filename: string): Promise<ExtractedTemplate> {
  // Dalam produksi, AI akan membaca teks dari DOCX/PDF dan menentukan struktur, heading, placeholder, static text, dll.
  const extracted = parseTemplateFile(buffer, filename);
  // Tambahkan confidence rendah untuk elemen yang tak pasti
  extracted.sections.forEach((sec) => {
    sec.fields.forEach((f) => {
      if (f.fieldType === "ai_generated" || f.fieldType === "source_tp") {
        f.confidence = (f.confidence ?? 1) * 0.7;
      }
    });
  });
  return extracted;
}