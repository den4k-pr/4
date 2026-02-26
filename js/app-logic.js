import { getAuthorizedUser, logout } from './auth-main.js';

async function initApp() {
    console.log('[App] Initializing protection check...');
    
    // Перевіряємо юзера
    const user = await getAuthorizedUser();

    if (!user) {
        console.error('[App] Not authorized! Redirecting to login...');
        window.location.href = 'index.html';
        return;
    }

    // Якщо ми тут — юзер залогований
    console.log('[App] Welcome,', user.email);
    renderUserData(user);
}

function renderUserData(user) {
    const userDisplay = document.getElementById('user-email');
    if (userDisplay) {
        userDisplay.textContent = user.email;
    }
    // Тут можна показати основний контент додатка
    document.body.classList.add('authorized');
}

// Прив'язуємо вихід до window
window.handleLogout = logout;

// Запускаємо перевірку відразу при завантаженні скрипта
document.addEventListener('DOMContentLoaded', initApp);