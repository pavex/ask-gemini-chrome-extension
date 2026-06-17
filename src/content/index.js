import { createGeminiUI } from '../common/ui';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "trigger") {
        const selection = request.selectionText || window.getSelection().toString();
        const context = selection || document.body.innerText.substring(0, 10000);
        
        createGeminiUI(document.body, {
            isModal: true,
            context: context
        });
    }
});
