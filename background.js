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

                case 'REALTIME_ACTIVITY':
                    // העברת פעילות זמן-אמת לדשבורד
                    this.broadcastToTabs({
                        type: 'NEW_ACTIVITY',
                        data: message.data
                    });
                    sendResponse({ success: true });
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
        // זיהוי שפת הפוסט
        const isEnglish = this.detectLanguage(postContent);
        const languageInstruction = isEnglish ? 
            "Write your response in English" : 
            "כתב את התגובה בעברית";

        let prompt = `You are writing social media comments according to the following persona:

Persona Name: ${persona.name}
Description: ${persona.description}

Writing Examples:
${persona.examples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

`;

        if (replyContext) {
            prompt += `Original Post Content:
${postContent}

Comment you are replying to:
${replyContext}

Write a short and relevant reply to the above comment, considering the context of the original post.`;
        } else {
            prompt += `Post Content:
${postContent}

Write a short, interesting and relevant comment to this post.`;
        }

        prompt += `

Requirements:
- The comment should match the same style and personality as shown in the examples
- Do not use emojis unless they appear in the examples
- Do not repeat words from the original post
- Keep the comment short (up to 50 words)
- ${languageInstruction}
- Be natural and authentic
- Do NOT wrap the response in quotes or quotation marks
- Return ONLY the comment text, nothing else

Comment:`;

        return prompt;
    }

    detectLanguage(text) {
        // זיהוי שפה פשוט - בודק אם יש יותר תווים לטיניים מאשר עבריים
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
        
        // אם יש יותר תווים אנגליים או אם אין תווים עבריים כלל
        return englishChars > hebrewChars || hebrewChars === 0;
    }

    async callCohereStream(apiKey, prompt) {
        console.log('Calling Cohere API v2 with model:', 'command-a-03-2025');
        console.log('API Key length:', apiKey ? apiKey.length : 'undefined');
        
        const response = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'command-a-03-2025',
                messages: [{ 
                    role: 'user', 
                    content: prompt 
                }],
                stream: true,
                max_tokens: 150,
                temperature: 0.7,
                frequency_penalty: 0.3,
                presence_penalty: 0.0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cohere API v2 Error Details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText
            });
            throw new Error(`Cohere API v2 error: ${response.status} - ${errorText}`);
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
                            
                            // Handle API v2 streaming format
                            if (data.type === 'content-delta' && data.delta?.message?.content?.text) {
                                comment += data.delta.message.content.text;
                            }
                            
                            // Log different event types for debugging
                            if (data.type === 'message-start') {
                                console.log('Stream started:', data.id);
                            } else if (data.type === 'content-start') {
                                console.log('Content generation started');
                            } else if (data.type === 'content-end') {
                                console.log('Content generation ended');
                            } else if (data.type === 'message-end') {
                                console.log('Message completed:', data.delta?.finish_reason);
                            }
                            
                        } catch (e) {
                            // Skip invalid JSON lines
                            console.log('Skipping invalid JSON line:', line);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream reading error:', error);
        } finally {
            reader.releaseLock();
        }

        let finalComment = comment.trim();
        
        // הסרת ציטוטים מהתחלה והסוף
        finalComment = finalComment.replace(/^["״"']+|["״"']+$/g, '');
        
        // הסרת ביטויים מיותרים
        finalComment = finalComment.replace(/^(תגובה:|Comment:|Response:)\s*/i, '');
        
        // ניקוי נוסף
        finalComment = finalComment.trim();
        
        console.log('Generated comment (cleaned):', finalComment);
        return finalComment;
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
            console.log('Testing Cohere API v2...');
            console.log('API Key provided:', apiKey ? 'Yes' : 'No');
            console.log('API Key length:', apiKey ? apiKey.length : 'N/A');
            
            // Test with streaming disabled for simple validation
            const response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'command-a-03-2025',
                    messages: [{ 
                        role: 'user', 
                        content: 'hello' 
                    }],
                    stream: false,
                    max_tokens: 5
                })
            });

            console.log('API Test Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Test Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                
                // Check for specific error types
                if (response.status === 401) {
                    console.error('Authentication failed - API key is invalid');
                    return false;
                } else if (response.status === 400) {
                    console.log('Bad request - but API key might be valid');
                    // For testing purposes, a 400 might still indicate valid auth
                    return true;
                }
                
                return false;
            }

            // If we get here, the API call was successful
            const responseData = await response.json();
            console.log('API Test Success:', responseData);
            return true;
            
        } catch (error) {
            console.error('API test failed with error:', error);
            
            // Check if it's a network error vs auth error
            if (error.message.includes('fetch')) {
                console.error('Network error - check internet connection');
            }
            
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
        try {
            // Reset session start time on background script initialization
            const storage = await chrome.storage.sync.get(['stats']);
            if (storage.stats) {
                storage.stats.sessionStart = Date.now();
                await chrome.storage.sync.set({ stats: storage.stats });
            }
        } catch (error) {
            console.error('Failed to initialize stats:', error);
        }
    }

    // שליחת הודעה לכל הטאבים הפתוחים של הדשבורד
    async broadcastToTabs(message) {
        try {
            const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('dashboard.html') + '*' });
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, message).catch(() => {
                    // Tab might be closed, ignore error
                });
            });
        } catch (error) {
            console.log('Could not broadcast to tabs:', error);
        }
    }
}

// Initialize background script
new SocialBotBackground();

console.log('YUV.AI SocialBot Pro - Background Service Worker loaded'); 