import { createGeminiUI } from '../common/ui';

async function init() {
    document.body.classList.add('is-popup');
    
    // In popup, we try to get selection from the active tab if possible
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    let context = "";
    try {
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString() || document.body.innerText.substring(0, 10000)
        });
        context = result[0].result;
    } catch (e) {
        console.error("Could not get context from tab", e);
    }

    createGeminiUI(document.body, {
        isModal: false,
        context: context
    });
}

init();
