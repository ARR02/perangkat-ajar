"use client";

import { useState, useEffect } from "react";

interface TemplateItem {
  id: string;
  name: string;
  documentType: string;
  version: number;
  fields: Array<{
    id: string;
    key: string;
    label: string;
    fieldType: string;
    required: boolean;
  }>;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Template "${file.name}" berhasil diunggah dan diekstrak!`, type: "success" });
        fetchTemplates();
      } else {
        setMessage({ text: data.error || "Gagal mengunggah template", type: "error" });
      }
    } catch {
      setMessage({ text: "Terjadi kesalahan jaringan saat upload.", type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Template Perangkat Ajar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gunakan format standar sekolah untuk Modul Ajar dan dokumen lainnya.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition">
          <span>{uploading ? "Menganalisis..." : "+ Unggah Template (.docx / .json)"}</span>
          <input
            type="file"
            accept=".docx,.pdf,.json"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Memuat template...</div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xl mb-3">
            📋
          </div>
          <h3 className="text-base font-semibold text-gray-900">Template Bawaan Aktif</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Sistem saat ini menggunakan Template Standar Kurikulum Merdeka (Kemendikbudristek). Anda juga dapat mengunggah template kustom sekolah Anda sendiri.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 mb-2">
                    {tpl.documentType}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">{tpl.name}</h2>
                </div>
                <span className="text-xs text-gray-400">Versi {tpl.version}</span>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Struktur Kolom & Field ({tpl.fields.length} Field)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.fields.map((f) => (
                    <span
                      key={f.id}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                    >
                      {f.label} ({f.fieldType})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
