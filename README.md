# TiketGo — Aplikasi Pemesanan Tiket (Sistem Terdistribusi)

Proyek UAS **Sistem Terdistribusi (PST1825)** — Universitas Garut.

Aplikasi pemesanan tiket bus yang menerapkan komunikasi antar-proses menggunakan
**REST API**. Terdiri dari dua komponen yang berjalan **terpisah** dan dapat
dijalankan sebagai dua **container Docker**:

- **server/** — REST API (Node.js + Express + **TypeScript**)
- **client/** — Frontend (React + Vite + TypeScript + Tailwind CSS)

Keduanya berkomunikasi lewat HTTP — wujud nyata arsitektur client–server pada
sistem terdistribusi.

## Struktur Proyek

```
uas-sistem-terdistribusi/
├── server/                 # SERVER — REST API (Express + TypeScript)
│   ├── src/server.ts       # kode utama server (4 endpoint)
│   ├── package.json · tsconfig.json
│   └── Dockerfile
├── client/                 # CLIENT — Frontend React + Vite
│   ├── src/                # App.tsx, api.ts, komponen UI
│   ├── Dockerfile          # build aset + sajikan via Nginx
│   └── nginx.conf
├── docker-compose.yml      # menjalankan 2 container terpisah
└── README.md
```

## Fitur Aplikasi

- Melihat daftar jadwal keberangkatan beserta sisa kursi (diambil dari server).
- Memesan tiket lewat dialog; sisa kursi otomatis berkurang.
- Melihat daftar "Tiket Saya" dan mencari tiket berdasarkan ID.
- Membatalkan tiket dengan konfirmasi; kursi dikembalikan ke jadwal.
- Indikator status server (online/offline), notifikasi, dan mode gelap/terang.

## Daftar Layanan (Method Service)

| No  | Method | Endpoint     | Fungsi                      |
| --- | ------ | ------------ | --------------------------- |
| 1   | GET    | `/jadwal`    | Melihat daftar jadwal tiket |
| 2   | POST   | `/pesan`     | Memesan tiket               |
| 3   | GET    | `/tiket/:id` | Melihat detail tiket        |
| 4   | POST   | `/batal/:id` | Membatalkan tiket           |

## Teknologi

| Komponen       | Teknologi                                        |
| -------------- | ------------------------------------------------ |
| Server         | Node.js, Express, TypeScript, CORS               |
| Client         | React, Vite, TypeScript, Tailwind CSS            |
| Komunikasi     | REST API (HTTP, JSON)                            |
| Kontainerisasi | Docker, Docker Compose, Nginx (penyaji frontend) |

## Cara Menjalankan (Pengembangan / tanpa Docker)

**Terminal 1 — Server**

```bash
cd server
npm install
npm run dev      # server jalan di http://localhost:3000
```

**Terminal 2 — Client**

```bash
cd client
npm install
npm run dev      # frontend jalan di http://localhost:5173
```

> Catatan: frontend berjalan di browser, jadi memanggil API di
> `http://localhost:3000`. Alamat ini dapat diatur lewat variabel
> `VITE_API_URL`. Server sudah mengaktifkan CORS sehingga client dari origin
> berbeda diizinkan mengakses API.

## Cara Menjalankan (Docker)

Pastikan Docker Desktop aktif, lalu dari folder utama:

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- API server: `http://localhost:3000`

Docker akan membangun dan menjalankan **dua container terpisah**
(`tiket-server` dan `tiket-client`). Untuk berhenti: `Ctrl+C` lalu
`docker compose down`.

> Jangan menjalankan `npm run dev` bersamaan dengan Docker — keduanya memakai
> port 3000 dan akan bentrok. Pilih salah satu cara menjalankan.

## Uji di Jaringan Lokal (LAN/Wi-Fi)

Jalankan server di komputer A (catat IP-nya, mis. `192.168.1.5`). Di komputer B
pada Wi-Fi yang sama, arahkan frontend ke `http://192.168.1.5:3000` lewat
`VITE_API_URL`, lalu buka aplikasinya di browser komputer B.

## Anggota Kelompok

| Nama     | NPM         | Tugas                                    |
| -------- | ----------- | ---------------------------------------- |
| M. Hilmi | 24073122005 | Back-end (REST API server, Express + TS) |
| Alno     | 24073122003 | Front-end (React + Vite)                 |
| Faisal   | 24073122025 | Konfigurasi Docker (compose & container) |
