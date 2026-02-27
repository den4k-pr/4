import { state, saveDaysToCache, saveCalcToCache, MONTHS, DAYS_S, DAYS_F } from './storage.js';
import { idealWeights, bmi, bmiCategory } from './formulas.js';

export function setSex(s, btn) {
    state.sex = s;
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

export function calculate() {
    const age = parseFloat(document.getElementById('age').value);
    const h = parseFloat(document.getElementById('height').value);
    const w = parseFloat(document.getElementById('weight').value);
    const goal = parseFloat(document.getElementById('goal-weight').value);
    const act = parseFloat(document.getElementById('activity').value);
    const def = parseFloat(document.getElementById('deficit').value);

    if (!age || !h || !w || !goal) { shakeEmpty(); return; }

    const bmr = state.sex === 'male' ? 10*w + 6.25*h - 5*age + 5 : 10*w + 6.25*h - 5*age - 161;
    const tdee = Math.round(bmr * act);
    const defCals = Math.round(tdee - def);

    const bmrGoal = state.sex === 'male' ? 10*goal + 6.25*h - 5*age + 5 : 10*goal + 6.25*h - 5*age - 161;
    const tdeeGoal = Math.round(bmrGoal * act);
    const prot = Math.round(goal * 2.0);
    const fat = Math.round(goal * 0.9);
    const carb = Math.max(Math.round((tdeeGoal - prot*4 - fat*9) / 4), 50);
    const toLose = Math.max(w - goal, 0);

    const newCalc = { age, height: h, weight: w, goal, sex: state.sex, tdee, tdeeGoal, def, defCals, prot, fat, carb, toLose };
    saveCalcToCache(newCalc);

    document.getElementById('r-cals').textContent = defCals;
    document.getElementById('r-prot').textContent = prot;
    document.getElementById('r-fat').textContent = fat;
    document.getElementById('r-carb').textContent = carb;
    document.getElementById('r-info').textContent = `Current TDEE: ${tdee} kcal · Maintenance for goal weight: ${tdeeGoal} kcal · Need to lose: ${toLose} kg × 8,000 kcal/kg = ${Math.round(toLose*8000).toLocaleString()} kcal total`;

    renderIdealPanel(h, w, goal, age, state.sex);
    updateProgress();

    const rd = document.getElementById('results');
    rd.style.display = 'block';
    const ip = document.getElementById('ideal-panel');
    ip.style.display = 'block';
    requestAnimationFrame(() => {
        ip.classList.add('in');
        rd.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), i*80));
    });
    renderTracker();
}

export function renderIdealPanel(h, w, goal, age, s) {
    const ideal = idealWeights(h, s, age);
    const bmiVal = bmi(w, h);
    const cat = bmiCategory(bmiVal);
    const bmiGoalVal = bmi(goal, h);

    const badge = document.getElementById('bmi-badge');
    badge.textContent = `BMI ${bmiVal.toFixed(1)} · ${cat.label}`;
    badge.style.borderColor = cat.color;
    badge.style.color = cat.color;
    badge.style.background = cat.color + '18';

    function bmiToPos(b) {
        if (b <= 18.5) return Math.max(0, (b / 18.5) * 18);
        if (b <= 25)   return 18 + ((b - 18.5) / 6.5) * 40;
        if (b <= 30)   return 58 + ((b - 25) / 5) * 18;
        if (b <= 35)   return 76 + ((b - 30) / 5) * 15;
        return Math.min(100, 91 + ((b - 35) / 5) * 9);
    }
    const pct = bmiToPos(bmiVal);
    const ptr = document.getElementById('bmi-pointer');
    ptr.style.left = pct + '%';
    ptr.textContent = bmiVal.toFixed(1);

    const boxes = [
        { label: 'Devine Formula', val: ideal.devine, sub: 'Clinical standard' },
        { label: 'Robinson Formula', val: ideal.robinson, sub: 'Adjusted Devine' },
        { label: 'Miller Formula', val: ideal.miller, sub: 'Conservative' },
        { label: 'BMI Midpoint', val: Math.round((ideal.bmiRange[0] + ideal.bmiRange[1]) / 2), sub: `Range ${ideal.bmiRange[0]}–${ideal.bmiRange[1]} kg` },
    ];

    const grid = document.getElementById('ideal-grid');
    grid.innerHTML = boxes.map(b => {
        const isRec = Math.abs(b.val - ideal.recommended) <= 2;
        return `<div class="ideal-box ${isRec ? 'recommended' : ''}" onclick="applyIdeal(${b.val})" title="Click to set as goal">
          <div class="ideal-box-val">${b.val} kg</div>
          <div class="ideal-box-label">${b.label}</div>
          <div class="ideal-box-sub">${b.sub}</div>
        </div>`;
    }).join('');

    const diff = +(w - ideal.recommended).toFixed(1);
    const bmiGoalCat = bmiCategory(bmiGoalVal);
    const rec = document.getElementById('rec-box');

    let recTitle, recText;
    if (Math.abs(diff) < 1) {
        recTitle = '🎯 YOU\'RE ALREADY AT YOUR IDEAL WEIGHT';
        recText = `Your current weight of ${w} kg is right on target for your height. Focus on body composition — lean mass and fat percentage matter more than the scale at this point.`;
    } else if (diff > 0) {
        const kcalNeeded = Math.round(diff * 8000);
        const daysAt500 = Math.ceil(kcalNeeded / 500);
        recTitle = `📉 RECOMMENDATION: LOSE ${diff} kg`;
        recText = `Based on your height (${h} cm) and age (${age}), your <strong>recommended ideal weight is ${ideal.recommended} kg</strong>. That's ${diff} kg to lose. Your goal weight of ${goal} kg puts you in the <strong>${bmiGoalCat.label}</strong>.`;
    } else {
        recTitle = `📈 BELOW IDEAL WEIGHT`;
        recText = `Your recommended weight is ${ideal.recommended} kg. Make sure your goal weight of ${goal} kg is healthy.`;
    }
    rec.innerHTML = `<div class="rec-title">${recTitle}</div><div class="rec-text">${recText}</div>`;
}

export function applyIdeal(kg) {
    document.getElementById('goal-weight').value = kg;
    document.getElementById('goal-weight').style.borderColor = 'var(--accent)';
    setTimeout(() => { document.getElementById('goal-weight').style.borderColor = ''; }, 800);
}

export function updateProgress() {
    if (!state.calc.def) return;
    const { toLose = 0, def, tdee = 0, weight = 0, goal = 0 } = state.calc;

    let totalDef = 0, daysLogged = 0;
    Object.values(state.days).forEach(d => {
        if (!d || d.status === 'miss') return;
        if (d.eaten != null && tdee) { totalDef += tdee - d.eaten; daysLogged++; }
        else if (d.status === 'done') { totalDef += def; daysLogged++; }
    });

    const kgLost = Math.max(totalDef / 8000, 0);
    const kgRemain = Math.max(toLose - kgLost, 0);
    const pct = toLose > 0 ? Math.min(Math.round(kgLost / toLose * 100), 100) : (kgLost > 0 ? 100 : 0);
    const avgDef = daysLogged > 0 ? totalDef / daysLogged : def;
    const daysLeft = kgRemain > 0 && avgDef > 0 ? Math.ceil(kgRemain * 8000 / avgDef) : 0;

    document.getElementById('prog-pct').textContent = pct + '%';
    document.getElementById('bar-start').textContent = weight + ' kg';
    document.getElementById('bar-goal').textContent = goal + ' kg';
    document.getElementById('bar-mid').textContent = kgLost > 0.001 ? `−${kgLost.toFixed(2)} kg` : '';
    setTimeout(() => { document.getElementById('bar-fill').style.width = pct + '%'; }, 100);

    document.getElementById('rp-lost').textContent = kgLost.toFixed(3);
    document.getElementById('rp-total-def').textContent = totalDef > 0 ? Math.round(totalDef).toLocaleString() : '0';
    document.getElementById('rp-remain').textContent = kgRemain.toFixed(2);

    const C = 2 * Math.PI * 35;
    const rPct = toLose > 0 ? Math.min(kgLost / toLose, 1) : (kgLost > 0 ? 1 : 0);
    const ring = document.getElementById('ring-fg');
    ring.setAttribute('stroke-dasharray', C);
    ring.style.strokeDashoffset = C * (1 - rPct);

    document.getElementById('cd-days').textContent = daysLeft > 0 ? daysLeft : (kgLost >= toLose && toLose > 0 ? '🎯' : '—');
    document.getElementById('cd-title').textContent = daysLeft > 0 ? 'DAYS TO GOAL' : 'GOAL REACHED!';
    
    if (daysLeft > 0 && avgDef > 0) {
        const finish = new Date();
        finish.setDate(finish.getDate() + daysLeft);
        document.getElementById('cd-desc').textContent = `Avg real deficit: ${Math.round(avgDef)} kcal/day · Est. finish: ${finish.toLocaleDateString('en-GB')}`;
    }

    updateStats();
}

export function renderTracker() {
    const today = new Date();
    const todayStr = ds(today);

    document.getElementById('cal-header').innerHTML = DAYS_S.map(d => `<div class="cal-hcell">${d}</div>`).join('');

    const first = new Date(state.curYear, state.curMonth, 1);
    let dow = first.getDay();
    dow = dow === 0 ? 6 : dow - 1;
    const dim = new Date(state.curYear, state.curMonth + 1, 0).getDate();
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    for (let i = 0; i < dow; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;

    for (let d = 1; d <= dim; d++) {
        const date = new Date(state.curYear, state.curMonth, d);
        const key = ds(date);
        const isToday = key === todayStr;
        const isFut = date > today && !isToday;
        const entry = state.days[key];

        let cls = 'cal-day';
        if (isFut) cls += ' future';
        else if (entry?.status === 'done') cls += ' done';
        else if (entry?.status === 'partial') cls += ' partial';
        else if (entry?.status === 'miss') cls += ' miss';
        if (isToday) cls += ' today';

        let badge = '';
        if (!isFut && entry) {
            if (entry.eaten != null && state.calc.tdee) {
                const def = state.calc.tdee - entry.eaten;
                badge = `<span class="day-def">${def >= 0 ? '+' : ''}${Math.round(def/10)*10}</span>`;
            } else if (entry.status === 'done') badge = `<span class="day-def">✓</span>`;
            else if (entry.status === 'miss') badge = `<span class="day-def" style="color:#ff4455">✕</span>`;
        }

        const click = isFut ? '' : `onclick="openModal('${key}')"`;
        grid.innerHTML += `<div class="${cls}" ${click}><span class="day-n">${d}</span>${badge}</div>`;
    }

    document.getElementById('month-label').textContent = `${MONTHS[state.curMonth]} ${state.curYear}`;
    updateStats();
}

export function chMonth(dir) {
    state.curMonth += dir;
    if (state.curMonth > 11) { state.curMonth = 0; state.curYear++; }
    if (state.curMonth < 0) { state.curMonth = 11; state.curYear--; }
    renderTracker();
}

export function ds(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function updateStats() {
    const today = new Date();
    let streak = 0, chk = new Date(today);
    while (true) {
        const s = state.days[ds(chk)]?.status;
        if (s === 'done' || s === 'partial') { streak++; chk.setDate(chk.getDate()-1); }
        else break;
    }
    const total = Object.values(state.days).filter(d => d?.status === 'done' || d?.status === 'partial').length;
    let sumD = 0, cnt = 0;
    Object.values(state.days).forEach(d => {
        if (d?.eaten != null && state.calc.tdee) { sumD += state.calc.tdee - d.eaten; cnt++; }
    });
    const avg = cnt > 0 ? Math.round(sumD / cnt) : 0;
    const mKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
    const done = Object.keys(state.days).filter(k => k.startsWith(mKey) && (state.days[k]?.status === 'done' || state.days[k]?.status === 'partial')).length;
    const rate = Math.round(done / today.getDate() * 100);

    document.getElementById('streak-num').textContent = streak;
    document.getElementById('ts-streak').textContent = streak;
    document.getElementById('ts-total').textContent = total;
    document.getElementById('ts-avg').textContent = avg !== 0 ? avg : '—';
    document.getElementById('ts-rate').textContent = rate + '%';

    const tips = ['Tap any past day to log calories.', `🔥 ${streak}-day streak!`, 'Consistency beats intensity.'];
    document.getElementById('tip-text').textContent = tips[Math.floor(Math.random() * tips.length)];
}

export function openModal(key) {
    state.mDate = key;
    const e = state.days[key] || {};
    state.mStatus = e.status || null;

    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m-1, d);
    document.getElementById('m-date').textContent = `${d} ${MONTHS[m-1]} ${y}`;
    document.getElementById('m-dow').textContent = DAYS_F[date.getDay() === 0 ? 6 : date.getDay()-1];

    renderStatus(e.status || null);
    document.getElementById('m-eaten').value = e.eaten != null ? e.eaten : '';

    const note = document.getElementById('m-note');
    if (state.calc.defCals) {
        note.style.display = 'block';
        note.innerHTML = `Your target: <span>${state.calc.defCals} kcal</span> · TDEE: <span>${state.calc.tdee} kcal</span>`;
    } else { note.style.display = 'none'; }

    recalcM();
    document.getElementById('overlay').classList.add('open');
    setTimeout(() => document.getElementById('m-eaten').focus(), 280);
}

export function closeModal() {
    document.getElementById('overlay').classList.remove('open');
    state.mDate = null;
}

export function renderStatus(s) {
    ['done','partial','miss'].forEach(id => {
        document.getElementById('sb-' + id).className = 'status-btn' + (s === id ? ` on-${id}` : '');
    });
}

export function setStatus(s) {
    state.mStatus = s;
    renderStatus(s);
}

export function recalcM() {
    const eaten = parseFloat(document.getElementById('m-eaten').value);
    const tdee = state.calc.tdee;
    if (!isNaN(eaten) && tdee) {
        const def = tdee - eaten;
        const el = document.getElementById('m-def');
        el.textContent = (def >= 0 ? '+' : '') + Math.round(def);
        el.className = 'rs-val ' + (def >= 0 ? 'pos' : 'neg');
        document.getElementById('m-fat-g').textContent = (def / 8).toFixed(1);
        document.getElementById('m-fat-kg').textContent = (def / 8000).toFixed(4);
        if (!state.mStatus) {
            if (def >= (state.calc.def || 400) * 0.9) setStatus('done');
            else if (def > 0) setStatus('partial');
            else setStatus('miss');
        }
    } else {
        ['m-def','m-fat-g','m-fat-kg'].forEach(id => document.getElementById(id).textContent = '—');
    }
}

export function saveDay() {
    if (!state.mDate) return;
    const eaten = parseFloat(document.getElementById('m-eaten').value);
    state.days[state.mDate] = { status: state.mStatus || 'done', eaten: isNaN(eaten) ? null : eaten };
    saveDaysToCache(state.days);
    closeModal();
    renderTracker();
    updateProgress();
}

export function confirmReset() {
    if (confirm('Reset all tracker data?')) {
        saveDaysToCache({});
        renderTracker();
        updateProgress();
    }
}

export function shakeEmpty() {
    ['age','height','weight','goal-weight'].forEach(id => {
        const el = document.getElementById(id);
        if (!el.value) {
            el.style.borderColor = 'var(--red)';
            el.style.animation = 'shake .35s ease';
            setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 700);
        }
    });
}

export function checkReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 30) el.classList.add('in');
    });
}