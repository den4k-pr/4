// main.js
import { authRequest } from './api.js';
import { elements, showMessage, hideMessage, setLoading } from './ui.js';

let isLoginMode = true;

async function handleAuth(e) {
    e.preventDefault();
    hideMessage();
    const email = elements.email.value.trim();
    const password = elements.password.value;

    if (!isLoginMode) {
        const confirm = elements.confirmPass.value;
        if (password !== confirm) return showMessage('Passwords do not match.', 'error');
        if (password.length < 6) return showMessage('Password must be at least 6 characters long.', 'error');
    }

    setLoading(true);
    try {
        const endpoint = isLoginMode ? '/login' : '/register';
        const data = await authRequest(endpoint, { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        showMessage(isLoginMode ? 'Login successful!' : 'Account created!', 'success');
        setTimeout(() => window.location.href = '/app.html', 500);
    } catch (err) {
        showMessage(err.message, 'error');
    } finally { setLoading(false); }
}

// Прив'язка форми без onsubmit
elements.form.addEventListener('submit', handleAuth);

// Перемикання режимів (коротко)
elements.tabLogin.addEventListener('click', () => { isLoginMode = true; elements.groupConfirm.classList.add('hidden'); });
elements.tabRegister.addEventListener('click', () => { isLoginMode = false; elements.groupConfirm.classList.remove('hidden'); });

// Google auth error обробка
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('error') === 'critical_auth_failure') {
    showMessage('Google Authentication failed.', 'error');
    window.history.replaceState({}, '', window.location.pathname);
}