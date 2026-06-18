chrome.action.onClicked.addListener((tab) => {
    triggerGemini(tab);
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "ask-gemini",
        title: "Ask Gemini about this",
        contexts: ["selection", "page"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "ask-gemini") {
        triggerGemini(tab, info.selectionText);
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "open-gemini-chat") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                triggerGemini(tabs[0]);
            }
        });
    }
});

// Listener for messages from UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOptions") {
        chrome.runtime.openOptionsPage();
        return true;
    }
});

async function triggerGemini(tab, selectionText = null) {
    if (!tab.id || tab.url.startsWith('chrome://')) return;

    try {
        // 1. Inject CSS
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
        });

        // 2. Inject JS (Content Script)
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // 3. Send message to the newly injected script
        // We add a small delay to ensure the script has registered its listener
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
                action: "trigger",
                selectionText: selectionText
            }).catch(err => {
                console.error("Message delivery failed:", err);
            });
        }, 100);

    } catch (err) {
        console.error("Injection failed:", err);
    }
}
