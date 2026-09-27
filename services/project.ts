/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database";

export interface CreateProjectInput {
  userId: string;
  schoolName: string;
  teacherName: string;
  subject: string;
  phase?: string;
  grade?: string;
  semester?: string;
  academicYear?: string;
  weeklyHours?: number;
}

export async function getProjects(userId: string) {
  return db.curriculumProject.findMany({
    where: { userId },
    include: { school: true, teacher: true, context: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProjectById(projectId: string, userId?: string) {
  return db.curriculumProject.findFirst({
    where: {
      id: projectId,
      ...(userId ? { userId } : {}),
    },
    include: {
      school: true,
      teacher: true,
      context: true,
    },
  });
}

export async function createProject(input: CreateProjectInput) {
  const {
    userId,
    schoolName,
    teacherName,
    subject,
    phase = "D",
    grade = "VIII",
    semester = "1",
    academicYear = "2026/2027",
    weeklyHours = 4,
  } = input;

  return db.$transaction(async (tx) => {
    let school = await tx.school.findFirst({
      where: { ownerId: userId, name: schoolName },
    });
    if (!school) {
      school = await tx.school.create({
        data: { name: schoolName, ownerId: userId },
      });
    }

    let teacher = await tx.teacher.findFirst({
      where: { userId, schoolId: school.id },
    });
    if (!teacher) {
      teacher = await tx.teacher.create({
        data: { userId, schoolId: school.id, name: teacherName },
      });
    } else if (teacher.name !== teacherName) {
      teacher = await tx.teacher.update({
        where: { id: teacher.id },
        data: { name: teacherName },
      });
    }

    const project = await tx.curriculumProject.create({
      data: {
        userId,
        schoolId: school.id,
        teacherId: teacher.id,
        context: {
          create: {
            school: { name: schoolName },
            teacher: { name: teacherName },
            curriculum: "Kurikulum Merdeka",
            phase,
            grade,
            semester,
            academicYear,
            subject,
            weeklyHours,
            cp: {},
            learningObjectives: [],
            learningSequences: [],
            assessmentCriteria: [],
            annualProgram: [],
            semesterProgram: [],
            modules: [],
            worksheets: [],
          },
        },
      },
      include: {
        school: true,
        teacher: true,
        context: true,
      },
    });

    return project;
  });
}

export async function getDashboardStats(userId: string) {
  const [projectsCount, schoolsCount, templatesCount, recentProjects] = await Promise.all([
    db.curriculumProject.count({ where: { userId } }),
    db.school.count({ where: { ownerId: userId } }),
    db.template.count(),
    db.curriculumProject.findMany({
      where: { userId },
      include: { school: true, teacher: true, context: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  let totalDocumentsReady = 0;
  for (const p of recentProjects) {
    if (p.context) {
      const c = p.context;
      if (c.cp && (c.cp as any).elements?.length) totalDocumentsReady++;
      if (Array.isArray(c.learningObjectives) && c.learningObjectives.length) totalDocumentsReady++;
      if (Array.isArray(c.learningSequences) && c.learningSequences.length) totalDocumentsReady++;
      if (Array.isArray(c.assessmentCriteria) && c.assessmentCriteria.length) totalDocumentsReady++;
      if (Array.isArray(c.annualProgram) && c.annualProgram.length) totalDocumentsReady++;
      if (Array.isArray(c.semesterProgram) && c.semesterProgram.length) totalDocumentsReady++;
      if (Array.isArray(c.modules) && c.modules.length) totalDocumentsReady++;
      if (Array.isArray(c.worksheets) && c.worksheets.length) totalDocumentsReady++;
    }
  }

  return {
    projectsCount,
    schoolsCount,
    templatesCount,
    totalDocumentsReady,
    recentProjects,
  };
}