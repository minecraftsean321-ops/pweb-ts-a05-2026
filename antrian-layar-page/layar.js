import { getSemuaJenisAntrian, getSemuaTiket } from "../utils.js";
import { ambilEl, bacaAman, bandingkanTiket, el, tampilkanError, } from "../public-shared.js";
const WAKTU_SOROT_MS = 6000;
const dipanggilSebelumnya = new Map(); // kode -> id tiket yang sedang dipanggil
const waktuPanggil = new Map(); // kode -> kapan terakhir berganti
let pertamaKali = true;
let suaraAktif = false;
let tandaTerakhir = "";
let terbaru = "";
const grid = ambilEl("grid-layar");
const tombolFull = ambilEl("btn-full");
const tombolSuara = ambilEl("btn-suara");
const umumkan = (id, nama) => {
    if (!suaraAktif || !("speechSynthesis" in window))
        return;
    const [kode = "", nomor = "0"] = id.split("-");
    const ucapan = new SpeechSynthesisUtterance(`Nomor antrian ${kode} ${Number(nomor)}, silakan menuju ${nama}`);
    ucapan.lang = "id-ID";
    ucapan.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ucapan);
};
const kartu = (j, dipanggil, berikutnya, sisa, sorot) => {
    const k = el("article", `kartu-layar${sorot ? " baru" : ""}`);
    const kepala = el("header");
    kepala.append(el("span", "kode", j.kode), el("h2", undefined, j.nama));
    const tengah = el("div", "tengah");
    tengah.append(el("p", "label", "Sedang dipanggil"), el("div", dipanggil ? "angka" : "angka kosong", dipanggil?.id ?? "- - -"));
    if (dipanggil && dipanggil.prioritas !== "Normal")
        tengah.append(el("span", "lencana", dipanggil.prioritas));
    const kaki = el("footer");
    kaki.append(el("span", undefined, `Sisa antrian: ${sisa}`), el("span", undefined, `Berikutnya: ${berikutnya?.id ?? "-"}`));
    k.append(kepala, tengah, kaki);
    return k;
};
const refresh = () => {
    tampilkanError("");
    const aktif = bacaAman(getSemuaJenisAntrian, []).filter((j) => j.aktif);
    const tiket = bacaAman(getSemuaTiket, []);
    const data = aktif.map((j) => {
        const milik = tiket.filter((t) => t.kodeAntrian === j.kode);
        const dipanggil = milik
            .filter((t) => t.status === "Dipanggil")
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        const menunggu = milik
            .filter((t) => t.status === "Menunggu")
            .sort(bandingkanTiket);
        return { j, dipanggil, menunggu };
    });
    for (const { j, dipanggil } of data) {
        const sebelumnya = dipanggilSebelumnya.get(j.kode);
        if (dipanggil && dipanggil.id !== sebelumnya) {
            waktuPanggil.set(j.kode, Date.now());
            terbaru = `${dipanggil.id} · ${j.nama}`;
            if (!pertamaKali)
                umumkan(dipanggil.id, j.nama);
        }
        if (dipanggil)
            dipanggilSebelumnya.set(j.kode, dipanggil.id);
        else
            dipanggilSebelumnya.delete(j.kode);
    }
    pertamaKali = false;
    ambilEl("panggilan-terbaru").textContent = terbaru || "-";
    const sorot = (kode) => Date.now() - (waktuPanggil.get(kode) ?? 0) < WAKTU_SOROT_MS;
    const tanda = JSON.stringify(data.map(({ j, dipanggil, menunggu }) => [
        j.kode,
        j.nama,
        dipanggil?.id,
        dipanggil?.prioritas,
        menunggu.length,
        menunggu[0]?.id,
        sorot(j.kode),
    ]));
    if (tanda === tandaTerakhir)
        return;
    tandaTerakhir = tanda;
    grid.replaceChildren();
    if (data.length === 0)
        grid.append(el("p", "kosong", "Belum ada layanan aktif."));
    for (const { j, dipanggil, menunggu } of data)
        grid.append(kartu(j, dipanggil, menunggu[0], menunggu.length, sorot(j.kode)));
};
const tampilJam = () => {
    const sekarang = new Date();
    ambilEl("jam").textContent = sekarang.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    ambilEl("tanggal").textContent = sekarang.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};
tombolFull.addEventListener("click", async () => {
    try {
        if (document.fullscreenElement)
            await document.exitFullscreen();
        else
            await document.documentElement.requestFullscreen();
    }
    catch (error) {
        console.error(error);
        tampilkanError("Mode layar penuh tidak didukung oleh browser ini.");
    }
});
document.addEventListener("fullscreenchange", () => {
    tombolFull.textContent = document.fullscreenElement
        ? "Keluar Layar Penuh"
        : "Layar Penuh";
});
tombolSuara.addEventListener("click", () => {
    suaraAktif = !suaraAktif;
    tombolSuara.textContent = suaraAktif ? "Suara: Hidup" : "Suara: Mati";
    tombolSuara.setAttribute("aria-pressed", String(suaraAktif));
    if (suaraAktif)
        umumkan("A-000", "loket pengujian suara"); // tes suara + izin autoplay browser
});
tampilJam();
refresh();
setInterval(tampilJam, 1000);
setInterval(refresh, 2000); // polling 2 detik
window.addEventListener("storage", refresh);
