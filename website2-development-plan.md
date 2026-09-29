# Rencana Pengembangan Proyek Website2 (Futuristic & 3D Update)

## 1. Visi & Tujuan Pembaruan UI/UX
- **Visi**: Meningkatkan pengalaman pengguna (UX) dengan antarmuka yang sangat modern, interaktif, dan futuristik.
- **Tujuan Utama**: 
  - Mengubah UI/UX menjadi bertema "Sci-Fi / Futuristic".
  - Menambahkan animasi 3D interaktif untuk meningkatkan engagement.
  - Mempertahankan kinerja tinggi (waktu muat cepat) meskipun ada animasi 3D.
  
## 2. Kebutuhan Teknologi Baru
- **Framer Motion**: Untuk animasi transisi halaman, *scroll reveal*, dan mikro-animasi elemen DOM yang mulus.
- **Three.js & React Three Fiber (R3F)**: Untuk merender objek 3D secara *real-time* (seperti partikel melayang, geometri abstrak, atau representasi data 3D).
- **React Three Drei**: Kumpulan *helper* untuk R3F untuk mempermudah pembuatan efek 3D (kamera, kontrol, pencahayaan).

## 3. Rencana Eksekusi (Milestone Futuristik)

### Fase 1: Persiapan & Instalasi
- [ ] Instalasi dependensi: `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `three-stdlib`.
- [ ] Menyiapkan komponen dasar untuk kanvas 3D (misalnya `Background3D.tsx` atau `Hero3D.tsx`).

### Fase 2: Peningkatan Landing Page (Homepage)
- [ ] **Hero Section 3D**: Menggantikan latar belakang statis dengan objek 3D interaktif yang merespons pergerakan kursor mouse.
- [ ] **Scroll Animations**: Menggunakan Framer Motion agar elemen (fitur, statistik) muncul secara bertahap saat di-scroll (*fade-in up*, *stagger children*).
- [ ] **Glow & Glassmorphism**: Memperhalus efek *glassmorphism* dan *neon glow* pada tombol dan kartu agar lebih menyatu dengan elemen 3D di belakangnya.

### Fase 3: Peningkatan Dashboard
- [ ] **Sidebar & Header Animasi**: Menambahkan transisi mulus saat membuka/tutup sidebar dan navigasi.
- [ ] **List/Grid Animasi**: Menganimasikan kemunculan kartu dokumen atau proyek menggunakan *layout animations* dari Framer Motion.
- [ ] **Micro-interactions**: Efek *hover* yang lebih hidup menggunakan varian *framer-motion* dan kursor kustom.

### Fase 4: Optimasi & Performa
- [ ] **Lazy Loading 3D**: Memuat komponen 3D secara dinamis (`next/dynamic`) agar tidak memblokir render pertama (FCP).
- [ ] **Fallback UI**: Menyediakan tampilan 2D fallback jika WebGL tidak didukung di perangkat pengguna.

## 4. Langkah Eksekusi Saat Ini
1. Instal dependensi framer-motion dan three.js.
2. Buat komponen efek partikel/bintang 3D.
3. Integrasikan framer-motion pada `app/page.tsx`.