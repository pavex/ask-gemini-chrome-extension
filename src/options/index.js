import { getSettings, saveSettings } from '../common/storage';

const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const systemPromptInput = document.getElementById('systemPrompt');
const modalScaleInput = document.getElementById('modalScale');
const promptsList = document.getElementById('promptsList');
const addPromptBtn = document.getElementById('addPrompt');
const saveBtn = document.getElementById('save');
const snackbar = document.getElementById('snackbar');

let currentPrompts = [];

function showSnackbar(message) {
    snackbar.textContent = message;
    snackbar.className = 'snackbar show';
    setTimeout(() => { 
        snackbar.className = 'snackbar';
    }, 3000);
}

function renderPrompts() {
    promptsList.innerHTML = '';
    currentPrompts.forEach((prompt, index) => {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <input type="text" value="${prompt.name}" placeholder="Prompt Name" class="prompt-name" data-index="${index}" style="margin-bottom: 0; flex-grow: 1; margin-right: 10px;">
                <button class="gemini-btn gemini-btn-danger remove-btn" data-index="${index}" title="Remove prompt" style="padding: 4px 10px; font-size: 18px; line-height: 1;">&times;</button>
            </div>
            <textarea placeholder="Prompt Text" class="prompt-text" data-index="${index}">${prompt.text}</textarea>
        `;
        promptsList.appendChild(div);
    });
}

async function load() {
    const settings = await getSettings();
    apiKeyInput.value = settings.apiKey;
    modelInput.value = settings.model;
    systemPromptInput.value = settings.systemPrompt || '';
    modalScaleInput.value = settings.modalScale || '1';
    currentPrompts = settings.prompts;
    renderPrompts();
    loadShortcuts();
}

async function loadShortcuts() {
    chrome.commands.getAll((commands) => {
        const command = commands.find(c => c.name === "open-gemini-chat");
        if (command && command.shortcut) {
            document.getElementById('current-shortcut').textContent = command.shortcut;
        }
    });
}

document.getElementById('manage-shortcuts').onclick = (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
};

addPromptBtn.addEventListener('click', () => {
    currentPrompts.push({ name: 'New Prompt', text: '' });
    renderPrompts();
});

promptsList.addEventListener('input', (e) => {
    const index = e.target.dataset.index;
    if (e.target.classList.contains('prompt-name')) {
        currentPrompts[index].name = e.target.value;
    } else if (e.target.classList.contains('prompt-text')) {
        currentPrompts[index].text = e.target.value;
    }
});

promptsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const index = e.target.dataset.index;
        currentPrompts.splice(index, 1);
        renderPrompts();
    }
});

saveBtn.addEventListener('click', async () => {
    await saveSettings({
        apiKey: apiKeyInput.value,
        model: modelInput.value,
        systemPrompt: systemPromptInput.value,
        modalScale: modalScaleInput.value,
        prompts: currentPrompts
    });
    showSnackbar('Settings saved successfully!');
});

load();
