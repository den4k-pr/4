// main.js
import { state } from './storage.js';
import * as ui from './ui.js';

// ПРИВ'ЯЗКА ФУНКЦІЙ ДО WINDOW
window.setSex = ui.setSex;
window.calculate = ui.calculate;
window.applyIdeal = ui.applyIdeal;
window.chMonth = ui.chMonth;
window.openModal = ui.openModal;
window.closeModal = ui.closeModal;
window.setStatus = ui.setStatus;
window.recalcM = ui.recalcM;
window.saveDay = ui.saveDay;
window.confirmReset = ui.confirmReset;
window.bgClose = (e) => { if (e.target === document.getElementById('overlay')) ui.closeModal(); };

/**
 * Головна функція запуску інтерфейсу.
 * Її ми викликаємо з app.js ПІСЛЯ fetchInitialData.
 */
export function initAppUI() {
    // 1. Заповнюємо поля вводу з актуального state (вже синхронізованого з сервером)
    if (state.calc.weight) {
        document.getElementById('age').value = state.calc.age || '';
        document.getElementById('height').value = state.calc.height || '';
        document.getElementById('weight').value = state.calc.weight || '';
        document.getElementById('goal-weight').value = state.calc.goal || '';
        
        // Візуально перемикаємо стать
        if (state.calc.sex === 'female') {
            state.sex = 'female';
            const btns = document.querySelectorAll('.seg-btn');
            btns[0].classList.remove('on'); btns[1].classList.add('on');
        }

        // Оновлюємо текстові результати
        document.getElementById('r-cals').textContent = state.calc.defCals || '—';
        document.getElementById('r-prot').textContent = state.calc.prot || '—';
        document.getElementById('r-fat').textContent = state.calc.fat || '—';
        document.getElementById('r-carb').textContent = state.calc.carb || '—';

        // Рендеримо панелі
        ui.renderIdealPanel(state.calc.height, state.calc.weight, state.calc.goal, state.calc.age, state.calc.sex || 'male');
        document.getElementById('ideal-panel').style.display = 'block';
        document.getElementById('ideal-panel').classList.add('in');
        document.getElementById('results').style.display = 'block';
        
        ui.updateProgress();
    }

    // 2. Малюємо трекер
    ui.renderTracker();
    ui.checkReveal();

    // 3. Навішуємо глобальні слухачі (тільки один раз)
    if (!window.appInitialized) {
        window.addEventListener('scroll', ui.checkReveal);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') ui.closeModal();
            if (e.key === 'Enter' && !document.getElementById('overlay').classList.contains('open')) ui.calculate();
        });
        window.appInitialized = true;
    }
}