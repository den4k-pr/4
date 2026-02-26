import { API_URL, elements, state } from './config.js';
import { showMessage, hideMessage, setLoading, switchMode } from './ui-utils.js';

/**
 * Функція для обробки Google OAuth
 * Перевіряє наявність токена або помилки в URL після редіректу
 */
export function handleGoogleOAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error === 'critical_auth_failure') {
        showMessage('Google Authentication failed. Please try again or use email.', 'error');
        // Очищаємо URL щоб помилка не висіла при оновленні сторінки
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (token) {
        // Зберігаємо отриманий токен
        localStorage.setItem('accessToken', token);
        // Очищаємо URL від токена для безпеки
        window.history.replaceState({}, document.title, window.location.pathname);
        // Редірект на головний додаток
        window.location.href = 'app.html';
    }
}

// Головна функція відправки даних форми (Email/Password)
async function handleAuth(e) {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Локальна перевірка паролів для реєстрації
    if (!state.isLoginMode) {
        const confirmPassword = document.getElementById('confirm-password').value;
        if (password !== confirmPassword) {
            return showMessage('Passwords do not match.', 'error');
        }
        if (password.length < 6) {
            return showMessage('Password must be at least 6 characters long.', 'error');
        }
    }

    const payload = { email, password };

    const endpoint = state.isLoginMode ? '/login' : '/register';
    console.log(`[Auth] Sending request to ${endpoint}...`);
    setLoading(true);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include' 
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Authentication failed');
        }

        console.log('[Auth] Success! Access Token received.');
        showMessage(state.isLoginMode ? 'Login successful! Redirecting...' : 'Account created! Redirecting...', 'success');
        
        localStorage.setItem('accessToken', data.accessToken);

        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1200);

    } catch (err) {
        console.error('[Auth Error]:', err.message);
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
}

// Прив'язка функцій до window для HTML атрибутів (onclick, onsubmit)
window.switchMode = switchMode;
window.handleAuth = handleAuth;
window.handleGoogleOAuth = handleGoogleOAuth;

// Виконуємо перевірку OAuth при кожному завантаженні сторінки
window.onload = () => {
    handleGoogleOAuth();
};