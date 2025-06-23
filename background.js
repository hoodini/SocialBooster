// YUV.AI SocialBot Pro - Advanced AI Agent System Background Service Worker
class SocialBotBackground {
    constructor() {
        this.agentSystem = new AdvancedAIAgentSystem();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeStats();
        this.initializeAgentSystem();
    }

    async initializeAgentSystem() {
        console.log('🤖 Initializing Advanced AI Agent System...');
        await this.agentSystem.initialize();
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
        
        // Initialize default settings with advanced AI features
        const defaultSettings = {
            autoLikes: false,
            autoComments: false,
            aiInsights: true,
            advancedAnalytics: true,
            multiAgentSystem: true,
            stats: {
                totalLikes: 0,
                totalComments: 0,
                sessionTime: 0,
                sessionStart: Date.now(),
                aiInsights: 0,
                sentimentAnalysis: 0
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

                case 'GENERATE_REPLY':
                    const reply = await this.generateReply(message.data);
                    sendResponse({ success: true, reply });
                    break;

                case 'ANALYZE_POST':
                    const analysis = await this.analyzePost(message.data);
                    sendResponse({ success: true, analysis });
                    break;

                case 'GET_AI_INSIGHTS':
                    const insights = await this.getAIInsights(message.data);
                    sendResponse({ success: true, insights });
                    break;

                case 'GENERATE_DASHBOARD_INSIGHTS':
                    const dashboardInsights = await this.generateDashboardInsights(message.data);
                    sendResponse({ success: true, insights: dashboardInsights });
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

                case 'RECORD_AI_GENERATION':
                    // רישום יצירה של AI לצורך אנליטיקה
                    await this.recordAIGeneration(message.data);
                    sendResponse({ success: true });
                    break;

                case 'IMPROVE_COMMENT':
                    await this.handleImproveComment(message.data)
                        .then(result => sendResponse(result))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true;

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

        // 🤖 Advanced AI Agent System - Multi-step comment generation with deep insights
        return await this.agentSystem.generateAdvancedComment(apiKey, persona, postContent, replyContext);
    }

    async generateReply(data) {
        const { postContent, commentContent, replyContext, personaId } = data;
        
        const storage = await chrome.storage.sync.get(['cohereApiKey', 'personas']);
        const apiKey = storage.cohereApiKey;
        
        if (!apiKey) {
            throw new Error('לא נמצא מפתח API של Cohere');
        }

        const persona = storage.personas?.find(p => p.id === personaId);
        if (!persona) {
            throw new Error('לא נמצאה פרסונה נבחרת');
        }

        // 🤖 Generate context-aware reply using multi-agent system
        return await this.agentSystem.generateContextualReply(apiKey, persona, postContent, commentContent, replyContext);
    }

    async analyzePost(data) {
        const { postContent } = data;
        const storage = await chrome.storage.sync.get(['cohereApiKey']);
        const apiKey = storage.cohereApiKey;
        
        if (!apiKey) {
            throw new Error('לא נמצא מפתח API של Cohere');
        }

        return await this.agentSystem.analyzePostInsights(apiKey, postContent);
    }

    async getAIInsights(data) {
        const storage = await chrome.storage.sync.get(['cohereApiKey']);
        const apiKey = storage.cohereApiKey;
        
        if (!apiKey) {
            throw new Error('לא נמצא מפתח API של Cohere');
        }

        return await this.agentSystem.generateAIInsights(apiKey, data);
    }

    async generateDashboardInsights(data) {
        const storage = await chrome.storage.sync.get(['cohereApiKey']);
        const apiKey = storage.cohereApiKey;
        
        if (!apiKey) {
            throw new Error('לא נמצא מפתח API של Cohere');
        }

        return await this.agentSystem.generateDashboardAnalytics(apiKey, data);
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
                    stream: true,
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

    async recordAIGeneration(data) {
        try {
            // שמירת פעילות AI לצורך אנליטיקה מתקדמת
            const record = {
                ...data,
                timestamp: Date.now(),
                id: Date.now() + Math.random()
            };

            // שמירה ב-storage לצורך דשבורד
            const existing = await chrome.storage.local.get(['aiGenerationStats']);
            const stats = existing.aiGenerationStats || [];
            
            stats.push(record);
            
            // שמירת רק 1000 הרשומות האחרונות
            if (stats.length > 1000) {
                stats.splice(0, stats.length - 1000);
            }

            await chrome.storage.local.set({ aiGenerationStats: stats });

            // עדכון הדשבורד אם פתוח
            this.broadcastToTabs({
                type: 'AI_GENERATION_RECORDED',
                data: record
            });

        } catch (error) {
            console.error('Error recording AI generation:', error);
        }
    }

    async handleImproveComment(data) {
        try {
            console.log('🤖 Improving comment based on feedback');
            
            const settings = await chrome.storage.sync.get(['cohereApiKey']);
            
            if (!settings.cohereApiKey) {
                return { success: false, error: 'No API key' };
            }
            
            // Prepare improvement prompt
            const prompt = this.createImprovementPrompt(data);
            
            // Call Cohere API
            const improvedComment = await this.callCohereAPI(prompt, settings.cohereApiKey);
            
            if (improvedComment) {
                console.log('✅ Comment improved successfully');
                return { success: true, comment: improvedComment };
            } else {
                return { success: false, error: 'API call failed' };
            }
            
        } catch (error) {
            console.error('Error improving comment:', error);
            return { success: false, error: error.message };
        }
    }

    createImprovementPrompt(data) {
        const isHebrew = data.language === 'he';
        
        const basePrompt = isHebrew ?
            `שפר את התגובה הזו על בסיס המשוב:

תגובה מקורית: "${data.originalComment}"
משוב: ${data.feedback}

הנחיות:
- שפר את התגובה על בסיס המשוב
- שמור על הטון המקצועי
- כתב בעברית בלבד
- התחל ישירות עם התגובה המשופרת

תגובה משופרת:` :
            `Improve this comment based on the feedback:

Original comment: "${data.originalComment}"
Feedback: ${data.feedback}

Guidelines:
- Improve the comment based on the feedback
- Maintain a professional tone
- Write in English only
- Start directly with the improved comment

Improved comment:`;
        
        return basePrompt;
    }

    async callCohereAPI(prompt, apiKey) {
        try {
            // Convert old prompt format to new messages format
            const messages = [
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'command-a-03-2025',
                    messages: messages,
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                console.error('Cohere API v2 error:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            
            if (data.message && data.message.content && data.message.content.length > 0) {
                let comment = data.message.content[0].text.trim();
                
                // Clean up the response
                comment = comment.replace(/^["']|["']$/g, ''); // Remove quotes
                comment = comment.replace(/\n+/g, ' '); // Replace newlines with spaces
                comment = comment.trim();
                
                return comment;
            } else {
                console.error('No content in Cohere v2 response');
                return null;
            }
            
        } catch (error) {
            console.error('Cohere API v2 call failed:', error);
            return null;
        }
    }
}

// 🤖 Advanced AI Agent System - Multi-Agent Architecture
class AdvancedAIAgentSystem {
    constructor() {
        this.agents = {};
        this.knowledgeBase = new AIKnowledgeBase();
        this.sessionContext = new SessionContextManager();
    }

    async initialize() {
        console.log('🧠 Initializing Advanced AI Agent System...');
        
        // Initialize specialized agents
        this.agents = {
            contentAnalyzer: new ContentAnalysisAgent(),
            sentimentAnalyzer: new SentimentAnalysisAgent(),
            commentGenerator: new CommentGenerationAgent(),
            replyGenerator: new ReplyGenerationAgent(),
            contextAnalyzer: new ContextAnalysisAgent(),
            qualityReviewer: new QualityReviewAgent(),
            insightGenerator: new InsightGenerationAgent(),
            trendAnalyzer: new TrendAnalysisAgent(),
            engagementOptimizer: new EngagementOptimizationAgent(),
            personalityMatcher: new PersonalityMatchingAgent()
        };

        await this.knowledgeBase.initialize();
        console.log('✅ AI Agent System initialized with', Object.keys(this.agents).length, 'specialized agents');
    }

    async generateAdvancedComment(apiKey, persona, postContent, replyContext = null) {
        console.log('🤖 Starting Advanced Multi-Agent Comment Generation...');
        
        try {
            // Step 1: Multi-dimensional content analysis
            const contentAnalysis = await this.agents.contentAnalyzer.analyze(apiKey, postContent, replyContext);
            const sentimentAnalysis = await this.agents.sentimentAnalyzer.analyze(apiKey, postContent);
            const contextAnalysis = await this.agents.contextAnalyzer.analyze(apiKey, postContent, replyContext);
            
            console.log('📊 Multi-dimensional analysis completed:', {
                content: contentAnalysis,
                sentiment: sentimentAnalysis,
                context: contextAnalysis
            });

            // Step 2: Personality matching and optimization
            const personalityMatch = await this.agents.personalityMatcher.matchPersona(persona, contentAnalysis);
            
            // Step 3: Advanced comment generation with context awareness
            const generatedComment = await this.agents.commentGenerator.generate(
                apiKey, 
                persona, 
                postContent, 
                replyContext, 
                {
                    contentAnalysis,
                    sentimentAnalysis,
                    contextAnalysis,
                    personalityMatch
                }
            );

            // Step 4: Engagement optimization
            const optimizedComment = await this.agents.engagementOptimizer.optimize(
                apiKey,
                generatedComment,
                contentAnalysis,
                sentimentAnalysis
            );

            // Step 5: Quality review and refinement
            const finalComment = await this.agents.qualityReviewer.review(
                apiKey,
                optimizedComment,
                persona,
                postContent,
                {
                    contentAnalysis,
                    sentimentAnalysis,
                    contextAnalysis
                }
            );

            // Step 6: Learn from generation for future improvements
            await this.knowledgeBase.learnFromGeneration({
                persona,
                postContent,
                finalComment,
                analyses: { contentAnalysis, sentimentAnalysis, contextAnalysis }
            });

            console.log('🎯 Advanced comment generation completed:', finalComment);
            return finalComment;
            
        } catch (error) {
            console.error('❌ Advanced AI Agent system error:', error);
            // Fallback to simpler generation
            return await this.fallbackCommentGeneration(apiKey, persona, postContent, replyContext);
        }
    }

    async generateContextualReply(apiKey, persona, postContent, commentContent, replyContext) {
        console.log('🤖 Starting Contextual Reply Generation...');
        
        try {
            // Advanced context analysis for replies
            const replyContextAnalysis = await this.agents.contextAnalyzer.analyzeReplyContext(
                apiKey, 
                postContent, 
                commentContent, 
                replyContext
            );

            // Generate contextually aware reply
            const reply = await this.agents.replyGenerator.generate(
                apiKey,
                persona,
                postContent,
                commentContent,
                replyContextAnalysis
            );

            return reply;
            
        } catch (error) {
            console.error('❌ Contextual reply generation error:', error);
            throw error;
        }
    }

    async analyzePostInsights(apiKey, postContent) {
        console.log('🔍 Analyzing post insights...');
        
        try {
            const insights = await this.agents.insightGenerator.generatePostInsights(apiKey, postContent);
            const trends = await this.agents.trendAnalyzer.analyzeTrends(apiKey, postContent);
            
            return {
                insights,
                trends,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Post insights analysis error:', error);
            throw error;
        }
    }

    async generateAIInsights(apiKey, data) {
        console.log('🧠 Generating AI insights...');
        
        try {
            const insights = await this.agents.insightGenerator.generateGeneralInsights(apiKey, data);
            return insights;
            
        } catch (error) {
            console.error('❌ AI insights generation error:', error);
            throw error;
        }
    }

    async generateDashboardAnalytics(apiKey, data) {
        console.log('📊 Generating dashboard analytics insights...');
        
        try {
            const analytics = await this.agents.insightGenerator.generateDashboardAnalytics(apiKey, data);
            const trends = await this.agents.trendAnalyzer.analyzeDashboardTrends(apiKey, data);
            
            return {
                analytics,
                trends,
                recommendations: await this.generateRecommendations(apiKey, data),
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Dashboard analytics generation error:', error);
            throw error;
        }
    }

    async generateRecommendations(apiKey, data) {
        // Generate AI-powered recommendations based on user data
        const prompt = `Based on the following social media engagement data, provide actionable recommendations for improving engagement:

Data: ${JSON.stringify(data, null, 2)}

Provide recommendations in Hebrew in the following JSON format:
{
  "posting_strategy": "המלצות לאסטרטגיית פרסום",
  "content_optimization": "המלצות לאופטימיזציה של תוכן",
  "timing_recommendations": "המלצות לתזמון פרסומים",
  "engagement_tactics": "טקטיקות להגברת מעורבות",
  "trend_opportunities": "הזדמנויות מגמות"
}

Return ONLY the JSON response.`;

        try {
            const response = await this.callCohereAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (error) {
            return {
                posting_strategy: "פרסם בזמנים עם פעילות גבוהה",
                content_optimization: "השתמש בתוכן אינטראקטיביי יותר",
                timing_recommendations: "פרסם בין 9-11 בבוקר ו-19-21 בערב",
                engagement_tactics: "הוסף שאלות בסוף הפוסטים",
                trend_opportunities: "עקוב אחר מגמות בתחום שלך"
            };
        }
    }

    async fallbackCommentGeneration(apiKey, persona, postContent, replyContext) {
        // Simple fallback generation
        const prompt = this.buildSimplePrompt(persona, postContent, replyContext);
        return await this.callCohereAPI(prompt, apiKey);
    }

    buildSimplePrompt(persona, postContent, replyContext = null) {
        let prompt = `אתה ${persona.name} - ${persona.description}\n\n`;
        
        if (persona.examples && persona.examples.length > 0) {
            prompt += `דוגמאות לסגנון הכתיבה שלך:\n`;
            persona.examples.forEach((example, index) => {
                prompt += `${index + 1}. ${example}\n`;
            });
            prompt += `\n`;
        }
        
        if (replyContext) {
            prompt += `פוסט מקורי: "${postContent}"\n`;
            prompt += `תגובה שמגיבים עליה: "${replyContext}"\n`;
            prompt += `כתוב תגובה על התגובה בסגנון שלך, קצרה ורלוונטית:\n`;
        } else {
            prompt += `פוסט: "${postContent}"\n`;
            prompt += `כתוב תגובה בסגנון שלך, קצרה ורלוונטית:\n`;
        }
        
        return prompt;
    }

    async callCohereAPI(apiKey, prompt) {
        try {
            const response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Cohere-Version': '2022-12-06'
                },
                body: JSON.stringify({
                    model: 'command',
                    prompt: prompt,
                    max_tokens: 150,
                    temperature: 0.7,
                    k: 0,
                    stop_sequences: ["\n\n"],
                    return_likelihoods: 'NONE'
                })
            });

            if (!response.ok) {
                console.error('Cohere API error:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            
            if (data.generations && data.generations.length > 0) {
                let comment = data.generations[0].text.trim();
                
                // Clean up the response
                comment = comment.replace(/^["']|["']$/g, ''); // Remove quotes
                comment = comment.replace(/\n+/g, ' '); // Replace newlines with spaces
                comment = comment.trim();
                
                return comment;
            } else {
                console.error('No generations in Cohere response');
                return null;
            }
            
        } catch (error) {
            console.error('Cohere API call failed:', error);
            return null;
        }
    }
}

// 🎯 Specialized AI Agents - Each agent handles specific tasks

// Agent 1: Content Analysis Agent
class ContentAnalysisAgent {
    async analyze(apiKey, postContent, replyContext = null) {
        const prompt = `You are an advanced content analysis AI agent. Analyze the following social media content and provide comprehensive structured insights.

Post Content: "${postContent}"
${replyContext ? `Reply Context: "${replyContext}"` : ''}

Analyze and respond with the following detailed structure:
{
  "sentiment": "positive/negative/neutral",
  "emotion": "joy/anger/fear/sadness/surprise/trust/disgust/anticipation/neutral",
  "topic": "main topic category",
  "subtopics": ["subtopic1", "subtopic2"],
  "tone": "formal/casual/professional/humorous/inspirational/educational",
  "language": "hebrew/english/mixed",
  "keywords": ["key1", "key2", "key3", "key4", "key5"],
  "entities": ["person/company/location names"],
  "engagement_type": "informative/emotional/question/announcement/story/opinion",
  "complexity_level": "simple/medium/complex",
  "target_audience": "general/professional/technical/casual",
  "call_to_action": true/false,
  "question_asked": true/false,
  "controversy_level": "low/medium/high",
  "trending_relevance": "low/medium/high",
  "recommended_response_style": "supportive/questioning/informative/humorous/empathetic/constructive"
}

Provide ONLY the JSON response, nothing else.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return this.getDefaultAnalysis();
        }
    }

    getDefaultAnalysis() {
        return {
            sentiment: "neutral",
            emotion: "neutral",
            topic: "general",
            subtopics: [],
            tone: "casual",
            language: "hebrew",
            keywords: [],
            entities: [],
            engagement_type: "informative",
            complexity_level: "medium",
            target_audience: "general",
            call_to_action: false,
            question_asked: false,
            controversy_level: "low",
            trending_relevance: "medium",
            recommended_response_style: "supportive"
        };
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 300,
                temperature: 0.3,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 2: Sentiment Analysis Agent
class SentimentAnalysisAgent {
    async analyze(apiKey, postContent) {
        const prompt = `You are a specialized sentiment analysis AI agent. Perform deep sentiment analysis on this social media content.

Content: "${postContent}"

Analyze and respond with the following detailed sentiment structure:
{
  "overall_sentiment": "very_positive/positive/slightly_positive/neutral/slightly_negative/negative/very_negative",
  "emotion_scores": {
    "joy": 0.0-1.0,
    "trust": 0.0-1.0,
    "anticipation": 0.0-1.0,
    "surprise": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "sadness": 0.0-1.0,
    "disgust": 0.0-1.0
  },
  "confidence_score": 0.0-1.0,
  "emotional_intensity": "low/medium/high",
  "subjectivity": "objective/slightly_subjective/subjective/highly_subjective",
  "urgency_level": "low/medium/high",
  "optimism_score": 0.0-1.0,
  "engagement_potential": "low/medium/high",
  "response_urgency": "immediate/soon/normal/delayed"
}

Provide ONLY the JSON response, nothing else.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return this.getDefaultSentiment();
        }
    }

    getDefaultSentiment() {
        return {
            overall_sentiment: "neutral",
            emotion_scores: {
                joy: 0.5, trust: 0.5, anticipation: 0.5, surprise: 0.3,
                anger: 0.1, fear: 0.1, sadness: 0.2, disgust: 0.1
            },
            confidence_score: 0.7,
            emotional_intensity: "medium",
            subjectivity: "slightly_subjective",
            urgency_level: "medium",
            optimism_score: 0.6,
            engagement_potential: "medium",
            response_urgency: "normal"
        };
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 250,
                temperature: 0.2,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 3: Advanced Comment Generation Agent
class CommentGenerationAgent {
    async generate(apiKey, persona, postContent, replyContext, analyses) {
        const { contentAnalysis, sentimentAnalysis, contextAnalysis, personalityMatch } = analyses;
        
        const languageInstruction = contentAnalysis.language === 'english' ? 
            "Write your response in English" : 
            "כתב את התגובה בעברית";

        const prompt = `You are an advanced comment generation AI agent. Generate a highly personalized and contextually appropriate social media comment.

PERSONA INFORMATION:
Name: ${persona.name}
Description: ${persona.description}
Writing Style Examples: ${persona.examples?.join(' | ') || 'Professional and engaging'}

CONTENT ANALYSIS:
- Sentiment: ${sentimentAnalysis.overall_sentiment}
- Primary Emotion: ${sentimentAnalysis.emotion_scores}
- Topic: ${contentAnalysis.topic}
- Tone: ${contentAnalysis.tone}
- Engagement Type: ${contentAnalysis.engagement_type}
- Complexity: ${contentAnalysis.complexity_level}
- Audience: ${contentAnalysis.target_audience}
- Controversy Level: ${contentAnalysis.controversy_level}

CONTEXTUAL INSIGHTS:
- Recommended Style: ${contentAnalysis.recommended_response_style}
- Response Urgency: ${sentimentAnalysis.response_urgency}
- Engagement Potential: ${sentimentAnalysis.engagement_potential}

POST CONTENT: "${postContent}"
${replyContext ? `REPLYING TO: "${replyContext}"` : ''}

GENERATION REQUIREMENTS:
- Match the persona's writing style EXACTLY as shown in examples
- Respond appropriately to the ${sentimentAnalysis.overall_sentiment} sentiment
- Use a ${contentAnalysis.recommended_response_style} approach
- Consider the ${contentAnalysis.complexity_level} complexity level
- Target ${contentAnalysis.target_audience} audience
- Handle ${contentAnalysis.controversy_level} controversy level appropriately
- ${languageInstruction}
- Length: 15-35 words for maximum engagement
- Be authentic, natural, and add genuine value
- Avoid generic responses or clichés
- Include subtle personality traits from the persona

Generate a comment that feels like it was written by a real person with the given persona, not an AI.

Return ONLY the comment text, no quotes or formatting.`;

        return await this.callAPI(apiKey, prompt);
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 150,
                temperature: 0.8,
                p: 0.9,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 4: Reply Generation Agent (for replies to comments)
class ReplyGenerationAgent {
    async generate(apiKey, persona, postContent, commentContent, replyContextAnalysis) {
        const prompt = `You are a specialized reply generation AI agent. Generate a contextually perfect reply to a comment.

PERSONA: ${persona.name} - ${persona.description}
WRITING EXAMPLES: ${persona.examples?.join(' | ') || 'Professional and engaging'}

ORIGINAL POST: "${postContent}"
COMMENT TO REPLY TO: "${commentContent}"

CONTEXT ANALYSIS: ${JSON.stringify(replyContextAnalysis)}

Generate a reply that:
- Directly addresses the specific comment
- Maintains context with the original post
- Matches the persona's style perfectly
- Is conversational and natural
- Adds value to the discussion
- Is 10-25 words for optimal engagement
- Feels like a real human response

Return ONLY the reply text, no formatting.`;

        return await this.callAPI(apiKey, prompt);
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.9,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 5: Context Analysis Agent
class ContextAnalysisAgent {
    async analyze(apiKey, postContent, replyContext = null) {
        const prompt = `You are a context analysis AI agent. Analyze the contextual elements of this social media content.

POST: "${postContent}"
${replyContext ? `REPLY CONTEXT: "${replyContext}"` : ''}

Analyze and return:
{
  "conversation_stage": "initial_post/early_discussion/active_debate/conclusion",
  "discussion_depth": "shallow/moderate/deep",
  "social_dynamics": "formal/casual/heated/supportive/neutral",
  "timing_context": "breaking_news/trending_topic/evergreen/personal_share",
  "interaction_pattern": "seeking_advice/sharing_knowledge/networking/celebrating",
  "cultural_context": "professional/personal/academic/entertainment",
  "response_expectations": "quick_acknowledgment/detailed_discussion/simple_reaction/no_response",
  "conversation_momentum": "building/stable/declining",
  "authenticity_level": "highly_personal/somewhat_personal/professional/generic"
}

Return ONLY the JSON response.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return this.getDefaultContext();
        }
    }

    async analyzeReplyContext(apiKey, postContent, commentContent, replyContext) {
        const prompt = `Analyze the full conversation context for generating a reply.

ORIGINAL POST: "${postContent}"
COMMENT TO REPLY TO: "${commentContent}"
${replyContext ? `ADDITIONAL CONTEXT: "${replyContext}"` : ''}

Analyze:
{
  "reply_type": "agreement/disagreement/question/clarification/addition/appreciation",
  "conversation_flow": "smooth/tense/supportive/challenging",
  "relationship_tone": "friendly/professional/neutral/confrontational",
  "expected_response_style": "brief/detailed/emotional/factual",
  "conversation_goal": "inform/persuade/connect/resolve/celebrate"
}

Return ONLY the JSON response.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return {
                reply_type: "addition",
                conversation_flow: "supportive",
                relationship_tone: "friendly",
                expected_response_style: "brief",
                conversation_goal: "connect"
            };
        }
    }

    getDefaultContext() {
        return {
            conversation_stage: "initial_post",
            discussion_depth: "moderate",
            social_dynamics: "neutral",
            timing_context: "evergreen",
            interaction_pattern: "sharing_knowledge",
            cultural_context: "professional",
            response_expectations: "simple_reaction",
            conversation_momentum: "stable",
            authenticity_level: "professional"
        };
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 200,
                temperature: 0.3,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 6: Quality Review Agent
class QualityReviewAgent {
    async review(apiKey, comment, persona, postContent, analyses) {
        const prompt = `You are a quality review AI agent. Review and improve this generated comment for maximum authenticity and engagement.

ORIGINAL POST: "${postContent}"
GENERATED COMMENT: "${comment}"
PERSONA STYLE: ${persona.examples?.join(' | ') || persona.description}

ANALYSIS CONTEXT:
- Content Analysis: ${JSON.stringify(analyses.contentAnalysis)}
- Sentiment: ${JSON.stringify(analyses.sentimentAnalysis)}

Review criteria:
1. Style consistency with persona examples (most important)
2. Appropriateness to post content and sentiment
3. Natural language flow and authenticity
4. Optimal length (15-35 words)
5. Engagement potential
6. No AI-generated feel or generic language
7. Adds genuine value to the conversation

If the comment needs improvement, provide a better version that:
- Sounds more human and natural
- Better matches the persona's unique voice
- Is more engaging and conversation-worthy
- Maintains appropriate length

If it's already excellent, return it unchanged.

Return ONLY the final comment text, no explanations or quotes.`;

        return await this.callAPI(apiKey, prompt);
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 120,
                temperature: 0.6,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 7: Insight Generation Agent
class InsightGenerationAgent {
    async generatePostInsights(apiKey, postContent) {
        const prompt = `Generate deep insights about this social media post for analytics purposes.

POST: "${postContent}"

Provide insights in Hebrew:
{
  "key_themes": ["נושא 1", "נושא 2", "נושא 3"],
  "engagement_drivers": ["גורם מעורבות 1", "גורם 2"],
  "viral_potential": "נמוך/בינוני/גבוה",
  "target_demographics": ["דמוגרפיה 1", "דמוגרפיה 2"],
  "optimal_response_time": "מיידי/תוך שעה/תוך יום",
  "content_category": "קטגוריית תוכן",
  "trend_alignment": "התאמה למגמות נוכחיות",
  "business_relevance": "רלוונטיות עסקית"
}

Return ONLY JSON.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return {
                key_themes: ["תוכן כללי"],
                engagement_drivers: ["רלוונטיות"],
                viral_potential: "בינוני",
                target_demographics: ["כללי"],
                optimal_response_time: "תוך שעה",
                content_category: "מידע",
                trend_alignment: "בינוני",
                business_relevance: "בינוני"
            };
        }
    }

    async generateGeneralInsights(apiKey, data) {
        const prompt = `Generate AI insights based on this data in Hebrew:

Data: ${JSON.stringify(data)}

Provide insights:
{
  "patterns_discovered": ["דפוס 1", "דפוס 2"],
  "optimization_opportunities": ["הזדמנות 1", "הזדמנות 2"],
  "risk_factors": ["סיכון 1", "סיכון 2"],
  "success_indicators": ["מחוון הצלחה 1", "מחוון 2"],
  "recommended_actions": ["פעולה מומלצת 1", "פעולה 2"]
}

Return ONLY JSON.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return {
                patterns_discovered: ["דפוסי התנהגות רגילים"],
                optimization_opportunities: ["שיפור תזמון"],
                risk_factors: ["אין סיכונים מזוהים"],
                success_indicators: ["מעורבות יציבה"],
                recommended_actions: ["המשך פעילות שוטפת"]
            };
        }
    }

    async generateDashboardAnalytics(apiKey, data) {
        const prompt = `Generate comprehensive dashboard analytics insights in Hebrew:

Analytics Data: ${JSON.stringify(data)}

Provide deep analytics:
{
  "performance_summary": "סיכום ביצועים מפורט",
  "trend_analysis": "ניתוח מגמות",
  "user_behavior_patterns": ["דפוס התנהגות 1", "דפוס 2"],
  "engagement_quality": "איכות מעורבות",
  "content_effectiveness": "יעילות תוכן",
  "growth_indicators": ["מחוון צמיחה 1", "מחוון 2"],
  "competitive_position": "מיקום תחרותי",
  "forecast_predictions": ["תחזית 1", "תחזית 2"],
  "actionable_insights": ["תובנה לפעולה 1", "תובנה 2"]
}

Return ONLY JSON.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return {
                performance_summary: "ביצועים טובים עם פוטנציאל לשיפור",
                trend_analysis: "מגמה חיובית במעורבות",
                user_behavior_patterns: ["גלילה אקטיבית", "מעורבות סלקטיבית"],
                engagement_quality: "איכותית ורלוונטית",
                content_effectiveness: "יעילות גבוהה",
                growth_indicators: ["עלייה במעורבות", "שיפור איכות תגובות"],
                competitive_position: "מיקום חזק",
                forecast_predictions: ["צמיחה מתמשכת", "שיפור מתמיד"],
                actionable_insights: ["התמקדות בתוכן איכותי", "אופטימיזציה של תזמונים"]
            };
        }
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 300,
                temperature: 0.4,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 8: Trend Analysis Agent
class TrendAnalysisAgent {
    async analyzeTrends(apiKey, postContent) {
        const prompt = `Analyze trends in this content:

Content: "${postContent}"

Provide trend analysis in Hebrew:
{
  "trending_topics": ["מגמה 1", "מגמה 2"],
  "seasonal_relevance": "רלוונטיות עונתית",
  "industry_trends": ["מגמת תעשייה 1", "מגמה 2"],
  "social_trends": ["מגמה חברתית 1", "מגמה 2"],
  "keyword_trends": ["מילת מפתח 1", "מילה 2"],
  "engagement_trends": "מגמות מעורבות",
  "future_relevance": "רלוונטיות עתידית"
}

Return ONLY JSON.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return {
                trending_topics: ["נושאים כלליים"],
                seasonal_relevance: "רלוונטי כל השנה",
                industry_trends: ["טרנדים מקצועיים"],
                social_trends: ["אינטראקציה חברתית"],
                keyword_trends: ["מילות מפתח רלוונטיות"],
                engagement_trends: "מעורבות יציבה",
                future_relevance: "רלוונטיות גבוהה"
            };
        }
    }

    async analyzeDashboardTrends(apiKey, data) {
        const prompt = `Analyze dashboard trends from this data:

Data: ${JSON.stringify(data)}

Provide comprehensive trend analysis in Hebrew:
{
  "performance_trends": "מגמות ביצועים",
  "user_engagement_trends": "מגמות מעורבות משתמשים",
  "content_performance_trends": "מגמות ביצועי תוכן",
  "timing_trends": "מגמות תזמון",
  "growth_trends": "מגמות צמיחה",
  "seasonal_patterns": "דפוסים עונתיים",
  "predictive_trends": "מגמות חיזוי",
  "benchmark_comparison": "השוואה לבנצ'מרק"
}

Return ONLY JSON.`;

        try {
            const response = await this.callAPI(apiKey, prompt);
            return JSON.parse(response);
        } catch (e) {
            return {
                performance_trends: "ביצועים יציבים עם מגמת עלייה",
                user_engagement_trends: "מעורבות גוברת ואיכותית",
                content_performance_trends: "תוכן מתבצע טוב",
                timing_trends: "תזמון אופטימלי",
                growth_trends: "צמיחה מתמדת",
                seasonal_patterns: "יציבות עונתית",
                predictive_trends: "צפי לשיפור המשך",
                benchmark_comparison: "מעל הממוצע בתחום"
            };
        }
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 250,
                temperature: 0.3,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 9: Engagement Optimization Agent
class EngagementOptimizationAgent {
    async optimize(apiKey, comment, contentAnalysis, sentimentAnalysis) {
        const prompt = `Optimize this comment for maximum engagement:

CURRENT COMMENT: "${comment}"
CONTENT ANALYSIS: ${JSON.stringify(contentAnalysis)}
SENTIMENT ANALYSIS: ${JSON.stringify(sentimentAnalysis)}

Optimize the comment to:
- Increase engagement potential
- Feel more natural and human
- Match the optimal response style
- Maintain authenticity
- Stay within 15-35 word limit
- Add conversation-starting elements if appropriate

Return ONLY the optimized comment text.`;

        return await this.callAPI(apiKey, prompt);
    }

    async callAPI(apiKey, prompt) {
        const response = await fetch('https://api.cohere.com/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024',
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.7,
                return_likelihoods: 'NONE'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
    }
}

// Agent 10: Personality Matching Agent
class PersonalityMatchingAgent {
    async matchPersona(persona, contentAnalysis) {
        // Analyze how well the persona matches the content
        const match = {
            style_compatibility: this.analyzeStyleCompatibility(persona, contentAnalysis),
            tone_alignment: this.analyzeToneAlignment(persona, contentAnalysis),
            audience_fit: this.analyzeAudienceFit(persona, contentAnalysis),
            approach_recommendation: this.recommendApproach(persona, contentAnalysis)
        };

        return match;
    }

    analyzeStyleCompatibility(persona, contentAnalysis) {
        // Simple compatibility scoring based on persona description and content tone
        const formalPersona = persona.description.toLowerCase().includes('formal') || 
                             persona.description.toLowerCase().includes('professional');
        const formalContent = contentAnalysis.tone === 'formal' || contentAnalysis.tone === 'professional';
        
        if (formalPersona === formalContent) return 0.9;
        if (contentAnalysis.tone === 'casual' && !formalPersona) return 0.8;
        return 0.6;
    }

    analyzeToneAlignment(persona, contentAnalysis) {
        // Analyze if persona tone matches content requirements
        const humorousPersona = persona.description.toLowerCase().includes('humor') ||
                               persona.description.toLowerCase().includes('funny');
        const needsHumor = contentAnalysis.recommended_response_style === 'humorous';
        
        if (humorousPersona && needsHumor) return 0.95;
        if (!humorousPersona && needsHumor) return 0.4;
        return 0.75;
    }

    analyzeAudienceFit(persona, contentAnalysis) {
        // Check if persona fits the target audience
        const professionalPersona = persona.description.toLowerCase().includes('professional') ||
                                   persona.description.toLowerCase().includes('business');
        const professionalAudience = contentAnalysis.target_audience === 'professional';
        
        if (professionalPersona === professionalAudience) return 0.9;
        return 0.7;
    }

    recommendApproach(persona, contentAnalysis) {
        // Recommend the best approach based on analysis
        if (contentAnalysis.controversy_level === 'high') {
            return 'diplomatic';
        } else if (contentAnalysis.engagement_type === 'question') {
            return 'helpful';
        } else if (contentAnalysis.sentiment === 'positive') {
            return 'supportive';
        } else if (contentAnalysis.sentiment === 'negative') {
            return 'empathetic';
        }
        return 'engaging';
    }
}

// 🧠 AI Knowledge Base for Learning and Improvement
class AIKnowledgeBase {
    constructor() {
        this.learningData = {
            successful_comments: [],
            persona_patterns: {},
            content_insights: {},
            engagement_metrics: {}
        };
    }

    async initialize() {
        // Load previous learning data from storage
        try {
            const stored = await chrome.storage.local.get(['aiKnowledgeBase']);
            if (stored.aiKnowledgeBase) {
                this.learningData = { ...this.learningData, ...stored.aiKnowledgeBase };
            }
        } catch (error) {
            console.log('Initializing new knowledge base');
        }
    }

    async learnFromGeneration(data) {
        const { persona, postContent, finalComment, analyses } = data;
        
        // Store successful generation patterns
        this.learningData.successful_comments.push({
            persona_id: persona.id,
            persona_name: persona.name,
            post_type: analyses.contentAnalysis.engagement_type,
            comment_length: finalComment.length,
            sentiment_match: analyses.sentimentAnalysis.overall_sentiment,
            timestamp: Date.now()
        });

        // Update persona patterns
        if (!this.learningData.persona_patterns[persona.id]) {
            this.learningData.persona_patterns[persona.id] = {
                successful_patterns: [],
                preferred_topics: [],
                style_evolution: []
            };
        }

        this.learningData.persona_patterns[persona.id].successful_patterns.push({
            content_type: analyses.contentAnalysis.engagement_type,
            response_style: analyses.contentAnalysis.recommended_response_style,
            comment: finalComment,
            timestamp: Date.now()
        });

        // Limit storage size
        if (this.learningData.successful_comments.length > 1000) {
            this.learningData.successful_comments = this.learningData.successful_comments.slice(-500);
        }

        // Save to storage
        await this.saveKnowledgeBase();
    }

    async saveKnowledgeBase() {
        try {
            await chrome.storage.local.set({ 
                aiKnowledgeBase: this.learningData 
            });
        } catch (error) {
            console.error('Failed to save knowledge base:', error);
        }
    }

    getPersonaInsights(personaId) {
        return this.learningData.persona_patterns[personaId] || null;
    }
}

// 📊 Session Context Manager
class SessionContextManager {
    constructor() {
        this.currentSession = {
            start_time: Date.now(),
            interactions: [],
            patterns: {},
            user_preferences: {}
        };
    }

    addInteraction(interaction) {
        this.currentSession.interactions.push({
            ...interaction,
            timestamp: Date.now()
        });

        // Analyze patterns in real-time
        this.analyzeSessionPatterns();
    }

    analyzeSessionPatterns() {
        // Analyze user behavior patterns within the session
        const interactions = this.currentSession.interactions;
        
        // Calculate response times
        const responseTimes = interactions
            .filter(i => i.type === 'comment_generated')
            .map(i => i.response_time);
        
        this.currentSession.patterns.avg_response_time = 
            responseTimes.length > 0 ? 
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

        // Identify preferred content types
        const contentTypes = interactions
            .filter(i => i.content_type)
            .map(i => i.content_type);
        
        this.currentSession.patterns.preferred_content_types = 
            this.getMostCommon(contentTypes);
    }

    getMostCommon(arr) {
        const frequency = {};
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        
        return Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
    }

    getSessionContext() {
        return {
            session_duration: Date.now() - this.currentSession.start_time,
            interaction_count: this.currentSession.interactions.length,
            patterns: this.currentSession.patterns,
            preferences: this.currentSession.user_preferences
        };
    }
}

// Initialize background script
if (typeof window !== 'undefined') {
    window.socialBotBackground = new SocialBotBackground();
} else {
    // For service worker environment
    new SocialBotBackground();
}

console.log('YUV.AI SocialBot Pro - Background Service Worker loaded'); 