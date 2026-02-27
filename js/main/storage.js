// storage.js

const API_BASE = 'https://serv-production-2768.up.railway.app/api/sync';

/**
 * Стан додатка.
 * Тепер ініціалізується порожніми значеннями.
 * Дані потрапляють сюди тільки після fetchInitialData.
 */
export let state = {
    sex: 'male',
    days: {},
    calc: {},
    curMonth: new Date().getMonth(),
    curYear: new Date().getFullYear(),
    mDate: null,
    mStatus: null,
    userId: null,
    token: null
};

/**
 * ТРИГЕР: Відправка даних на сервер.
 * Викликається автоматично при зміні днів або результатів розрахунків.
 */
async function triggerServerSync(key, data) {
    if (!state.userId || !state.token) {
        console.warn(`[Sync] Attempted to sync ${key} without auth.`);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${state.userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                storageKey: key, // 'fuel_calc_v3' або 'fuel_days_v3'
                payload: data
            })
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        
        console.log(`[Sync] ${key} successfully updated on server.`);
    } catch (err) {
        console.error(`[Sync Error] Failed to sync ${key}:`, err);
    }
}

/**
 * Початкове завантаження даних.
 * Викликається в app.js після успішної авторизації.
 */
export async function fetchInitialData(userId, token) {
    state.userId = userId;
    state.token = token;

    try {
        console.log('[Sync] Fetching data from server...');
        const response = await fetch(`${API_BASE}/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch initial data');

        const data = await response.json();
        
        if (data) {
            // Оновлюємо глобальний state даними з бази
            state.calc = data.fuel_calc_v3 || {};
            state.days = data.fuel_days_v3 || {};
            
            // Якщо в збережених даних була стать, оновлюємо її в state
            if (state.calc.sex) {
                state.sex = state.calc.sex;
            }
            
            console.log('[Sync] Data loaded successfully.');
        }
    } catch (err) {
        console.error('[Sync Error] Error during initial load:', err);
        // Залишаємо state порожнім ({}), щоб користувач міг почати "з чистого аркуша"
    }
}

/**
 * Збереження логів днів (календар).
 * Викликається при збереженні модалки.
 */
export function saveDaysToCache(newDays) {
    state.days = newDays;
    triggerServerSync('fuel_days_v3', state.days);
}

/**
 * Збереження параметрів калькулятора (вага, ціль, ккал).
 * Викликається після calculate().
 */
export function saveCalcToCache(newCalc) {
    state.calc = newCalc;
    // Оновлюємо стать у стані, якщо вона змінилась при розрахунку
    if (newCalc.sex) state.sex = newCalc.sex;
    
    triggerServerSync('fuel_calc_v3', state.calc);
}

// Константи для інтерфейсу
export const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];
export const DAYS_S = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const DAYS_F = [
    'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
];