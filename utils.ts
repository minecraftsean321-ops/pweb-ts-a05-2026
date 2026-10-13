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
    if (!data) return null;

    try {
        const session: unknown = JSON.parse(data);

        if (typeof session !== 'object' || session === null) return null;
        if (!('token' in session) || typeof session.token !== 'string') return null;
        if (!('role' in session) || typeof session.role !== 'string') return null;
        if (!('firstName' in session) || typeof session.firstName !== 'string') return null;

        return {
            token: session.token,
            role: session.role,
            firstName: session.firstName
        };
    } catch (error) {
        if (error instanceof SyntaxError) return null;
        throw error;
    }
};

export const logout = (): void => {
    localStorage.removeItem(KEY_AUTH);
    window.location.replace(new URL('./login-operator/login.html', import.meta.url).href);
};

export const requireAuth = (): AuthSession | null => {
    const session = getAuthSession();
    if (!session?.token || !['admin', 'user'].includes(session.role)) {
        window.location.replace(new URL('./login-operator/login.html', import.meta.url).href);
        return null;
    }
    return session;
};

// Hanya admin yang boleh membuka dashboard.
export const checkAuth = (): void => {
    const session = requireAuth();
    if (session && session.role !== 'admin') {
        const loginUrl = new URL('./login-operator/login.html?denied=admin', import.meta.url);
        window.location.replace(loginUrl.href);
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

    const nomorTerakhir = semuaTiket.reduce((tertinggi, tiket) => {
        if (tiket.kodeAntrian !== kode) return tertinggi;

        const nomor = Number(tiket.id.slice(kode.length + 1));
        return Number.isInteger(nomor) ? Math.max(tertinggi, nomor) : tertinggi;
    }, 0);

    const nomorBerikutnya = nomorTerakhir + 1;
    const nomorFormat = nomorBerikutnya.toString().padStart(3, '0');

    return `${kode}-${nomorFormat}`;
};