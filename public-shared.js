export const ambilEl = (id) => {
    const elemen = document.getElementById(id);
    if (!elemen) {
        throw new Error(`Elemen dengan id "${id}" tidak ditemukan.`);
    }
    return elemen;
};
export const el = (tagName, className, textContent) => {
    const elemen = document.createElement(tagName);
    if (className) {
        elemen.className = className;
    }
    if (textContent !== undefined) {
        elemen.textContent = textContent;
    }
    return elemen;
};
export const bacaAman = (panggil, fallback) => {
    try {
        return panggil();
    }
    catch {
        return fallback;
    }
};
export const bandingkanTiket = (a, b) => {
    const prioritasUrut = {
        VIP: 0,
        Disabilitas: 1,
        Lansia: 2,
        Normal: 3,
    };
    const selisihPrioritas = prioritasUrut[a.prioritas] - prioritasUrut[b.prioritas];
    if (selisihPrioritas !== 0) {
        return selisihPrioritas;
    }
    return a.timestamp - b.timestamp;
};
export const formatJam = (timestamp) => {
    if (!Number.isFinite(timestamp)) {
        return "-";
    }
    const tanggal = new Date(timestamp);
    if (Number.isNaN(tanggal.getTime())) {
        return "-";
    }
    return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(tanggal);
};
export const tampilkanError = (pesan) => {
    const banner = document.getElementById("error-banner");
    if (!banner) {
        return;
    }
    if (!pesan) {
        banner.hidden = true;
        banner.textContent = "";
        return;
    }
    banner.textContent = pesan;
    banner.hidden = false;
};
