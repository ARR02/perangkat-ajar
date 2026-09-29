"use client";

import { useState } from "react";

export function ExportButton({
  projectId,
  documentType,
}: {
  projectId: string;
  documentType: string;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, version: 1, format: "DOCX" }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="?([^";]+)"?/);
        const filename = match?.[1] || `${documentType}.docx`;

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
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition"
    >
      {exporting ? "Mengunduh..." : "📥 DOCX"}
    </button>
  );
}