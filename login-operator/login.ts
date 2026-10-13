import { setAuthSession } from './utils.js';

const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
const usernameInput = document.getElementById('username') as HTMLInputElement | null;
const passwordInput = document.getElementById('password') as HTMLInputElement | null;
const btnLogin = document.getElementById('btnLogin') as HTMLButtonElement | null;
const btnText = document.getElementById('btnText') as HTMLSpanElement | null;
const errorBanner = document.getElementById('error-banner') as HTMLDivElement | null;

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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Gagal melakukan autentikasi. Periksa kembali username dan password Anda.');
        }

        // DummyJSON tidak selalu mengirim properti 'role', jadi kita berikan fallback
        // Akun 'emilys' diatur sebagai admin/moderator, sisanya user biasa
        let userRole: string = data.role || (username === 'emilys' ? 'admin' : 'user');
        
        if (userRole === 'moderator') {
            userRole = 'admin';
        }

        setAuthSession({
            token: data.token,
            role: userRole,
            firstName: data.firstName || username
        });

        // Auto Redirect Berdasarkan Role sesuai instruksi tugas
        if (['admin', 'moderator'].includes(userRole)) {
            window.location.href = 'index.html'; // Dashboard Admin
        } else {
            window.location.href = 'operator.html'; // Panel Operator / User biasa
        }

    } catch (error: any) {
        errorBanner.textContent = error.message || 'Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.';
        errorBanner.hidden = false;
    } finally {
        btnLogin.disabled = false;
        btnText.textContent = 'Masuk';
    }
});