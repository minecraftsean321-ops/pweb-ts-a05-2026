import { getAuthSession, logout, getSemuaJenisAntrian, simpanJenisAntrian, getSemuaTiket, simpanTiket, formatNomorTiket } from '../utils.js';
const authSession = getAuthSession();
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const profileButton = document.getElementById('profileButton');
const userPanel = document.getElementById('user-panel');
const btnLogout = document.getElementById('btnLogout');
const inputKode = document.getElementById('inputKodeValue');
const inputNama = document.getElementById('inputNamaValue');
const btnTambah = document.getElementById('btnTambah');
const listJenisAntrian = document.getElementById('listJenisAntrian');
const selectJenisTerbit = document.getElementById('selectJenisTerbit');
const selectPrioritas = document.querySelector('#selectPrioritas select');
const btnTerbitkan = document.getElementById('btnTerbitkan');
const btnResetAntrian = document.getElementById('btnResetAntrian');
const listTiketAntrian = document.getElementById('listTiketAntrian');
const daftarPrioritas = ['Normal', 'Lansia', 'Disabilitas', 'VIP'];
if (authSession) {
    if (userNameDisplay)
        userNameDisplay.textContent = authSession.firstName;
    if (userRoleDisplay)
        userRoleDisplay.textContent = authSession.role;
}
else {
    if (userNameDisplay)
        userNameDisplay.textContent = 'Pengguna';
    if (userRoleDisplay)
        userRoleDisplay.textContent = 'Akses sementara';
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
const renderJenisAntrian = () => {
    const dataJenis = getSemuaJenisAntrian();
    const semuaTiket = getSemuaTiket();
    if (listJenisAntrian) {
        listJenisAntrian.replaceChildren();
        if (dataJenis.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.textContent = 'Belum ada jenis antrian.';
            listJenisAntrian.appendChild(emptyState);
        }
        dataJenis.forEach((jenis) => {
            const item = document.createElement('li');
            const info = document.createElement('div');
            info.className = 'info-antrian';
            const name = document.createElement('strong');
            name.textContent = `${jenis.nama} (${jenis.kode})`;
            const status = document.createElement('span');
            status.textContent = `Status: ${jenis.aktif ? 'Aktif' : 'Nonaktif'}`;
            const waiting = document.createElement('span');
            const jumlahMenunggu = semuaTiket.filter((tiket) => tiket.kodeAntrian === jenis.kode && tiket.status === 'Menunggu').length;
            waiting.textContent = `${jumlahMenunggu} Menunggu`;
            info.append(name, status, waiting);
            const actions = document.createElement('div');
            actions.className = 'list-left';
            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.dataset.action = 'toggle';
            toggleButton.dataset.kode = jenis.kode;
            toggleButton.textContent = jenis.aktif ? 'Nonaktifkan' : 'Aktifkan';
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.kode = jenis.kode;
            deleteButton.textContent = 'Hapus';
            actions.append(toggleButton, deleteButton);
            item.append(info, actions);
            listJenisAntrian.appendChild(item);
        });
    }
    if (selectJenisTerbit) {
        const selectedKode = selectJenisTerbit.value;
        selectJenisTerbit.replaceChildren(new Option('Pilih Jenis Antrian', ''));
        dataJenis.filter((jenis) => jenis.aktif).forEach((jenis) => {
            selectJenisTerbit.add(new Option(`${jenis.nama} (${jenis.kode})`, jenis.kode));
        });
        if (dataJenis.some((jenis) => jenis.aktif && jenis.kode === selectedKode)) {
            selectJenisTerbit.value = selectedKode;
        }
    }
};
const renderTiket = () => {
    if (!listTiketAntrian)
        return;
    listTiketAntrian.replaceChildren();
    const semuaJenis = getSemuaJenisAntrian();
    const semuaTiket = getSemuaTiket();
    if (semuaTiket.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.textContent = 'Belum ada tiket dalam antrian.';
        listTiketAntrian.appendChild(emptyState);
        return;
    }
    semuaJenis.forEach((jenis) => {
        const tiketJenis = semuaTiket.filter((tiket) => tiket.kodeAntrian === jenis.kode);
        if (tiketJenis.length === 0)
            return;
        const group = document.createElement('section');
        group.className = 'ticket-group';
        const heading = document.createElement('h4');
        heading.textContent = `${jenis.nama} (${jenis.kode})`;
        const list = document.createElement('ul');
        list.className = 'list-jenis';
        tiketJenis.forEach((tiket) => {
            const item = document.createElement('li');
            const id = document.createElement('strong');
            id.textContent = tiket.id;
            const priority = document.createElement('span');
            priority.textContent = tiket.prioritas;
            const ticketStatus = document.createElement('span');
            ticketStatus.textContent = tiket.status;
            item.append(id, priority, ticketStatus);
            list.appendChild(item);
        });
        group.append(heading, list);
        listTiketAntrian.appendChild(group);
    });
};
const renderDashboard = () => {
    renderJenisAntrian();
    renderTiket();
};
btnTambah?.addEventListener('click', () => {
    if (!inputKode || !inputNama) {
        alert('Input kode/nama tidak ditemukan!');
        return;
    }
    const kode = inputKode.value.trim().toUpperCase();
    const nama = inputNama.value.trim();
    if (!/^[A-Z]$/.test(kode)) {
        alert('Kode harus berupa 1 huruf kapital!');
        return;
    }
    if (!nama) {
        alert('Nama layanan tidak boleh kosong!');
        return;
    }
    const dataJenis = getSemuaJenisAntrian();
    const isDuplicate = dataJenis.some((jenis) => jenis.kode.toUpperCase() === kode || jenis.nama.trim().toLocaleLowerCase() === nama.toLocaleLowerCase());
    if (isDuplicate) {
        alert('Kode atau nama layanan sudah digunakan!');
        return;
    }
    dataJenis.push({ kode, nama, aktif: true });
    simpanJenisAntrian(dataJenis);
    inputKode.value = '';
    inputNama.value = '';
    renderDashboard();
});
listJenisAntrian?.addEventListener('click', (event) => {
    if (!(event.target instanceof Element))
        return;
    const button = event.target.closest('button[data-action][data-kode]');
    const kode = button?.dataset.kode;
    const action = button?.dataset.action;
    if (!button || !kode || (action !== 'toggle' && action !== 'delete'))
        return;
    const dataJenis = getSemuaJenisAntrian();
    const jenis = dataJenis.find((item) => item.kode === kode);
    if (!jenis) {
        alert('Jenis antrian tidak ditemukan. Muat ulang halaman dan coba lagi.');
        return;
    }
    if (action === 'toggle') {
        jenis.aktif = !jenis.aktif;
        simpanJenisAntrian(dataJenis);
        renderDashboard();
        return;
    }
    if (!confirm(`Hapus jenis antrian ${jenis.nama} (${jenis.kode}) beserta semua tiketnya?`))
        return;
    simpanJenisAntrian(dataJenis.filter((item) => item.kode !== kode));
    simpanTiket(getSemuaTiket().filter((tiket) => tiket.kodeAntrian !== kode));
    renderDashboard();
});
btnTerbitkan?.addEventListener('click', () => {
    if (!selectJenisTerbit || !selectPrioritas) {
        alert('Elemen form terbit tiket tidak ditemukan!');
        return;
    }
    const kodeDipilih = selectJenisTerbit.value;
    const jenisAktif = getSemuaJenisAntrian().some((jenis) => jenis.kode === kodeDipilih && jenis.aktif);
    if (!kodeDipilih || !jenisAktif) {
        alert('Silakan pilih jenis antrian yang masih aktif!');
        renderJenisAntrian();
        return;
    }
    const prioritasDipilih = daftarPrioritas.find((prioritas) => prioritas === selectPrioritas.value);
    if (!prioritasDipilih) {
        alert('Silakan pilih prioritas tiket yang valid!');
        return;
    }
    const idTiketBaru = formatNomorTiket(kodeDipilih);
    const semuaTiket = getSemuaTiket();
    const tiketBaru = {
        id: idTiketBaru,
        kodeAntrian: kodeDipilih,
        prioritas: prioritasDipilih,
        status: 'Menunggu',
        timestamp: Date.now()
    };
    semuaTiket.push(tiketBaru);
    simpanTiket(semuaTiket);
    renderDashboard();
    alert(`Tiket berhasil diterbitkan: ${idTiketBaru}`);
});
btnResetAntrian?.addEventListener('click', () => {
    if (!confirm('Reset seluruh antrian? Semua tiket akan dihapus dan nomor kembali ke awal.'))
        return;
    simpanTiket([]);
    renderDashboard();
    alert('Antrian berhasil direset. Nomor tiket kembali ke awal.');
});
renderDashboard();
//# sourceMappingURL=code.js.map