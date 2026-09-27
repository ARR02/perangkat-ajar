import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createProject, getProjects } from "@/services/project";

const CreateProjectSchema = z.object({
  schoolName: z.string().trim().min(2).max(160),
  teacherName: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(120),
  phase: z.string().trim().min(1).max(10).default("D"),
  grade: z.string().trim().min(1).max(20).default("VIII"),
  semester: z.string().trim().min(1).max(20).default("1"),
  academicYear: z.string().trim().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran: YYYY/YYYY").default("2026/2027"),
  weeklyHours: z.number().positive().optional().default(4),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const projects = await getProjects(session.user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const payload = CreateProjectSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Data project tidak valid", details: payload.error.flatten() }, { status: 400 });
  }

  try {
    const project = await createProject({
      userId: session.user.id,
      ...payload.data,
    });

    return NextResponse.json({ id: project.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create project:", error);
    const errorMessage = error instanceof Error ? error.message : "Gagal membuat project";
    return NextResponse.json({
      error: errorMessage,
      details: String(error),
    }, { status: 500 });
  }
}