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

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "openOptions") {
        chrome.runtime.openOptionsPage();
    }
});

function triggerGemini(tab, selectionText = null) {
    chrome.tabs.sendMessage(tab.id, {
        action: "trigger",
        selectionText: selectionText
    });
}
