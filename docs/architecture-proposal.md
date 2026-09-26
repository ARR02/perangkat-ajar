# Perangkat Ajar AI — Proposal Arsitektur Teknis

**Status:** Proposal — belum implementasi fitur
**Scope:** Fondasi aplikasi web guru untuk menghasilkan perangkat ajar berbasis Curriculum Master
**Keputusan utama:** AI tidak menulis dokumen langsung. AI menghasilkan structured JSON tervalidasi; renderer mengubah JSON menjadi dokumen editable/exportable.

## 1. Analisis kebutuhan

### Aktor
- **Guru:** membuat project, mengisi identitas, meninjau/mengedit hasil, mengatur template, mengekspor dokumen.
- **Admin kurikulum:** mengelola Curriculum Master resmi dan sumber referensinya.
- **System worker:** menjalankan generation, validation, consistency check, dan export.

### Input project
- Identitas sekolah dan guru.
- Mata pelajaran, fase/kelas, tahun ajaran, semester.
- Alokasi waktu, kalender pendidikan, jumlah minggu efektif.
- Sumber kurikulum yang dipilih.
- Template sekolah untuk Modul Ajar dan dokumen lain bila diperlukan.

### Output
CP, TP, ATP, KKTP, PROTA, PROSEM, Modul Ajar, LKPD.

Setiap output harus menyimpan:
- `status`: `DRAFT`, `GENERATING`, `READY`, `NEEDS_REVIEW`, `FAILED`, `ARCHIVED`.
- structured JSON tervalidasi.
- dependency ke sumber dan dokumen induk.
- nomor versi, audit trail, model/provider metadata tanpa secret.
- catatan validasi dan peringatan.

### Batasan penting
- Data kurikulum tidak tersedia: jangan dikarang; minta input atau tandai `NEEDS_REVIEW`.
- AI tidak yakin terhadap struktur: hasil tetap tersimpan sebagai draft dengan warning.
- Identitas sekolah/guru tidak diubah AI.
- Fitur gratis bergantung provider/model yang dipilih; biaya AI, rate limit, dan batas kuota tetap perlu ditangani.

## 2. Arsitektur sistem

```text
Next.js App Router
  ├─ UI: React + Tailwind + shadcn/ui
  ├─ Server Actions / Route Handlers
  └─ Auth/session boundary
        ↓
Application services
  ├─ Project service
  ├─ Curriculum Master service
  ├─ Generation orchestrator
  ├─ Validation service
  ├─ Consistency checker
  ├─ Template engine
  ├─ Export service
  └─ Audit/version service
        ↓
PostgreSQL/Supabase
Object storage (validated uploads/templates/exports)
        ↓
Provider-agnostic AI adapter
(OpenAI-compatible, Anthropic, local/provider lain)
```

### Prinsip boundary
- API key hanya di server.
- Browser hanya menerima result, status, dan error aman.
- AI adapter tidak boleh menulis database langsung.
- Orchestrator memvalidasi input, memilih schema, memanggil provider, memvalidasi output, lalu menyimpan versi.
- Renderer hanya menerima IR tervalidasi.

### Execution model
MVP dapat memakai request sinkron untuk generation kecil. Generation besar dan export memakai job table + polling/status stream agar loading, empty, dan error state jelas. Job harus idempotent memakai `requestId`.

## 3. Struktur folder yang disarankan

```text
src/
  app/
    (auth)/login/page.tsx
    (dashboard)/dashboard/page.tsx
    (dashboard)/projects/page.tsx
    (dashboard)/projects/[projectId]/page.tsx
    (dashboard)/projects/[projectId]/curriculum/page.tsx
    (dashboard)/projects/[projectId]/documents/[documentId]/page.tsx
    (dashboard)/projects/[projectId]/templates/page.tsx
    api/projects/route.ts
    api/projects/[projectId]/generation/route.ts
    api/documents/[documentId]/route.ts
    api/jobs/[jobId]/route.ts
  components/
    project/
    curriculum/
    documents/
    templates/
    shared/
  features/
    curriculum/
    generation/
    documents/
    templates/
    exports/
  server/
    auth/
    db/
    repositories/
    services/
    ai/
    validation/
    rendering/
    storage/
    audit/
  lib/
    schemas/
    constants/
    errors/
  types/
    curriculum.ts
    documents.ts
    generation.ts
prisma/schema.prisma
docs/
```

Repository, service, dan adapter dipisah. Tidak membuat abstraction tambahan sebelum ada kebutuhan provider atau storage kedua.

## 4. Entity relationship

```text
User ──< Membership >── School
User ──< Project >── School
Project ──1 ProjectContext
Project ──1 CurriculumMasterSnapshot
Project ──< Document
Document ──< DocumentVersion
Document ──< DocumentDependency >── Document
DocumentVersion ──< ValidationResult
Project ──< GenerationJob
GenerationJob ──< GenerationAttempt
Project ──< Template
Template ──< TemplateVersion
TemplateVersion ──< TemplateField
DocumentVersion ──< Export
Project ──< AuditEvent
```

### Entitas dan aturan data
- **School:** profil sekolah; tidak di-hard-code.
- **TeacherProfile:** data guru; perubahan perlu persetujuan eksplisit.
- **Project:** satu paket perangkat ajar untuk identitas, mapel, fase/kelas, dan tahun ajaran tertentu.
- **ProjectContext:** input project yang sudah disetujui pengguna.
- **CurriculumMaster:** sumber kurikulum terstruktur, dengan `source`, `jurisdiction`, `curriculumVersion`, dan status publikasi.
- **CurriculumMasterSnapshot:** snapshot yang dipakai project; mencegah perubahan master merusak versi lama.
- **Document:** logical document bertipe CP/TP/ATP/KKTP/PROTA/PROSEM/MODUL_AJAR/LKPD.
- **DocumentVersion:** immutable JSON IR, editor, source generation, schema version, dan confidence.
- **DocumentDependency:** parent/child atau `derived_from`; wajib untuk semua dokumen selain root yang sah.
- **Template/TemplateVersion:** format sekolah versioned, editable, dan terpisah dari content.
- **GenerationJob/Attempt:** status, retry, error code aman, provider/model metadata.
- **ValidationResult:** schema, business rule, dan consistency result.
- **AuditEvent:** actor, action, entity, before/after summary, timestamp, correlation ID.
- **Export:** format, document version, status, file reference, expiry.

Jangan menghapus field existing saat implementasi. Migration baru harus backward-compatible dan memakai backfill bila diperlukan.

## 5. Data flow

```text
User input
  → Zod input validation
  → ProjectContext approval
  → select/pin CurriculumMasterSnapshot
  → generate CP or import approved CP
  → validate CP IR
  → save DocumentVersion(CP)
  → generate TP from CP dependency
  → validate + save
  → generate ATP from TP dependency
  → generate KKTP from TP/ATP dependency
  → generate PROTA/PROSEM from ATP + calendar + time allocation
  → generate Modul Ajar from ATP + selected TemplateVersion
  → generate LKPD from Modul Ajar + ATP
  → run consistency checker
  → mark READY or NEEDS_REVIEW
  → render preview/edit
  → save new DocumentVersion
  → export selected version
```

Generate in dependency order. User may regenerate a child, but system must show stale descendants and require confirmation before cascading regeneration.

## 6. Curriculum Master

Curriculum Master bukan sekadar tabel CP. Struktur minimal:

- curriculum identity: kurikulum, fase, jenjang, subject.
- elements and official CP statements.
- learning outcomes/TP references bila tersedia.
- source citation and publication date.
- schema version and content version.
- approval/publication status.

AI hanya boleh memilih, menyusun, atau mengadaptasi data master yang tersedia. Klaim tanpa sumber masuk `Needs Review` dan tidak menjadi fakta resmi.

## 7. Structured JSON dan validation

Setiap tipe dokumen memiliki schema version sendiri, misalnya `cp.v1`, `modul_ajar.v1`. Schema memakai Zod di server dan type inference TypeScript.

Pipeline:
1. Validasi input dan context.
2. Bentuk prompt dari context + source data terpilih; bukan prompt bebas dari seluruh database.
3. Minta provider mengembalikan JSON schema.
4. Parse JSON; reject malformed output.
5. Validasi Zod.
6. Validasi business rules dan dependency IDs.
7. Jalankan consistency checker.
8. Simpan hanya output tervalidasi sebagai version.
9. Simpan warning; set `NEEDS_REVIEW` jika confidence rendah, source kurang, atau rule gagal non-fatal.

Contoh envelope umum:

```ts
{
  schemaVersion: "modul_ajar.v1",
  documentType: "MODUL_AJAR",
  projectId: "...",
  sourceDocumentVersionIds: ["..."],
  templateVersionId: "...",
  content: {},
  confidence: 0.0,
  warnings: [],
  needsReview: false
}
```

Confidence dari provider bukan bukti kebenaran. Business validation tetap wajib.

## 8. AI Orchestrator

Komponen:
- `PromptBuilder`: deterministic; menerima context terpilih dan schema.
- `ProviderAdapter`: contract umum `generateStructured(input, schema)`.
- `GenerationPolicy`: timeout, retry terbatas, token limit, model selection.
- `OutputParser`: JSON parse dan schema validation.
- `DependencyResolver`: mengambil versi sumber yang dipin.
- `GenerationService`: orchestration dan persistence.
- `ReviewClassifier`: memberi `NEEDS_REVIEW` berdasarkan rule.

Error handling:
- timeout/provider unavailable: `FAILED`, retry aman.
- invalid JSON/schema: retry dengan batas, lalu `FAILED`.
- missing curriculum source: jangan retry tanpa perubahan input; `NEEDS_REVIEW`.
- rate limit: exponential backoff dengan batas.
- semua error user-facing memakai pesan aman; detail server masuk log terstruktur.

## 9. Document generation dan editing

IR menjadi canonical representation. Editor mengubah IR melalui field-aware form atau block editor, bukan mengedit hasil DOCX sebagai sumber utama. Setiap save membuat `DocumentVersion` baru.

Renderer terpisah:
- HTML preview: cepat, editable.
- DOCX: template mapping ke paragraph/table/content controls.
- PDF: render dari HTML/DOCX melalui server worker.
- XLSX: khusus tabel PROTA/PROSEM/KKTP bila sesuai template.

Export selalu menyebut document version dan template version yang dipakai. File tidak menjadi source of truth.

## 10. Template Builder

Template tidak berupa hard-code JSX. Template version menyimpan:
- metadata: name, document type, school, status.
- ordered sections/blocks.
- field key, label, type, required, repeatable, visibility rule.
- layout hints dan renderer mapping.
- schema compatibility.

MVP template builder:
- tambah/urutkan section.
- edit label dan instruksi.
- pilih field dari schema dokumen.
- tandai required/optional.
- preview dengan sample data tervalidasi.
- publish version baru; versi lama tetap bisa dirender.

Upload template divalidasi berdasarkan MIME, ukuran, extension, parsing, malware scanning bila tersedia, dan schema mapping. Jangan mengeksekusi template upload sebagai code.

## 11. API endpoint awal

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/projects` | list project user |
| `POST` | `/api/projects` | buat project + context |
| `GET` | `/api/projects/:id` | detail dan status dokumen |
| `PATCH` | `/api/projects/:id` | edit context dengan approval |
| `GET` | `/api/curriculum-masters` | cari source resmi |
| `POST` | `/api/projects/:id/curriculum-snapshot` | pin snapshot |
| `POST` | `/api/projects/:id/generation` | mulai generation job |
| `GET` | `/api/jobs/:id` | polling status job |
| `GET` | `/api/projects/:id/documents` | list document/version aktif |
| `GET` | `/api/documents/:id` | ambil IR tervalidasi |
| `POST` | `/api/documents/:id/versions` | simpan edit manual |
| `POST` | `/api/projects/:id/consistency-check` | jalankan checker |
| `GET` | `/api/projects/:id/templates` | list template |
| `POST` | `/api/projects/:id/templates` | buat template version |
| `PATCH` | `/api/templates/:id` | edit draft template |
| `POST` | `/api/templates/:id/publish` | publish version |
| `POST` | `/api/documents/:id/exports` | mulai export |
| `GET` | `/api/exports/:id` | status/download export |

Contract memakai error envelope konsisten: `code`, `message`, `fieldErrors`, `requestId`. Perubahan contract perlu migration/versioning.

## 12. Frontend components

- `ProjectWizard`: identitas, kurikulum, kalender, alokasi waktu, review.
- `ProjectOverview`: dependency graph, status, stale warning.
- `GenerationPanel`: start, progress, loading, empty, error, retry.
- `DocumentList` dan `DocumentDependencyView`.
- `DocumentEditor`: form/block editor dengan autosave terkontrol.
- `ValidationSummary` dan `NeedsReviewBanner`.
- `TemplateBuilder`: sections, fields, ordering, preview.
- `ExportDialog`: format, version, template, status.
- `AuditTimeline`: riwayat perubahan.

Semua generator wajib punya loading, empty, error, retry, dan accessible status. Jangan menampilkan hasil partial sebagai final tanpa label.

## 13. Backend services

- `ProjectService`
- `IdentityService`
- `CurriculumMasterService`
- `DocumentService`
- `GenerationOrchestrator`
- `ProviderRegistry` dan `AIProviderAdapter`
- `SchemaValidationService`
- `ConsistencyCheckService`
- `TemplateService`
- `DocumentRenderService`
- `ExportService`
- `AuditService`
- `UploadValidationService`

Database transaction dipakai saat menyimpan version + dependency + audit event. Job processing harus idempotent.

## 14. Consistency checker

Rule awal:
- TP mereferensikan CP yang ada.
- ATP hanya memakai TP dari project yang sama.
- urutan ATP tidak duplikat dan alokasi waktu valid.
- KKTP mencakup TP yang direferensikan.
- PROTA/PROSEM tidak melebihi minggu efektif/alokasi.
- Modul Ajar memakai ATP/TP yang aktif.
- LKPD memakai tujuan dan aktivitas Modul Ajar.
- seluruh dependency menunjuk versi yang ada.
- template fields required terisi.

Output checker berupa finding dengan severity `ERROR`, `WARNING`, `INFO`, bukan silent mutation.

## 15. Security, privacy, dan audit

- Auth + authorization berbasis membership project/school.
- Row-level security bila memakai Supabase.
- API key dan service credentials server-side, environment variable, tidak masuk Git.
- Validasi upload dan signed URL berumur pendek.
- PII school/teacher dikirim ke AI seminimal mungkin.
- Log tidak menyimpan secret atau full sensitive document tanpa alasan.
- Audit setiap create, edit, regenerate, publish, export, dan approval.
- Rate limit per user/project/provider.

## 16. Testing strategy

- Unit: schemas, dependency resolver, business rules, template mapping.
- Integration: database transaction, generation pipeline dengan fake provider hanya di test, export pipeline.
- Contract: provider adapter dan API error envelope.
- E2E: wizard → pin master → generate chain → edit → consistency → export.
- Regression: existing routes/schema sebelum migration.
- Security: authorization, upload bypass, secret exposure, cross-project access.

Fake provider hanya untuk automated test; tidak diaktifkan production.

## 17. Delivery phases

### Phase 0 — Fondasi
Auth, project/context, Curriculum Master read-only, schema registry, migration, audit dasar.

### Phase 1 — Vertical slice
CP → TP → ATP memakai satu provider adapter, structured JSON, validation, versioning, editor, status UI.

### Phase 2 — Perangkat turunan
KKTP, PROTA, PROSEM, dependency checker, allocation rules.

### Phase 3 — Template dan Modul Ajar
Template builder versioned, Modul Ajar renderer, `NEEDS_REVIEW` workflow.

### Phase 4 — LKPD dan export
LKPD dari Modul Ajar, DOCX/PDF/XLSX, job worker, download aman.

### Phase 5 — Hardening
Provider kedua, quota, observability, RLS review, performance, regression suite.

## 18. Definition of done setiap perubahan

1. Architecture dan affected entities/API ditinjau.
2. Migration backward-compatible.
3. Input/output schema tervalidasi.
4. Loading, empty, error state tersedia.
5. Audit/version/dependency tersimpan.
6. Unit/integration/E2E relevant test berjalan.
7. `typecheck`, `lint`, `build`, dan relevant tests berjalan.
8. Error diperbaiki sebelum status selesai.
9. Tidak ada secret, mock production, atau hard-coded identity/template.

## 19. Keputusan yang perlu dikonfirmasi sebelum coding

1. Auth: Supabase Auth atau auth provider lain?
2. Hosting dan database target: Supabase managed atau PostgreSQL mandiri?
3. Sumber Curriculum Master: data resmi yang sudah tersedia, upload admin, atau input manual terkurasi?
4. Provider AI awal dan batas quota gratis?
5. Format template Modul Ajar: DOCX upload, block builder, atau keduanya?
6. Apakah project multi-guru/kolaboratif atau satu guru per project?

Proposal ini berhenti di dokumentasi. Implementasi menunggu keputusan tersebut.
