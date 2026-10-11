// 1. Import fungsi dari utils.js (INGAT: pakai akhiran .js saat import)
import { 
    checkAuth, 
    getAuthSession,
    logout,
    getSemuaJenisAntrian, 
    simpanJenisAntrian, 
    JenisAntrian,
    getSemuaTiket,
    simpanTiket,
    Tiket,
    formatNomorTiket,
    Prioritas
} from '../utils.js';

// 2. Auth Guard: Redirect ke login jika sesi tidak valid atau role tidak diizinkan
checkAuth();

const authSession = getAuthSession();
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const btnLogout = document.getElementById('btnLogout');

if (authSession) {
    if (userNameDisplay) userNameDisplay.textContent = authSession.firstName;
    if (userRoleDisplay) userRoleDisplay.textContent = authSession.role;
}

btnLogout?.addEventListener('click', logout);

const inputKode = document.getElementById('inputKode');
const inputNama = document.getElementById('inputNama');
const btnTambah = document.getElementById('btnTambah');
const containerJenisAntrian = document.getElementById('containerJenisAntrian');

const selectJenisTerbit = document.getElementById('selectJenisTerbit');
const selectPrioritas = document.getElementById('selectPrioritas');
const btnTerbitkan = document.getElementById('btnTerbitkan');

// ==========================================
// LOGIKA 1: RENDER & TAMBAH JENIS ANTRIAN
// ==========================================

// Fungsi untuk me-refresh tampilan daftar jenis antrian & opsi dropdown
const renderJenisAntrian = () => {
    const dataJenis = getSemuaJenisAntrian();
    
    // Kosongkan container sebelum diisi ulang
    if (containerJenisAntrian) containerJenisAntrian.innerHTML = '';
    if (selectJenisTerbit) selectJenisTerbit.innerHTML = '<option value="">Pilih Jenis Antrian</option>';

    dataJenis.forEach((jenis: JenisAntrian) => {
        // Render ke daftar UI sebelah kiri
        if (containerJenisAntrian) {
            const div = document.createElement('div');
            // Menambahkan class CSS (opsional, sesuaikan dengan mystyle.css)
            div.className = 'flex justify-between items-center border-b p-2'; 
            div.innerHTML = `
                <div>
                    <span class="font-bold">${jenis.nama} (${jenis.kode})</span>
                    <p class="text-sm">Status: ${jenis.aktif ? 'Aktif' : 'Nonaktif'}</p>
                </div>
                <div>
                    <button class="btn-toggle text-sm mr-2" data-kode="${jenis.kode}">
                        ${jenis.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button class="btn-hapus text-sm text-red-500" data-kode="${jenis.kode}">Hapus</button>
                </div>
            `;
            containerJenisAntrian.appendChild(div);
        }

        // Tambahkan ke dropdown "Terbitkan Tiket" jika statusnya aktif
        if (jenis.aktif && selectJenisTerbit) {
            const option = document.createElement('option');
            option.value = jenis.kode;
            option.textContent = `${jenis.nama} (${jenis.kode})`;
            selectJenisTerbit.appendChild(option);
        }
    });
};

// Event Listener untuk tombol "Tambah"
btnTambah?.addEventListener('click', () => {
    const kode = inputKode.value.trim().toUpperCase();
    const nama = inputNama.value.trim();

    // Validasi input
    if (kode.length !== 1 || !/^[A-Z]$/.test(kode)) {
        alert('Kode harus berupa 1 huruf kapital!');
        return;
    }
    if (!nama) {
        alert('Nama antrian tidak boleh kosong!');
        return;
    }

    const dataJenis = getSemuaJenisAntrian();
    
    // Cek duplikasi (case-insensitive)
    const isDuplicate = dataJenis.some(j => j.kode === kode || j.nama.toLowerCase() === nama.toLowerCase());
    if (isDuplicate) {
        alert('Kode atau Nama jenis antrian sudah digunakan!');
        return;
    }

    // Simpan data baru
    const jenisBaru: JenisAntrian = { kode, nama, aktif: true };
    dataJenis.push(jenisBaru);
    simpanJenisAntrian(dataJenis);

    // Reset form & render ulang
    inputKode.value = '';
    inputNama.value = '';
    renderJenisAntrian();
});

// ==========================================
// LOGIKA 2: TERBITKAN TIKET MANUAL
// ==========================================

btnTerbitkan?.addEventListener('click', () => {
    const kodeDipilih = selectJenisTerbit.value;
    const prioritasDipilih = selectPrioritas.value as Prioritas;

    if (!kodeDipilih) {
        alert('Silakan pilih jenis antrian terlebih dahulu!');
        return;
    }

    // Buat id tiket baru (misal: C-001)
    const idTiketBaru = formatNomorTiket(kodeDipilih);

    const tiketBaru: Tiket = {
        id: idTiketBaru,
        kodeAntrian: kodeDipilih,
        prioritas: prioritasDipilih,
        status: 'Menunggu',
        timestamp: Date.now()
    };

    // Ambil tiket lama, tambahkan yang baru, simpan lagi
    const semuaTiket = getSemuaTiket();
    semuaTiket.push(tiketBaru);
    simpanTiket(semuaTiket);

    alert(`Tiket berhasil diterbitkan: ${idTiketBaru}`);
    // Nanti disini kamu bisa panggil fungsi renderTiket() buat nampilin list di bawahnya
});

// ==========================================
// INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
renderJenisAntrian();