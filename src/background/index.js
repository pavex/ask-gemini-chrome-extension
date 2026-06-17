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

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOptions") {
        chrome.runtime.openOptionsPage();
        return true; // Keep the message channel open for async if needed
    }
});

function triggerGemini(tab, selectionText = null) {
    if (!tab.id) return;
    chrome.tabs.sendMessage(tab.id, {
        action: "trigger",
        selectionText: selectionText
    }).catch(err => {
        console.error("Could not send message to tab. Content script might not be loaded.", err);
    });
}
