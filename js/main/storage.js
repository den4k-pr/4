// storage.js

const API_BASE = 'https://serv-production-2768.up.railway.app/api/sync';

/**
 * ============================
 * HELPERS
 * ============================
 */

const log = (...args) => console.log('%c[Storage]', 'color:#4CAF50', ...args);
const warn = (...args) => console.warn('%c[Storage]', 'color:#FF9800', ...args);
const error = (...args) => console.error('%c[Storage]', 'color:#F44336', ...args);

function readCache(key, fallback = {}) {
    const raw = localStorage.getItem(key);
    log(`Reading cache key="${key}"`, raw);

    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        error(`Failed to parse cache key="${key}"`, e);
        return fallback;
    }
}

function writeCache(key, value) {
    log(`Writing cache key="${key}"`, value);
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * ============================
 * STATE (INIT FROM CACHE)
 * ============================
 * Ініціалізується миттєво з localStorage,
 * щоб UI не розвалився при старті.
 */

const cachedCalc = readCache('fuel_calc_v3', {});
const cachedDays = readCache('fuel_days_v3', {});

export let state = {
    sex: cachedCalc.sex || 'male',
    days: cachedDays,
    calc: cachedCalc,
    curMonth: new Date().getMonth(),
    curYear: new Date().getFullYear(),
    mDate: null,
    mStatus: null,
    performer: localStorage.getItem('currentPerformer') || 'default',
    userId: null,
    token: null
};

log('Initial state hydrated from cache:', structuredClone(state));

/**
 * ============================
 * BACKGROUND CLOUD SYNC
 * ============================
 * Відправляє дані на сервер,
 * не блокуючи UI
 */

async function triggerServerSync(key, payload) {
    if (!state.userId || !state.token) {
        console.warn('[Sync] No userId or token, skipping server sync');
        return;
    }

    console.log('[Sync] Sending to server:', { storageKey: key, payload }); // ПЕРЕВІР ЦЕ В КОНСОЛІ

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

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Server status: ${response.status}`);
        }
        console.log(`[Cloud] ${key} synced.`);
    } catch (err) {
        console.error(`[Cloud Sync Error]`, err.message);
    }
}

/**
 * ============================
 * FETCH INITIAL DATA (STARTUP)
 * ============================
 * Тягнемо свіжі дані з сервера
 * і оновлюємо локальний кеш
 */

export async function fetchInitialData(userId, token) {
    log('Initial cloud fetch started', { userId });

    state.userId = userId;
    state.token = token;

    try {
        const response = await fetch(`${API_BASE}/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const cloudData = await response.json();
        log('Cloud data received', cloudData);

        if (!cloudData) {
            warn('Cloud returned empty payload');
            return;
        }

        let hasChanges = false;

        /**
         * ---- CALC ----
         */
        if (
            cloudData.fuel_calc_v3 &&
            Object.keys(cloudData.fuel_calc_v3).length > 0
        ) {
            log('Updating calc from cloud', cloudData.fuel_calc_v3);

            state.calc = cloudData.fuel_calc_v3;
            writeCache('fuel_calc_v3', state.calc);

            if (state.calc.sex) {
                state.sex = state.calc.sex;
                log('Sex updated from calc', state.sex);
            }

            hasChanges = true;
        } else {
            log('Cloud calc empty → keeping local cache');
        }

        /**
         * ---- DAYS ----
         */
        if (
            cloudData.fuel_days_v3 &&
            Object.keys(cloudData.fuel_days_v3).length > 0
        ) {
            log('Updating days from cloud', cloudData.fuel_days_v3);

            state.days = cloudData.fuel_days_v3;
            writeCache('fuel_days_v3', state.days);

            hasChanges = true;
        } else {
            log('Cloud days empty → keeping local cache');
        }

        if (hasChanges) {
            log('Local cache updated from cloud');
            log('Current state after sync:', structuredClone(state));
        } else {
            log('No cloud changes applied');
        }

    } catch (err) {
        warn('Cloud unreachable → offline mode', err.message);
    }
}

/**
 * ============================
 * SAVE DAYS
 * ============================
 */

export function saveDaysToCache(newDays) {
    log('saveDaysToCache called', newDays);

    state.days = newDays;
    writeCache('fuel_days_v3', newDays);

    triggerServerSync('fuel_days_v3', newDays);

    log('Days saved. Current state.days:', structuredClone(state.days));
}

/**
 * ============================
 * SAVE CALC
 * ============================
 */

export function saveCalcToCache(newCalc) {
    log('saveCalcToCache called', newCalc);

    state.calc = newCalc;

    if (newCalc.sex) {
        state.sex = newCalc.sex;
        log('Sex updated from calc save', state.sex);
    }

    writeCache('fuel_calc_v3', newCalc);
    triggerServerSync('fuel_calc_v3', newCalc);

    log('Calc saved. Current state.calc:', structuredClone(state.calc));
}

/**
 * ============================
 * CONSTANTS
 * ============================
 */

export const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

export const DAYS_S = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export const DAYS_F = [
    'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
];