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

        // Handle tab activation - ensure content script is loaded when user switches to social media tab
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            try {
                const tab = await chrome.tabs.get(activeInfo.tabId);
                if (this.isSupportedSite(tab.url)) {
                    // Wait a bit for tab to be ready
                    setTimeout(() => {
                        this.ensureContentScriptLoaded(activeInfo.tabId);
                    }, 1000);
                }
            } catch (error) {
                console.log('Could not handle tab activation:', error);
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

        // 🤖 AI Agent System - Multi-step comment generation
        return await this.aiAgentCommentGeneration(apiKey, persona, postContent, replyContext);
    }

    // 🤖 AI Agent System for Advanced Comment Generation
    async aiAgentCommentGeneration(apiKey, persona, postContent, replyContext = null) {
        console.log('🤖 Starting AI Agent comment generation process...');
        
        try {
            // Step 1: Content Analysis Agent
            const analysis = await this.contentAnalysisAgent(apiKey, postContent, replyContext);
            console.log('📊 Content analysis completed:', analysis);
            
            // Step 2: Comment Generation Agent
            const initialComment = await this.commentGenerationAgent(apiKey, persona, postContent, replyContext, analysis);
            console.log('💬 Initial comment generated:', initialComment);
            
            // Step 3: Quality Review Agent
            const reviewedComment = await this.qualityReviewAgent(apiKey, persona, initialComment, postContent, analysis);
            console.log('✅ Comment reviewed and improved:', reviewedComment);
            
            // Step 4: Final Validation Agent
            const finalComment = await this.finalValidationAgent(apiKey, persona, reviewedComment, postContent);
            console.log('🎯 Final comment validated:', finalComment);
            
            return finalComment;
            
        } catch (error) {
            console.error('❌ AI Agent system error:', error);
            // Fallback to simple generation
            return await this.fallbackCommentGeneration(apiKey, persona, postContent, replyContext);
        }
    }

    // Agent 1: Content Analysis
    async contentAnalysisAgent(apiKey, postContent, replyContext) {
        const prompt = `You are a content analysis AI agent. Analyze the following social media content and provide structured insights.

Post Content: "${postContent}"
${replyContext ? `Reply Context: "${replyContext}"` : ''}

Analyze and respond with the following structure:
{
  "sentiment": "positive/negative/neutral",
  "topic": "main topic of the post",
  "tone": "formal/casual/professional/humorous",
  "language": "hebrew/english",
  "keywords": ["key1", "key2", "key3"],
  "engagement_type": "informative/emotional/question/announcement",
  "recommended_response_style": "supportive/questioning/informative/humorous"
}

Provide ONLY the JSON response, nothing else.`;

        const response = await this.callCohereAPI(apiKey, prompt);
        try {
            return JSON.parse(response);
        } catch (e) {
            return {
                sentiment: "neutral",
                topic: "general",
                tone: "casual",
                language: "hebrew",
                keywords: [],
                engagement_type: "informative",
                recommended_response_style: "supportive"
            };
        }
    }

    // Agent 2: Comment Generation
    async commentGenerationAgent(apiKey, persona, postContent, replyContext, analysis) {
        const languageInstruction = analysis.language === 'english' ? 
            "Write your response in English" : 
            "כתב את התגובה בעברית";

        const prompt = `You are a comment generation AI agent. Generate a social media comment based on the analysis and persona.

Persona: ${persona.name}
Description: ${persona.description}
Writing Examples: ${persona.examples.join(' | ')}

Content Analysis:
- Sentiment: ${analysis.sentiment}
- Topic: ${analysis.topic}
- Tone: ${analysis.tone}
- Recommended Style: ${analysis.recommended_response_style}

Post Content: "${postContent}"
${replyContext ? `Replying to: "${replyContext}"` : ''}

Generate a comment that:
- Matches the persona's writing style exactly
- Responds appropriately to the ${analysis.sentiment} sentiment
- Uses a ${analysis.recommended_response_style} approach
- Stays relevant to the topic: ${analysis.topic}
- ${languageInstruction}
- Is 20-40 words maximum
- Feels natural and authentic

Return ONLY the comment text, no quotes or extra formatting.`;

        return await this.callCohereAPI(apiKey, prompt);
    }

    // Agent 3: Quality Review
    async qualityReviewAgent(apiKey, persona, comment, postContent, analysis) {
        const prompt = `You are a quality review AI agent. Review and improve the generated comment.

Original Post: "${postContent}"
Generated Comment: "${comment}"
Persona Style: ${persona.examples.join(' | ')}
Content Analysis: ${JSON.stringify(analysis)}

Review the comment for:
1. Style consistency with persona examples
2. Appropriateness to the post content
3. Natural language flow
4. Length (should be 20-40 words)
5. Authenticity

If the comment needs improvement, provide a better version.
If it's already good, return it as is.

Return ONLY the final comment text, no explanations.`;

        return await this.callCohereAPI(apiKey, prompt);
    }

    // Agent 4: Final Validation
    async finalValidationAgent(apiKey, persona, comment, postContent) {
        const prompt = `You are a final validation AI agent. Perform a final check on this comment.

Post: "${postContent}"
Comment: "${comment}"
Persona: ${persona.name}

Final validation checklist:
- Does it sound like something ${persona.name} would write?
- Is it appropriate and respectful?
- Is it engaging but not controversial?
- Is the length appropriate (20-40 words)?
- Does it add value to the conversation?

If it passes all checks, return the comment as is.
If any issues, provide a corrected version.

Return ONLY the final comment text.`;

        return await this.callCohereAPI(apiKey, prompt);
    }

    // Fallback generation method
    async fallbackCommentGeneration(apiKey, persona, postContent, replyContext) {
        console.log('🔄 Using fallback comment generation...');
        const prompt = this.buildPrompt(persona, postContent, replyContext);
        return await this.callCohereStream(apiKey, prompt);
    }

    // Simple API call method for agents
    async callCohereAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'command-xlarge-nightly',
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.7,
                k: 0,
                stop_sequences: [],
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.generations[0]?.text?.trim() || '';
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

    async ensureContentScriptLoaded(tabId) {
        try {
            // Try to ping the content script
            const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
            if (response && response.status === 'ready') {
                console.log('Content script already loaded in tab:', tabId);
                return;
            }
        } catch (error) {
            // Content script not loaded, inject it
            console.log('Injecting content script into activated tab:', tabId);
            await this.injectContentScript(tabId);
        }
    }
}

// Initialize background script
new SocialBotBackground();

console.log('YUV.AI SocialBot Pro - Background Service Worker loaded'); 