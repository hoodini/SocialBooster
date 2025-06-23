// AI Intelligent Scroll Agent - סוכן גלילה חכם עם Transformers.js
// משתמש בזיהוי תוכן מקומי לקבלת החלטות גלילה מושכלות

class IntelligentScrollAgent {
    constructor() {
        this.isActive = false;
        this.isInitialized = false;
        this.classifier = null;
        this.emotionAnalyzer = null;
        this.visualization = null;
        this.settings = {};
        
        // Scroll intelligence state
        this.scrollHistory = [];
        this.contentScores = new Map();
        this.lastScrollTime = 0;
        this.scrollVelocity = 0;
        this.userEngagementLevel = 0;
        
        console.log('🧠 Intelligent Scroll Agent initializing...');
        this.initializeAI();
    }

    async initializeAI() {
        try {
            console.log('🤖 Initializing intelligent scrolling with rule-based AI...');
            
            // Use advanced rule-based AI instead of external models
            // This is safer and doesn't require external dependencies
            this.isInitialized = true;
            this.useFallbackMode = false; // We're using our smart rule-based system
            
            console.log('✅ Intelligent rule-based AI system initialized for scrolling');
            
            if (this.visualization) {
                this.visualization.addActivity('🧠 מערכת גלילה חכמה מבוססת חוקים');
                this.visualization.addActivity('🎯 ניתוח תוכן מתקדם ומהירות אדפטיבית');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize intelligent scrolling:', error);
            this.isInitialized = true;
            this.useFallbackMode = true;
            
            if (this.visualization) {
                this.visualization.addActivity('⚠️ גלילה במצב בסיסי');
            }
        }
    }

    // Removed external model loading - using rule-based AI instead

    setVisualization(visualization) {
        this.visualization = visualization;
    }

    updateSettings(settings) {
        this.settings = settings;
    }

    async start() {
        if (!this.isInitialized) {
            console.log('⏳ Waiting for AI models to initialize...');
            await this.waitForInitialization();
        }
        
        this.isActive = true;
        this.startIntelligentScrolling();
        
        if (this.visualization) {
            this.visualization.addActivity('🧠 גלילה חכמה עם AI התחילה');
        }
    }

    async stop() {
        this.isActive = false;
        this.stopIntelligentScrolling();
        
        if (this.visualization) {
            this.visualization.addActivity('🧠 גלילה חכמה נעצרה');
        }
    }

    async waitForInitialization() {
        let attempts = 0;
        const maxAttempts = 60; // 30 seconds
        
        while (!this.isInitialized && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!this.isInitialized) {
            console.warn('⚠️ AI models failed to initialize, using fallback logic');
        }
    }

    startIntelligentScrolling() {
        if (this.scrollInterval) return;
        
        // Monitor page continuously for intelligent decisions
        this.scrollInterval = setInterval(async () => {
            await this.performIntelligentAnalysis();
        }, 2000); // Check every 2 seconds
        
        // Monitor user activity
        this.setupUserActivityMonitoring();
        
        console.log('🧠 Intelligent scrolling started with AI analysis');
    }

    stopIntelligentScrolling() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        
        this.removeUserActivityMonitoring();
        console.log('🧠 Intelligent scrolling stopped');
    }

    setupUserActivityMonitoring() {
        // Monitor mouse movement and clicks
        this.mouseHandler = (e) => this.updateUserActivity('mouse', e);
        this.clickHandler = (e) => this.updateUserActivity('click', e);
        this.scrollHandler = (e) => this.updateUserActivity('scroll', e);
        
        document.addEventListener('mousemove', this.mouseHandler);
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('scroll', this.scrollHandler);
    }

    removeUserActivityMonitoring() {
        if (this.mouseHandler) {
            document.removeEventListener('mousemove', this.mouseHandler);
            document.removeEventListener('click', this.clickHandler);
            document.removeEventListener('scroll', this.scrollHandler);
        }
    }

    updateUserActivity(type, event) {
        const now = Date.now();
        
        if (type === 'scroll' && event.isTrusted) {
            // User manual scroll detected
            this.lastUserScrollTime = now;
            this.userEngagementLevel = Math.min(this.userEngagementLevel + 0.1, 1.0);
        } else if (type === 'mouse') {
            this.lastMouseActivity = now;
        } else if (type === 'click') {
            this.lastClickActivity = now;
            this.userEngagementLevel = Math.min(this.userEngagementLevel + 0.2, 1.0);
        }
        
        // Decay engagement over time
        const timeSinceLastActivity = now - (this.lastUserScrollTime || 0);
        if (timeSinceLastActivity > 10000) { // 10 seconds
            this.userEngagementLevel *= 0.95;
        }
    }

    async performIntelligentAnalysis() {
        if (!this.isActive) return;
        
        try {
            // Analyze current viewport content
            const pageAnalysis = await this.analyzeCurrentViewport();
            
            // Get AI decision on scrolling (works with or without AI models)
            const scrollDecision = await this.makeScrollDecision(pageAnalysis);
            
            // Execute decision if appropriate
            if (scrollDecision.shouldScroll) {
                await this.executeIntelligentScroll(scrollDecision);
            }
            
        } catch (error) {
            console.error('🚨 Intelligent scroll analysis error:', error);
            
            // Emergency fallback - simple scroll logic
            if (this.shouldFallbackScroll()) {
                await this.executeFallbackScroll();
            }
        }
    }

    shouldFallbackScroll() {
        const now = Date.now();
        const timeSinceLastScroll = now - this.lastScrollTime;
        const timeSinceUserActivity = now - (this.lastUserScrollTime || 0);
        
        // Simple fallback logic
        return timeSinceLastScroll > 8000 && timeSinceUserActivity > 10000;
    }

    async executeFallbackScroll() {
        const scrollAmount = 400;
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        this.lastScrollTime = Date.now();
        
        if (this.visualization) {
            this.visualization.addActivity('📜 גלילה פשוטה (fallback)');
        }
        
        console.log('🔄 Fallback scroll executed');
    }

    async analyzeCurrentViewport() {
        const posts = this.getVisiblePosts();
        const analysis = {
            postsCount: posts.length,
            contentQuality: 0,
            emotionalTone: 'neutral',
            engagementPotential: 0,
            userActivity: this.getUserActivityLevel(),
            scrollPosition: window.scrollY,
            viewportHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight
        };

        if (posts.length === 0) {
            return analysis;
        }

        // Analyze content with AI models
        const contentTexts = posts.map(post => this.extractPostText(post)).filter(text => text.length > 10);
        
        if (contentTexts.length > 0 && this.classifier) {
            try {
                // Analyze sentiment/quality of visible content
                const sentimentResults = await Promise.all(
                    contentTexts.slice(0, 3).map(text => this.classifier(text.substring(0, 512)))
                );
                
                // Calculate average content quality
                const avgSentiment = sentimentResults.reduce((sum, result) => {
                    return sum + (result[0].label === 'POSITIVE' ? result[0].score : -result[0].score);
                }, 0) / sentimentResults.length;
                
                analysis.contentQuality = (avgSentiment + 1) / 2; // Normalize to 0-1
                
                // Analyze emotional tone if available
                if (this.emotionAnalyzer && contentTexts.length > 0) {
                    const emotionResult = await this.emotionAnalyzer(contentTexts[0].substring(0, 256));
                    analysis.emotionalTone = emotionResult[0].label.toLowerCase();
                }
                
                if (this.visualization) {
                    this.visualization.addActivity(`🔍 ניתוח תוכן: איכות ${(analysis.contentQuality * 100).toFixed(0)}%`);
                }
                
            } catch (error) {
                console.warn('⚠️ AI analysis failed, using fallback:', error);
            }
        }

        // Calculate engagement potential based on content types
        analysis.engagementPotential = this.calculateEngagementPotential(posts);
        
        return analysis;
    }

    getVisiblePosts() {
        const selectors = [
            '[data-urn*="activity:"]',
            '.feed-shared-update-v2',
            '.feed-post',
            '.post',
            '[role="article"]',
            '.entry-content'
        ];
        
        let posts = [];
        for (const selector of selectors) {
            posts = Array.from(document.querySelectorAll(selector));
            if (posts.length > 0) break;
        }
        
        // Filter for visible posts
        return posts.filter(post => {
            const rect = post.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        });
    }

    extractPostText(postElement) {
        const textElements = postElement.querySelectorAll('.feed-shared-text, .post-content, p, .entry-content');
        let text = '';
        
        textElements.forEach(el => {
            text += el.textContent + ' ';
        });
        
        return text.trim().substring(0, 1000); // Limit text length
    }

    calculateEngagementPotential(posts) {
        let potential = 0;
        
        posts.forEach(post => {
            // Check for engagement indicators
            const likes = post.querySelectorAll('[aria-label*="like"], .like-button');
            const comments = post.querySelectorAll('[aria-label*="comment"], .comment-button');
            const shares = post.querySelectorAll('[aria-label*="share"], .share-button');
            
            potential += (likes.length * 0.3 + comments.length * 0.5 + shares.length * 0.2);
        });
        
        return Math.min(potential / posts.length, 1.0);
    }

    getUserActivityLevel() {
        const now = Date.now();
        const timeSinceLastScroll = now - (this.lastUserScrollTime || 0);
        const timeSinceLastClick = now - (this.lastClickActivity || 0);
        const timeSinceLastMouse = now - (this.lastMouseActivity || 0);
        
        // User is active if any recent activity
        const isActive = timeSinceLastScroll < 30000 || timeSinceLastClick < 60000 || timeSinceLastMouse < 20000;
        
        return {
            isActive,
            engagementLevel: this.userEngagementLevel,
            timeSinceLastScroll,
            timeSinceLastClick
        };
    }

    async makeScrollDecision(analysis) {
        const decision = {
            shouldScroll: false,
            direction: 'down',
            amount: 300,
            speed: 'smooth',
            reason: 'No action needed',
            confidence: 0
        };

        // Don't scroll if user is actively using the page
        if (analysis.userActivity.timeSinceLastScroll < 5000) {
            decision.reason = 'User recently scrolled manually';
            return decision;
        }

        // Don't scroll if at bottom of page
        const scrollProgress = (analysis.scrollPosition + analysis.viewportHeight) / analysis.documentHeight;
        if (scrollProgress > 0.95) {
            decision.reason = 'Near bottom of page';
            return decision;
        }

        // AI-based decision making
        let scrollScore = 0;
        
        // Content quality factor (higher quality = slower scroll)
        if (analysis.contentQuality > 0.7) {
            scrollScore += 0.3; // Good content, scroll slowly
            decision.amount = 200;
        } else if (analysis.contentQuality < 0.3) {
            scrollScore += 0.8; // Poor content, scroll faster
            decision.amount = 500;
        } else {
            scrollScore += 0.5; // Medium content, normal scroll
            decision.amount = 350;
        }
        
        // Engagement potential factor
        scrollScore += analysis.engagementPotential * 0.3;
        
        // User engagement level factor
        if (analysis.userActivity.engagementLevel > 0.7) {
            scrollScore += 0.4; // User is engaged, continue showing content
        } else if (analysis.userActivity.engagementLevel < 0.3) {
            scrollScore += 0.1; // User seems disengaged, slow down
        }
        
        // Posts count factor
        if (analysis.postsCount < 2) {
            scrollScore += 0.6; // Few posts visible, load more
        }

        // Make final decision
        decision.confidence = scrollScore;
        if (scrollScore > 0.5) {
            decision.shouldScroll = true;
            decision.reason = `AI decision: score ${scrollScore.toFixed(2)} (quality: ${(analysis.contentQuality * 100).toFixed(0)}%, engagement: ${(analysis.engagementPotential * 100).toFixed(0)}%)`;
        } else {
            decision.reason = `AI decided to wait: score ${scrollScore.toFixed(2)}`;
        }

        return decision;
    }

    async executeIntelligentScroll(decision) {
        const now = Date.now();
        
        // Apply scroll decision
        window.scrollBy({
            top: decision.amount,
            behavior: decision.speed
        });
        
        // Record scroll action
        this.scrollHistory.push({
            timestamp: now,
            amount: decision.amount,
            reason: decision.reason,
            confidence: decision.confidence
        });
        
        // Keep only recent history
        if (this.scrollHistory.length > 50) {
            this.scrollHistory = this.scrollHistory.slice(-30);
        }
        
        this.lastScrollTime = now;
        
        if (this.visualization) {
            this.visualization.addActivity(`📜 ${decision.reason}`);
        }
        
        console.log('🧠 Intelligent scroll executed:', decision);
    }

    // Analytics and reporting
    getScrollAnalytics() {
        return {
            totalScrolls: this.scrollHistory.length,
            averageConfidence: this.scrollHistory.reduce((sum, s) => sum + s.confidence, 0) / this.scrollHistory.length,
            userEngagementLevel: this.userEngagementLevel,
            isAIInitialized: this.isInitialized,
            recentDecisions: this.scrollHistory.slice(-10)
        };
    }
}

// Export for use in main system
window.IntelligentScrollAgent = IntelligentScrollAgent; 