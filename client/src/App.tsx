import * as React from "react";
import {
  Ticket,
  Bus,
  MapPin,
  Clock,
  Armchair,
  Search,
  RefreshCw,
  Loader2,
  Wallet,
  CalendarClock,
  Ban,
  Inbox,
  TriangleAlert,
  User,
  ArrowRight,
  Network,
  Zap,
  ShieldCheck,
} from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../components/ui/dialog";
import { ToastProvider, useToast } from "../components/ui/toast";
import { ThemeToggle } from "../components/theme-toggle";

import {
  type Jadwal,
  type Tiket,
  getJadwal,
  pesanTiket,
  getTiket,
  batalkanTiket,
  formatRupiah,
  ApiError,
  API_URL,
} from "./api";

// ------------------------------------------------------------
//  HEADER
// ------------------------------------------------------------
function Header({ serverOnline }: { serverOnline: boolean | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bus className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-base font-semibold tracking-tight">
              TiketGo
            </p>
            <p className="text-xs text-muted-foreground">Pemesanan Tiket Bus</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              serverOnline
                ? "success"
                : serverOnline === null
                  ? "muted"
                  : "destructive"
            }
            className="gap-1.5 py-1"
          >
            <span
              className={
                "size-1.5 rounded-full " +
                (serverOnline
                  ? "bg-primary-foreground"
                  : serverOnline === null
                    ? "bg-muted-foreground"
                    : "bg-destructive")
              }
            />
            {serverOnline
              ? "Server Online"
              : serverOnline === null
                ? "Memeriksa…"
                : "Server Offline"}
          </Badge>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

// ------------------------------------------------------------
//  KARTU JADWAL  (GET /jadwal)
// ------------------------------------------------------------
function JadwalCard({
  jadwal,
  onPesan,
}: {
  jadwal: Jadwal;
  onPesan: (j: Jadwal) => void;
}) {
  const habis = jadwal.kursiTersedia <= 0;
  const menipis = !habis && jadwal.kursiTersedia <= 10;
  const [asal, tujuan] = jadwal.rute.split(" - ");

  return (
    <Card className="justify-between gap-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Badge variant="muted" className="gap-1 font-mono">
            <Clock className="size-3" />
            {jadwal.jam} WIB
          </Badge>
          <Badge
            variant={habis ? "destructive" : menipis ? "secondary" : "outline"}
            className="gap-1"
          >
            <Armchair className="size-3" />
            {habis ? "Habis" : `${jadwal.kursiTersedia} kursi`}
          </Badge>
        </div>

        <CardTitle className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
          {tujuan ? (
            <>
              <span>{asal}</span>
              <ArrowRight className="size-4 text-secondary" />
              <span>{tujuan}</span>
            </>
          ) : (
            jadwal.rute
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {formatRupiah(jadwal.harga)}
          </span>
          <span className="text-xs text-muted-foreground">/ kursi</span>
        </div>
      </CardContent>

      <CardFooter className="mt-4">
        <Button
          className="w-full"
          disabled={habis}
          onClick={() => onPesan(jadwal)}
        >
          <Ticket className="size-4" />
          {habis ? "Tidak Tersedia" : "Pesan Tiket"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ------------------------------------------------------------
//  DIALOG PEMESANAN  (POST /pesan)
// ------------------------------------------------------------
function BookingDialog({
  jadwal,
  open,
  onOpenChange,
  onBooked,
}: {
  jadwal: Jadwal | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBooked: (t: Tiket) => void;
}) {
  const { toast } = useToast();
  const [nama, setNama] = React.useState("");
  const [kursi, setKursi] = React.useState("1");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setNama("");
      setKursi("1");
      setLoading(false);
    }
  }, [open]);

  if (!jadwal) return null;

  const jumlah = Math.max(0, Math.floor(Number(kursi) || 0));
  const total = jumlah * jadwal.harga;
  const valid =
    nama.trim().length > 0 && jumlah >= 1 && jumlah <= jadwal.kursiTersedia;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !jadwal) return;
    setLoading(true);
    try {
      const tiket = await pesanTiket({
        jadwalId: jadwal.id,
        namaPemesan: nama.trim(),
        jumlahKursi: jumlah,
      });
      toast({
        tone: "success",
        title: `Tiket #${tiket.idTiket} berhasil dipesan`,
        description: `${tiket.rute} · ${tiket.jumlahKursi} kursi · ${formatRupiah(tiket.totalBayar)}`,
      });
      onBooked(tiket);
      onOpenChange(false);
    } catch (err) {
      toast({
        tone: "error",
        title: "Pemesanan gagal",
        description:
          err instanceof ApiError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pesan Tiket</DialogTitle>
          <DialogDescription>
            Lengkapi data pemesan untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="size-4 text-primary" />
              {jadwal.rute}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {jadwal.jam} WIB
            </span>
          </div>
          <Separator className="my-2.5" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Harga per kursi</span>
            <span className="font-medium tabular-nums">
              {formatRupiah(jadwal.harga)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Pemesan</Label>
            <Input
              id="nama"
              placeholder="mis. Budi Santoso"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kursi">Jumlah Kursi</Label>
            <Input
              id="kursi"
              type="number"
              min={1}
              max={jadwal.kursiTersedia}
              value={kursi}
              onChange={(e) => setKursi(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tersedia {jadwal.kursiTersedia} kursi.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="size-4 text-primary" />
              Total Bayar
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight tabular-nums text-primary">
              {formatRupiah(total)}
            </span>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={loading}>
                  Batal
                </Button>
              }
            />
            <Button type="submit" disabled={!valid || loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ticket className="size-4" />
              )}
              Konfirmasi Pesan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
//  TAB JADWAL
// ------------------------------------------------------------
function JadwalTab({ onBooked }: { onBooked: (t: Tiket) => void }) {
  const [data, setData] = React.useState<Jadwal[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Jadwal | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getJadwal());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat jadwal.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function handlePesan(j: Jadwal) {
    setSelected(j);
    setDialogOpen(true);
  }

  function handleBooked(t: Tiket) {
    onBooked(t);
    load(); // segarkan sisa kursi dari server
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Jadwal Keberangkatan
          </h2>
          <p className="text-sm text-muted-foreground">
            Pilih rute dan jam untuk memesan tiket.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={"size-4 " + (loading ? "animate-spin" : "")} />
          Segarkan
        </Button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-44 animate-pulse">
              <CardHeader>
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-1/2 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={<TriangleAlert className="size-6" />}
          title="Tidak dapat memuat jadwal"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-4" />
              Coba lagi
            </Button>
          }
          tone="error"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((j) => (
            <JadwalCard key={j.id} jadwal={j} onPesan={handlePesan} />
          ))}
        </div>
      )}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="Belum ada jadwal"
          description="Saat ini belum ada jadwal keberangkatan yang tersedia."
        />
      )}

      <BookingDialog
        jadwal={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onBooked={handleBooked}
      />
    </div>
  );
}

// ------------------------------------------------------------
//  KARTU TIKET  +  DIALOG BATAL  (GET /tiket/:id, POST /batal/:id)
// ------------------------------------------------------------
function TiketCard({
  tiket,
  onCancelled,
}: {
  tiket: Tiket;
  onCancelled: (t: Tiket) => void;
}) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const aktif = tiket.status === "AKTIF";

  async function handleCancel() {
    setLoading(true);
    try {
      const updated = await batalkanTiket(tiket.idTiket);
      toast({
        tone: "success",
        title: `Tiket #${updated.idTiket} dibatalkan`,
        description: "Kursi telah dikembalikan ke jadwal.",
      });
      onCancelled(updated);
      setConfirmOpen(false);
    } catch (err) {
      toast({
        tone: "error",
        title: "Pembatalan gagal",
        description:
          err instanceof ApiError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className={
        "border-l-4 " + (aktif ? "border-l-primary" : "border-l-border")
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <span className="font-mono text-base">#{tiket.idTiket}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {tiket.namaPemesan}
            </CardDescription>
          </div>
          <Badge variant={aktif ? "success" : "muted"}>
            {aktif ? "Aktif" : "Dibatalkan"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-sm">
        <Row
          icon={<MapPin className="size-4" />}
          label="Rute"
          value={tiket.rute}
        />
        <Row
          icon={<Clock className="size-4" />}
          label="Berangkat"
          value={`${tiket.jam} WIB`}
        />
        <Row
          icon={<Armchair className="size-4" />}
          label="Jumlah Kursi"
          value={`${tiket.jumlahKursi} kursi`}
        />
        <Row
          icon={<CalendarClock className="size-4" />}
          label="Waktu Pesan"
          value={formatWaktu(tiket.waktuPesan)}
        />
        <Separator />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4" />
            Total Bayar
          </span>
          <span className="font-heading text-base font-semibold tabular-nums">
            {formatRupiah(tiket.totalBayar)}
          </span>
        </div>
      </CardContent>

      {aktif && (
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setConfirmOpen(true)}
          >
            <Ban className="size-4" />
            Batalkan Tiket
          </Button>
        </CardFooter>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Batalkan tiket #{tiket.idTiket}?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan membatalkan tiket atas nama{" "}
              <span className="font-medium text-foreground">
                {tiket.namaPemesan}
              </span>{" "}
              dan mengembalikan {tiket.jumlahKursi} kursi. Tidak dapat
              diurungkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={loading}>
                  Kembali
                </Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ------------------------------------------------------------
//  TAB TIKET SAYA
// ------------------------------------------------------------
function TiketTab({
  tickets,
  onUpsert,
}: {
  tickets: Tiket[];
  onUpsert: (t: Tiket) => void;
}) {
  const { toast } = useToast();
  const [cariId, setCariId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleCari(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(cariId);
    if (!id || id < 1) return;
    setLoading(true);
    try {
      const tiket = await getTiket(id);
      onUpsert(tiket);
      toast({
        tone: "success",
        title: `Tiket #${tiket.idTiket} ditemukan`,
        description: `${tiket.namaPemesan} · ${tiket.rute}`,
      });
      setCariId("");
    } catch (err) {
      toast({
        tone: "error",
        title: "Tiket tidak ditemukan",
        description:
          err instanceof ApiError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...tickets].sort((a, b) => b.idTiket - a.idTiket);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Tiket Saya
        </h2>
        <p className="text-sm text-muted-foreground">
          Tiket yang Anda pesan di sesi ini, atau cari berdasarkan ID.
        </p>
      </div>

      <form onSubmit={handleCari} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            placeholder="Cari tiket berdasarkan ID, mis. 1"
            value={cariId}
            onChange={(e) => setCariId(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" disabled={loading || !cariId}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Cari
        </Button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title="Belum ada tiket"
          description="Pesan tiket dari tab Jadwal, atau cari tiket menggunakan ID di atas."
          action={
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Mulai dari tab Jadwal <ArrowRight className="size-4" />
            </span>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((t) => (
            <TiketCard key={t.idTiket} tiket={t} onCancelled={onUpsert} />
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  KOMPONEN KECIL
// ------------------------------------------------------------
function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function FeatureChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div
          className={
            "flex size-12 items-center justify-center rounded-full " +
            (tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground")
          }
        >
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

function formatWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

// ------------------------------------------------------------
//  ROOT
// ------------------------------------------------------------
function Shell() {
  const [tickets, setTickets] = React.useState<Tiket[]>([]);
  const [serverOnline, setServerOnline] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let alive = true;
    getJadwal()
      .then(() => alive && setServerOnline(true))
      .catch(() => alive && setServerOnline(false));
    return () => {
      alive = false;
    };
  }, []);

  const upsertTicket = React.useCallback((t: Tiket) => {
    setServerOnline(true);
    setTickets((prev) => {
      const i = prev.findIndex((x) => x.idTiket === t.idTiket);
      if (i === -1) return [...prev, t];
      const next = [...prev];
      next[i] = t;
      return next;
    });
  }, []);

  const aktifCount = tickets.filter((t) => t.status === "AKTIF").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header serverOnline={serverOnline} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8">
          <Badge variant="muted" className="gap-1.5">
            <Network className="size-3" />
            Sistem Terdistribusi · REST API
          </Badge>
          <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Pesan tiket bus dengan mudah
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <FeatureChip
              icon={<Ticket className="size-3.5" />}
              label="4 Layanan REST"
            />
            <FeatureChip
              icon={<Zap className="size-3.5" />}
              label="Kursi realtime"
            />
            <FeatureChip
              icon={<ShieldCheck className="size-3.5" />}
              label="CORS aktif"
            />
          </div>
        </section>

        <Tabs defaultValue="jadwal">
          <TabsList>
            <TabsTrigger value="jadwal">
              <Bus className="size-4" />
              Jadwal
            </TabsTrigger>
            <TabsTrigger value="tiket">
              <Ticket className="size-4" />
              Tiket Saya
              {aktifCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  {aktifCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jadwal" className="mt-6">
            <JadwalTab onBooked={upsertTicket} />
          </TabsContent>

          <TabsContent value="tiket" className="mt-6">
            <TiketTab tickets={tickets} onUpsert={upsertTicket} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
          UAS Sistem Terdistribusi (PST1825) · Universitas Garut · REST API ·
          React + Vite + shadcn/ui
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
