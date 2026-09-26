# Perangkat Ajar AI

Platform web otomasi penyusunan Perangkat Ajar (CP, TP, ATP, KKTP, PROTA, PROSEM, Modul Ajar, dan LKPD) menggunakan AI berbasis **Curriculum Master** dan **Structured JSON Intermediate Representation (IR)**.

---

## 1. Arsitektur Aplikasi

Aplikasi dibangun dengan prinsip **"Generate once, reuse everywhere"**:
- **Curriculum Master:** Sumber acuan resmi materi kurikulum.
- **Dependency Flow:** Identitas & CP -> TP -> ATP -> KKTP -> PROTA/PROSEM -> Modul Ajar -> LKPD.
- **Intermediate Representation (IR):** Semua output AI distrukturkan dalam schema JSON tervalidasi sebelum dirender atau diekspor.
- **Security:** API Key AI dan kredensial database hanya tersimpan di server-side.

---

## 2. Struktur Project

```
├── app/               # Next.js App Router (Halaman & Routing)
├── components/        # UI & Shared Components (shadcn/ui & custom)
├── database/          # Database connection client & schema Prisma
├── docs/              # Dokumentasi teknis & arsitektur
├── lib/               # Utility, environment safeguards, helper
├── public/            # Static assets
├── services/          # Business logic & abstraction services
├── templates/         # Schema & template JSON modular (Modul Ajar dll)
├── types/             # TypeScript interfaces & types
├── .env.example       # Contoh konfigurasi environment
├── package.json       # Manajemen dependensi & scripts
├── tsconfig.json      # Konfigurasi TypeScript
└── tailwind.config.ts # Konfigurasi styling Tailwind CSS
```

---

## 3. Environment Variables

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Daftar variable:
- `DATABASE_URL`: Connection string PostgreSQL / Supabase.
- `AI_API_KEY`: API Key provider LLM (Hanya diakses server-side).
- `AI_PROVIDER`: Provider default (misal `openai`, `anthropic`, dsb).
- `STORAGE_URL`: URL penyimpanan dokumen / object storage.
- `AUTH_SECRET`: Secret key enkripsi sesi autentikasi.

---

## 4. Cara Install & Menjalankan

### Install Dependensi
```bash
npm install
```

### Setup Database (Prisma)
```bash
npx prisma generate --schema=database/schema.prisma
```

### Menjalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser.

### Periksa Kode & Build
```bash
npm run typecheck
npm run lint
npm run build
```
