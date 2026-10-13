export interface AuthSession {
    token: string;
    role: string;
    firstName: string;
}
export interface JenisAntrian {
    kode: string;
    nama: string;
    aktif: boolean;
}
export type Prioritas = 'Normal' | 'Lansia' | 'Disabilitas' | 'VIP';
export type StatusTiket = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';
export interface Tiket {
    id: string;
    kodeAntrian: string;
    prioritas: Prioritas;
    status: StatusTiket;
    timestamp: number;
}
export declare const setAuthSession: (data: AuthSession) => void;
export declare const getAuthSession: () => AuthSession | null;
export declare const logout: () => void;
export declare const requireAuth: () => AuthSession | null;
export declare const checkAuth: () => void;
export declare const getSemuaJenisAntrian: () => JenisAntrian[];
export declare const simpanJenisAntrian: (data: JenisAntrian[]) => void;
export declare const getSemuaTiket: () => Tiket[];
export declare const simpanTiket: (data: Tiket[]) => void;
export declare const formatNomorTiket: (kode: string) => string;
//# sourceMappingURL=utils.d.ts.map