import { API_URL, USER_PROFILE_URL, elements, state } from './config.js';
import { showMessage, hideMessage, setLoading, switchMode } from './ui-utils.js';

export async function getAuthorizedUser() {
    let token = localStorage.getItem('accessToken');

    if (!token) {
        console.warn('[Auth Service] No access token found');
        return null;
    }

    try {
        // 1. Пробуємо отримати профіль юзера
        let response = await fetch(USER_PROFILE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 2. Якщо токен протермінований (401), пробуємо Refresh
        if (response.status === 401) {
            console.log('[Auth Service] Access token expired, trying refresh...');
            const newToken = await refreshTokens();
            
            if (newToken) {
                // 3. Якщо рефреш успішний, робимо повторний запит за профілем
                response = await fetch(USER_PROFILE_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                return null; // Рефреш не вдався
            }
        }

        if (!response.ok) throw new Error('Failed to fetch user');

        return await response.json();
    } catch (err) {
        console.error('[Auth Service Error]:', err);
        return null;
    }
}

async function refreshTokens() {
    try {
        const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST', // або GET, залежно від твого сервера
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // ВАЖЛИВО: для передачі Refresh Cookie
        });

        if (!response.ok) throw new Error('Refresh session expired');

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            console.log('[Auth Service] Token refreshed successfully');
            return data.accessToken;
        }
        return null;
    } catch (err) {
        console.warn('[Auth Service] Refresh failed, session lost');
        localStorage.removeItem('accessToken');
        return null;
    }
}

export function logout() {
    localStorage.removeItem('accessToken');
    // Можна додати запит на бекенд для очищення кук
    window.location.href = 'index.html';
}

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
    // ОТРИМУЄМО ВИКОНАВЦЯ (додай цей input в HTML з id="performer")
    const performer = document.getElementById('performer').value.trim(); 
    
    if (!performer) {
        return showMessage('Please enter Performer name.', 'error');
    }

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

    // ДОДАЄМО performer В ПЕЙЛОАД
    const payload = { email, password, performer };

    const endpoint = state.isLoginMode ? '/login' : '/register';
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

        // ЗБЕРІГАЄМО ТОКЕН ТА ВИКОНАВЦЯ
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('currentPerformer', performer); // ВАЖЛИВО для наступних запитів

        showMessage(state.isLoginMode ? 'Login successful!' : 'Account created!', 'success');
        
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1200);

    } catch (err) {
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