import { getAuthSession, setAuthSession } from '../utils.js';
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const btnText = document.getElementById('btnText');
const errorBanner = document.getElementById('error-banner');
const userDashboardBack = document.getElementById('user-dashboard-back');
const authSession = getAuthSession();
if (new URLSearchParams(window.location.search).get('denied') === 'admin' &&
    authSession?.role === 'user' &&
    userDashboardBack) {
    userDashboardBack.hidden = false;
}
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput || !btnLogin || !btnText || !errorBanner)
        return;
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
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Gagal melakukan autentikasi. Periksa kembali username dan password Anda.');
        }
        if (typeof data.id !== 'number') {
            throw new Error('Data akun dari server tidak valid.');
        }
        const fetchUsersByRole = async (role) => {
            const usersResponse = await fetch(`https://dummyjson.com/users/filter?key=role&value=${role}&limit=0`);
            const usersData = await usersResponse.json();
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
        }
        else {
            window.location.href = '../antrian-layar-page/ambilantrian.html';
        }
    }
    catch (error) {
        errorBanner.textContent = error instanceof Error
            ? error.message
            : 'Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.';
        errorBanner.hidden = false;
    }
    finally {
        btnLogin.disabled = false;
        btnText.textContent = 'Masuk';
    }
});