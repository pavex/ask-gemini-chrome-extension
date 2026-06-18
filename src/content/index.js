import { createGeminiUI } from '../common/ui';

// In Manifest V3 with dynamic injection, we want to ensure we don't 
// add multiple listeners if the script is injected multiple times.
if (!window.geminiQuickAskInjected) {
    window.geminiQuickAskInjected = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "trigger") {
            const selection = request.selectionText || window.getSelection().toString();
            // If we don't have a selection, we fallback to page content
            const context = selection || document.body.innerText.substring(0, 10000);
            
            createGeminiUI(document.body, {
                isModal: true,
                context: context
            });
        }
    });
}
