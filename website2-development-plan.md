# Rencana Pengembangan Proyek Website2

## 1. PRD (Product Requirements Document)

- **Visi & Tujuan**: Bangun website sesuai kebutuhan pengguna (detail fitur belum diketahui, lihat inventaris kode). KPI utama: waktu muat < 2 detik, keamanan OWASP, dokumen lengkap.
- **Scope**: UI responsif, API stabil, integrasi data, auth, CI/CD, dokumentasi.
- **Kebutuhan Fungsional**: halaman, endpoint, alur pengguna (dijabarkan setelah audit kode).
- **Kebutuhan Non‑Fungsional**: performa, SEO, aksesibilitas, keamanan, skalabilitas.
- **KPI**: waktu muat < 2 s, uptime 99 %, coverage unit test ≥ 80 %.

## 2. Milestone

| Milestone | Fokus | Deliverable | Acceptance |
|-----------|-------|-------------|------------|
| M1 – Audit & Inventaris | Struktur, dependensi, gap | Inventaris file, backlog awal | Semua file terdaftar, issues teridentifikasi |
| M2 – Refaktor & Standarisasi | Lint, TypeScript, CI | `npm run lint` bersih, CI pipeline aktif | Lint 0 error, CI passing |
| M3 – Fitur Inti | Implementasi halaman/API yang belum ada | UI/API selesai, e2e test | User‑flow berhasil, 200 % success |
| M4 – Keamanan & Optimasi | Auth, CSP, audit performa | Middleware auth, header keamanan, bundle split | OWASP‑10 pass, bundle < X KB |
| M5 – CI/CD & Deploy | GitHub Actions, staging env | Workflow deploy otomatis, roll‑back script | Deploy berhasil pada push ke `main` |
| M6 – Dokumentasi & Release | README, OpenAPI, changelog | Docs build, versi tag | Docs publik, versi semver 1.0.0 |

## 3. Skema Pengembangan

- **Branching**: `main` protected → fitur `feat/<nama>`, bugfix `fix/<nama>`.
- **Pull Request**: wajib lint + unit test + reviewer approval.
- **Testing**: Jest (unit), Supertest (API), Cypress (e2e).
- **Code Review**: checklist lint, test coverage, security.
- **Release**: semantic versioning, auto‑tag via GitHub Actions, changelog otomatis.

## 4. Risiko & Mitigasi

- Dependensi usang → upgrade bertahap, lockfile.
- Kurang tes → coverage minimum tiap sprint.
- Scope creep → backlog MoSCoW, perubahan via PR.

## 5. Langkah Selanjutnya

1. Eksplorasi kode sumber (tree, README, package.json).
2. Isi inventaris fitur & gap.
3. Perbarui PRD dan milestone berdasarkan temuan.
4. Eksekusi per sprint sesuai skema.