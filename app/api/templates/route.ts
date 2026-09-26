import { db } from "@/database";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const school = await db.school.findFirst({ where: { ownerId: session.user.id } });
  if (!school) return NextResponse.json({ templates: [] });

  const templates = await db.template.findMany({
    where: { schoolId: school.id },
    include: { fields: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ templates });
}
