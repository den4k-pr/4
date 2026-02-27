import { getAuthorizedUser, logout } from './auth-main.js';
import { fetchInitialData } from './main/storage.js'; // Додаємо імпорт
import { initAppUI } from './main/main.js';           // Додаємо імпорт

const elements = {
    preloader: document.getElementById('app-preloader'),
    mainContent: document.getElementById('app-main')
};

function hidePreloader() {
    if (elements.preloader) {
        elements.preloader.classList.add('fade-out');
        if (elements.mainContent) {
            elements.mainContent.style.display = 'block';
        }
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
        const response = await getAuthorizedUser();

        if (!response || !response.user) {
            console.error('[App] Not authorized! Redirecting...');
            window.location.href = 'index.html';
            return;
        }

        console.log('[App] Authorization confirmed.');
        
        // --- ОСЬ ТУТ МАГІЯ СИНХРОНІЗАЦІЇ ---
        const token = localStorage.getItem('accessToken');
        
        // 1. Чекаємо завантаження даних з сервера (це оновить state і localStorage)
        await fetchInitialData(response.user._id, token);

        // 2. Ініціалізуємо інтерфейс (малюємо календар, заповнюємо інпути)
        // Викликаємо функцію, яку ми створили в main.js
        initAppUI(); 
        // -----------------------------------

        hidePreloader();

    } catch (err) {
        console.error('[App Critical Error]', err);
        window.location.href = 'index.html';
    }
}

window.handleLogout = logout;
document.addEventListener('DOMContentLoaded', initApp);