// YUV.AI SocialBot Pro - Content Script with AI Agents System
// ארכיטקטורה חדשה עם מערכת סוכני AI מושלמת

class YuvAISocialBotPro {
    constructor() {
        this.isActive = false;
        this.settings = {};
        this.aiAgentsSystem = null;
        this.visualization = null;
        this.platform = this.detectPlatform();
        this.extensionId = chrome.runtime.id;
        
        console.log('🚀 YUV.AI SocialBot Pro initializing...');
        this.init();
    }

    async init() {
        try {
            // Wait for AI Agents System to be available
            await this.waitForAIAgentsSystem();
            
            // Initialize AI Agents System
            this.aiAgentsSystem = new AIAgentsSystem();
            
            // Initialize visualization first
            await this.initializeVisualization();
            
            // Setup message listeners
            this.setupMessageListeners();
            
            // Load settings
            await this.loadSettings();
            
            // Setup AI Agents with visualization and settings
            this.aiAgentsSystem.setVisualization(this.visualization);
            this.aiAgentsSystem.setSettings(this.settings);
            
            // Start the system if enabled
            if (this.settings.globallyEnabled) {
                await this.start();
            }
            
            console.log('✅ YUV.AI SocialBot Pro initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize YUV.AI SocialBot Pro:', error);
        }
    }

    async waitForAIAgentsSystem() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.AIAgentsSystem && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.AIAgentsSystem) {
            throw new Error('AI Agents System not loaded');
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
        
        // Update AI Agents with new settings
        if (this.aiAgentsSystem) {
            this.aiAgentsSystem.setSettings(this.settings);
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
        if (!this.aiAgentsSystem) return;
        
        const scrollAgent = this.aiAgentsSystem.agents.get('scrollAgent');
        if (!scrollAgent) return;
        
        if (this.settings.autoScroll && this.isActive) {
            await scrollAgent.start();
        } else {
            await scrollAgent.stop();
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
            
            console.log('⚙️ Settings loaded:', this.settings);
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

    async start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🚀 YUV.AI SocialBot Pro Starting...');
        
        if (this.visualization) {
            this.visualization.addActivity('מערכת החלה לפעול');
            this.visualization.setSystemStatus('פעילה');
        }
        
        // Start AI Agents System
        if (this.aiAgentsSystem) {
            await this.aiAgentsSystem.start();
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
        
        // Stop AI Agents System
        if (this.aiAgentsSystem) {
            await this.aiAgentsSystem.stop();
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

    detectPlatform() {
        const hostname = window.location.hostname.toLowerCase();
        
        if (hostname.includes('linkedin.com')) {
            return 'linkedin';
        } else if (hostname.includes('facebook.com')) {
            return 'facebook';
        } else {
            return 'unknown';
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

// Wait for DOM and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            new YuvAISocialBotPro();
        }, 1000);
    });
} else {
    setTimeout(() => {
        new YuvAISocialBotPro();
    }, 1000);
}

// Global access for debugging
window.YuvAISocialBotPro = YuvAISocialBotPro; 