import {
  formatNomorTiket,
  getSemuaJenisAntrian,
  getSemuaTiket,
  simpanTiket,
} from "./utils.js";
import type { JenisAntrian, Prioritas, Tiket } from "./utils.js";
import {
  ambilEl,
  bacaAman,
  bandingkanTiket,
  el,
  formatJam,
  tampilkanError,
} from "./public-shared.js";

const KEY_TIKET_SAYA = "tiket_saya"; // tiket milik pengunjung ini (per tab/sesi)
const DAFTAR_PRIORITAS: Prioritas[] = [
  "Normal",
  "Lansia",
  "Disabilitas",
  "VIP",
];

let kodeDipilih: string | null = null;
let prioritasDipilih: Prioritas = "Normal";
let tandaTerakhir = "";

const daftarLayanan = ambilEl("daftar-layanan");
const daftarPrioritas = ambilEl("daftar-prioritas");
const tombolAmbil = ambilEl<HTMLButtonElement>("btn-ambil");
const panelTiket = ambilEl("tiket-saya");
const isi = (id: string, teks: string): void => {
  ambilEl(id).textContent = teks;
};

const buatPrioritas = (): void => {
  for (const p of DAFTAR_PRIORITAS) {
    const label = el("label", "chip");
    const radio = el("input");
    radio.type = "radio";
    radio.name = "prioritas";
    radio.value = p;
    radio.checked = p === prioritasDipilih;
    radio.addEventListener("change", () => {
      prioritasDipilih = p;
    });
    label.append(radio, el("span", undefined, p));
    daftarPrioritas.append(label);
  }
};

const renderLayanan = (
  jenis: JenisAntrian[],
  menunggu: (kode: string) => number,
): void => {
  daftarLayanan.replaceChildren();
  if (jenis.length === 0) {
    daftarLayanan.append(
      el(
        "p",
        "kosong",
        "Belum ada layanan yang dibuka. Silakan hubungi petugas.",
      ),
    );
    return;
  }
  for (const j of jenis) {
    const tombol = el("button", "kartu-layanan");
    tombol.type = "button";
    tombol.setAttribute("aria-pressed", String(j.kode === kodeDipilih));
    tombol.append(
      el("span", "kode", j.kode),
      el("span", "nama", j.nama),
      el("span", "info", `${menunggu(j.kode)} menunggu`),
    );
    tombol.addEventListener("click", () => {
      kodeDipilih = j.kode;
      tandaTerakhir = "";
      refresh();
    });
    daftarLayanan.append(tombol);
  }
};

const renderTiketSaya = (tiket: Tiket[], jenis: JenisAntrian[]): void => {
  const id = sessionStorage.getItem(KEY_TIKET_SAYA);
  const saya = id ? tiket.find((t) => t.id === id) : undefined;
  panelTiket.hidden = !saya;
  if (!saya) return;
  const depan = tiket.filter(
    (t) =>
      t.kodeAntrian === saya.kodeAntrian &&
      t.status === "Menunggu" &&
      bandingkanTiket(t, saya) < 0,
  ).length;
  isi("t-nomor", saya.id);
  isi(
    "t-layanan",
    jenis.find((j) => j.kode === saya.kodeAntrian)?.nama ?? saya.kodeAntrian,
  );
  isi("t-prioritas", saya.prioritas);
  isi(
    "t-status",
    saya.status === "Dipanggil"
      ? "Dipanggil, silakan menuju loket"
      : saya.status,
  );
  ambilEl("t-status").dataset["status"] = saya.status;
  isi("t-jam", formatJam(saya.timestamp));
  isi("t-depan", saya.status === "Menunggu" ? `${depan} orang` : "-");
};

const refresh = (): void => {
  tampilkanError("");
  const semuaJenis = bacaAman(getSemuaJenisAntrian, [] as JenisAntrian[]);
  const tiket = bacaAman(getSemuaTiket, [] as Tiket[]);
  const aktif = semuaJenis.filter((j) => j.aktif);
  const menunggu = (kode: string): number =>
    tiket.filter((t) => t.kodeAntrian === kode && t.status === "Menunggu")
      .length;

  if (kodeDipilih && !aktif.some((j) => j.kode === kodeDipilih))
    kodeDipilih = null; // jenis dinonaktifkan/dihapus admin

  const tanda = JSON.stringify([
    aktif.map((j) => [j.kode, j.nama, menunggu(j.kode)]),
    kodeDipilih,
  ]);
  if (tanda !== tandaTerakhir) {
    tandaTerakhir = tanda;
    renderLayanan(aktif, menunggu);
  }

  tombolAmbil.disabled = kodeDipilih === null;
  renderTiketSaya(tiket, semuaJenis);
};

const ambilTiket = (): void => {
  try {
    const jenis = getSemuaJenisAntrian().find((j) => j.kode === kodeDipilih);
    if (!jenis) throw new Error("Pilih layanan terlebih dahulu.");
    if (!jenis.aktif)
      throw new Error(`Layanan ${jenis.nama} sedang dinonaktifkan.`);
    const baru: Tiket = {
      id: formatNomorTiket(jenis.kode),
      kodeAntrian: jenis.kode,
      prioritas: prioritasDipilih,
      status: "Menunggu",
      timestamp: Date.now(),
    };
    simpanTiket([...getSemuaTiket(), baru]);
    sessionStorage.setItem(KEY_TIKET_SAYA, baru.id);
    refresh();
    panelTiket.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    tampilkanError(
      error instanceof Error
        ? error.message
        : "Gagal mengambil tiket. Coba lagi.",
    );
  }
};

tombolAmbil.addEventListener("click", ambilTiket);
ambilEl("btn-cetak").addEventListener("click", () => window.print());
ambilEl("btn-lagi").addEventListener("click", () => {
  sessionStorage.removeItem(KEY_TIKET_SAYA);
  refresh();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

buatPrioritas();
refresh();
setInterval(refresh, 2000); // polling
window.addEventListener("storage", refresh); // update instan saat admin mengubah data di tab lain
