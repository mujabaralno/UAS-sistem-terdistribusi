import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json()); 
app.use(cors());         

interface Jadwal {
  id: number;
  rute: string;
  jam: string;
  harga: number;
  kursiTersedia: number;
}

interface Tiket {
  idTiket: number;
  namaPemesan: string;
  rute: string;
  jam: string;
  jumlahKursi: number;
  totalBayar: number;
  status: "AKTIF" | "DIBATALKAN";
  waktuPesan: string;
}

const daftarJadwal: Jadwal[] = [
  { id: 1, rute: "Garut - Bandung", jam: "08:00", harga: 45000, kursiTersedia: 40 },
  { id: 2, rute: "Garut - Jakarta", jam: "10:30", harga: 120000, kursiTersedia: 30 },
  { id: 3, rute: "Garut - Tasik", jam: "13:00", harga: 35000, kursiTersedia: 50 },
  { id: 4, rute: "Garut - Bandung", jam: "17:00", harga: 50000, kursiTersedia: 40 },
];

const daftarTiket: Tiket[] = [];
let nomorTiketBerikutnya = 1;

// ------------------------------------------------------------
//  SERVICE / METHOD (endpoint REST)
//  Syarat soal: minimal 2 method service -> di sini ada 4
// ------------------------------------------------------------

// [METHOD 1] GET /jadwal -> melihat daftar jadwal tiket tersedia
app.get("/jadwal", (_req: Request, res: Response) => {
  console.log("[SERVER] Permintaan: lihat daftar jadwal");
  res.json({ status: "sukses", jumlah: daftarJadwal.length, data: daftarJadwal });
});

// [METHOD 2] POST /pesan -> memesan tiket
// body: { jadwalId: number, namaPemesan: string, jumlahKursi: number }
app.post("/pesan", (req: Request, res: Response) => {
  const { jadwalId, namaPemesan, jumlahKursi } = req.body as {
    jadwalId?: number | string;
    namaPemesan?: string;
    jumlahKursi?: number | string;
  };

  if (!jadwalId || !namaPemesan || !jumlahKursi) {
    return res.status(400).json({
      status: "gagal",
      pesan: "jadwalId, namaPemesan, dan jumlahKursi wajib diisi",
    });
  }

  const jadwal = daftarJadwal.find((j) => j.id === Number(jadwalId));
  if (!jadwal) {
    return res.status(404).json({ status: "gagal", pesan: "Jadwal tidak ditemukan" });
  }

  const jumlah = Number(jumlahKursi);
  if (jumlah > jadwal.kursiTersedia) {
    return res.status(400).json({
      status: "gagal",
      pesan: `Kursi tidak cukup. Tersisa ${jadwal.kursiTersedia} kursi`,
    });
  }

  jadwal.kursiTersedia -= jumlah;
  const tiket: Tiket = {
    idTiket: nomorTiketBerikutnya++,
    namaPemesan: String(namaPemesan),
    rute: jadwal.rute,
    jam: jadwal.jam,
    jumlahKursi: jumlah,
    totalBayar: jadwal.harga * jumlah,
    status: "AKTIF",
    waktuPesan: new Date().toISOString(),
  };
  daftarTiket.push(tiket);

  console.log(`[SERVER] Tiket #${tiket.idTiket} dipesan oleh ${tiket.namaPemesan}`);
  res.status(201).json({ status: "sukses", pesan: "Tiket berhasil dipesan", data: tiket });
});

// [METHOD 3] GET /tiket/:id -> melihat detail tiket yang sudah dipesan
app.get("/tiket/:id", (req: Request, res: Response) => {
  const tiket = daftarTiket.find((t) => t.idTiket === Number(req.params.id));
  if (!tiket) {
    return res.status(404).json({ status: "gagal", pesan: "Tiket tidak ditemukan" });
  }
  res.json({ status: "sukses", data: tiket });
});

// [METHOD 4] POST /batal/:id -> membatalkan tiket (kursi dikembalikan)
app.post("/batal/:id", (req: Request, res: Response) => {
  const tiket = daftarTiket.find((t) => t.idTiket === Number(req.params.id));
  if (!tiket) {
    return res.status(404).json({ status: "gagal", pesan: "Tiket tidak ditemukan" });
  }
  if (tiket.status === "DIBATALKAN") {
    return res.status(400).json({ status: "gagal", pesan: "Tiket sudah dibatalkan" });
  }

  const jadwal = daftarJadwal.find((j) => j.rute === tiket.rute && j.jam === tiket.jam);
  if (jadwal) jadwal.kursiTersedia += tiket.jumlahKursi;
  tiket.status = "DIBATALKAN";

  console.log(`[SERVER] Tiket #${tiket.idTiket} dibatalkan`);
  res.json({ status: "sukses", pesan: "Tiket berhasil dibatalkan", data: tiket });
});

// ------------------------------------------------------------
//  JALANKAN SERVER
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log("============================================");
  console.log("  SERVER PEMESANAN TIKET BERJALAN");
  console.log(`  Alamat : http://localhost:${PORT}`);
  console.log("  Tekan Ctrl+C untuk menghentikan server");
  console.log("============================================");
});
