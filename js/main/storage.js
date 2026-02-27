// storage.js

const API_BASE = 'https://serv-production-2768.up.railway.app/api/sync';

/**
 * STATE: Ініціалізується миттєво з localStorage.
 * Це гарантує, що UI не розвалиться при старті.
 */
export let state = {
    sex: JSON.parse(localStorage.getItem('fuel_calc_v3') || '{}').sex || 'male',
    days: JSON.parse(localStorage.getItem('fuel_days_v3') || '{}'),
    calc: JSON.parse(localStorage.getItem('fuel_calc_v3') || '{}'),
    curMonth: new Date().getMonth(),
    curYear: new Date().getFullYear(),
    mDate: null,
    mStatus: null,
    userId: null,
    token: null
};

/**
 * ФОНОВА СИНХРОНІЗАЦІЯ:
 * Відправляє дані на сервер, не блокуючи роботу інтерфейсу.
 */
async function triggerServerSync(key, payload) {
    if (!state.userId || !state.token) return;

    try {
        const response = await fetch(`${API_BASE}/${state.userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            credentials: 'omit',
            body: JSON.stringify({ storageKey: key, payload })
        });

        if (!response.ok) throw new Error(`Server status: ${response.status}`);
        console.log(`[Cloud] ${key} synced successfully.`);
    } catch (err) {
        console.error(`[Cloud Sync Error] ${key}:`, err.message);
        // Тут можна додати логіку черги (retry), якщо сервер ліг
    }
}

/**
 * ПЕРЕВІРКА ТА ОНОВЛЕННЯ ДАНИХ (STARTUP):
 * Викликається в app.js. Отримує "свіжі" дані з сервера і оновлює кеш.
 */
export async function fetchInitialData(userId, token) {
    state.userId = userId;
    state.token = token;

    try {
        const response = await fetch(`${API_BASE}/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Cloud unreachable');

        const cloudData = await response.json();

        if (cloudData) {
            let hasChanges = false;

            // Звіряємо та оновлюємо розрахунки (calc)
            if (cloudData.fuel_calc_v3 && Object.keys(cloudData.fuel_calc_v3).length > 0) {
                state.calc = cloudData.fuel_calc_v3;
                localStorage.setItem('fuel_calc_v3', JSON.stringify(state.calc));
                if (state.calc.sex) state.sex = state.calc.sex;
                hasChanges = true;
            }

            // Звіряємо та оновлюємо календар (days)
            if (cloudData.fuel_days_v3 && Object.keys(cloudData.fuel_days_v3).length > 0) {
                state.days = cloudData.fuel_days_v3;
                localStorage.setItem('fuel_days_v3', JSON.stringify(state.days));
                hasChanges = true;
            }

            if (hasChanges) console.log('[Cloud] Local cache updated from server.');
        }
    } catch (err) {
        console.warn('[Cloud] Using offline mode (cache only):', err.message);
    }
}

/**
 * ЗБЕРЕЖЕННЯ ДНІВ:
 * Пишемо в стейт, в кеш і відправляємо на сервер одночасно.
 */
export function saveDaysToCache(newDays) {
    state.days = newDays;
    localStorage.setItem('fuel_days_v3', JSON.stringify(newDays));
    triggerServerSync('fuel_days_v3', newDays);
}

/**
 * ЗБЕРЕЖЕННЯ РОЗРАХУНКІВ:
 * Пишемо в стейт, в кеш і відправляємо на сервер одночасно.
 */
export function saveCalcToCache(newCalc) {
    state.calc = newCalc;
    if (newCalc.sex) state.sex = newCalc.sex;
    
    localStorage.setItem('fuel_calc_v3', JSON.stringify(newCalc));
    triggerServerSync('fuel_calc_v3', newCalc);
}

// Конфігураційні константи
export const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];
export const DAYS_S = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const DAYS_F = [
    'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
];