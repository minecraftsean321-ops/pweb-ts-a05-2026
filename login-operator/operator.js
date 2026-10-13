import { logout, getSemuaTiket, simpanTiket, getSemuaJenisAntrian, requireAuth } from '../utils.js';
// 1. Auth Guard: Memastikan pengguna telah terotentikasi & memiliki data session
const authSession = requireAuth();
// Tampilkan informasi profil di navbar
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const profileButton = document.getElementById('profileButton');
const userPanel = document.getElementById('user-panel');
const btnLogout = document.getElementById('btnLogout');
if (authSession) {
    if (userNameDisplay)
        userNameDisplay.textContent = authSession.firstName;
    if (userRoleDisplay) {
        userRoleDisplay.textContent = authSession.role.charAt(0).toUpperCase() + authSession.role.slice(1);
    }
}
const closeUserPanel = () => {
    if (!userPanel || !profileButton)
        return;
    userPanel.hidden = true;
    profileButton.setAttribute('aria-expanded', 'false');
};
profileButton?.addEventListener('click', () => {
    if (!userPanel)
        return;
    const isOpening = userPanel.hidden;
    userPanel.hidden = !isOpening;
    profileButton.setAttribute('aria-expanded', String(isOpening));
});
btnLogout?.addEventListener('click', logout);
document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node))
        return;
    if (userPanel?.contains(event.target) || profileButton?.contains(event.target))
        return;
    closeUserPanel();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape')
        closeUserPanel();
});
// Elemen DOM Operator
const lblNomorAktif = document.getElementById('lblNomorAktif');
const lblLayananAktif = document.getElementById('lblLayananAktif');
const lblPrioritasAktif = document.getElementById('lblPrioritasAktif');
const listAntrianMenunggu = document.getElementById('listAntrianMenunggu');
const btnPanggilBerikutnya = document.getElementById('btnPanggilBerikutnya');
const btnLewati = document.getElementById('btnLewati');
const btnSelesai = document.getElementById('btnSelesai');
// Bobot prioritas untuk pengurutan otomatis (semakin tinggi bobot, semakin didahulukan)
const bobotPrioritas = {
    'VIP': 4,
    'Disabilitas': 3,
    'Lansia': 2,
    'Normal': 1
};
// Fungsi untuk mendapatkan antrian menunggu yang sudah diurutkan berdasarkan prioritas & waktu ambil
const getAntrianMenungguUrut = () => {
    const semuaTiket = getSemuaTiket();
    return semuaTiket
        .filter(tiket => tiket.status === 'Menunggu')
        .sort((a, b) => {
        const bobotA = bobotPrioritas[a.prioritas] || 1;
        const bobotB = bobotPrioritas[b.prioritas] || 1;
        if (bobotB !== bobotA) {
            return bobotB - bobotA; // Prioritas lebih tinggi di atas
        }
        return a.timestamp - b.timestamp; // Jika prioritas sama, yang ambil lebih dulu didahulukan (FIFO)
    });
};
// Render Halaman Operator
const renderOperatorPanel = () => {
    const semuaTiket = getSemuaTiket();
    const semuaJenis = getSemuaJenisAntrian();
    // 1. Cari tiket yang sedang aktif dipanggil (status: 'Dipanggil')
    const tiketDipanggil = semuaTiket.find(t => t.status === 'Dipanggil');
    if (tiketDipanggil) {
        if (lblNomorAktif)
            lblNomorAktif.textContent = tiketDipanggil.id;
        const jenisInfo = semuaJenis.find(j => j.kode === tiketDipanggil.kodeAntrian);
        if (lblLayananAktif)
            lblLayananAktif.textContent = jenisInfo ? `${jenisInfo.nama} (${jenisInfo.kode})` : tiketDipanggil.kodeAntrian;
        if (lblPrioritasAktif) {
            lblPrioritasAktif.textContent = tiketDipanggil.prioritas;
            lblPrioritasAktif.style.display = 'inline-block';
        }
    }
    else {
        if (lblNomorAktif)
            lblNomorAktif.textContent = '-';
        if (lblLayananAktif)
            lblLayananAktif.textContent = 'Belum ada antrian dipanggil';
        if (lblPrioritasAktif)
            lblPrioritasAktif.style.display = 'none';
    }
    // 2. Render Daftar Antrian Menunggu (dengan aturan prioritas)
    if (listAntrianMenunggu) {
        listAntrianMenunggu.replaceChildren();
        const antrianMenunggu = getAntrianMenungguUrut();
        if (antrianMenunggu.length === 0) {
            const li = document.createElement('li');
            li.style.justifyContent = 'center';
            li.style.color = '#6d6e5f';
            li.textContent = 'Tidak ada antrian menunggu saat ini.';
            listAntrianMenunggu.appendChild(li);
            return;
        }
        antrianMenunggu.forEach(tiket => {
            const li = document.createElement('li');
            const infoText = document.createElement('strong');
            infoText.textContent = tiket.id;
            const badge = document.createElement('span');
            badge.className = 'badge-prioritas';
            badge.textContent = tiket.prioritas;
            li.append(infoText, badge);
            listAntrianMenunggu.appendChild(li);
        });
    }
};
// --- TOMBOL KONTROL OPERATOR ---
// A. Tombol Panggil Berikutnya
btnPanggilBerikutnya?.addEventListener('click', () => {
    const semuaTiket = getSemuaTiket();
    // 1. Ubah tiket yang sebelumnya berstatus 'Dipanggil' menjadi 'Selesai'
    const tiketAktif = semuaTiket.find(t => t.status === 'Dipanggil');
    if (tiketAktif) {
        tiketAktif.status = 'Selesai';
    }
    // 2. Ambil antrian menunggu berikutnya berdasarkan urutan prioritas tertinggi
    const antrianMenungguUrut = getAntrianMenungguUrut();
    if (antrianMenungguUrut.length === 0) {
        simpanTiket(semuaTiket);
        renderOperatorPanel();
        alert('Tidak ada antrian berikutnya yang menunggu.');
        return;
    }
    const tiketBerikutnyaId = antrianMenungguUrut[0]?.id;
    const tiketBerikutnya = semuaTiket.find(t => t.id === tiketBerikutnyaId);
    if (tiketBerikutnya) {
        tiketBerikutnya.status = 'Dipanggil';
    }
    simpanTiket(semuaTiket);
    renderOperatorPanel();
});
// B. Tombol Lewati (Menandai tiket aktif sebagai 'Dilewati' dan memanggil berikutnya)
btnLewati?.addEventListener('click', () => {
    const semuaTiket = getSemuaTiket();
    const tiketAktif = semuaTiket.find(t => t.status === 'Dipanggil');
    if (!tiketAktif) {
        alert('Tidak ada tiket yang sedang dipanggil untuk dilewati.');
        return;
    }
    tiketAktif.status = 'Dilewati';
    const nomorTiketDilewati = tiketAktif.id;
    // Otomatis memanggil antrian berikutnya setelah tiket dilewati
    const antrianMenungguUrut = getAntrianMenungguUrut();
    if (antrianMenungguUrut.length > 0) {
        const tiketBerikutnyaId = antrianMenungguUrut[0]?.id;
        const tiketBerikutnya = semuaTiket.find(t => t.id === tiketBerikutnyaId);
        if (tiketBerikutnya) {
            tiketBerikutnya.status = 'Dipanggil';
        }
    }
    simpanTiket(semuaTiket);
    renderOperatorPanel();
    alert(`Tiket ${nomorTiketDilewati} dilewati.`);
});
// C. Tombol Selesai (Menutup tiket aktif tanpa otomatis memanggil berikutnya)
btnSelesai?.addEventListener('click', () => {
    const semuaTiket = getSemuaTiket();
    const tiketAktif = semuaTiket.find(t => t.status === 'Dipanggil');
    if (!tiketAktif) {
        alert('Tidak ada tiket aktif yang sedang dipanggil.');
        return;
    }
    tiketAktif.status = 'Selesai';
    const nomorTiketSelesai = tiketAktif.id;
    simpanTiket(semuaTiket);
    renderOperatorPanel();
    alert(`Tiket ${nomorTiketSelesai} diselesaikan.`);
});
// Inisialisasi awal saat halaman dimuat
renderOperatorPanel();