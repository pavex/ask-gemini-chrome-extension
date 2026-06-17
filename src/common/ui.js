import { getSettings } from '../common/storage';
import { marked } from 'marked';

export async function createGeminiUI(container, options = {}) {
    const isModal = options.isModal || false;
    const initialContext = options.context || '';
    
    const settings = await getSettings();

    const html = `
        <dialog id="gemini-quick-ask-dialog">
            <div class="gemini-container">
                <div class="gemini-header">
                    <h2>Gemini Quick Ask</h2>
                    <a href="#" class="gemini-settings-link" id="gemini-open-settings">Settings</a>
                </div>

                <div id="gemini-chat-area">
                    <div class="gemini-msg gemini-msg-context">
                        <b>Selected Context:</b>
                        <div class="gemini-context-preview">${escapeHtml(initialContext)}</div>
                    </div>
                </div>

                <textarea id="gemini-user-input" placeholder="What would you like to know? (Ctrl+Enter to send)"></textarea>

                <div class="gemini-prompts-container" id="gemini-prompts-list"></div>

                <div class="gemini-footer">
                    ${isModal ? '<button class="gemini-btn" id="gemini-close-btn">Close</button>' : ''}
                    <button class="gemini-btn gemini-btn-primary" id="gemini-send-btn">Send</button>
                </div>
            </div>
        </dialog>
    `;

    container.insertAdjacentHTML('beforeend', html);
    const dialog = container.querySelector('#gemini-quick-ask-dialog');
    
    if (isModal) {
        const scale = settings.modalScale || '1';
        
        // Ensure absolute centering even with scaling
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.margin = '0';
        
        if (scale !== '1') {
            dialog.style.transform = `translate(-50%, -50%) scale(${scale})`;
        } else {
            dialog.style.transform = `translate(-50%, -50%)`;
        }

        dialog.showModal();
        
        // Close when clicking on the backdrop
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dialog.close();
            }
        };
    } else {
        dialog.setAttribute('open', '');
    }

    setupEventListeners(dialog, initialContext, isModal);
    renderPrompts(dialog, initialContext);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function renderPrompts(dialog, context) {
    const settings = await getSettings();
    const container = dialog.querySelector('#gemini-prompts-list');
    const input = dialog.querySelector('#gemini-user-input');

    settings.prompts.forEach(prompt => {
        const btn = document.createElement('button');
        btn.className = 'gemini-prompt-btn';
        btn.textContent = prompt.name;
        btn.onclick = () => {
            input.value = prompt.text;
            const sendBtn = dialog.querySelector('#gemini-send-btn');
            sendBtn.click();
        };
        container.appendChild(btn);
    });
}

async function setupEventListeners(dialog, context, isModal) {
    const sendBtn = dialog.querySelector('#gemini-send-btn');
    const closeBtn = dialog.querySelector('#gemini-close-btn');
    const settingsBtn = dialog.querySelector('#gemini-open-settings');
    const input = dialog.querySelector('#gemini-user-input');
    const chatArea = dialog.querySelector('#gemini-chat-area');

    settingsBtn.onclick = (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: "openOptions" });
    };

    if (isModal && closeBtn) {
        closeBtn.onclick = () => {
            dialog.close();
            dialog.remove();
        };
        dialog.onclose = () => dialog.remove();
    }

    sendBtn.onclick = async () => {
        const prompt = input.value.trim();
        if (!prompt) return;

        chatArea.innerHTML += `<div class="gemini-msg gemini-msg-user"><b>You:</b> ${escapeHtml(prompt)}</div>`;
        input.value = '';
        sendBtn.disabled = true;
        chatArea.scrollTop = chatArea.scrollHeight;

        const thinkingId = 'gemini-thinking-' + Date.now();
        chatArea.innerHTML += `<div class="gemini-msg gemini-msg-ai" id="${thinkingId}"><i>Thinking...</i></div>`;
        
        // Scroll to the "Thinking..." message
        const thinkingMsgElement = document.getElementById(thinkingId);
        thinkingMsgElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            const settings = await getSettings();
            if (!settings.apiKey) {
                throw new Error("API Key missing. Go to Settings.");
            }

            const response = await callGemini(prompt, context, settings);
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.innerHTML = `<b>Gemini:</b> <div class="gemini-response-content">${marked.parse(response)}</div>`;
                // Scroll to the beginning of this new response
                thinkingMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.style.color = 'red';
                thinkingMsg.innerHTML = `<b>Error:</b> ${escapeHtml(error.message)}`;
                thinkingMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } finally {
            sendBtn.disabled = false;
        }
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            sendBtn.click();
        }
    };
}

async function callGemini(prompt, context, settings) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
    
    const systemInstruction = settings.systemPrompt ? `${settings.systemPrompt}\n\n` : '';
    const fullPrompt = `${systemInstruction}Context: ${context}\n\nQuestion: ${prompt}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }]
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.candidates || data.candidates.length === 0) throw new Error("No response from Gemini.");
    return data.candidates[0].content.parts[0].text;
}
