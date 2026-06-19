// ------------------------------------------------------------
//  Lapisan komunikasi CLIENT -> SERVER (REST API)
//  Memetakan 4 endpoint server pada README:
//    GET  /jadwal      -> daftar jadwal
//    POST /pesan       -> pesan tiket
//    GET  /tiket/:id   -> detail tiket
//    POST /batal/:id   -> batalkan tiket
// ------------------------------------------------------------

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000"

export interface Jadwal {
  id: number
  rute: string
  jam: string
  harga: number
  kursiTersedia: number
}

export interface Tiket {
  idTiket: number
  namaPemesan: string
  rute: string
  jam: string
  jumlahKursi: number
  totalBayar: number
  status: "AKTIF" | "DIBATALKAN"
  waktuPesan: string
}

interface ApiOk<T> {
  status: "sukses"
  pesan?: string
  jumlah?: number
  data: T
}

interface ApiErr {
  status: "gagal"
  pesan: string
}

/** Error yang membawa pesan dari server agar bisa ditampilkan ke pengguna. */
export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    })
  } catch {
    throw new ApiError(
      `Tidak dapat terhubung ke server (${API_URL}). Pastikan server berjalan.`
    )
  }

  const body = (await res.json().catch(() => null)) as
    | ApiOk<T>
    | ApiErr
    | null

  if (!res.ok || !body || body.status === "gagal") {
    throw new ApiError(
      (body as ApiErr | null)?.pesan ?? `Permintaan gagal (HTTP ${res.status})`
    )
  }
  return (body as ApiOk<T>).data
}

export function getJadwal() {
  return request<Jadwal[]>("/jadwal")
}

export function pesanTiket(input: {
  jadwalId: number
  namaPemesan: string
  jumlahKursi: number
}) {
  return request<Tiket>("/pesan", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function getTiket(id: number) {
  return request<Tiket>(`/tiket/${id}`)
}

export function batalkanTiket(id: number) {
  return request<Tiket>(`/batal/${id}`, { method: "POST" })
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}
