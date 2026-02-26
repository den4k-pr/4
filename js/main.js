import { elements, switchMode } from './ui.js';
import { handleAuth } from './auth.js';
import { handleGoogleOAuth } from './google.js';

let isLoginMode = true;

// Ініціалізація
window.addEventListener('DOMContentLoaded', () => {
    handleGoogleOAuth();

    // Перемикання вкладок
    elements.tabLogin.addEventListener('click', () => { isLoginMode = true; switchMode(true); });
    elements.tabRegister.addEventListener('click', () => { isLoginMode = false; switchMode(false); });

    // Відправка форми
    elements.form.addEventListener('submit', (e) => handleAuth(isLoginMode, e));
});