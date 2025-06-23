// AI Smart Agents - סוכני AI אמיתיים עם חשיבה
// משתמשים ב-Cohere API v2 לקבלת החלטות חכמות

class AISmartAgentsSystem {
    constructor() {
        this.agents = new Map();
        this.isActive = false;
        this.visualization = null;
        this.settings = null;
        this.cohereApiKey = null;
        
        console.log('🧠 AI Smart Agents System initializing...');
        this.initializeSmartAgents();
    }

    async initializeSmartAgents() {
        // Load API key
        await this.loadCohereApiKey();
        
        // Initialize smart AI agents
        this.agents.set('scrollDecisionAgent', new ScrollDecisionAgent(this));
        this.agents.set('contentAnalysisAgent', new ContentAnalysisAgent(this));
        this.agents.set('commentQualityAgent', new CommentQualityAgent(this));
        this.agents.set('strategyAgent', new StrategyAgent(this));
        this.agents.set('engagementAnalysisAgent', new EngagementAnalysisAgent(this));
        
        console.log('🧠 AI Smart Agents initialized with Cohere API v2');
    }

    async loadCohereApiKey() {
        try {
            if (chrome.storage) {
                const result = await chrome.storage.sync.get(['cohereApiKey']);
                this.cohereApiKey = result.cohereApiKey;
            }
        } catch (error) {
            console.error('Failed to load Cohere API key:', error);
        }
    }

    setVisualization(visualization) {
        this.visualization = visualization;
        for (const agent of this.agents.values()) {
            agent.setVisualization(visualization);
        }
    }

    setSettings(settings) {
        this.settings = settings;
        for (const agent of this.agents.values()) {
            agent.updateSettings(settings);
        }
    }

    async start() {
        this.isActive = true;
        console.log('🧠 Starting AI Smart Agents System');
        
        if (this.visualization) {
            this.visualization.addActivity('🧠 מערכת AI Agents חכמה מתחילה');
        }

        // Start all smart agents
        for (const agent of this.agents.values()) {
            await agent.start();
        }
    }

    async stop() {
        this.isActive = false;
        for (const agent of this.agents.values()) {
            await agent.stop();
        }
    }

    // Helper method to call Cohere API v2
    async callCohereAPI(messages, options = {}) {
        if (!this.cohereApiKey) {
            throw new Error('No Cohere API key available');
        }

        try {
            const response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.cohereApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'command-a-03-2025',
                    messages: messages,
                    max_tokens: options.maxTokens || 200,
                    temperature: options.temperature || 0.7,
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error(`Cohere API error: ${response.status}`);
            }

            const data = await response.json();
            return data.message.content[0].text;
        } catch (error) {
            console.error('Cohere API call failed:', error);
            throw error;
        }
    }
}

// Base class for AI agents
class BaseAIAgent {
    constructor(system) {
        this.system = system;
        this.isActive = false;
        this.currentTask = null;
        this.taskCount = 0;
        this.lastActivity = null;
        this.visualization = null;
        this.settings = {};
        this.agentPersonality = this.definePersonality();
    }

    definePersonality() {
        return {
            role: 'AI Agent',
            traits: ['analytical', 'careful', 'strategic'],
            expertise: 'general'
        };
    }

    setVisualization(visualization) {
        this.visualization = visualization;
    }

    updateSettings(settings) {
        this.settings = settings;
    }

    async start() {
        this.isActive = true;
        this.lastActivity = Date.now();
        this.logActivity(`סוכן ${this.constructor.name} מתחיל לפעול`);
    }

    async stop() {
        this.isActive = false;
        this.currentTask = null;
    }

    logActivity(message) {
        this.lastActivity = Date.now();
        console.log(`[${this.constructor.name}] ${message}`);
        if (this.visualization) {
            this.visualization.addActivity(`${this.getAgentIcon()} ${message}`);
        }
    }

    getAgentIcon() {
        return '🧠';
    }

    // Method to think using Cohere API
    async think(prompt, context = {}) {
        try {
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(prompt, context);
            
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ];

            const response = await this.system.callCohereAPI(messages, {
                temperature: 0.3,
                maxTokens: 150
            });

            this.logActivity('חשב והחליט באמצעות AI');
            return this.parseAIResponse(response);
            
        } catch (error) {
            console.error(`${this.constructor.name} thinking failed:`, error);
            return this.fallbackDecision(prompt, context);
        }
    }

    buildSystemPrompt() {
        return `אתה ${this.agentPersonality.role} מומחה ב-${this.agentPersonality.expertise}.
התכונות שלך: ${this.agentPersonality.traits.join(', ')}.
אתה עובד בתוך תוסף Chrome לאוטומציה של LinkedIn.
תמיד תחזיר תשובה מובנית וברורה בפורמט JSON.`;
    }

    buildUserPrompt(prompt, context) {
        return `${prompt}

הקשר נוסף:
${JSON.stringify(context, null, 2)}

תחזיר החלטה במבנה JSON עם השדות הבאים:
- decision: החלטה ברורה (true/false או ערך ספציפי)
- reasoning: הסבר קצר לההחלטה
- confidence: רמת ביטחון (0-100)
- action: פעולה מומלצת`;
    }

    parseAIResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback parsing
            return {
                decision: response.includes('כן') || response.includes('true'),
                reasoning: response.substring(0, 100),
                confidence: 70,
                action: 'continue'
            };
        } catch (error) {
            return this.fallbackDecision(response);
        }
    }

    fallbackDecision(prompt, context) {
        return {
            decision: true,
            reasoning: 'Fallback decision due to API failure',
            confidence: 50,
            action: 'continue'
        };
    }
}

// 1. סוכן קבלת החלטות גלילה חכם
class ScrollDecisionAgent extends BaseAIAgent {
    constructor(system) {
        super(system);
        this.scrollHistory = [];
        this.pageAnalysis = null;
    }

    definePersonality() {
        return {
            role: 'Smart Scroll Decision Agent',
            traits: ['strategic', 'observant', 'patient'],
            expertise: 'page navigation and content discovery'
        };
    }

    getAgentIcon() { return '📜'; }

    async shouldScroll(currentPageState) {
        this.currentTask = 'deciding_scroll';
        this.logActivity('מחליט האם לגלול בדף');

        const decision = await this.think(
            `האם כדאי לגלול בדף הזה כרגע? נתח את המצב והחלט.`,
            {
                visiblePosts: currentPageState.visiblePosts,
                processedPosts: currentPageState.processedPosts,
                scrollPosition: currentPageState.scrollPosition,
                timeOnPage: currentPageState.timeOnPage,
                lastScrollTime: this.getLastScrollTime(),
                userActivity: currentPageState.userActivity
            }
        );

        this.currentTask = null;
        this.taskCount++;
        
        return decision;
    }

    async analyzeScrollDirection(pageState) {
        this.logActivity('מנתח כיוון גלילה אופטימלי');

        const decision = await this.think(
            `באיזה כיוון וכמה לגלול? נתח את המצב הנוכחי של הדף.`,
            {
                currentPosts: pageState.currentPosts,
                newContentBelow: pageState.newContentBelow,
                userEngagement: pageState.userEngagement,
                scrollSpeed: this.settings.scrollSpeed
            }
        );

        return decision;
    }

    async shouldPauseForPost(postElement) {
        const postData = await this.extractBasicPostData(postElement);
        
        const decision = await this.think(
            `האם כדאי לעצור ולעבד את הפוסט הזה?`,
            {
                postAuthor: postData.author,
                postContent: postData.content.substring(0, 200),
                postEngagement: postData.metrics,
                ourStrategy: this.settings.strategy,
                timeConstraints: this.getTimeConstraints()
            }
        );

        return decision;
    }

    async extractBasicPostData(element) {
        // Quick extraction for decision making
        const author = element.querySelector('.feed-shared-actor__name')?.textContent?.trim() || 'Unknown';
        const content = element.querySelector('.feed-shared-text')?.textContent?.trim() || '';
        const metrics = {
            likes: this.extractNumber(element, '[aria-label*="like"]'),
            comments: this.extractNumber(element, '[aria-label*="comment"]')
        };

        return { author, content, metrics };
    }

    extractNumber(element, selector) {
        const el = element.querySelector(selector);
        if (el) {
            const match = el.textContent.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }
        return 0;
    }

    getLastScrollTime() {
        return this.scrollHistory.length > 0 ? 
               Date.now() - this.scrollHistory[this.scrollHistory.length - 1] : 
               0;
    }

    getTimeConstraints() {
        return {
            maxSessionTime: 30 * 60 * 1000, // 30 minutes
            currentSessionTime: Date.now() - (this.sessionStartTime || Date.now())
        };
    }
}

// 2. סוכן ניתוח תוכן מתקדם
class ContentAnalysisAgent extends BaseAIAgent {
    definePersonality() {
        return {
            role: 'Content Analysis Expert',
            traits: ['perceptive', 'thorough', 'insightful'],
            expertise: 'content analysis and social media understanding'
        };
    }

    getAgentIcon() { return '🔍'; }

    async analyzePost(postData) {
        this.currentTask = 'analyzing_content';
        this.logActivity(`מנתח פוסט של ${postData.author}`);

        const analysis = await this.think(
            `נתח את הפוסט הזה ותן המלצות לאינטראקציה`,
            {
                author: postData.author,
                content: postData.content,
                metrics: postData.metrics,
                timestamp: postData.timestamp,
                language: postData.language
            }
        );

        this.currentTask = null;
        this.taskCount++;
        
        return analysis;
    }

    async shouldEngage(postData, analysisResult) {
        const decision = await this.think(
            `האם כדאי לעשות אינטראקציה עם הפוסט הזה?`,
            {
                postAnalysis: analysisResult,
                postData: postData,
                ourPersona: this.settings.currentPersona,
                engagementGoals: this.settings.engagementGoals
            }
        );

        return decision;
    }

    async suggestEngagementType(postData) {
        const suggestion = await this.think(
            `איזה סוג של אינטראקציה הכי מתאים לפוסט הזה?`,
            {
                postContent: postData.content,
                postAuthor: postData.author,
                postMetrics: postData.metrics,
                availableActions: ['like', 'heart', 'comment', 'share', 'save']
            }
        );

        return suggestion;
    }
}

// 3. סוכן בקרת איכות תגובות מתקדם
class CommentQualityAgent extends BaseAIAgent {
    definePersonality() {
        return {
            role: 'Comment Quality Inspector',
            traits: ['meticulous', 'professional', 'culturally-aware'],
            expertise: 'content quality and professional communication'
        };
    }

    getAgentIcon() { return '✨'; }

    async evaluateComment(comment, postData) {
        this.currentTask = 'evaluating_comment';
        this.logActivity('בודק איכות תגובה עם AI');

        const evaluation = await this.think(
            `בדוק את איכות התגובה הזו ותן ציון מפורט`,
            {
                comment: comment,
                originalPost: {
                    content: postData.content,
                    author: postData.author,
                    language: postData.language
                },
                qualityCriteria: [
                    'relevance',
                    'professionalism', 
                    'authenticity',
                    'language_match',
                    'value_addition'
                ]
            }
        );

        this.currentTask = null;
        this.taskCount++;
        
        return evaluation;
    }

    async improveComment(originalComment, evaluationResult, postData) {
        this.logActivity('משפר תגובה על בסיס משוב AI');

        const improvement = await this.think(
            `שפר את התגובה הזו על בסיס הניתוח`,
            {
                originalComment: originalComment,
                issues: evaluationResult.issues,
                suggestions: evaluationResult.suggestions,
                postContext: postData,
                targetQuality: 85
            }
        );

        return improvement;
    }

    async detectInappropriateContent(comment) {
        const detection = await this.think(
            `בדוק האם יש תוכן לא מתאים בתגובה הזו`,
            {
                comment: comment,
                checkFor: [
                    'spam',
                    'commercial_content', 
                    'inappropriate_language',
                    'off_topic',
                    'promotional_content'
                ]
            }
        );

        return detection;
    }
}

// 4. סוכן אסטרטגיה כללי
class StrategyAgent extends BaseAIAgent {
    definePersonality() {
        return {
            role: 'Strategic Planning Agent',
            traits: ['strategic', 'forward-thinking', 'adaptive'],
            expertise: 'social media strategy and automation planning'
        };
    }

    getAgentIcon() { return '🎯'; }

    async planSessionStrategy(currentContext) {
        this.currentTask = 'planning_strategy';
        this.logActivity('מתכנן אסטרטגיית התקשרות');

        const strategy = await this.think(
            `תכנן אסטרטגיה לסשן האוטומציה הזה`,
            {
                timeAvailable: currentContext.timeAvailable,
                userGoals: currentContext.userGoals,
                platformState: currentContext.platformState,
                previousSessions: currentContext.previousSessions,
                currentTrends: currentContext.currentTrends
            }
        );

        this.currentTask = null;
        return strategy;
    }

    async adjustStrategy(currentResults, sessionProgress) {
        const adjustment = await this.think(
            `האם צריך לעדכן את האסטרטגיה על בסיס התוצאות עד כה?`,
            {
                currentResults: currentResults,
                sessionProgress: sessionProgress,
                timeRemaining: sessionProgress.timeRemaining,
                goalAchievement: sessionProgress.goalAchievement
            }
        );

        return adjustment;
    }

    async optimizeEngagementTiming() {
        const timing = await this.think(
            `מה הזמן האופטימלי למשך הפעולות השונות?`,
            {
                currentTime: new Date().getHours(),
                userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platformActivity: this.estimatePlatformActivity(),
                userPreferences: this.settings.timingPreferences
            }
        );

        return timing;
    }

    estimatePlatformActivity() {
        const hour = new Date().getHours();
        // Business hours logic for LinkedIn
        if (hour >= 9 && hour <= 17) {
            return 'high';
        } else if (hour >= 7 && hour <= 21) {
            return 'medium';
        } else {
            return 'low';
        }
    }
}

// 5. סוכן ניתוח engagement
class EngagementAnalysisAgent extends BaseAIAgent {
    definePersonality() {
        return {
            role: 'Engagement Analysis Expert',
            traits: ['analytical', 'data-driven', 'insightful'],
            expertise: 'social media engagement and performance analysis'
        };
    }

    getAgentIcon() { return '📊'; }

    async analyzeEngagementOpportunity(postData, userHistory) {
        this.currentTask = 'analyzing_engagement';
        this.logActivity('מנתח הזדמנות engagement');

        const analysis = await this.think(
            `נתח את ההזדמנות לעשות engagement עם הפוסט הזה`,
            {
                post: postData,
                authorProfile: this.analyzeAuthorProfile(postData.author),
                userHistory: userHistory,
                engagementGoals: this.settings.engagementGoals,
                industryContext: this.settings.industryFocus
            }
        );

        this.currentTask = null;
        return analysis;
    }

    async predictEngagementOutcome(actionType, postData) {
        const prediction = await this.think(
            `נבא את התוצאה הצפויה מהפעולה הזו`,
            {
                actionType: actionType,
                postData: postData,
                historicalData: this.getHistoricalEngagementData(),
                currentTrends: this.getCurrentTrends()
            }
        );

        return prediction;
    }

    analyzeAuthorProfile(authorName) {
        // Basic profile analysis
        return {
            name: authorName,
            estimatedFollowers: this.estimateFollowers(authorName),
            engagementLikely: authorName !== 'Unknown Author'
        };
    }

    estimateFollowers(authorName) {
        // Simple heuristic
        return authorName.length > 10 ? 'high' : 'medium';
    }

    getHistoricalEngagementData() {
        // Mock historical data - in real implementation, this would come from storage
        return {
            averageLikeResponse: 0.3,
            averageCommentResponse: 0.1,
            bestPerformingTimeSlots: ['9-11', '14-16', '19-21']
        };
    }

    getCurrentTrends() {
        // Mock trend data
        return {
            trendingTopics: ['AI', 'automation', 'productivity'],
            peakActivityHours: new Date().getHours()
        };
    }
}

// Global export
window.AISmartAgentsSystem = AISmartAgentsSystem;
window.ScrollDecisionAgent = ScrollDecisionAgent;
window.ContentAnalysisAgent = ContentAnalysisAgent;
window.CommentQualityAgent = CommentQualityAgent;
window.StrategyAgent = StrategyAgent;
window.EngagementAnalysisAgent = EngagementAnalysisAgent; 