import { API_URL, USER_PROFILE_URL, elements, state } from './config.js';
import { showMessage, hideMessage, setLoading, switchMode, openResetModal } from './ui-utils.js';

const MIN_PASSWORD_LENGTH = 6;

export async function getAuthorizedUser() {
    let token = localStorage.getItem('accessToken');

    if (!token) return null;

    const fetchOptions = (t) => ({
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${t}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        let response = await fetch(USER_PROFILE_URL, fetchOptions(token));

        if (response.status === 401) {
            const newToken = await refreshTokens();
            if (newToken) {
                response = await fetch(USER_PROFILE_URL, fetchOptions(newToken));
            } else {
                return null;
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Refresh session expired');

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        }
        return null;
    } catch (err) {
        localStorage.removeItem('accessToken');
        return null;
    }
}

export function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = 'index.html';
}

function startGoogleAuth() {
    const performerInput = document.getElementById('performer');
    if (!performerInput) return;

    const performer = performerInput.value.trim();
    if (!performer) {
        alert('Enter performer name');
        return;
    }

    localStorage.setItem('pendingPerformer', performer);
    window.location.href = `${API_URL}/google?state=${encodeURIComponent(performer)}`;
}

export async function handleGoogleOAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) return;

    localStorage.setItem('accessToken', token);

    const performer = localStorage.getItem('pendingPerformer');
    if (performer) {
        localStorage.setItem('currentPerformer', performer);
        localStorage.removeItem('pendingPerformer');
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.href = 'app.html';
}

async function handleAuth(e) {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const performer = document.getElementById('performer')?.value.trim();

    if (!state.isLoginMode && password.length < MIN_PASSWORD_LENGTH) {
        return showMessage('Password must be at least 6 characters long.', 'error');
    }

    if (!state.isLoginMode) {
        const confirmPassword = document.getElementById('confirm-password').value;
        if (password !== confirmPassword) {
            return showMessage('Passwords do not match.', 'error');
        }
    }

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
        if (!response.ok) throw new Error(data.error || 'Auth failed');

        localStorage.setItem('accessToken', data.accessToken);
        if (performer) localStorage.setItem('currentPerformer', performer);

        showMessage('Success! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'app.html'; }, 1200);
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
}

function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-inputs input');

    inputs.forEach((input, i) => {
        input.addEventListener('input', () => {
            if (input.value && i < inputs.length - 1) {
                inputs[i + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 0) {
                inputs[i - 1].focus();
            }
        });
    });
}

async function goToCodeStep() {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) {
        showMessage('Enter email', 'error');
        return;
    }

    setLoading(true);

    try {
        const res = await fetch(`${API_URL}/reset-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send code');

        // зберігаємо email для наступних кроків
        state.resetEmail = email;

        elements.stepEmail.classList.add('hidden');
        elements.stepCode.classList.remove('hidden');
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function goToPasswordStep() {
    const inputs = document.querySelectorAll('.code-inputs input');
    const code = Array.from(inputs).map(i => i.value).join('');

    if (code.length !== inputs.length) {
        showMessage('Enter full code', 'error');
        return;
    }

    setLoading(true);

    try {
        const res = await fetch(`${API_URL}/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: state.resetEmail,
                code
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid code');

        state.resetCode = code;

        elements.stepCode.classList.add('hidden');
        elements.stepPassword.classList.remove('hidden');
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function finishReset() {
    const pass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-new-password').value;

    if (pass.length < MIN_PASSWORD_LENGTH) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (pass !== confirm) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    setLoading(true);

    try {
        const res = await fetch(`${API_URL}/update-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: state.resetEmail,
                code: state.resetCode,
                password: pass
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update password');

        showMessage('Password updated successfully', 'success');

        // cleanup
        state.resetEmail = null;
        state.resetCode = null;

        setTimeout(() => {
            elements.resetModal.classList.add('hidden');
        }, 800);

    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
}

if (elements.forgotBtn) {
    elements.forgotBtn.addEventListener('click', openResetModal);
}

setupCodeInputs();


window.goToCodeStep = goToCodeStep;
window.goToPasswordStep = goToPasswordStep;
window.finishReset = finishReset;
window.switchMode = switchMode;
window.handleAuth = handleAuth;
window.handleGoogleOAuth = handleGoogleOAuth;
window.startGoogleAuth = startGoogleAuth;

window.onload = () => {
    handleGoogleOAuth();
};