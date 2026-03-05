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

/**
 * ============================
 * STATE (SERVER-ONLY)
 * ============================
 * Ініціалізується порожніми даними.
 */

export let state = {
    sex: 'male',
    days: {},
    calc: {},
    curMonth: new Date().getMonth(),
    curYear: new Date().getFullYear(),
    mDate: null,
    mStatus: null,
    performer: 'default',
    userId: null,
    token: null
};

log('Initial state (server-only):', structuredClone(state));

/**
 * ============================
 * BACKGROUND CLOUD SYNC
 * ============================
 * Відправляє дані на сервер,
 * не блокуючи UI
 */

async function triggerServerSync(key, payload) {
    if (!state.userId || !state.token) {
        warn('[Sync] No userId or token, skipping server sync');
        return;
    }

    log('[Sync] Sending to server:', { storageKey: key, payload });

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
        log(`[Cloud] ${key} synced.`);
    } catch (err) {
        error('[Cloud Sync Error]', err.message);
    }
}

/**
 * ============================
 * FETCH INITIAL DATA (STARTUP)
 * ============================
 * Тягнемо свіжі дані з сервера
 * і оновлюємо стан
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

        /**
         * ---- CALC ----
         */
        if (cloudData.fuel_calc_v3_zubalenok && Object.keys(cloudData.fuel_calc_v3_zubalenok).length > 0) {
            log('Updating calc from cloud', cloudData.fuel_calc_v3_zubalenok);

            state.calc = cloudData.fuel_calc_v3_zubalenok;

            if (state.calc.sex) {
                state.sex = state.calc.sex;
                log('Sex updated from calc', state.sex);
            }
        } else {
            log('Cloud calc empty → keeping default state');
        }

        /**
         * ---- DAYS ----
         */
        if (cloudData.fuel_days_v3_zubalenok && Object.keys(cloudData.fuel_days_v3_zubalenok).length > 0) {
            log('Updating days from cloud', cloudData.fuel_days_v3_zubalenok);

            state.days = cloudData.fuel_days_v3_zubalenok;
        } else {
            log('Cloud days empty → keeping default state');
        }

        log('State after initial fetch:', structuredClone(state));

    } catch (err) {
        warn('Cloud unreachable → offline mode', err.message);
    }
}

/**
 * ============================
 * SAVE DAYS
 * ============================
 */

export function saveDaysToServer(newDays) {
    log('saveDaysToServer called', newDays);

    state.days = newDays;

    triggerServerSync('fuel_days_v3_zubalenok', newDays);

    log('Days saved. Current state.days:', structuredClone(state.days));
}

/**
 * ============================
 * SAVE CALC
 * ============================
 */

export function saveCalcToServer(newCalc) {
    log('saveCalcToServer called', newCalc);

    state.calc = newCalc;

    if (newCalc.sex) {
        state.sex = newCalc.sex;
        log('Sex updated from calc save', state.sex);
    }

    triggerServerSync('fuel_calc_v3_zubalenok', newCalc);

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
