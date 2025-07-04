// YUV.AI SocialBot Pro - Content Script with AI Agents System
// ארכיטקטורה חדשה עם מערכת סוכני AI מושלמת

// Prevent multiple initializations with stronger protection
if (window.YuvAISocialBotProInstance) {
    console.log('🔄 YUV.AI SocialBot Pro already initialized, skipping...');
} else {

// Additional protection against redeclaration
if (!window.YuvAISocialBotProClass) {

console.log('content script loaded');

class YuvAISocialBotPro {
    constructor() {
        this.isActive = false;
        this.settings = {};
        this.smartAgentsSystem = null;  // 🧠 מערכת סוכנים חכמים עם AI
        this.visualization = null;
        this.platform = this.detectPlatformFallback(); // Use fallback initially
        this.extensionId = chrome.runtime?.id || 'unknown';
        
        console.log('🧠 YUV.AI SocialBot Pro initializing with Smart AI Agents...');
        this.init();
    }

    async init() {
        try {
            // Wait for Smart AI Agents System to be available
            await this.waitForSmartAIAgentsSystem();
            
            // Initialize Smart AI Agents System 🧠
            this.smartAgentsSystem = new AISmartAgentsSystem();
            await this.smartAgentsSystem.initializeSmartAgents(); // Make sure initialization completes
            
            // Update platform using proper detection agent
            this.updatePlatformFromAgent();
            
            // Setup platform change listener for dynamic platform switching
            this.setupPlatformChangeListener();
            
            // Initialize visualization first
            await this.initializeVisualization();
            
            // Setup message listeners
            this.setupMessageListeners();
            
            // Load settings with platform-aware state management
            await this.loadSettings();
            
            // Setup Smart AI Agents with visualization and settings
            this.smartAgentsSystem.setVisualization(this.visualization);
            this.smartAgentsSystem.setSettings(this.settings);
            
            // Start the system if enabled
            if (this.settings.globallyEnabled) {
                await this.start();
            }
            
            console.log('✅ YUV.AI SocialBot Pro with Smart AI Agents + Platform Detection initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize YUV.AI SocialBot Pro:', error);
        }
    }

    updatePlatformFromAgent() {
        // Get current platform from Platform Detection Agent
        const platformAgent = this.smartAgentsSystem?.agents?.get('platformDetectionAgent');
        if (platformAgent && platformAgent.currentPlatform) {
            this.platform = platformAgent.currentPlatform;
            console.log('🌐 Platform updated from agent:', this.platform);
        }
    }

    detectPlatformFallback() {
        try {
            const hostname = window.location.hostname.toLowerCase();
            
            if (hostname.includes('linkedin.com')) {
                return 'linkedin';
            } else if (hostname.includes('facebook.com')) {
                return 'facebook';
            } else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
                return 'x';
            } else {
                return 'unknown';
            }
        } catch (error) {
            console.warn('Error detecting platform:', error);
            return 'unknown';
        }
    }

    // Legacy method for backward compatibility
    detectPlatform() {
        return this.detectPlatformFallback();
    }

    async waitForSmartAIAgentsSystem() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.AISmartAgentsSystem && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.AISmartAgentsSystem) {
            throw new Error('Smart AI Agents System not loaded');
        }
    }

    async initializeVisualization() {
        try {
            // Wait for visualization to be available
            await this.waitForVisualization();
            
            // Initialize visualization
            this.visualization = new AIAgentsVisualization();
            this.visualization.init();
            
            // Show initial status
            this.visualization.addActivity('מערכת YUV.AI SocialBot Pro מוכנה');
            
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
        }
    }

    async waitForVisualization() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.AIAgentsVisualization && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.AIAgentsVisualization) {
            console.warn('Visualization not available, continuing without it');
        }
    }

    setupMessageListeners() {
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sender, sendResponse);
                return true; // Keep message channel open for async responses
            });
        }
    }

    async handleMessage(message, sender, sendResponse) {
        console.log('📨 Content script received message:', message.type);
        
        try {
            switch (message.type) {
                case 'PING':
                    sendResponse({ success: true, active: this.isActive });
                    break;
                    
                case 'SYNC_SETTINGS':
                    await this.syncSettings(message.settings);
                    sendResponse({ success: true });
                    break;
                    
                case 'TOGGLE_AUTO_SCROLL':
                    await this.toggleAutoScroll();
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_STATUS':
                    const status = this.getSystemStatus();
                    sendResponse({ success: true, status });
                    break;
                    
                case 'START_SYSTEM':
                    await this.start();
                    sendResponse({ success: true });
                    break;
                    
                case 'STOP_SYSTEM':
                    await this.stop();
                    sendResponse({ success: true });
                    break;
                    
                default:
                    console.log('❓ Unknown message type:', message.type);
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async syncSettings(newSettings) {
        if (!newSettings) return;
        
        const oldSettings = { ...this.settings };
        this.settings = { ...newSettings };
        
        console.log('✅ Settings synced from popup:', this.settings);
        
        // Update Smart AI Agents with new settings
        if (this.smartAgentsSystem) {
            this.smartAgentsSystem.setSettings(this.settings);
        }
        
        // Handle auto-scroll toggle
        if (oldSettings.autoScroll !== this.settings.autoScroll) {
            await this.handleAutoScrollChange();
        }
        
        // Start/stop system based on global setting
        if (this.settings.globallyEnabled && !this.isActive) {
            await this.start();
        } else if (!this.settings.globallyEnabled && this.isActive) {
            await this.stop();
        }
        
        if (this.visualization) {
            this.visualization.addActivity('הגדרות עודכנו');
        }
    }

    async handleAutoScrollChange() {
        if (!this.smartAgentsSystem) return;
        
        // Try to use the new intelligent scroll agent first
        const intelligentScrollAgent = this.smartAgentsSystem.agents.get('intelligentScrollAgent');
        const scrollDecisionAgent = this.smartAgentsSystem.agents.get('scrollDecisionAgent');
        
        if (this.settings.autoScroll && this.isActive) {
            // Prefer intelligent scroll agent
            if (intelligentScrollAgent) {
                await intelligentScrollAgent.start();
                if (this.visualization) {
                    this.visualization.addActivity('🧠 גלילה חכמה עם Transformers.js התחילה');
                }
            } else if (scrollDecisionAgent) {
                await scrollDecisionAgent.start();
                this.startSmartScrolling();
            }
        } else {
            // Stop both agents
            if (intelligentScrollAgent) {
                await intelligentScrollAgent.stop();
            }
            if (scrollDecisionAgent) {
                await scrollDecisionAgent.stop();
            }
            this.stopSmartScrolling();
        }
    }

    async toggleAutoScroll() {
        this.settings.autoScroll = !this.settings.autoScroll;
        
        // Update storage
        if (chrome.storage) {
            chrome.storage.sync.set({ autoScroll: this.settings.autoScroll });
        }
        
        await this.handleAutoScrollChange();
        
        if (this.visualization) {
            const status = this.settings.autoScroll ? 'הופעלה' : 'כובתה';
            this.visualization.addActivity(`גלילה אוטומטית ${status}`);
        }
    }

    async loadSettings() {
        try {
            if (chrome.storage) {
                const result = await chrome.storage.sync.get(null);
                this.settings = {
                    globallyEnabled: true,
                    autoLikes: true,
                    autoComments: true,
                    autoScroll: true,
                    scrollSpeed: 2,
                    heartReaction: true,
                    ...result
                };
            } else {
                // Fallback default settings
                this.settings = {
                    globallyEnabled: true,
                    autoLikes: true,
                    autoComments: true,
                    autoScroll: true,
                    scrollSpeed: 2,
                    heartReaction: true
                };
            }
            
            // Load platform-specific state if available
            await this.loadPlatformSpecificState();
            
            console.log('⚙️ Settings loaded with platform state:', this.settings);
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Use default settings
            this.settings = {
                globallyEnabled: true,
                autoLikes: true,
                autoComments: true,
                autoScroll: true,
                scrollSpeed: 2,
                heartReaction: true
            };
        }
    }

    async loadPlatformSpecificState() {
        // Load platform-specific settings and state
        const platformAgent = this.smartAgentsSystem?.agents?.get('platformDetectionAgent');
        if (!platformAgent) return;
        
        try {
            const platformState = platformAgent.platformState || {};
            
            // If platform has saved settings, merge them
            if (platformState.settings) {
                this.settings = { ...this.settings, ...platformState.settings };
            }
            
            // If platform has saved active state, use it
            if (platformState.isActive !== undefined) {
                this.isActive = platformState.isActive;
            }
            
            console.log(`📦 Loaded platform-specific state for ${platformAgent.currentPlatform}:`, platformState);
            
        } catch (error) {
            console.warn('⚠️ Failed to load platform-specific state:', error);
        }
    }

    async start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🚀 YUV.AI SocialBot Pro Starting...');
        
        if (this.visualization) {
            this.visualization.addActivity('מערכת החלה לפעול');
            this.visualization.setSystemStatus('פעילה');
        }
        
        // Start Smart AI Agents System 🧠
        if (this.smartAgentsSystem) {
            await this.smartAgentsSystem.start();
        }
        
        console.log('✅ YUV.AI SocialBot Pro Started Successfully');
    }

    async stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        console.log('🛑 YUV.AI SocialBot Pro Stopping...');
        
        if (this.visualization) {
            this.visualization.addActivity('מערכת נעצרה');
            this.visualization.setSystemStatus('לא פעילה');
        }
        
        // Stop Smart AI Agents System
        if (this.smartAgentsSystem) {
            await this.smartAgentsSystem.stop();
        }
        
        console.log('✅ YUV.AI SocialBot Pro Stopped Successfully');
    }

    getSystemStatus() {
        const baseStatus = {
            isActive: this.isActive,
            platform: this.platform,
            settings: this.settings,
            extensionId: this.extensionId
        };
        
        if (this.aiAgentsSystem) {
            return {
                ...baseStatus,
                aiAgents: this.aiAgentsSystem.getSystemStatus()
            };
        }
        
        return baseStatus;
    }

    // 🧠 Smart scrolling with AI decision making
    async startSmartScrolling() {
        if (this.smartScrollingInterval) return;
        
        this.smartScrollingInterval = setInterval(async () => {
            await this.performSmartScroll();
        }, 3000); // Check every 3 seconds
        
        console.log('🧠 Smart scrolling started');
    }

    stopSmartScrolling() {
        if (this.smartScrollingInterval) {
            clearInterval(this.smartScrollingInterval);
            this.smartScrollingInterval = null;
        }
        console.log('🧠 Smart scrolling stopped');
    }

    async performSmartScroll() {
        if (!this.smartAgentsSystem || !this.isActive) return;
        
        const scrollAgent = this.smartAgentsSystem.agents.get('scrollDecisionAgent');
        const contentAgent = this.smartAgentsSystem.agents.get('contentAnalysisAgent');
        
        if (!scrollAgent || !contentAgent) return;
        
        // Analyze current page state
        const pageState = this.getCurrentPageState();
        
        // Let AI decide if we should scroll
        const decision = await scrollAgent.shouldScroll(pageState);
        
        if (decision.decision) {
            // Get scrolling direction and amount from AI
            const scrollStrategy = await scrollAgent.analyzeScrollDirection(pageState);
            
            if (scrollStrategy.action === 'scroll_down') {
                const scrollAmount = scrollStrategy.scrollAmount || 500;
                window.scrollBy(0, scrollAmount);
                
                if (this.visualization) {
                    this.visualization.addActivity(`📜 גלילה חכמה: ${scrollStrategy.reasoning}`);
                }
            }
        }
    }

    getCurrentPageState() {
        const posts = document.querySelectorAll('[data-urn*="activity:"], .feed-shared-update-v2');
        const visiblePosts = Array.from(posts).filter(post => {
            const rect = post.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight;
        });
        
        return {
            visiblePosts: visiblePosts.length,
            totalPosts: posts.length,
            scrollPosition: window.scrollY,
            timeOnPage: Date.now() - this.pageStartTime || 0,
            userActivity: this.detectUserActivity()
        };
    }

    detectUserActivity() {
        // Simple user activity detection
        return {
            lastUserScroll: this.lastUserScrollTime || 0,
            lastUserClick: this.lastUserClickTime || 0,
            isUserActive: (Date.now() - (this.lastUserActivity || 0)) < 30000 // 30 seconds
        };
    }

    setupPlatformChangeListener() {
        // Listen for platform changes from the Platform Detection Agent
        window.addEventListener('yuvai-platform-changed', async (event) => {
            const { platform, config, state } = event.detail;
            
            console.log(`🔄 Platform changed to: ${platform}`);
            
            // Update current platform
            this.platform = platform;
            
            // Save current settings state to old platform
            await this.savePlatformState();
            
            // Load settings for new platform
            await this.loadSettings();
            
            // Update Smart AI Agents with new settings
            if (this.smartAgentsSystem) {
                this.smartAgentsSystem.setSettings(this.settings);
            }
            
            // Restart system if it was active
            if (this.isActive) {
                await this.stop();
                await this.start();
            }
            
            if (this.visualization) {
                this.visualization.addActivity(`🌐 עבר ל${config.displayName}`);
            }
        });
    }

    getCurrentPlatform() {
        // Get current platform from Platform Detection Agent
        const platformAgent = this.smartAgentsSystem?.agents?.get('platformDetectionAgent');
        return platformAgent?.currentPlatform || this.detectPlatformFallback();
    }

    async savePlatformState() {
        // Save current settings to platform-specific state
        const platformAgent = this.smartAgentsSystem?.agents?.get('platformDetectionAgent');
        if (!platformAgent) return;
        
        try {
            await platformAgent.savePlatformState({
                settings: this.settings,
                isActive: this.isActive,
                lastUsed: Date.now()
            });
        } catch (error) {
            console.warn('⚠️ Failed to save platform state:', error);
        }
    }

    // Check if extension context is still valid
    isExtensionContextValid() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            return false;
        }
    }

    // Enhanced connection check with retry logic
    async checkExtensionConnection() {
        if (!this.isExtensionContextValid()) {
            console.log('🔄 Extension context invalid, may need reload...');
            
            if (this.visualization) {
                this.visualization.addActivity('⚠️ חיבור לתוסף נפסק - נדרש רענון');
            }
            
            return false;
        }
        
        try {
            await chrome.runtime.sendMessage({ type: 'PING' });
            return true;
        } catch (error) {
            console.log('🔄 Extension not responding, may need reload...');
            return false;
        }
    }

    // Legacy compatibility functions for tests
    handleScroll() {
        // Handled by ScrollAgent in AI system
        if (this.aiAgentsSystem) {
            const scrollAgent = this.aiAgentsSystem.agents.get('scrollAgent');
            if (scrollAgent && scrollAgent.isActive) {
                return true;
            }
        }
        return false;
    }

    async processAutoLike(postElement) {
        // Handled by LikeAgent in AI system
        if (this.aiAgentsSystem) {
            const likeAgent = this.aiAgentsSystem.agents.get('likeAgent');
            const contentExtractor = this.aiAgentsSystem.agents.get('contentExtractor');
            
            if (likeAgent && contentExtractor) {
                const postData = await contentExtractor.extractPostData(postElement);
                if (postData) {
                    return await likeAgent.processLike(postElement, postData);
                }
            }
        }
        return false;
    }

    async processAutoComment(postElement) {
        // Handled by AI Agents system workflow
        if (this.aiAgentsSystem) {
            await this.aiAgentsSystem.processPost(postElement);
            return true;
        }
        return false;
    }

    async generateAndPostComment(postElement, postContent) {
        // Handled by CommentGeneratorAgent and CommentInjectorAgent
        if (this.aiAgentsSystem) {
            const generator = this.aiAgentsSystem.agents.get('commentGenerator');
            const injector = this.aiAgentsSystem.agents.get('commentInjector');
            const contentExtractor = this.aiAgentsSystem.agents.get('contentExtractor');
            
            if (generator && injector && contentExtractor) {
                const postData = await contentExtractor.extractPostData(postElement);
                if (postData) {
                    const comment = await generator.generateComment(postData);
                    if (comment) {
                        return await injector.injectComment(postElement, comment);
                    }
                }
            }
        }
        return false;
    }
}

// Enhanced Comment Generation for AI Agents System
if (!window.CommentGeneratorExtensions) {
class CommentGeneratorExtensions {
    static async generateReply(parentPostData, commentData) {
        // Generate contextual reply to a comment
        try {
            if (!chrome.runtime?.id) {
                return this.generateFallbackReply(parentPostData, commentData);
            }

            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_REPLY',
                data: {
                    parentPost: {
                        content: parentPostData.content,
                        author: parentPostData.author
                    },
                    originalComment: {
                        content: commentData.content,
                        author: commentData.author
                    },
                    language: parentPostData.language
                }
            });

            if (response?.success && response.comment) {
                return response.comment;
            }

            return this.generateFallbackReply(parentPostData, commentData);
        } catch (error) {
            return this.generateFallbackReply(parentPostData, commentData);
        }
    }

    static generateFallbackReply(parentPostData, commentData) {
        const language = parentPostData.language || 'en';
        
        const hebrewReplies = [
            `@${commentData.author} נקודה מעניינת! תודה על התוספת 👍`,
            `@${commentData.author} אני מסכים איתך לחלוטין`,
            `@${commentData.author} תודה על השיתוף, זה מוסיף ערך`,
            `@${commentData.author} מעניין לשמוע את הדעה שלך`,
            `@${commentData.author} זה באמת נותן מבט חדש על הנושא`
        ];
        
        const englishReplies = [
            `@${commentData.author} Great point! Thanks for adding to the discussion 👍`,
            `@${commentData.author} I completely agree with you`,
            `@${commentData.author} Thanks for sharing, this adds value`,
            `@${commentData.author} Interesting to hear your perspective`,
            `@${commentData.author} This really gives a fresh take on the topic`
        ];
        
        const replies = language === 'he' ? hebrewReplies : englishReplies;
        return replies[Math.floor(Math.random() * replies.length)];
    }
}

// Add the generateReply method to CommentGeneratorAgent
if (window.CommentGeneratorAgent) {
    window.CommentGeneratorAgent.prototype.generateReply = CommentGeneratorExtensions.generateReply;
}

window.CommentGeneratorExtensions = CommentGeneratorExtensions;
} // Close CommentGeneratorExtensions guard

// Wait for DOM and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const instance = new YuvAISocialBotPro();
            window.YuvAISocialBotProInstance = instance;
        }, 1000);
    });
} else {
    setTimeout(() => {
        const instance = new YuvAISocialBotPro();
        window.YuvAISocialBotProInstance = instance;
    }, 1000);
}

// Global access for debugging
window.YuvAISocialBotPro = YuvAISocialBotPro;
window.YuvAISocialBotProClass = YuvAISocialBotPro; // Mark class as declared

} // Close class protection guard

} // Close the if statement that prevents multiple initializations 