/* ═══════════════════════════════════════════════
   AUTH LOGIC & API INTEGRATION - CONFIG
   ══════════════════════════════════════════════════ */

// ВАЖЛИВО: Оскільки в твоєму .env порт 9001, ми стукаємо туди
export const API_URL = 'https://serv-production-2768.up.railway.app/api/auth';

export const elements = {
    title: document.getElementById('header-title'),
    sub: document.getElementById('header-sub'),
    groupConfirm: document.getElementById('group-confirm'),
    confirmPass: document.getElementById('confirm-password'),
    btnText: document.getElementById('btn-text'),
    btnLoader: document.getElementById('btn-loader'),
    submitBtn: document.getElementById('submit-btn'),
    msgBox: document.getElementById('msg-box'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    form: document.getElementById('auth-form')
};

export let state = {
    isLoginMode: true
};