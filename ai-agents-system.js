// AI Agents System - מערכת סוכני AI מושלמת
// ארכיטקטורה מודולרית לכל סוכן עם אחריות נפרדת

class AIAgentsSystem {
    constructor() {
        this.agents = new Map();
        this.isActive = false;
        this.currentTask = null;
        this.taskQueue = [];
        this.visualization = null;
        this.settings = null;
        this.platform = 'linkedin';
        
        // Initialize all agents
        this.initializeAgents();
        console.log('🤖 AI Agents System initialized');
    }

    initializeAgents() {
        // 1. סוכן גלילה חכם
        this.agents.set('scrollAgent', new ScrollAgent(this));
        
        // 2. סוכן חילוץ תוכן
        this.agents.set('contentExtractor', new ContentExtractorAgent(this));
        
        // 3. סוכן יצירת תגובות
        this.agents.set('commentGenerator', new CommentGeneratorAgent(this));
        
        // 4. סוכן ביקורת תגובות
        this.agents.set('commentReviewer', new CommentReviewerAgent(this));
        
        // 5. סוכן הזרקת תגובות
        this.agents.set('commentInjector', new CommentInjectorAgent(this));
        
        // 6. סוכן ניטור ואיסוף נתונים
        this.agents.set('dataMonitor', new DataMonitorAgent(this));
        
        // 7. סוכן תגובות ללחיצות
        this.agents.set('replyHandler', new ReplyHandlerAgent(this));
        
        // 8. סוכן לייקים חכם
        this.agents.set('likeAgent', new LikeAgent(this));
    }

    setVisualization(visualization) {
        this.visualization = visualization;
        // Update all agents with visualization
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
        console.log('🚀 Starting AI Agents System');
        
        if (this.visualization) {
            this.visualization.addActivity('מערכת AI Agents מתחילה לפעול');
        }

        // Start monitoring agent first
        await this.agents.get('dataMonitor').start();
        
        // Start scroll agent if auto-scroll is enabled
        if (this.settings?.autoScroll) {
            await this.agents.get('scrollAgent').start();
        }
        
        // Start reply handler
        await this.agents.get('replyHandler').start();
        
        // Start like agent
        await this.agents.get('likeAgent').start();
    }

    async stop() {
        this.isActive = false;
        console.log('🛑 Stopping AI Agents System');
        
        for (const agent of this.agents.values()) {
            await agent.stop();
        }
        
        if (this.visualization) {
            this.visualization.addActivity('מערכת AI Agents נעצרה');
        }
    }

    async processPost(postElement) {
        if (!this.isActive) return;
        
        const task = {
            id: Date.now(),
            type: 'PROCESS_POST',
            postElement,
            status: 'pending',
            timestamp: Date.now()
        };
        
        this.taskQueue.push(task);
        await this.executeTask(task);
    }

    async executeTask(task) {
        this.currentTask = task;
        task.status = 'processing';
        
        try {
            switch (task.type) {
                case 'PROCESS_POST':
                    await this.processPostWorkflow(task.postElement);
                    break;
                case 'HANDLE_REPLY':
                    await this.handleReplyWorkflow(task.replyData);
                    break;
            }
            
            task.status = 'completed';
        } catch (error) {
            console.error('Task execution failed:', error);
            task.status = 'failed';
            task.error = error.message;
        } finally {
            this.currentTask = null;
        }
    }

    async processPostWorkflow(postElement) {
        // Step 1: Extract content
        const contentAgent = this.agents.get('contentExtractor');
        const postData = await contentAgent.extractPostData(postElement);
        
        if (!postData) {
            console.log('Failed to extract post data');
            return;
        }

        // Step 2: Monitor and store data
        const monitorAgent = this.agents.get('dataMonitor');
        await monitorAgent.recordPost(postData);

        // Step 3: Handle likes if enabled
        if (this.settings?.autoLikes) {
            const likeAgent = this.agents.get('likeAgent');
            await likeAgent.processLike(postElement, postData);
        }

        // Step 4: Handle comments if enabled
        if (this.settings?.autoComments) {
            await this.processCommentWorkflow(postElement, postData);
        }
    }

    async processCommentWorkflow(postElement, postData) {
        // Step 1: Generate comment
        const generator = this.agents.get('commentGenerator');
        const generatedComment = await generator.generateComment(postData);
        
        if (!generatedComment) {
            console.log('Failed to generate comment');
            return;
        }

        // Step 2: Review comment
        const reviewer = this.agents.get('commentReviewer');
        const reviewResult = await reviewer.reviewComment(generatedComment, postData);
        
        if (!reviewResult.approved) {
            console.log('Comment rejected by reviewer:', reviewResult.reason);
            // Try again with feedback
            const improvedComment = await generator.improveComment(generatedComment, reviewResult.feedback);
            if (improvedComment) {
                const secondReview = await reviewer.reviewComment(improvedComment, postData);
                if (secondReview.approved) {
                    await this.injectComment(postElement, improvedComment);
                }
            }
            return;
        }

        // Step 3: Inject comment
        await this.injectComment(postElement, generatedComment);
    }

    async injectComment(postElement, comment) {
        const injector = this.agents.get('commentInjector');
        await injector.injectComment(postElement, comment);
    }

    async handleReplyWorkflow(replyData) {
        const handler = this.agents.get('replyHandler');
        await handler.processReply(replyData);
    }

    getSystemStatus() {
        const agentStatuses = {};
        for (const [name, agent] of this.agents) {
            agentStatuses[name] = {
                isActive: agent.isActive,
                currentTask: agent.currentTask,
                taskCount: agent.taskCount || 0,
                lastActivity: agent.lastActivity
            };
        }
        
        return {
            isActive: this.isActive,
            currentTask: this.currentTask,
            queueLength: this.taskQueue.length,
            agents: agentStatuses
        };
    }
}

// Base Agent Class
class BaseAgent {
    constructor(system) {
        this.system = system;
        this.isActive = false;
        this.currentTask = null;
        this.taskCount = 0;
        this.lastActivity = null;
        this.visualization = null;
        this.settings = {};
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
        return '🤖';
    }
}

// 1. סוכן גלילה חכם
class ScrollAgent extends BaseAgent {
    constructor(system) {
        super(system);
        this.isScrolling = false;
        this.scrollTimer = null;
        this.pausedForPost = false;
    }

    getAgentIcon() { return '📜'; }

    async start() {
        await super.start();
        if (this.settings.autoScroll) {
            this.startSmartScrolling();
            this.logActivity('החל גלילה חכמה');
            if (this.visualization) {
                this.visualization.scannerActive('גלילה אוטומטית פעילה');
            }
        }
    }

    async stop() {
        await super.stop();
        this.stopScrolling();
        if (this.visualization) {
            this.visualization.scannerStandby();
        }
    }

    startSmartScrolling() {
        if (this.isScrolling || !this.settings.autoScroll) return;
        
        this.isScrolling = true;
        this.performSmartScroll();
    }

    async performSmartScroll() {
        if (!this.isActive || !this.isScrolling || this.pausedForPost || !this.settings.autoScroll) {
            return;
        }

        try {
            // Find unprocessed posts
            const posts = this.findUnprocessedPosts();
            
            if (posts.length > 0) {
                this.logActivity(`נמצאו ${posts.length} פוסטים לעיבוד`);
                
                // Pause scrolling and let content processing happen
                this.pausedForPost = true;
                
                // Process the most visible post
                const targetPost = this.selectBestPost(posts);
                await this.system.processPost(targetPost);
                
                // Resume after processing
                setTimeout(() => {
                    this.pausedForPost = false;
                    this.performSmartScroll();
                }, 3000);
                
            } else {
                // Continue scrolling to find new content
                this.scrollToNewContent();
                
                // Schedule next scroll
                this.scrollTimer = setTimeout(() => {
                    this.performSmartScroll();
                }, this.getScrollDelay());
            }
        } catch (error) {
            console.error('Smart scroll error:', error);
            this.scrollTimer = setTimeout(() => {
                this.performSmartScroll();
            }, 5000);
        }
    }

    findUnprocessedPosts() {
        const posts = document.querySelectorAll('.feed-shared-update-v2');
        return Array.from(posts).filter(post => {
            const rect = post.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight + 200;
            const isProcessed = post.dataset.agentProcessed === 'true';
            return isVisible && !isProcessed;
        });
    }

    selectBestPost(posts) {
        // Select the post most centered in viewport
        return posts.reduce((best, current) => {
            const currentRect = current.getBoundingClientRect();
            const bestRect = best.getBoundingClientRect();
            
            const currentCenter = Math.abs(currentRect.top + currentRect.height/2 - window.innerHeight/2);
            const bestCenter = Math.abs(bestRect.top + bestRect.height/2 - window.innerHeight/2);
            
            return currentCenter < bestCenter ? current : best;
        });
    }

    scrollToNewContent() {
        const scrollAmount = window.innerHeight * 0.7; // 70% of viewport
        window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
        this.logActivity(`גולל ${Math.round(scrollAmount)}px למטה`);
    }

    getScrollDelay() {
        const speed = this.settings.scrollSpeed || 2;
        const baseDelay = 5000; // 5 seconds base
        return baseDelay / speed + Math.random() * 2000; // Add randomness
    }

    stopScrolling() {
        this.isScrolling = false;
        this.pausedForPost = false;
        if (this.scrollTimer) {
            clearTimeout(this.scrollTimer);
            this.scrollTimer = null;
        }
        this.logActivity('גלילה נעצרה');
    }
}

// 2. סוכן חילוץ תוכן
class ContentExtractorAgent extends BaseAgent {
    getAgentIcon() { return '📄'; }

    async extractPostData(postElement) {
        this.currentTask = 'extracting_content';
        this.logActivity('מחלץ נתוני פוסט');
        
        if (this.visualization) {
            this.visualization.analyzerActive('מנתח תוכן פוסט');
        }

        try {
            const postData = {
                id: this.extractPostId(postElement),
                author: this.extractAuthor(postElement),
                content: this.extractContent(postElement),
                timestamp: this.extractTimestamp(postElement),
                metrics: this.extractMetrics(postElement),
                language: this.detectLanguage(postElement),
                element: postElement
            };

            // Mark as processed
            postElement.dataset.agentProcessed = 'true';
            
            this.taskCount++;
            this.currentTask = null;
            
            if (this.visualization) {
                this.visualization.analyzerStandby();
            }
            
            this.logActivity(`תוכן חולץ בהצלחה: ${postData.author}`);
            return postData;
            
        } catch (error) {
            console.error('Content extraction failed:', error);
            this.currentTask = null;
            return null;
        }
    }

    extractPostId(element) {
        // Try multiple selectors for LinkedIn post ID
        const selectors = [
            '[data-urn*="urn:li:activity:"]',
            '[data-id*="urn:li:activity:"]'
        ];
        
        for (const selector of selectors) {
            const idElement = element.querySelector(selector) || element.closest(selector);
            if (idElement) {
                const urn = idElement.dataset.urn || idElement.dataset.id;
                if (urn && urn.includes('urn:li:activity:')) {
                    return urn;
                }
            }
        }
        
        return `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractAuthor(element) {
        const selectors = [
            '.feed-shared-actor__name',
            '.update-components-actor__name',
            '.feed-shared-actor__title',
            '[data-test-id="post-author-name"]',
            '.feed-shared-actor__container-link .visually-hidden',
            'a[data-control-name="actor"] .visually-hidden',
            '.artdeco-entity-lockup__title',
            '.feed-shared-actor__container a[href*="/in/"] span[aria-hidden="true"]',
            '.update-components-actor__meta a span[aria-hidden="true"]'
        ];
        
        for (const selector of selectors) {
            const authorElement = element.querySelector(selector);
            if (authorElement && authorElement.textContent.trim()) {
                let name = authorElement.textContent.trim();
                name = name.replace(/\s+/g, ' ').replace(/^\s*View\s*/i, '').replace(/\s*profile.*$/i, '');
                if (name.length > 2 && !name.includes('View') && !name.includes('profile')) {
                    return name;
                }
            }
        }
        
        return 'Unknown Author';
    }

    extractContent(element) {
        const contentSelectors = [
            '.feed-shared-text',
            '.feed-shared-inline-show-more-text',
            '.update-components-text',
            '[data-test-id="main-feed-activity-card"] .feed-shared-text'
        ];
        
        for (const selector of contentSelectors) {
            const contentElement = element.querySelector(selector);
            if (contentElement) {
                return contentElement.textContent.trim();
            }
        }
        
        return '';
    }

    extractTimestamp(element) {
        const timeElement = element.querySelector('time, [data-test-id="post-timestamp"]');
        if (timeElement) {
            return timeElement.dateTime || timeElement.textContent.trim();
        }
        return new Date().toISOString();
    }

    extractMetrics(element) {
        const metrics = {
            likes: 0,
            comments: 0,
            shares: 0
        };
        
        // Extract like count
        const likeElement = element.querySelector('[aria-label*="like"], .social-counts__reactions');
        if (likeElement) {
            const likeText = likeElement.textContent || likeElement.getAttribute('aria-label') || '';
            const likeMatch = likeText.match(/(\d+)/);
            if (likeMatch) {
                metrics.likes = parseInt(likeMatch[1]);
            }
        }
        
        // Extract comment count
        const commentElement = element.querySelector('[aria-label*="comment"]');
        if (commentElement) {
            const commentText = commentElement.textContent || commentElement.getAttribute('aria-label') || '';
            const commentMatch = commentText.match(/(\d+)/);
            if (commentMatch) {
                metrics.comments = parseInt(commentMatch[1]);
            }
        }
        
        return metrics;
    }

    detectLanguage(element) {
        const content = this.extractContent(element);
        // Simple Hebrew detection
        const hebrewPattern = /[\u0590-\u05FF]/;
        return hebrewPattern.test(content) ? 'he' : 'en';
    }
}

// 3. סוכן יצירת תגובות
class CommentGeneratorAgent extends BaseAgent {
    getAgentIcon() { return '✍️'; }

    async generateComment(postData) {
        this.currentTask = 'generating_comment';
        this.logActivity(`יוצר תגובה לפוסט של ${postData.author}`);
        
        if (this.visualization) {
            this.visualization.commenterActive('יוצר תגובה חכמה');
        }

        try {
            // First try AI generation
            const aiComment = await this.generateWithAI(postData);
            
            if (aiComment) {
                this.taskCount++;
                this.currentTask = null;
                
                if (this.visualization) {
                    this.visualization.commenterStandby();
                }
                
                this.logActivity('תגובה נוצרה בהצלחה עם AI');
                return aiComment;
            }
            
            // Fallback to smart templates
            const fallbackComment = this.generateFallbackComment(postData);
            this.currentTask = null;
            
            if (this.visualization) {
                this.visualization.commenterStandby();
            }
            
            this.logActivity('תגובה נוצרה עם תבנית fallback');
            return fallbackComment;
            
        } catch (error) {
            console.error('Comment generation failed:', error);
            this.currentTask = null;
            return null;
        }
    }

    async generateWithAI(postData) {
        try {
            // Check if extension context is valid
            if (!chrome.runtime?.id) {
                console.log('Extension context invalid, using fallback');
                return null;
            }

            const response = await Promise.race([
                chrome.runtime.sendMessage({
                    type: 'GENERATE_COMMENT',
                    data: {
                        postContent: postData.content,
                        author: postData.author,
                        language: postData.language,
                        platform: 'linkedin',
                        context: {
                            metrics: postData.metrics,
                            timestamp: postData.timestamp
                        }
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 8000)
                )
            ]);

            if (response && response.success && response.comment) {
                return response.comment;
            }
            
            return null;
        } catch (error) {
            console.log('AI generation failed:', error.message);
            return null;
        }
    }

    generateFallbackComment(postData) {
        const language = postData.language || 'en';
        const templates = language === 'he' ? this.getHebrewTemplates() : this.getEnglishTemplates();
        
        // Select template based on content type
        const selectedTemplate = this.selectTemplateByContent(postData.content, templates);
        
        return this.personalizeTemplate(selectedTemplate, postData);
    }

    getHebrewTemplates() {
        return [
            "תודה על השיתוף! נקודה מעניינת מאוד 🎯",
            "פוסט מעורר מחשבה. אשמח לשמוע עוד על הנושא 💭",
            "תובנה מצוינת! זה באמת רלוונטי 👏",
            "דעה מעניינת. יש לי ניסיון דומה בתחום 🤝",
            "שיתוף איכותי! זה נותן מבט חדש על הנושא ✨",
            "נושא חשוב. תודה על הבהרה המקצועית 🎓",
            "פוסט מועיל מאוד. שמור לי להמשך 📌",
            "תוכן איכותי! זה מוסיף ערך אמיתי 💎"
        ];
    }

    getEnglishTemplates() {
        return [
            "Great insights! This adds real value to the discussion 🎯",
            "Thought-provoking post. Thanks for sharing your perspective 💭",
            "Excellent point! This is really relevant to current trends 👏",
            "Interesting perspective. I've had similar experiences 🤝",
            "Quality content! This gives a fresh take on the topic ✨",
            "Important topic. Thanks for the professional insights 🎓",
            "Very helpful post. Saving this for later reference 📌",
            "Valuable content! This brings genuine insight 💎"
        ];
    }

    selectTemplateByContent(content, templates) {
        // Simple content analysis to select appropriate template
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('שיתוף') || lowerContent.includes('share')) {
            return templates[0] || templates[Math.floor(Math.random() * templates.length)];
        }
        
        if (lowerContent.includes('מחשבה') || lowerContent.includes('thought')) {
            return templates[1] || templates[Math.floor(Math.random() * templates.length)];
        }
        
        // Default random selection
        return templates[Math.floor(Math.random() * templates.length)];
    }

    personalizeTemplate(template, postData) {
        // Add slight personalization based on author or content
        if (postData.author !== 'Unknown Author') {
            // Could add author-specific touches here
        }
        
        return template;
    }

    async improveComment(originalComment, feedback) {
        this.logActivity('משפר תגובה על בסיס משובים');
        
        // Try to improve with AI first
        const improvedAI = await this.improveWithAI(originalComment, feedback);
        if (improvedAI) {
            return improvedAI;
        }
        
        // Fallback improvement
        return this.improveFallback(originalComment, feedback);
    }

    async improveWithAI(originalComment, feedback) {
        try {
            if (!chrome.runtime?.id) return null;

            const response = await chrome.runtime.sendMessage({
                type: 'IMPROVE_COMMENT',
                data: {
                    originalComment,
                    feedback,
                    language: this.detectLanguage(originalComment)
                }
            });

            return response?.success ? response.comment : null;
        } catch (error) {
            return null;
        }
    }

    improveFallback(originalComment, feedback) {
        // Simple improvement strategies
        if (feedback.includes('too short')) {
            return originalComment + ' אשמח לדעת מה דעתכם על כך!';
        }
        
        if (feedback.includes('language')) {
            // Try to fix language issues
            return originalComment.replace(/[^\u0590-\u05FF\s\p{P}\p{N}]/gu, '');
        }
        
        return originalComment;
    }

    detectLanguage(text) {
        const hebrewPattern = /[\u0590-\u05FF]/;
        return hebrewPattern.test(text) ? 'he' : 'en';
    }
}

// 4. סוכן ביקורת תגובות
class CommentReviewerAgent extends BaseAgent {
    getAgentIcon() { return '🔍'; }

    async reviewComment(comment, postData) {
        this.currentTask = 'reviewing_comment';
        this.logActivity('בוחן איכות תגובה');
        
        if (this.visualization) {
            this.visualization.addActivity('🔍 בוחן איכות התגובה');
        }

        try {
            const reviewResult = {
                approved: false,
                reason: '',
                feedback: '',
                score: 0
            };

            // Check language match
            const languageCheck = this.checkLanguageMatch(comment, postData);
            if (!languageCheck.passed) {
                reviewResult.reason = 'Language mismatch';
                reviewResult.feedback = languageCheck.feedback;
                this.logActivity('תגובה נדחתה - אי התאמת שפה');
                return reviewResult;
            }

            // Check comment quality
            const qualityCheck = this.checkCommentQuality(comment);
            if (!qualityCheck.passed) {
                reviewResult.reason = 'Quality issues';
                reviewResult.feedback = qualityCheck.feedback;
                this.logActivity('תגובה נדחתה - בעיות איכות');
                return reviewResult;
            }

            // Check appropriateness
            const appropriatenessCheck = this.checkAppropriateness(comment, postData);
            if (!appropriatenessCheck.passed) {
                reviewResult.reason = 'Inappropriate content';
                reviewResult.feedback = appropriatenessCheck.feedback;
                this.logActivity('תגובה נדחתה - תוכן לא מתאים');
                return reviewResult;
            }

            // All checks passed
            reviewResult.approved = true;
            reviewResult.score = (languageCheck.score + qualityCheck.score + appropriatenessCheck.score) / 3;
            
            this.taskCount++;
            this.currentTask = null;
            this.logActivity('תגובה אושרה בהצלחה');
            
            return reviewResult;
            
        } catch (error) {
            console.error('Comment review failed:', error);
            this.currentTask = null;
            return {
                approved: false,
                reason: 'Review error',
                feedback: error.message,
                score: 0
            };
        }
    }

    checkLanguageMatch(comment, postData) {
        const commentLang = this.detectLanguage(comment);
        const postLang = postData.language;
        
        if (commentLang === postLang) {
            return { passed: true, score: 100, feedback: 'Language match perfect' };
        }
        
        // Allow English comments on Hebrew posts but not vice versa
        if (postLang === 'he' && commentLang === 'en') {
            return { passed: true, score: 80, feedback: 'English comment on Hebrew post is acceptable' };
        }
        
        return {
            passed: false,
            score: 0,
            feedback: `Language mismatch: comment is ${commentLang}, post is ${postLang}`
        };
    }

    checkCommentQuality(comment) {
        const issues = [];
        let score = 100;

        // Check minimum length
        if (comment.length < 10) {
            issues.push('too short');
            score -= 30;
        }

        // Check maximum length
        if (comment.length > 500) {
            issues.push('too long');
            score -= 20;
        }

        // Check for spam patterns
        const spamPatterns = [
            /(.)\1{4,}/, // Repeated characters
            /^[A-Z\s!]{20,}$/, // All caps
            /http[s]?:\/\//, // URLs
            /@\w+/, // @mentions without context
        ];

        for (const pattern of spamPatterns) {
            if (pattern.test(comment)) {
                issues.push('spam pattern detected');
                score -= 40;
            }
        }

        // Check for meaningful content
        const meaningfulWords = comment.match(/\w{3,}/g) || [];
        if (meaningfulWords.length < 3) {
            issues.push('insufficient meaningful content');
            score -= 25;
        }

        return {
            passed: score >= 60,
            score: Math.max(0, score),
            feedback: issues.length > 0 ? `Issues: ${issues.join(', ')}` : 'Quality check passed'
        };
    }

    checkAppropriateness(comment, postData) {
        const inappropriatePatterns = [
            /\b(spam|scam|fake|bot)\b/i,
            /\b(buy|sell|purchase|discount|offer)\b/i,
            /\b(click|link|website|visit)\b/i
        ];

        for (const pattern of inappropriatePatterns) {
            if (pattern.test(comment)) {
                return {
                    passed: false,
                    score: 0,
                    feedback: 'Contains inappropriate commercial content'
                };
            }
        }

        return {
            passed: true,
            score: 100,
            feedback: 'Content is appropriate'
        };
    }

    detectLanguage(text) {
        const hebrewPattern = /[\u0590-\u05FF]/;
        return hebrewPattern.test(text) ? 'he' : 'en';
    }
}

// 5. סוכן הזרקת תגובות
class CommentInjectorAgent extends BaseAgent {
    getAgentIcon() { return '💉'; }

    async injectComment(postElement, comment) {
        this.currentTask = 'injecting_comment';
        this.logActivity('מזריק תגובה לפוסט');
        
        if (this.visualization) {
            this.visualization.commenterActive('מזריק תגובה');
        }

        try {
            // Find or open comment box
            const commentBox = await this.findOrOpenCommentBox(postElement);
            
            if (!commentBox) {
                this.logActivity('לא נמצאה תיבת תגובות');
                this.currentTask = null;
                return false;
            }

            // Inject comment for user approval
            await this.typeCommentSlowly(commentBox, comment);
            
            this.taskCount++;
            this.currentTask = null;
            
            if (this.visualization) {
                this.visualization.commenterStandby();
            }
            
            this.logActivity('תגובה הוזרקה בהצלחה לאישור המשתמש');
            return true;
            
        } catch (error) {
            console.error('Comment injection failed:', error);
            this.currentTask = null;
            return false;
        }
    }

    async findOrOpenCommentBox(postElement) {
        // Try to find existing comment box
        let commentBox = this.findCommentBox(postElement);
        
        if (commentBox) {
            return commentBox;
        }

        // Try to open comment box by clicking comment button
        const commentButton = this.findCommentButton(postElement);
        if (commentButton) {
            commentButton.click();
            
            // Wait for comment box to appear
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            commentBox = this.findCommentBox(postElement);
            return commentBox;
        }

        return null;
    }

    findCommentBox(postElement) {
        const selectors = [
            '.ql-editor[data-placeholder*="comment"]',
            '.ql-editor[data-placeholder*="תגובה"]',
            'div[role="textbox"][data-placeholder*="comment"]',
            'div[role="textbox"][data-placeholder*="תגובה"]',
            '.comments-comment-box__form .ql-editor',
            '.comments-comment-texteditor .ql-editor',
            '[data-test-id="comment-texteditor"] .ql-editor'
        ];

        for (const selector of selectors) {
            const element = postElement.querySelector(selector) || 
                           document.querySelector(selector);
            
            if (element && this.isElementVisible(element)) {
                return element;
            }
        }

        return null;
    }

    findCommentButton(postElement) {
        const selectors = [
            'button[aria-label*="Comment"]',
            'button[aria-label*="תגובה"]',
            '.social-actions-button[data-control-name*="comment"]',
            '[data-test-id="comment-button"]'
        ];

        for (const selector of selectors) {
            const button = postElement.querySelector(selector);
            if (button && this.isElementVisible(button)) {
                return button;
            }
        }

        return null;
    }

    async typeCommentSlowly(commentBox, comment) {
        // Clear existing content
        commentBox.innerHTML = '';
        commentBox.textContent = '';
        
        // Focus the comment box
        commentBox.focus();
        
        // Type character by character with realistic delays
        for (let i = 0; i < comment.length; i++) {
            const char = comment[i];
            
            // Add character
            commentBox.textContent += char;
            
            // Trigger input events
            const inputEvent = new Event('input', { bubbles: true });
            commentBox.dispatchEvent(inputEvent);
            
            // Random delay between characters (30-80ms)
            await new Promise(resolve => 
                setTimeout(resolve, 30 + Math.random() * 50)
            );
        }
        
        // Final events
        const changeEvent = new Event('change', { bubbles: true });
        commentBox.dispatchEvent(changeEvent);
        
        // Add visual indication that this is AI-generated
        this.addAIIndicator(commentBox);
    }

    addAIIndicator(commentBox) {
        // Add a subtle visual indicator
        const indicator = document.createElement('div');
        indicator.textContent = '🤖 AI Generated - Click to approve';
        indicator.style.cssText = `
            position: absolute;
            top: -25px;
            right: 0;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            z-index: 1000;
            pointer-events: none;
        `;
        
        const container = commentBox.closest('.comments-comment-box__form') || commentBox.parentElement;
        if (container) {
            container.style.position = 'relative';
            container.appendChild(indicator);
            
            // Remove indicator after 5 seconds
            setTimeout(() => {
                if (indicator.parentElement) {
                    indicator.remove();
                }
            }, 5000);
        }
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               window.getComputedStyle(element).visibility !== 'hidden';
    }
}

// 6. סוכן ניטור ואיסוף נתונים
class DataMonitorAgent extends BaseAgent {
    constructor(system) {
        super(system);
        this.observedPosts = new Set();
        this.postData = new Map();
        this.metrics = {
            postsViewed: 0,
            likesGiven: 0,
            commentsGenerated: 0,
            scrollsPerformed: 0
        };
    }

    getAgentIcon() { return '📊'; }

    async start() {
        await super.start();
        this.startMonitoring();
        this.logActivity('החל ניטור ואיסוף נתונים');
    }

    async stop() {
        await super.stop();
        this.stopMonitoring();
    }

    startMonitoring() {
        // Monitor page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logActivity('דף הוסתר - שומר מצב');
                this.saveState();
            } else {
                this.logActivity('דף חזר להיות פעיל');
            }
        });

        // Monitor scroll events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.metrics.scrollsPerformed++;
                this.updateVisualizationMetrics();
            }, 150);
        });
    }

    stopMonitoring() {
        // Cleanup would go here
    }

    async recordPost(postData) {
        this.currentTask = 'recording_post';
        
        if (!this.observedPosts.has(postData.id)) {
            this.observedPosts.add(postData.id);
            this.postData.set(postData.id, {
                ...postData,
                timestamp: Date.now(),
                interactions: []
            });
            
            this.metrics.postsViewed++;
            this.logActivity(`פוסט חדש נרשם: ${postData.author}`);
            this.updateVisualizationMetrics();
            
            // Store in IndexedDB (mock for now)
            await this.storePostData(postData);
        }
        
        this.currentTask = null;
    }

    async recordLike(postId, likeData) {
        const post = this.postData.get(postId);
        if (post) {
            post.interactions.push({
                type: 'like',
                timestamp: Date.now(),
                data: likeData
            });
            
            this.metrics.likesGiven++;
            this.logActivity('לייק נרשם במסד הנתונים');
            this.updateVisualizationMetrics();
        }
    }

    async recordComment(postId, commentData) {
        const post = this.postData.get(postId);
        if (post) {
            post.interactions.push({
                type: 'comment',
                timestamp: Date.now(),
                data: commentData
            });
            
            this.metrics.commentsGenerated++;
            this.logActivity('תגובה נרשמה במסד הנתונים');
            this.updateVisualizationMetrics();
        }
    }

    async storePostData(postData) {
        // Mock IndexedDB storage
        try {
            this.logActivity('שומר נתוני פוסט במסד נתונים');
            // In real implementation, this would use IndexedDB
            localStorage.setItem(`post_${postData.id}`, JSON.stringify(postData));
        } catch (error) {
            console.error('Failed to store post data:', error);
        }
    }

    saveState() {
        const state = {
            metrics: this.metrics,
            lastActivity: this.lastActivity,
            observedPostsCount: this.observedPosts.size
        };
        
        localStorage.setItem('aiAgentsState', JSON.stringify(state));
    }

    loadState() {
        try {
            const stateStr = localStorage.getItem('aiAgentsState');
            if (stateStr) {
                const state = JSON.parse(stateStr);
                this.metrics = { ...this.metrics, ...state.metrics };
                this.updateVisualizationMetrics();
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    updateVisualizationMetrics() {
        if (this.visualization) {
            this.visualization.updateCounters(this.metrics);
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// 7. סוכן תגובות ללחיצות
class ReplyHandlerAgent extends BaseAgent {
    constructor(system) {
        super(system);
        this.replyListeners = new Set();
    }

    getAgentIcon() { return '↩️'; }

    async start() {
        await super.start();
        this.attachReplyListeners();
        this.logActivity('מאזין ללחיצות על תגובות');
    }

    async stop() {
        await super.stop();
        this.removeReplyListeners();
    }

    attachReplyListeners() {
        // Use event delegation for better performance
        document.addEventListener('click', this.handleClick.bind(this), true);
    }

    removeReplyListeners() {
        document.removeEventListener('click', this.handleClick.bind(this), true);
    }

    async handleClick(event) {
        const target = event.target;
        
        // Check if clicked on a comment or reply element
        if (this.isCommentElement(target)) {
            const commentData = this.extractCommentData(target);
            if (commentData) {
                await this.processReply(commentData);
            }
        }
    }

    isCommentElement(element) {
        // Check if element is a comment that can be replied to
        const commentSelectors = [
            '.comments-comment-item',
            '.comment-item',
            '[data-test-id="comment-item"]'
        ];

        for (const selector of commentSelectors) {
            if (element.matches(selector) || element.closest(selector)) {
                return true;
            }
        }

        return false;
    }

    extractCommentData(element) {
        const commentElement = element.closest('.comments-comment-item') || 
                              element.closest('.comment-item') ||
                              element.closest('[data-test-id="comment-item"]');
                              
        if (!commentElement) return null;

        try {
            const commentData = {
                id: this.generateCommentId(commentElement),
                author: this.extractCommentAuthor(commentElement),
                content: this.extractCommentContent(commentElement),
                timestamp: this.extractCommentTimestamp(commentElement),
                parentPost: this.findParentPost(commentElement),
                element: commentElement
            };

            return commentData;
        } catch (error) {
            console.error('Failed to extract comment data:', error);
            return null;
        }
    }

    async processReply(commentData) {
        this.currentTask = 'processing_reply';
        this.logActivity(`מעבד תגובה על תגובה של ${commentData.author}`);

        try {
            if (!commentData.parentPost) {
                this.logActivity('לא נמצא פוסט אב לתגובה');
                return;
            }

            // Extract parent post data
            const contentExtractor = this.system.agents.get('contentExtractor');
            const parentPostData = await contentExtractor.extractPostData(commentData.parentPost);

            if (!parentPostData) {
                this.logActivity('נכשל בחילוץ נתוני פוסט אב');
                return;
            }

            // Generate contextual reply
            const generator = this.system.agents.get('commentGenerator');
            const replyComment = await generator.generateReply(parentPostData, commentData);

            if (replyComment) {
                // Review the reply
                const reviewer = this.system.agents.get('commentReviewer');
                const reviewResult = await reviewer.reviewComment(replyComment, parentPostData);

                if (reviewResult.approved) {
                    // Inject the reply
                    const injector = this.system.agents.get('commentInjector');
                    await injector.injectComment(commentData.parentPost, replyComment);
                    
                    this.logActivity('תגובה על תגובה נוצרה בהצלחה');
                } else {
                    this.logActivity('תגובה על תגובה נדחתה בביקורת');
                }
            }

            this.taskCount++;
            this.currentTask = null;

        } catch (error) {
            console.error('Reply processing failed:', error);
            this.currentTask = null;
        }
    }

    generateCommentId(element) {
        return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractCommentAuthor(element) {
        const selectors = [
            '.comments-post-meta__name',
            '.comment-author-name',
            '[data-test-id="comment-author"]'
        ];

        for (const selector of selectors) {
            const authorElement = element.querySelector(selector);
            if (authorElement && authorElement.textContent.trim()) {
                return authorElement.textContent.trim();
            }
        }

        return 'Unknown Commenter';
    }

    extractCommentContent(element) {
        const selectors = [
            '.comments-comment-item__main-content',
            '.comment-content',
            '[data-test-id="comment-content"]'
        ];

        for (const selector of selectors) {
            const contentElement = element.querySelector(selector);
            if (contentElement) {
                return contentElement.textContent.trim();
            }
        }

        return '';
    }

    extractCommentTimestamp(element) {
        const timeElement = element.querySelector('time');
        if (timeElement) {
            return timeElement.dateTime || timeElement.textContent.trim();
        }
        return new Date().toISOString();
    }

    findParentPost(commentElement) {
        return commentElement.closest('.feed-shared-update-v2') ||
               commentElement.closest('[data-test-id="main-feed-activity-card"]');
    }
}

// 8. סוכן לייקים חכם
class LikeAgent extends BaseAgent {
    getAgentIcon() { return '❤️'; }

    async start() {
        await super.start();
        this.logActivity('סוכן לייקים מוכן לפעולה');
    }

    async processLike(postElement, postData) {
        if (!this.settings.autoLikes) return false;
        
        this.currentTask = 'processing_like';
        this.logActivity(`מעבד לייק לפוסט של ${postData.author}`);

        try {
            const likeButton = this.findLikeButton(postElement);
            if (!likeButton) {
                this.logActivity('כפתור לייק לא נמצא');
                return false;
            }

            // Check if already liked
            if (this.isAlreadyLiked(likeButton)) {
                this.logActivity('פוסט כבר קיבל לייק');
                return false;
            }

            // Add delay before liking
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            // Try heart reaction first if enabled
            if (this.settings.heartReaction) {
                const heartSuccess = await this.tryHeartReaction(likeButton);
                if (heartSuccess) {
                    this.logActivity('הגיב עם לב');
                    await this.recordLike(postData, 'heart');
                    return true;
                }
            }

            // Fallback to regular like
            likeButton.click();
            this.logActivity('נתן לייק רגיל');
            await this.recordLike(postData, 'like');

            this.taskCount++;
            this.currentTask = null;
            return true;

        } catch (error) {
            console.error('Like processing failed:', error);
            this.currentTask = null;
            return false;
        }
    }

    findLikeButton(postElement) {
        const selectors = [
            'button[aria-label*="Like"]',
            'button[aria-label*="אהבתי"]',
            '.social-actions-button[data-control-name*="like"]',
            '[data-test-id="like-button"]'
        ];

        for (const selector of selectors) {
            const button = postElement.querySelector(selector);
            if (button && this.isElementVisible(button)) {
                return button;
            }
        }

        return null;
    }

    isAlreadyLiked(likeButton) {
        return likeButton.getAttribute('aria-pressed') === 'true' ||
               likeButton.classList.contains('react-button--active') ||
               likeButton.querySelector('[data-test-id="like-button-active"]') !== null;
    }

    async tryHeartReaction(likeButton) {
        try {
            // Hover over like button to show reactions
            const hoverEvent = new MouseEvent('mouseenter', { bubbles: true });
            likeButton.dispatchEvent(hoverEvent);

            // Wait for reaction menu to appear
            await new Promise(resolve => setTimeout(resolve, 500));

            // Look for heart reaction
            const heartSelectors = [
                'button[data-test-id="love-reaction"]',
                'button[aria-label*="Love"]',
                'button[aria-label*="אהבה"]',
                '.reactions-menu button[data-reaction-type="LOVE"]'
            ];

            for (const selector of heartSelectors) {
                const heartButton = document.querySelector(selector);
                if (heartButton && this.isElementVisible(heartButton)) {
                    heartButton.click();
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.error('Heart reaction failed:', error);
            return false;
        }
    }

    async recordLike(postData, reactionType) {
        const likeData = {
            postId: postData.id,
            author: postData.author,
            reactionType: reactionType,
            timestamp: Date.now()
        };

        // Record with data monitor
        const monitor = this.system.agents.get('dataMonitor');
        await monitor.recordLike(postData.id, likeData);
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               window.getComputedStyle(element).visibility !== 'hidden';
    }
}

// Global export
window.AIAgentsSystem = AIAgentsSystem;
window.BaseAgent = BaseAgent;
window.ScrollAgent = ScrollAgent;
window.ContentExtractorAgent = ContentExtractorAgent;
window.CommentGeneratorAgent = CommentGeneratorAgent;
window.CommentReviewerAgent = CommentReviewerAgent;
window.CommentInjectorAgent = CommentInjectorAgent;
window.DataMonitorAgent = DataMonitorAgent;
window.ReplyHandlerAgent = ReplyHandlerAgent;
window.LikeAgent = LikeAgent; 