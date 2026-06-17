const DEFAULT_PROMPTS = [
    { name: 'Summarize', text: 'Summarize the following text:' },
    { name: 'Explain', text: 'Explain the following content clearly:' },
    { name: 'Key Points', text: 'Extract the key points from this text:' }
];

export async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiKey', 'model', 'prompts', 'systemPrompt', 'modalScale'], (result) => {
            resolve({
                apiKey: result.apiKey || '',
                model: result.model || 'gemini-1.5-flash',
                prompts: result.prompts || DEFAULT_PROMPTS,
                systemPrompt: result.systemPrompt || '',
                modalScale: result.modalScale || '1'
            });
        });
    });
}

export async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.local.set(settings, () => {
            resolve();
        });
    });
}
