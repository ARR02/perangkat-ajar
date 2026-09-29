"use client";

import { useState } from "react";
import type { CurriculumMaster } from "@/types/curriculum-master";
import { getFixPlan, type ConsistencyResult } from "@/services/consistency";

interface DocMeta {
  key: "CP" | "TP" | "ATP" | "KKTP" | "PROTA" | "PROSEM" | "MODUL_AJAR" | "LKPD";
  label: string;
  ready: boolean;
  dependsOn: string | null;
  count: number;
}

export function DocumentGrid({
  projectId,
  documents,
  master,
  consistency,
}: {
  projectId: string;
  documents: DocMeta[];
  master: CurriculumMaster;
  consistency: ConsistencyResult;
}) {
  const [messages, setMessages] = useState<Record<string, { text: string; error: boolean }>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocMeta | null>(null);
  const fixPlan = getFixPlan(consistency.issues);

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    const missing = documents.filter((d) => !d.ready);
    const generated = new Set<string>();
    try {
      for (const doc of missing) {
        const depReady =
          !doc.dependsOn ||
          documents.find((d) => d.key === doc.dependsOn)?.ready ||
          generated.has(doc.dependsOn);
        if (!depReady) {
          setMessages((prev) => ({
            ...prev,
            [doc.key]: { text: `Lewati — butuh ${doc.dependsOn} dulu`, error: true },
          }));
          continue;
        }
        setMessages((prev) => ({ ...prev, [doc.key]: { text: "Memproses AI...", error: false } }));
        try {
          const res = await fetch(`/api/projects/${projectId}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: doc.key }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            generated.add(doc.key);
            setMessages((prev) => ({
              ...prev,
              [doc.key]: { text: "Berhasil dibuat!", error: false },
            }));
          } else {
            setMessages((prev) => ({
              ...prev,
              [doc.key]: { text: data.error || "Gagal generate", error: true },
            }));
          }
        } catch {
          setMessages((prev) => ({
            ...prev,
            [doc.key]: { text: "Terjadi kesalahan jaringan", error: true },
          }));
        }
      }
    } finally {
      setGeneratingAll(false);
      window.location.reload();
    }
  };

  const handleAutoFix = async () => {
    if (fixPlan.length === 0) return;
    const list = fixPlan.map((f) => `• ${f.docKey}: ${f.reason}`).join("\n");
    if (!window.confirm(`Perbaiki dengan membuat ulang dokumen berikut?\n\n${list}\n\nLanjutkan?`)) return;
    setFixing(true);
    try {
      for (const item of fixPlan) {
        setMessages((prev) => ({ ...prev, [item.docKey]: { text: "Memproses AI...", error: false } }));
        try {
          const res = await fetch(`/api/projects/${projectId}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: item.docKey }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setMessages((prev) => ({ ...prev, [item.docKey]: { text: "Berhasil diperbaiki!", error: false } }));
          } else {
            setMessages((prev) => ({
              ...prev,
              [item.docKey]: { text: data.error || "Gagal memperbaiki", error: true },
            }));
          }
        } catch {
          setMessages((prev) => ({ ...prev, [item.docKey]: { text: "Terjadi kesalahan jaringan", error: true } }));
        }
      }
    } finally {
      setFixing(false);
      window.location.reload();
    }
  };

  const handleGenerate = async (docKey: string, label: string) => {
    setLoading(label);
    setMessages((prev) => ({ ...prev, [docKey]: { text: "Memproses AI...", error: false } }));

    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: docKey }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => ({
          ...prev,
          [docKey]: { text: "Berhasil dibuat!", error: false },
        }));
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setMessages((prev) => ({
          ...prev,
          [docKey]: { text: data.error || "Gagal generate", error: true },
        }));
      }
    } catch {
      setMessages((prev) => ({
        ...prev,
        [docKey]: { text: "Terjadi kesalahan jaringan", error: true },
      }));
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async (docKey: string) => {
    setExporting(docKey);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docKey, version: 1, format: "DOCX" }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="?([^";]+)"?/);
        const filename = match?.[1] || `${docKey}.docx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        let message = "Gagal mengekspor dokumen";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          // ignore non-JSON error body
        }
        alert(message);
      }
    } catch {
      alert("Terjadi kesalahan jaringan saat mengunduh berkas.");
    } finally {
      setExporting(null);
    }
  };

  const renderPreviewContent = (docKey: string) => {
    switch (docKey) {
      case "CP":
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Elemen Capaian Pembelajaran</h4>
            {master.cp?.elements && master.cp.elements.length > 0 ? (
              <div className="divide-y border rounded-lg overflow-hidden">
                {master.cp.elements.map((el, i) => (
                  <div key={i} className="p-4 bg-white">
                    <span className="font-semibold text-blue-700 block mb-1">
                      {i + 1}. {el.element}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{el.capaianPembelajaran}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Belum ada konten CP.</p>
            )}
          </div>
        );

      case "TP":
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Daftar Tujuan Pembelajaran</h4>
            <div className="space-y-3">
              {master.learningObjectives.map((tp) => (
                <div key={tp.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                      {tp.code || tp.id}
                    </span>
                    <span className="text-xs text-gray-500">Elemen: {tp.relatedCPElement || tp.element}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{tp.description}</p>
                  {tp.scopeOfMaterial && (
                    <p className="text-xs text-gray-500 mt-1">Lingkup Materi: {tp.scopeOfMaterial}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "ATP":
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Alur Tujuan Pembelajaran (ATP)</h4>
            <div className="space-y-3">
              {master.learningSequences.map((atp) => (
                <div key={atp.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-700 text-sm">
                      Urutan {atp.order}: {atp.id} (Ref: {atp.tpId})
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                      {atp.allocatedHours} JP · Sem {atp.semester}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{atp.materialScope}</p>
                  <p className="text-xs text-gray-600 mt-1">{atp.tpDescription}</p>
                  <p className="text-xs text-gray-400 mt-1.5">Pendekatan: {atp.pedagogicalApproach}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "KKTP":
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Kriteria Ketercapaian Tujuan Pembelajaran</h4>
            <div className="space-y-3">
              {master.assessmentCriteria.map((kktp) => (
                <div key={kktp.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-700 text-sm">Ref TP: {kktp.tpId}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                      Target: {kktp.achievementCategory}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800">
                    <span className="font-semibold block text-xs text-gray-500 uppercase">Indikator:</span>
                    <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs">
                      {kktp.indicators.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Kriteria:</strong> {kktp.achievementCriteria}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Instrumen:</strong> {kktp.instruments.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "PROTA":
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Program Tahunan (PROTA)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border">
                <thead className="bg-gray-100 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5 border">No</th>
                    <th className="p-2.5 border">Ref ATP</th>
                    <th className="p-2.5 border">Topik Materi</th>
                    <th className="p-2.5 border">Alokasi</th>
                    <th className="p-2.5 border">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {master.annualProgram.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2.5 border text-center">{p.no || i + 1}</td>
                      <td className="p-2.5 border font-semibold text-blue-700">{p.atpId}</td>
                      <td className="p-2.5 border">{p.materialTopic}</td>
                      <td className="p-2.5 border text-center">{p.allocatedHours} JP</td>
                      <td className="p-2.5 border text-center">Semester {p.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "PROSEM":
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Program Semester (PROSEM)</h4>
            <div className="space-y-3">
              {master.semesterProgram.map((p, i) => (
                <div key={i} className="p-3 border rounded-lg bg-white text-xs">
                  <div className="flex justify-between font-bold text-gray-900 mb-1">
                    <span>
                      {p.no}. {p.materialTopic} ({p.atpId})
                    </span>
                    <span className="text-blue-600">{p.allocatedHours} JP</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {p.monthAllocations &&
                      Object.entries(p.monthAllocations).map(([month, weeks]) => (
                        <div key={month} className="p-2 bg-gray-50 rounded border">
                          <span className="font-semibold block text-gray-700">{month}</span>
                          <span className="text-gray-500">Minggu: [{(weeks as number[]).join(", ")}]</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "MODUL_AJAR":
        return (
          <div className="space-y-6">
            <h4 className="font-bold text-gray-900">Modul Ajar (RPP Plus)</h4>
            {master.modules.map((mod) => (
              <div key={mod.id} className="p-5 border rounded-xl bg-white space-y-4 shadow-sm">
                <div className="border-b pb-3">
                  <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                    {mod.id} · Ref: {mod.atpId}
                  </span>
                  <h5 className="text-base font-bold text-gray-900 mt-1">{mod.title}</h5>
                  <p className="text-xs text-gray-500">
                    Alokasi: {mod.allocation} · Model: {mod.learningModel} · Target: {mod.targetStudents}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Profil Pancasila: {mod.pancasilaProfile.join(", ")}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-gray-700 block uppercase">Langkah Pembelajaran:</span>
                  <div className="p-2.5 bg-gray-50 rounded">
                    <strong className="text-gray-900">1. Pendahuluan:</strong>
                    <ul className="list-disc list-inside mt-1 text-gray-700">
                      {mod.coreActivities.opening.map((op, i) => (
                        <li key={i}>{op}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded">
                    <strong className="text-gray-900">2. Kegiatan Inti:</strong>
                    <ul className="list-disc list-inside mt-1 text-gray-700">
                      {mod.coreActivities.main.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded">
                    <strong className="text-gray-900">3. Penutup:</strong>
                    <ul className="list-disc list-inside mt-1 text-gray-700">
                      {mod.coreActivities.closing.map((cl, i) => (
                        <li key={i}>{cl}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-blue-900 block">Asesmen & Evaluasi:</span>
                  <p><strong>Diagnostik:</strong> {mod.assessments.diagnostic || "-"}</p>
                  <p><strong>Formatif:</strong> {mod.assessments.formative || "-"}</p>
                  <p><strong>Sumatif:</strong> {mod.assessments.summative || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case "LKPD":
        return (
          <div className="space-y-6">
            <h4 className="font-bold text-gray-900">Lembar Kerja Peserta Didik (LKPD)</h4>
            {master.worksheets.map((ws) => (
              <div key={ws.id} className="p-5 border rounded-xl bg-white space-y-4 shadow-sm">
                <div className="border-b pb-3">
                  <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                    {ws.id} · Ref: {ws.modulId}
                  </span>
                  <h5 className="text-base font-bold text-gray-900 mt-1">{ws.title}</h5>
                </div>

                <div className="text-xs">
                  <span className="font-bold text-gray-700 block uppercase mb-1">Petunjuk Pengerjaan:</span>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 bg-gray-50 p-3 rounded">
                    {ws.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-gray-700 block uppercase">Aktivitas & Pertanyaan:</span>
                  {ws.activities.map((act, i) => (
                    <div key={i} className="p-3 border rounded bg-white">
                      <strong className="text-blue-800 block mb-1">
                        Langkah {act.step}: {act.instruction}
                      </strong>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                        {act.questions.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {ws.reflectionQuestions.length > 0 && (
                  <div className="p-3 bg-amber-50/50 rounded-lg text-xs">
                    <span className="font-bold text-amber-900 block mb-1">Pertanyaan Refleksi Siswa:</span>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {ws.reflectionQuestions.map((rf, i) => (
                        <li key={i}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Consistency Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-start justify-between ${
          consistency.status === "passed"
            ? "bg-green-50 border-green-200 text-green-900"
            : consistency.status === "warning"
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-red-50 border-red-200 text-red-900"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {consistency.status === "passed"
                ? "✓ Konsistensi Kurikulum Terverifikasi"
                : consistency.status === "warning"
                ? "⚠️ Perhatian Konsistensi (Review)"
                : "❌ Ditemukan Masalah Inkonsistensi"}
            </span>
          </div>
          {consistency.issues.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {consistency.issues.map((issue, i) => (
                <li key={i} className="list-disc list-inside">
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll || documents.every((d) => d.ready)}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
          >
            {generatingAll ? "Menyusun semua dokumen..." : "⚡ Generate Semua"}
          </button>
          {fixPlan.length > 0 && (
            <button
              onClick={handleAutoFix}
              disabled={fixing}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
            >
              {fixing ? "Memperbaiki..." : `🛠 Perbaiki (${fixPlan.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {documents.map((doc) => {
          const occupied = doc.dependsOn && !documents.find((d) => d.key === doc.dependsOn)?.ready;
          const isProcessing = loading === doc.label;
          const isExporting = exporting === doc.key;

          return (
            <div
              key={doc.key}
              className={`flex flex-col justify-between rounded-xl border p-5 shadow-sm transition ${
                doc.ready ? "bg-white border-gray-200" : "bg-gray-50/70 border-dashed border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      doc.ready ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {doc.key}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      doc.ready ? "text-green-600" : occupied ? "text-amber-600" : "text-gray-400"
                    }`}
                  >
                    {doc.ready ? `Tersedia (${doc.count})` : occupied ? `Butuh: ${doc.dependsOn}` : "Siap Dibuat"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-3">{doc.label}</h3>

                {messages[doc.key] && (
                  <p
                    className={`mt-2 text-xs ${
                      messages[doc.key].error ? "text-red-600" : "text-green-600 font-medium"
                    }`}
                  >
                    {messages[doc.key].text}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-2 border-t border-gray-100 pt-3">
                {doc.ready ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActivePreviewDoc(doc)}
                        className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        👁️ Preview
                      </button>
                      <button
                        onClick={() => handleExport(doc.key)}
                        disabled={isExporting}
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition"
                      >
                        {isExporting ? "Mengunduh..." : "📥 DOCX"}
                      </button>
                    </div>

                    <button
                      onClick={() => handleGenerate(doc.key, doc.label)}
                      disabled={isProcessing}
                      className="w-full text-center text-[11px] font-medium text-gray-500 hover:text-blue-600 py-1 transition"
                    >
                      {isProcessing ? "Menghasilkan..." : "🔄 Regenerate Ulang"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleGenerate(doc.key, doc.label)}
                    disabled={!!occupied || isProcessing}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition"
                  >
                    {isProcessing ? "AI Sedang Berpikir..." : `Generate ${doc.label}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {activePreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {activePreviewDoc.label} ({activePreviewDoc.key})
                </h3>
                <p className="text-xs text-gray-500">
                  Pratinjau struktur dokumen terintegrasi Kurikulum Merdeka
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(activePreviewDoc.key)}
                  disabled={exporting === activePreviewDoc.key}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  {exporting === activePreviewDoc.key ? "Mengekspor..." : "Export DOCX"}
                </button>
                <button
                  onClick={() => setActivePreviewDoc(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {renderPreviewContent(activePreviewDoc.key)}
            </div>

            <div className="border-t bg-gray-50 px-6 py-3 text-right">
              <button
                onClick={() => setActivePreviewDoc(null)}
                className="rounded-lg border bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}