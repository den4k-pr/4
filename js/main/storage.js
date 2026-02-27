// storage.js

const API_BASE = 'http://localhost:3000/api/sync';

export let state = {
    sex: 'male',
    days: JSON.parse(localStorage.getItem('fuel_days_v3') || '{}'),
    calc: JSON.parse(localStorage.getItem('fuel_calc_v3') || '{}'),
    curMonth: new Date().getMonth(),
    curYear: new Date().getFullYear(),
    mDate: null,
    mStatus: null,
    // Додаємо поля для зберігання сесії
    userId: null,
    token: null
};

// ТРИГЕР: Відправка на сервер з JWT
async function triggerServerSync(key, data) {
    if (!state.userId || !state.token) return;

    try {
        await fetch(`${API_BASE}/${state.userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}` // Твій JWT токен
            },
            body: JSON.stringify({
                storageKey: key,
                payload: data
            })
        });
        console.log(`[Sync] ${key} synced to server.`);
    } catch (err) {
        console.error('[Sync Error]:', err);
    }
}

// Завантаження даних при старті
export async function fetchInitialData(userId, token) {
    state.userId = userId;
    state.token = token;

    try {
        const response = await fetch(`${API_BASE}/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data) {
            if (data.fuel_calc_v3 && Object.keys(data.fuel_calc_v3).length > 0) {
                state.calc = data.fuel_calc_v3;
                localStorage.setItem('fuel_calc_v3', JSON.stringify(state.calc));
            }
            if (data.fuel_days_v3 && Object.keys(data.fuel_days_v3).length > 0) {
                state.days = data.fuel_days_v3;
                localStorage.setItem('fuel_days_v3', JSON.stringify(state.days));
            }
        }
    } catch (err) {
        console.warn('[Sync] Could not fetch data, using local storage.');
    }
}

export function saveDaysToCache(newDays) {
    state.days = newDays;
    localStorage.setItem('fuel_days_v3', JSON.stringify(state.days));
    triggerServerSync('fuel_days_v3', state.days);
}

export function saveCalcToCache(newCalc) {
    state.calc = newCalc;
    localStorage.setItem('fuel_calc_v3', JSON.stringify(state.calc));
    triggerServerSync('fuel_calc_v3', state.calc);
}

export const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
export const DAYS_S = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const DAYS_F = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];