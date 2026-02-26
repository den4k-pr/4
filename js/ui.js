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

export function showMessage(text, type) {
    elements.msgBox.textContent = text;
    elements.msgBox.className = `show ${type}`;
}

export function hideMessage() {
    elements.msgBox.className = '';
}

export function setLoading(isLoading) {
    elements.submitBtn.disabled = isLoading;
    elements.btnText.style.display = isLoading ? 'none' : 'block';
    elements.btnLoader.style.display = isLoading ? 'block' : 'none';
}

export function switchMode(isLoginMode) {
    hideMessage();
    if (isLoginMode) {
        elements.tabLogin.classList.add('active');
        elements.tabRegister.classList.remove('active');
        elements.title.textContent = 'Welcome Back';
        elements.sub.textContent = 'Enter your details to access your account';
        elements.btnText.textContent = 'Sign In';
        elements.groupConfirm.classList.add('hidden');
        elements.confirmPass.removeAttribute('required');
    } else {
        elements.tabRegister.classList.add('active');
        elements.tabLogin.classList.remove('active');
        elements.title.textContent = 'Create Account';
        elements.sub.textContent = 'Join Adlyzerra to start tracking';
        elements.btnText.textContent = 'Sign Up';
        elements.groupConfirm.classList.remove('hidden');
        elements.confirmPass.setAttribute('required', 'true');
    }
}