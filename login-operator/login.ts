import { getAuthSession, setAuthSession } from '../utils.js';

type DummyJsonUser = {
    id: number;
    role: string;
};

type DummyJsonUserList = {
    users: DummyJsonUser[];
};

const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
const usernameInput = document.getElementById('username') as HTMLInputElement | null;
const passwordInput = document.getElementById('password') as HTMLInputElement | null;
const btnLogin = document.getElementById('btnLogin') as HTMLButtonElement | null;
const btnText = document.getElementById('btnText') as HTMLSpanElement | null;
const errorBanner = document.getElementById('error-banner') as HTMLDivElement | null;
const userDashboardBack = document.getElementById('user-dashboard-back');

const authSession = getAuthSession();
if (
    new URLSearchParams(window.location.search).get('denied') === 'admin' &&
    authSession?.role === 'user' &&
    userDashboardBack
) {
    userDashboardBack.hidden = false;
}

loginForm?.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    if (!usernameInput || !passwordInput || !btnLogin || !btnText || !errorBanner) return;

    errorBanner.hidden = true;
    errorBanner.textContent = '';
    btnLogin.disabled = true;
    btnText.textContent = 'Memverifikasi...';

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('https://dummyjson.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data: {
            message?: string;
            id?: number;
            token?: string;
            accessToken?: string;
            firstName?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Gagal melakukan autentikasi. Periksa kembali username dan password Anda.');
        }

        if (typeof data.id !== 'number') {
            throw new Error('Data akun dari server tidak valid.');
        }

        const fetchUsersByRole = async (role: 'admin' | 'user'): Promise<DummyJsonUser[]> => {
            const usersResponse = await fetch(`https://dummyjson.com/users/filter?key=role&value=${role}&limit=0`);
            const usersData: DummyJsonUserList = await usersResponse.json();
            if (!usersResponse.ok || !Array.isArray(usersData.users)) {
                throw new Error(`Gagal memuat daftar akun ${role} dari server.`);
            }
            return usersData.users;
        };

        const [admins, users] = await Promise.all([
            fetchUsersByRole('admin'),
            fetchUsersByRole('user')
        ]);
        const userRole = admins.some(user => user.id === data.id)
            ? 'admin'
            : users.some(user => user.id === data.id)
                ? 'user'
                : null;

        if (!userRole) {
            throw new Error('Role akun tidak terdaftar. Silakan hubungi administrator.');
        }

        const token = data.accessToken || data.token;
        if (!token) {
            throw new Error('Token autentikasi tidak diterima dari server.');
        }

        setAuthSession({
            token,
            role: userRole,
            firstName: data.firstName || username
        });

        if (userRole === 'admin') {
            window.location.href = '../dashboard-admin/index.html';
        } else {
            window.location.href = '../antrian-layar-page/ambilantrian.html';
        }

    } catch (error: unknown) {
        errorBanner.textContent = error instanceof Error
            ? error.message
            : 'Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.';
        errorBanner.hidden = false;
    } finally {
        btnLogin.disabled = false;
        btnText.textContent = 'Masuk';
    }
});