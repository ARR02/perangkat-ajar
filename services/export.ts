/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database";
import type { DocumentType, Prisma } from "@prisma/client";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from "docx";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface ExportResult {
  success: boolean;
  url?: string;
  error?: string;
  filename: string;
}

const tableBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
};

function createHeaderParagraph(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  });
}

function createMetaTable(meta: {
  school: string;
  teacher: string;
  subject: string;
  phaseGrade: string;
  semesterYear: string;
}): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Satuan Pendidikan: ", bold: true }), new TextRun(meta.school)] }),
              new Paragraph({ children: [new TextRun({ text: "Mata Pelajaran: ", bold: true }), new TextRun(meta.subject)] }),
              new Paragraph({ children: [new TextRun({ text: "Fase / Kelas: ", bold: true }), new TextRun(meta.phaseGrade)] }),
            ],
            borders: tableBorder,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Penyusun: ", bold: true }), new TextRun(meta.teacher)] }),
              new Paragraph({ children: [new TextRun({ text: "Semester / T.A.: ", bold: true }), new TextRun(meta.semesterYear)] }),
              new Paragraph({ children: [new TextRun({ text: "Kurikulum: ", bold: true }), new TextRun("Kurikulum Merdeka")] }),
            ],
            borders: tableBorder,
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates a structured DOCX file from document content and returns a relative URL.
 */
export async function exportDocument(
  projectId: string,
  documentType: DocumentType,
  version: number,
  format: "DOCX" | "PDF" | "XLSX"
): Promise<ExportResult> {
  const context = await db.curriculumContext.findUnique({
    where: { projectId },
    include: {
      project: {
        include: {
          school: true,
          teacher: true,
        },
      },
    },
  });

  if (!context) {
    return { success: false, error: "Context project tidak ditemukan.", filename: `${documentType}-v1` };
  }

  const schoolName = (context.school as any)?.name || context.project.school.name || "Sekolah";
  const teacherName = (context.teacher as any)?.name || context.project.teacher.name || "Guru";
  const meta = {
    school: schoolName,
    teacher: teacherName,
    subject: context.subject,
    phaseGrade: `Fase ${context.phase} / Kelas ${context.grade}`,
    semesterYear: `Semester ${context.semester} / ${context.academicYear}`,
  };

  const docChildren: (Paragraph | Table)[] = [
    createHeaderParagraph(`PERANGKAT AJAR: ${documentType.replace(/_/g, " ")}`),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "KURIKULUM MERDEKA", bold: true, size: 22 })],
      spacing: { after: 200 },
    }),
    createMetaTable(meta),
    new Paragraph({ text: "", spacing: { after: 200 } }),
  ];

  if (documentType === "CP") {
    const cp = context.cp as any;
    const elements: any[] = cp?.elements || [];
    docChildren.push(
      new Paragraph({ text: "A. Capaian Pembelajaran per Elemen", heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })
    );

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Elemen", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Capaian Pembelajaran", bold: true })] })], borders: tableBorder }),
        ],
      }),
      ...elements.map((el, i) => new TableRow({
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph(String(i + 1))], borders: tableBorder }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph(el.element || "-")], borders: tableBorder }),
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph(el.capaianPembelajaran || "-")], borders: tableBorder }),
        ],
      })),
    ];
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  } else if (documentType === "TP") {
    const tps = (context.learningObjectives as any[]) || [];
    docChildren.push(
      new Paragraph({ text: "A. Tujuan Pembelajaran (TP)", heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })
    );
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Kode TP", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Elemen CP", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Rumusan Tujuan Pembelajaran", bold: true })] })], borders: tableBorder }),
        ],
      }),
      ...tps.map((tp) => new TableRow({
        children: [
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(tp.code || tp.id || "-")], borders: tableBorder }),
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph(tp.relatedCPElement || tp.element || "-")], borders: tableBorder }),
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph(tp.description || "-")], borders: tableBorder }),
        ],
      })),
    ];
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  } else if (documentType === "ATP") {
    const atps = (context.learningSequences as any[]) || [];
    docChildren.push(
      new Paragraph({ text: "A. Alur Tujuan Pembelajaran (ATP)", heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })
    );
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Ref TP", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Materi / Alur Pembelajaran", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Alokasi JP", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Semester", bold: true })] })], borders: tableBorder }),
        ],
      }),
      ...atps.map((atp, i) => new TableRow({
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph(String(atp.order || i + 1))], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(atp.tpId || "-")], borders: tableBorder }),
          new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph(`${atp.materialScope || ""}\n${atp.tpDescription || ""}`)], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(`${atp.allocatedHours || 2} JP`)], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(`Sem ${atp.semester || "1"}`)], borders: tableBorder }),
        ],
      })),
    ];
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  } else if (documentType === "KKTP") {
    const kktps = (context.assessmentCriteria as any[]) || [];
    docChildren.push(
      new Paragraph({ text: "A. Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)", heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })
    );
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "TP ID", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Indikator Ketercapaian", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Kriteria & Bukti Asesmen", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Kategori / Instrumen", bold: true })] })], borders: tableBorder }),
        ],
      }),
      ...kktps.map((k) => new TableRow({
        children: [
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(k.tpId || "-")], borders: tableBorder }),
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph((k.indicators || []).join("\n• "))], borders: tableBorder }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph(`Kriteria: ${k.achievementCriteria || "-"}\nBukti: ${k.assessmentEvidence || "-"}`)], borders: tableBorder }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph(`Kategori: ${k.achievementCategory || "Baik"}\nInstrumen: ${(k.instruments || []).join(", ")}`)], borders: tableBorder }),
        ],
      })),
    ];
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  } else if (documentType === "PROTA") {
    const prota = (context.annualProgram as any[]) || [];
    docChildren.push(
      new Paragraph({ text: "A. Matriks Program Tahunan (PROTA)", heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })
    );
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Alur / Materi Pokok", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Alokasi Waktu", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Semester", bold: true })] })], borders: tableBorder }),
        ],
      }),
      ...prota.map((item, i) => new TableRow({
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph(String(item.no || i + 1))], borders: tableBorder }),
          new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph(item.materialTopic || item.atpId || "-")], borders: tableBorder }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph(`${item.allocatedHours || 0} JP`)], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(`Sem ${item.semester || "1"}`)], borders: tableBorder }),
        ],
      })),
    ];
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  } else if (documentType === "PROSEM") {
    const prosem = (context.semesterProgram as any[]) || [];
    docChildren.push(
      new Paragraph({ text: "A. Matriks Program Semester (PROSEM)", heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })
    );
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Materi Pokok", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Alokasi JP", bold: true })] })], borders: tableBorder }),
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Distribusi Bulan", bold: true })] })], borders: tableBorder }),
        ],
      }),
      ...prosem.map((item, i) => {
        const monthDist = item.monthAllocations
          ? Object.entries(item.monthAllocations).map(([m, w]) => `${m}: [${(w as any).join(", ")}]`).join("; ")
          : "-";
        return new TableRow({
          children: [
            new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph(String(item.no || i + 1))], borders: tableBorder }),
            new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph(item.materialTopic || item.atpId || "-")], borders: tableBorder }),
            new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph(`${item.allocatedHours || 0} JP`)], borders: tableBorder }),
            new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph(monthDist)], borders: tableBorder }),
          ],
        });
      }),
    ];
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
  } else if (documentType === "MODUL_AJAR") {
    const modules = (context.modules as any[]) || [];
    modules.forEach((mod, idx) => {
      docChildren.push(
        new Paragraph({ text: `${idx + 1}. ${mod.title || "Modul Ajar"}`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: "Alokasi Waktu: ", bold: true }), new TextRun(mod.allocation || "-")] }),
        new Paragraph({ children: [new TextRun({ text: "Target Siswa: ", bold: true }), new TextRun(mod.targetStudents || "Reguler")] }),
        new Paragraph({ children: [new TextRun({ text: "Model Pembelajaran: ", bold: true }), new TextRun(mod.learningModel || "Problem-Based Learning")] }),
        new Paragraph({ children: [new TextRun({ text: "Profil Pelajar Pancasila: ", bold: true }), new TextRun((mod.pancasilaProfile || []).join(", "))] }),
        new Paragraph({ children: [new TextRun({ text: "Langkah-Langkah Kegiatan:", bold: true })], spacing: { before: 100, after: 50 } }),
        new Paragraph({ children: [new TextRun({ text: "• Pendahuluan: ", bold: true }), new TextRun((mod.coreActivities?.opening || []).join(" "))] }),
        new Paragraph({ children: [new TextRun({ text: "• Inti: ", bold: true }), new TextRun((mod.coreActivities?.main || []).join(" "))] }),
        new Paragraph({ children: [new TextRun({ text: "• Penutup: ", bold: true }), new TextRun((mod.coreActivities?.closing || []).join(" "))] }),
        new Paragraph({ children: [new TextRun({ text: "Asesmen Pembelajaran:", bold: true })], spacing: { before: 100, after: 50 } }),
        new Paragraph({ children: [new TextRun({ text: "• Diagnostik: ", bold: true }), new TextRun(mod.assessments?.diagnostic || "-")] }),
        new Paragraph({ children: [new TextRun({ text: "• Formatif: ", bold: true }), new TextRun(mod.assessments?.formative || "-")] }),
        new Paragraph({ children: [new TextRun({ text: "• Sumatif: ", bold: true }), new TextRun(mod.assessments?.summative || "-")] }),
        new Paragraph({ text: "", spacing: { after: 150 } })
      );
    });
  } else if (documentType === "LKPD") {
    const worksheets = (context.worksheets as any[]) || [];
    worksheets.forEach((ws, idx) => {
      docChildren.push(
        new Paragraph({ text: `${idx + 1}. ${ws.title || "Lembar Kerja Peserta Didik"}`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: "Petunjuk Pengerjaan:", bold: true })], spacing: { before: 50, after: 50 } }),
        ...(ws.instructions || []).map((ins: string, insIdx: number) => new Paragraph(`${insIdx + 1}. ${ins}`)),
        new Paragraph({ children: [new TextRun({ text: "Aktivitas & Tugas:", bold: true })], spacing: { before: 100, after: 50 } }),
        ...(ws.activities || []).flatMap((act: any) => [
          new Paragraph({ children: [new TextRun({ text: `Langkah ${act.step || 1}: `, bold: true }), new TextRun(act.instruction || "")] }),
          ...(act.questions || []).map((q: string, qIdx: number) => new Paragraph(`   ${qIdx + 1}) ${q}`)),
        ]),
        new Paragraph({ children: [new TextRun({ text: "Refleksi Peserta Didik:", bold: true })], spacing: { before: 100, after: 50 } }),
        ...(ws.reflectionQuestions || []).map((ref: string, rIdx: number) => new Paragraph(`${rIdx + 1}. ${ref}`)),
        new Paragraph({ text: "", spacing: { after: 150 } })
      );
    });
  }

  const filename = `${documentType}-${projectId.slice(0, 8)}.docx`;
  const exportDir = join(process.cwd(), "public", "exports");
  const filePath = join(exportDir, filename);

  try {
    await mkdir(exportDir, { recursive: true });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    await writeFile(filePath, buffer);

    await db.aiGenerationLog.create({
      data: {
        projectId,
        provider: "export-engine",
        operation: "EXPORT",
        status: "SUCCESS",
        requestId: `exp-${Date.now()}`,
        metadata: { documentType, version, format } as Prisma.InputJsonValue,
      },
    });

    return { success: true, url: `/exports/${filename}`, filename };
  } catch (error) {
    console.error("Export error:", error);
    return { success: false, error: "Gagal membuat file DOCX", filename };
  }
}

export async function getRelatedDocuments(projectId: string): Promise<string[]> {
  const master = await db.curriculumContext.findUnique({ where: { projectId } });
  if (!master) return [];

  const cp = master.cp as { elements?: Array<{ element: string }> } | null;
  const cpElements = cp?.elements?.map((e) => e.element) ?? [];
  const tpIds = (master.learningObjectives as Array<{ id: string }>) ?? [];
  const atpIds = (master.learningSequences as Array<{ id: string }>) ?? [];
  const kktpIds = (master.assessmentCriteria as Array<{ id: string }>) ?? [];
  const modulIds = (master.modules as Array<{ id: string }>) ?? [];
  const lkpdIds = (master.worksheets as Array<{ id: string }>) ?? [];

  return [
    ...cpElements,
    ...tpIds.map((t) => t.id),
    ...atpIds.map((a) => a.id),
    ...kktpIds.map((k) => k.id),
    ...modulIds.map((m) => m.id),
    ...lkpdIds.map((w) => w.id),
  ];
}