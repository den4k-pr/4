// main.js
import { state, fetchInitialData } from './storage.js';
import * as ui from './ui.js';

// Глобальні прив'язки для HTML
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

// Цю функцію викличе app.js
export async function startAppLogic(user, token) {
    // 1. Чекаємо дані з сервера
    await fetchInitialData(user._id, token);

    // 2. Рендеримо інтерфейс на основі завантаженого state
    if (state.calc.weight) {
        document.getElementById('age').value = state.calc.age || '';
        document.getElementById('height').value = state.calc.height || '';
        document.getElementById('weight').value = state.calc.weight || '';
        document.getElementById('goal-weight').value = state.calc.goal || '';
        
        if (state.calc.sex === 'female') {
            state.sex = 'female';
            const btns = document.querySelectorAll('.seg-btn');
            btns[0].classList.remove('on'); btns[1].classList.add('on');
        }

        ui.renderIdealPanel(state.calc.height, state.calc.weight, state.calc.goal, state.calc.age, state.calc.sex || 'male');
        document.getElementById('ideal-panel').style.display = 'block';
        document.getElementById('ideal-panel').classList.add('in');
        document.getElementById('results').style.display = 'block';
        
        ui.updateProgress();
    }

    ui.renderTracker();
    ui.checkReveal();
    
    window.addEventListener('scroll', ui.checkReveal);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') ui.closeModal();
        if (e.key === 'Enter' && !document.getElementById('overlay').classList.contains('open')) ui.calculate();
    });
}