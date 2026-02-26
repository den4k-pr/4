import { authRequest } from './api.js';
import { elements, showMessage, hideMessage, setLoading } from './ui.js';

export async function handleAuth(isLoginMode, e) {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isLoginMode) {
        const confirmPassword = document.getElementById('confirm-password').value;
        if (password !== confirmPassword) return showMessage('Passwords do not match.', 'error');
        if (password.length < 6) return showMessage('Password must be at least 6 characters long.', 'error');
    }

    const payload = { email, password };
    const endpoint = isLoginMode ? '/login' : '/register';

    setLoading(true);
    try {
        const data = await authRequest(endpoint, payload);

        localStorage.setItem('accessToken', data.accessToken);
        showMessage(isLoginMode ? 'Login successful! Redirecting...' : 'Account created! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = '/app.html';
        }, 500);
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
}