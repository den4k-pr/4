// Початковий стан
export let state = {
    sex: 'male',
    days: JSON.parse(localStorage.getItem('fuel_days_v3') || '{}'),
    calc: JSON.parse(localStorage.getItem('fuel_calc_v3') || '{}'),
    curMonth: new Date().getMonth(),
    curYear: new Date().getFullYear(),
    mDate: null,
    mStatus: null
};

// ТРИГЕР ДЛЯ СЕРВЕРА (викликається при кожному записі)
async function triggerServerSync(key, data) {
    console.log(`Trigger: Data updated [${key}]. Ready for server sync.`);
    // Тут в майбутньому пропишете fetch/axios до сервера
}

export function saveDaysToCache(newDays) {
    state.days = newDays;
    localStorage.setItem('fuel_days_v3', JSON.stringify(state.days));
    triggerServerSync('days', state.days);
}

export function saveCalcToCache(newCalc) {
    state.calc = newCalc;
    localStorage.setItem('fuel_calc_v3', JSON.stringify(state.calc));
    triggerServerSync('calc', state.calc);
}

export const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
export const DAYS_S = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const DAYS_F = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];