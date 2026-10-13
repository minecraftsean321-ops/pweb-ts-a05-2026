import { setAuthSession } from './utils.js';
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const btnText = document.getElementById('btnText');
const errorBanner = document.getElementById('error-banner');
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
        let userRole = data.role || 'user';
        if (userRole === 'moderator') {
            userRole = 'admin';
        }
        setAuthSession({
            token: data.token,
            role: userRole,
            firstName: data.firstName || username
        });
        if (['admin', 'moderator'].includes(userRole)) {
            window.location.href = 'index.html';
        }
        else {
            window.location.href = 'antrian-layar-page/ambilantrian.html';
        }
    }
    catch (error) {
        errorBanner.textContent = error.message || 'Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.';
        errorBanner.hidden = false;
    }
    finally {
        btnLogin.disabled = false;
        btnText.textContent = 'Masuk';
    }
});
