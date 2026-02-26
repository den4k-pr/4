import { getAuthorizedUser, logout } from './auth-main.js';

const elements = {
    preloader: document.getElementById('app-preloader'),
    mainContent: document.getElementById('app-main')
};

/**
 * Функція плавного приховування прелоадера
 */
function hidePreloader() {
    if (elements.preloader) {
        elements.preloader.classList.add('fade-out');
        
        // Показуємо основний контент
        if (elements.mainContent) {
            elements.mainContent.style.display = 'block';
        }

        // Прибираємо клас блокування скролу з body
        setTimeout(() => {
            document.body.classList.remove('loading');
        }, 500);
    }
}

/**
 * Ініціалізація додатка
 */
async function initApp() {
    console.log('[App] Initializing protection check...');
    
    try {
        // Чекаємо на відповідь від сервера
        const response = await getAuthorizedUser();

        // Перевіряємо за твоїм форматом: { success: true, user: { ... } }
        if (!response || !response.user) {
            console.error('[App] Not authorized! Redirecting...');
            window.location.href = 'index.html';
            return;
        }

        // Якщо ми тут — авторизація успішна
        console.log('[App] Authorization confirmed.');
        
        // Тут можна викликати функції завантаження твоїх даних SyncData
        // loadSyncData(response.user._id);

        // Приховуємо прелоадер
        hidePreloader();

    } catch (err) {
        console.error('[App Critical Error]', err);
        window.location.href = 'index.html';
    }
}

// Прив'язка Logout до window
window.handleLogout = logout;

// Запуск при завантаженні DOM
document.addEventListener('DOMContentLoaded', initApp);