// YUV.AI SocialBot Pro - Background Service Worker
class SocialBotBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeStats();
    }

    setupEventListeners() {
        // Handle installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.isSupportedSite(tab.url)) {
                this.injectContentScript(tabId);
            }
        });
    }

    async handleInstallation(details) {
        console.log('YUV.AI SocialBot Pro installed:', details.reason);
        
        // Initialize default settings
        const defaultSettings = {
            autoLikes: false,
            autoComments: false,
            linkedinEnabled: true,
            facebookEnabled: false,
            stats: {
                totalLikes: 0,
                totalComments: 0,
                sessionTime: 0,
                sessionStart: Date.now()
            }
        };

        // Set defaults if not already set
        const existing = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const toSet = {};
        
        for (const [key, value] of Object.entries(defaultSettings)) {
            if (existing[key] === undefined) {
                toSet[key] = value;
            }
        }

        if (Object.keys(toSet).length > 0) {
            await chrome.storage.sync.set(toSet);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'GENERATE_COMMENT':
                    const comment = await this.generateComment(message.data);
                    sendResponse({ success: true, comment });
                    break;

                case 'UPDATE_STATS':
                    await this.updateStats(message.data);
                    sendResponse({ success: true });
                    break;

                case 'GET_SETTINGS':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, settings });
                    break;

                case 'TEST_API':
                    const isValid = await this.testCohereAPI(message.apiKey);
                    sendResponse({ success: true, isValid });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async generateComment(data) {
        const { postContent, replyContext, personaId } = data;
        
        // Get API key and persona
        const storage = await chrome.storage.sync.get(['cohereApiKey', 'personas']);
        const apiKey = storage.cohereApiKey;
        
        if (!apiKey) {
            throw new Error('לא נמצא מפתח API של Cohere');
        }

        const persona = storage.personas?.find(p => p.id === personaId);
        if (!persona) {
            throw new Error('לא נמצאה פרסונה נבחרת');
        }

        // Build prompt
        const prompt = this.buildPrompt(persona, postContent, replyContext);

        // Call Cohere API with streaming
        return await this.callCohereStream(apiKey, prompt);
    }

    buildPrompt(persona, postContent, replyContext = null) {
        let prompt = `אתה כותב תגובות ברשתות חברתיות בהתאם לפרסונה הבאה:

שם הפרסונה: ${persona.name}
תיאור: ${persona.description}

דוגמאות לכתיבה:
${persona.examples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

`;

        if (replyContext) {
            prompt += `תוכן הפוסט המקורי:
"${postContent}"

התגובה שאליה אתה מגיב:
"${replyContext}"

כתב תגובה קצרה ורלוונטית לתגובה הנ"ל, תוך התחשבות בהקשר של הפוסט המקורי.`;
        } else {
            prompt += `תוכן הפוסט:
"${postContent}"

כתב תגובה קצרה, מעניינת ורלוונטית לפוסט הזה.`;
        }

        prompt += `

דרישות:
- התגובה צריכה להיות באותו סגנון ואופי כמו בדוגמאות
- אל תשתמש באמוג'ים אלא אם כן זה מופיע בדוגמאות
- אל תחזור על המילים מהפוסט המקורי
- התגובה צריכה להיות קצרה (עד 50 מילים)
- כתב בעברית
- הייה טבעי ואותנטי

תגובה:`;

        return prompt;
    }

    async callCohereStream(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'command-a-03-2025',
                messages: [{ role: 'user', content: prompt }],
                stream: true,
                max_tokens: 150,
                temperature: 0.7,
                frequency_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.status}`);
        }

        return await this.handleStreamResponse(response);
    }

    async handleStreamResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let comment = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            if (jsonStr.trim() === '[DONE]') continue;
                            
                            const data = JSON.parse(jsonStr);
                            
                            if (data.type === 'content-delta' && data.delta?.message?.content?.text) {
                                comment += data.delta.message.content.text;
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return comment.trim();
    }

    async updateStats(statsData) {
        const storage = await chrome.storage.sync.get(['stats']);
        const currentStats = storage.stats || {
            totalLikes: 0,
            totalComments: 0,
            sessionTime: 0,
            sessionStart: Date.now()
        };

        // Update stats
        if (statsData.likes) currentStats.totalLikes += statsData.likes;
        if (statsData.comments) currentStats.totalComments += statsData.comments;
        
        // Update session time
        currentStats.sessionTime = Date.now() - currentStats.sessionStart;

        await chrome.storage.sync.set({ stats: currentStats });
    }

    async getSettings() {
        return await chrome.storage.sync.get([
            'autoLikes',
            'autoComments',
            'linkedinEnabled',
            'facebookEnabled',
            'selectedPersonaId',
            'personas'
        ]);
    }

    async testCohereAPI(apiKey) {
        try {
            const response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'command-a-03-2025',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                })
            });

            return response.ok || response.status === 400;
        } catch (error) {
            console.error('API test failed:', error);
            return false;
        }
    }

    isSupportedSite(url) {
        if (!url) return false;
        return url.includes('linkedin.com') || url.includes('facebook.com');
    }

    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
        } catch (error) {
            console.log('Could not inject content script:', error);
        }
    }

    async initializeStats() {
        // Reset session start time on background script initialization
        const storage = await chrome.storage.sync.get(['stats']);
        if (storage.stats) {
            storage.stats.sessionStart = Date.now();
            await chrome.storage.sync.set({ stats: storage.stats });
        }
    }
}

// Initialize background script
new SocialBotBackground();

console.log('YUV.AI SocialBot Pro - Background Service Worker loaded'); 