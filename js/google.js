import { showMessage } from './ui.js';

export function handleGoogleOAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error === 'critical_auth_failure') {
        showMessage('Google Authentication failed. Please try again or use email.', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (token) {
        localStorage.setItem('accessToken', token);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.href = '/app.html';
    }
}