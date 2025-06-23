// AI Platform Detection Agent - סוכן זיהוי פלטפורמה אוטומטי עם AI
// מזהה אוטומטית את הפלטפורמה הנוכחית ומנהל state מתקדם

// Prevent multiple initializations
if (window.PlatformDetectionAgentLoaded) {
    console.log('🔄 Platform Detection Agent already loaded, skipping...');
} else {
    window.PlatformDetectionAgentLoaded = true;

class PlatformDetectionAgent {
    constructor() {
        this.currentPlatform = null;
        this.platformState = {};
        this.detectionHistory = [];
        this.isInitialized = false;
        this.visualization = null;
        this.stateManager = new PlatformStateManager();
        
        console.log('🔍 Platform Detection Agent initializing...');
        this.initializePlatformDetection();
    }

    async initializePlatformDetection() {
        try {
            // Detect current platform immediately
            await this.detectCurrentPlatform();
            
            // Load saved state for current platform
            await this.loadPlatformState();
            
            // Setup URL change monitoring
            this.setupUrlChangeMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Platform Detection Agent initialized successfully');
            
            if (this.visualization) {
                this.visualization.addActivity(`🔍 זוהתה פלטפורמה: ${this.getPlatformDisplayName()}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize platform detection:', error);
        }
    }

    async detectCurrentPlatform() {
        const url = window.location.href.toLowerCase();
        const hostname = window.location.hostname.toLowerCase();
        
        // Enhanced platform detection with AI analysis
        let detectedPlatform = null;
        let confidence = 0;
        
        // Primary URL-based detection
        if (hostname.includes('linkedin.com')) {
            detectedPlatform = 'linkedin';
            confidence = 0.95;
        } else if (hostname.includes('facebook.com')) {
            detectedPlatform = 'facebook';
            confidence = 0.95;
        } else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
            detectedPlatform = 'x';
            confidence = 0.95;
        }
        
        // Secondary content-based detection for enhanced accuracy
        if (!detectedPlatform || confidence < 0.9) {
            detectedPlatform = await this.performContentBasedDetection();
            confidence = 0.8;
        }
        
        // Update platform info
        this.currentPlatform = detectedPlatform;
        this.detectionHistory.push({
            platform: detectedPlatform,
            url: window.location.href,
            timestamp: Date.now(),
            confidence: confidence
        });
        
        // Keep only recent history
        if (this.detectionHistory.length > 20) {
            this.detectionHistory = this.detectionHistory.slice(-15);
        }
        
        console.log(`🔍 Platform detected: ${detectedPlatform} (confidence: ${(confidence * 100).toFixed(1)}%)`);
        
        return {
            platform: detectedPlatform,
            confidence: confidence,
            url: window.location.href,
            hostname: hostname
        };
    }

    async performContentBasedDetection() {
        try {
            // Look for platform-specific elements and patterns
            const platformIndicators = this.analyzePlatformIndicators();
            
            // LinkedIn indicators
            if (platformIndicators.linkedin > 0.7) {
                return 'linkedin';
            }
            
            // Facebook indicators
            if (platformIndicators.facebook > 0.7) {
                return 'facebook';
            }
            
            // X/Twitter indicators
            if (platformIndicators.x > 0.7) {
                return 'x';
            }
            
            return 'unknown';
            
        } catch (error) {
            console.warn('⚠️ Content-based detection failed:', error);
            return 'unknown';
        }
    }

    analyzePlatformIndicators() {
        const indicators = {
            linkedin: 0,
            facebook: 0,
            x: 0
        };
        
        // LinkedIn-specific selectors
        const linkedinSelectors = [
            '[data-urn*="activity:"]',
            '.feed-shared-update-v2',
            '.linkedin-logo',
            '.global-nav',
            '[data-test-id*="linkedin"]'
        ];
        
        // Facebook-specific selectors
        const facebookSelectors = [
            '[data-pagelet="FeedUnit"]',
            '[role="feed"]',
            '.facebook-logo',
            '[data-testid*="facebook"]'
        ];
        
        // X/Twitter-specific selectors
        const xSelectors = [
            '[data-testid="tweet"]',
            '[data-testid="tweetText"]',
            '[aria-label*="Tweet"]',
            '[data-testid="primaryColumn"]',
            '.twitter-logo',
            '[data-testid="sidebarColumn"]'
        ];
        
        // Count matches for each platform
        linkedinSelectors.forEach(selector => {
            if (document.querySelector(selector)) {
                indicators.linkedin += 0.3;
            }
        });
        
        facebookSelectors.forEach(selector => {
            if (document.querySelector(selector)) {
                indicators.facebook += 0.3;
            }
        });
        
        xSelectors.forEach(selector => {
            if (document.querySelector(selector)) {
                indicators.x += 0.3;
            }
        });
        
        // Text content analysis
        const bodyText = document.body.textContent.toLowerCase();
        
        if (bodyText.includes('linkedin') || bodyText.includes('professional network')) {
            indicators.linkedin += 0.2;
        }
        
        if (bodyText.includes('facebook') || bodyText.includes('meta')) {
            indicators.facebook += 0.2;
        }
        
        if (bodyText.includes('twitter') || bodyText.includes('tweet') || bodyText.includes('retweet')) {
            indicators.x += 0.2;
        }
        
        return indicators;
    }

    setupUrlChangeMonitoring() {
        // Monitor URL changes for SPA navigation
        let lastUrl = window.location.href;
        
        const urlCheckInterval = setInterval(async () => {
            const currentUrl = window.location.href;
            
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                console.log('🔄 URL changed, re-detecting platform...');
                
                // Re-detect platform
                await this.detectCurrentPlatform();
                
                // Load state for new platform
                await this.loadPlatformState();
                
                if (this.visualization) {
                    this.visualization.addActivity(`🔄 עבר לפלטפורמה: ${this.getPlatformDisplayName()}`);
                }
                
                // Notify other components about platform change
                this.notifyPlatformChange();
            }
        }, 1000);
        
        // Also listen to history API changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            setTimeout(() => {
                window.dispatchEvent(new Event('platformchange'));
            }, 100);
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            setTimeout(() => {
                window.dispatchEvent(new Event('platformchange'));
            }, 100);
        };
        
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                window.dispatchEvent(new Event('platformchange'));
            }, 100);
        });
        
        window.addEventListener('platformchange', async () => {
            await this.detectCurrentPlatform();
            await this.loadPlatformState();
        });
    }

    async loadPlatformState() {
        if (!this.currentPlatform) return;
        
        try {
            const state = await this.stateManager.loadState(this.currentPlatform);
            this.platformState = state || {};
            
            console.log(`📦 Loaded state for ${this.currentPlatform}:`, this.platformState);
            
        } catch (error) {
            console.warn('⚠️ Failed to load platform state:', error);
            this.platformState = {};
        }
    }

    async savePlatformState(stateData) {
        if (!this.currentPlatform) return;
        
        try {
            // Merge with existing state
            this.platformState = { ...this.platformState, ...stateData };
            
            await this.stateManager.saveState(this.currentPlatform, this.platformState);
            
            console.log(`💾 Saved state for ${this.currentPlatform}:`, stateData);
            
        } catch (error) {
            console.error('❌ Failed to save platform state:', error);
        }
    }

    getPlatformConfig() {
        const configs = {
            linkedin: {
                name: 'LinkedIn',
                displayName: 'לינקדאין',
                selectors: {
                    posts: [
                        '[data-urn*="activity:"]',
                        '.feed-shared-update-v2',
                        '.feed-post'
                    ],
                    likeButtons: [
                        '[aria-label*="Like"]',
                        '[data-test-id="like-button"]',
                        '.react-button'
                    ],
                    commentBoxes: [
                        '[placeholder*="Add a comment"]',
                        '[placeholder*="הוסף תגובה"]',
                        '.comments-comment-box__form textarea'
                    ],
                    authors: [
                        '.feed-shared-actor__name',
                        '.update-components-actor__name',
                        '[data-test-id="post-author"]'
                    ]
                }
            },
            facebook: {
                name: 'Facebook',
                displayName: 'פייסבוק',
                selectors: {
                    posts: [
                        '[data-pagelet="FeedUnit"]',
                        '[role="article"]',
                        '.userContentWrapper'
                    ],
                    likeButtons: [
                        '[aria-label*="Like"]',
                        '[data-testid="fb-ufi-likelink"]'
                    ],
                    commentBoxes: [
                        '[placeholder*="Write a comment"]',
                        '[placeholder*="כתוב תגובה"]'
                    ],
                    authors: [
                        '.actor-name',
                        '[data-testid="post_author_name"]'
                    ]
                }
            },
            x: {
                name: 'X (Twitter)',
                displayName: 'X (טוויטר)',
                selectors: {
                    posts: [
                        '[data-testid="tweet"]',
                        'article[role="article"]',
                        '[data-testid="tweetText"]'
                    ],
                    likeButtons: [
                        '[data-testid="like"]',
                        '[aria-label*="Like"]',
                        '[data-testid="heart"]'
                    ],
                    commentBoxes: [
                        '[data-testid="tweetTextarea_0"]',
                        '[placeholder*="Post your reply"]',
                        '[placeholder*="כתוב תגובה"]'
                    ],
                    authors: [
                        '[data-testid="User-Name"]',
                        '.css-1dbjc4n [dir="ltr"]',
                        '[data-testid="tweet"] [role="link"]'
                    ]
                }
            }
        };
        
        return configs[this.currentPlatform] || configs.linkedin;
    }

    getPlatformDisplayName() {
        const config = this.getPlatformConfig();
        return config.displayName || config.name || 'לא זוהה';
    }

    notifyPlatformChange() {
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('yuvai-platform-changed', {
            detail: {
                platform: this.currentPlatform,
                config: this.getPlatformConfig(),
                state: this.platformState
            }
        }));
    }

    setVisualization(visualization) {
        this.visualization = visualization;
    }

    // Analytics and reporting
    getDetectionAnalytics() {
        return {
            currentPlatform: this.currentPlatform,
            detectionHistory: this.detectionHistory.slice(-10),
            platformState: this.platformState,
            isInitialized: this.isInitialized
        };
    }
}

// State Manager for persistent platform states
class PlatformStateManager {
    constructor() {
        this.storageKey = 'yuvai-platform-states';
    }

    async saveState(platform, state) {
        try {
            const allStates = await this.getAllStates();
            allStates[platform] = {
                ...state,
                lastUpdated: Date.now(),
                version: '1.0'
            };
            
            await chrome.storage.local.set({
                [this.storageKey]: allStates
            });
            
        } catch (error) {
            console.error('❌ Failed to save platform state:', error);
        }
    }

    async loadState(platform) {
        try {
            const allStates = await this.getAllStates();
            return allStates[platform] || {};
            
        } catch (error) {
            console.error('❌ Failed to load platform state:', error);
            return {};
        }
    }

    async getAllStates() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            return result[this.storageKey] || {};
            
        } catch (error) {
            console.error('❌ Failed to get all states:', error);
            return {};
        }
    }

    async clearState(platform) {
        try {
            const allStates = await this.getAllStates();
            delete allStates[platform];
            
            await chrome.storage.local.set({
                [this.storageKey]: allStates
            });
            
        } catch (error) {
            console.error('❌ Failed to clear platform state:', error);
        }
    }
}

// Export for use in main system
window.PlatformDetectionAgent = PlatformDetectionAgent;
window.PlatformStateManager = PlatformStateManager;

} // Close the if statement that prevents multiple initializations 