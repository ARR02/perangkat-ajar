import { auth } from "@/lib/auth";
import { db } from "@/database";
import { redirect } from "next/navigation";

export default async function SchoolsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const schools = await db.school.findMany({
    where: { ownerId: session.user.id },
    include: {
      teachers: true,
      projects: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Satuan Pendidikan & Guru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Informasi profil sekolah dan data guru penyusun perangkat ajar.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {schools.map((school) => (
          <div key={school.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 mb-2">
                  Satuan Pendidikan
                </span>
                <h2 className="text-lg font-bold text-gray-900">{school.name}</h2>
              </div>
              <span className="text-xs text-gray-400">
                {school.projects.length} Proyek Aktif
              </span>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Daftar Guru Terdaftar
              </h3>
              {school.teachers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada profil guru.</p>
              ) : (
                <div className="space-y-2">
                  {school.teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    >
                      <span className="font-medium">{teacher.name}</span>
                      <span className="text-xs text-gray-500">Penyusun</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
