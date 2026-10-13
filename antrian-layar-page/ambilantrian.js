import { formatNomorTiket, getSemuaJenisAntrian, getSemuaTiket, logout, requireAuth, simpanTiket, } from "../utils.js";
import { ambilEl, bacaAman, bandingkanTiket, el, formatJam, tampilkanError, } from "../public-shared.js";
const authSession = requireAuth();
const userNameDisplay = document.getElementById("userNameDisplay");
const userRoleDisplay = document.getElementById("userRoleDisplay");
const profileButton = document.getElementById("profileButton");
const userPanel = document.getElementById("user-panel");
if (userNameDisplay && authSession) {
    userNameDisplay.textContent = authSession.firstName;
}
if (userRoleDisplay && authSession) {
    userRoleDisplay.textContent = authSession.role.charAt(0).toUpperCase() + authSession.role.slice(1);
}
const closeUserPanel = () => {
    if (!userPanel || !profileButton)
        return;
    userPanel.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");
};
profileButton?.addEventListener("click", () => {
    if (!userPanel)
        return;
    const isOpening = userPanel.hidden;
    userPanel.hidden = !isOpening;
    profileButton.setAttribute("aria-expanded", String(isOpening));
});
document.getElementById("btnLogout")?.addEventListener("click", logout);
document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node))
        return;
    if (userPanel?.contains(event.target) || profileButton?.contains(event.target))
        return;
    closeUserPanel();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape")
        closeUserPanel();
});
const KEY_TIKET_SAYA = "tiket_saya"; // tiket milik pengunjung ini (per tab/sesi)
const DAFTAR_PRIORITAS = [
    "Normal",
    "Lansia",
    "Disabilitas",
    "VIP",
];
let kodeDipilih = null;
let prioritasDipilih = "Normal";
let tandaTerakhir = "";
const daftarLayanan = ambilEl("daftar-layanan");
const daftarPrioritas = ambilEl("daftar-prioritas");
const tombolAmbil = ambilEl("btn-ambil");
const panelTiket = ambilEl("tiket-saya");
const isi = (id, teks) => {
    ambilEl(id).textContent = teks;
};
const buatPrioritas = () => {
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
const renderLayanan = (jenis, menunggu) => {
    daftarLayanan.replaceChildren();
    if (jenis.length === 0) {
        daftarLayanan.append(el("p", "kosong", "Belum ada layanan yang dibuka. Silakan hubungi petugas."));
        return;
    }
    for (const j of jenis) {
        const tombol = el("button", "kartu-layanan");
        tombol.type = "button";
        tombol.setAttribute("aria-pressed", String(j.kode === kodeDipilih));
        tombol.append(el("span", "kode", j.kode), el("span", "nama", j.nama), el("span", "info", `${menunggu(j.kode)} menunggu`));
        tombol.addEventListener("click", () => {
            kodeDipilih = j.kode;
            tandaTerakhir = "";
            refresh();
        });
        daftarLayanan.append(tombol);
    }
};
const renderTiketSaya = (tiket, jenis) => {
    const id = sessionStorage.getItem(KEY_TIKET_SAYA);
    const saya = id ? tiket.find((t) => t.id === id) : undefined;
    panelTiket.hidden = !saya;
    if (!saya)
        return;
    const depan = tiket.filter((t) => t.kodeAntrian === saya.kodeAntrian &&
        t.status === "Menunggu" &&
        bandingkanTiket(t, saya) < 0).length;
    isi("t-nomor", saya.id);
    isi("t-layanan", jenis.find((j) => j.kode === saya.kodeAntrian)?.nama ?? saya.kodeAntrian);
    isi("t-prioritas", saya.prioritas);
    isi("t-status", saya.status === "Dipanggil"
        ? "Dipanggil, silakan menuju loket"
        : saya.status);
    ambilEl("t-status").dataset["status"] = saya.status;
    isi("t-jam", formatJam(saya.timestamp));
    isi("t-depan", saya.status === "Menunggu" ? `${depan} orang` : "-");
};
const refresh = () => {
    tampilkanError("");
    const semuaJenis = bacaAman(getSemuaJenisAntrian, []);
    const tiket = bacaAman(getSemuaTiket, []);
    const aktif = semuaJenis.filter((j) => j.aktif);
    const menunggu = (kode) => tiket.filter((t) => t.kodeAntrian === kode && t.status === "Menunggu")
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
const ambilTiket = () => {
    try {
        const jenis = getSemuaJenisAntrian().find((j) => j.kode === kodeDipilih);
        if (!jenis)
            throw new Error("Pilih layanan terlebih dahulu.");
        if (!jenis.aktif)
            throw new Error(`Layanan ${jenis.nama} sedang dinonaktifkan.`);
        const baru = {
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
    }
    catch (error) {
        tampilkanError(error instanceof Error
            ? error.message
            : "Gagal mengambil tiket. Coba lagi.");
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