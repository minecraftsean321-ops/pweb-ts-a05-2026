// ==========================================
// INTERFACES (Struktur Data TypeScript)
// ==========================================
export interface AuthSession {
    token: string;
    role: string;
    firstName: string;
}

export interface JenisAntrian {
    kode: string; // 1 Huruf kapital (Contoh: 'A')
    nama: string; // Contoh: 'UMUM-1'
    aktif: boolean;
}

// Tingkat prioritas sesuai ketentuan PDF
export type Prioritas = 'Normal' | 'Lansia' | 'Disabilitas' | 'VIP';

// Status antrian aktif
export type StatusTiket = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';

export interface Tiket {
    id: string; // Format: Kode-000 (Contoh: A-001)
    kodeAntrian: string;
    prioritas: Prioritas;
    status: StatusTiket;
    timestamp: number;
}

// ==========================================
// KONSTANTA (Kunci Penyimpanan Local Storage)
// ==========================================
const KEY_AUTH = 'auth_session';
const KEY_JENIS_ANTRIAN = 'master_jenis_antrian';
const KEY_TIKET = 'data_tiket_antrian';

// ==========================================
// FUNGSI AUTENTIKASI & PROTEKSI HALAMAN
// ==========================================

export const setAuthSession = (data: AuthSession): void => {
    localStorage.setItem(KEY_AUTH, JSON.stringify(data));
};

export const getAuthSession = (): AuthSession | null => {
    const data = localStorage.getItem(KEY_AUTH);
    return data ? JSON.parse(data) : null;
};

export const logout = (): void => {
    localStorage.removeItem(KEY_AUTH);
    window.location.href = 'login.html';
};

// Fungsi Auth Guard untuk proteksi dashboard admin & operator
export const checkAuth = (allowedRoles: string[]): void => {
    const session = getAuthSession();
    
    // Redirect paksa jika belum login
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Perlakuan hak akses moderator disamakan dengan admin
    let userRole = session.role;
    if (userRole === 'moderator') {
        userRole = 'admin';
    }

    // Jika role tidak sesuai, lemparkan ke halaman yang benar
    if (!allowedRoles.includes(userRole)) {
        if (userRole === 'admin') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'ambil-antrian.html';
        }
    }
};

// ==========================================
// FUNGSI CRUD JENIS ANTRIAN
// ==========================================

export const getSemuaJenisAntrian = (): JenisAntrian[] => {
    const data = localStorage.getItem(KEY_JENIS_ANTRIAN);
    return data ? JSON.parse(data) : [];
};

export const simpanJenisAntrian = (data: JenisAntrian[]): void => {
    localStorage.setItem(KEY_JENIS_ANTRIAN, JSON.stringify(data));
};

// ==========================================
// FUNGSI CRUD & FORMAT TIKET ANTRIAN
// ==========================================

export const getSemuaTiket = (): Tiket[] => {
    const data = localStorage.getItem(KEY_TIKET);
    return data ? JSON.parse(data) : [];
};

export const simpanTiket = (data: Tiket[]): void => {
    localStorage.setItem(KEY_TIKET, JSON.stringify(data));
};

// Menghasilkan nomor tiket dengan format Kode-Nomor 3 Digit (contoh: A-001)
export const formatNomorTiket = (kode: string): string => {
    const semuaTiket = getSemuaTiket();
    
    // Hitung berapa banyak tiket yang sudah ada untuk kode tersebut
    const totalTiketDiKodeIni = semuaTiket.filter(t => t.kodeAntrian === kode).length;
    
    // Nomor berikutnya adalah total + 1
    const nomorBerikutnya = totalTiketDiKodeIni + 1;
    
    // Format menjadi 3 digit (padStart)
    const nomorFormat = nomorBerikutnya.toString().padStart(3, '0');
    
    return `${kode}-${nomorFormat}`;
};