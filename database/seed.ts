import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { email: "guru@sekolah.sch.id" },
    update: {},
    create: {
      email: "guru@sekolah.sch.id",
      name: "Budi Santoso, S.Pd.",
    },
  });

  const school = await prisma.school.upsert({
    where: { id: "school-demo-01" },
    update: {},
    create: {
      id: "school-demo-01",
      name: "SMA Negeri 1 Nusantara",
      ownerId: user.id,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId_schoolId: { userId: user.id, schoolId: school.id } },
    update: {},
    create: {
      userId: user.id,
      schoolId: school.id,
      name: "Budi Santoso, S.Pd.",
    },
  });

  console.log("Seed data successfully created:", { user: user.email, school: school.name, teacher: teacher.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
