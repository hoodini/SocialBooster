// 🤖 YUV.AI SocialBot Pro - Content Script
// ===============================================

// בדיקה אם הסקריפט כבר נטען כדי למנוע טעינה כפולה
if (typeof window.socialBotContentScriptLoaded !== 'undefined') {
    console.log('⚠️ Content script already loaded, skipping...');
} else {
    window.socialBotContentScriptLoaded = true;
    
    // 🔧 Global State Management
    let socialBotInstance = null;
    let isInitialized = false;

    // 📊 Global Statistics
    let totalLikes = 0;
    let totalComments = 0;
    let totalPosts = 0;
    let totalScrolls = 0;

    // ⚙️ Global Settings
    let settings = {
        globallyEnabled: true,
        autoLike: true,
        autoComment: true,
        autoScroll: true,
        scrollSpeed: 2,
        language: 'he'
    };

    // 🚀 Initialize Content Script
    console.log('🚀 YUV.AI SocialBot Pro Content Script Loading...');

    // 📨 Single Message Listener - Handles ALL Communication
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Content script received message:', request.type);
        
        try {
            switch (request.type) {
                case 'PING':
                    sendResponse({ 
                        status: 'ready',
                        initialized: isInitialized,
                        instanceExists: !!socialBotInstance 
                    });
                    break;
                    
                case 'SYNC_SETTINGS':
                    if (request.settings) {
                        // עדכון הגדרות גלובליות
                        Object.assign(settings, request.settings);
                        console.log('✅ Settings synced from popup:', settings);
                        
                        // עדכון מופע הבוט אם קיים
                        if (socialBotInstance) {
                            socialBotInstance.updateSettings(settings);
                        }
                        
                        // התחלה/עצירה לפי מצב גלובלי
                        handleGlobalStateChange(settings.globallyEnabled);
                    }
                    sendResponse({ status: 'settings_synced' });
                    break;
                    
                case 'GET_STATUS':
                    sendResponse({
                        status: {
                            initialized: isInitialized,
                            instanceExists: !!socialBotInstance,
                            globallyEnabled: settings.globallyEnabled,
                            currentActivity: getCurrentActivity(),
                            stats: getStats()
                        }
                    });
                    break;
                    
                case 'TOGGLE_GLOBAL_STATE':
                    settings.globallyEnabled = request.enabled;
                    console.log('🔄 Global state toggled:', request.enabled);
                    
                    handleGlobalStateChange(request.enabled);
                    
                    sendResponse({ 
                        status: request.enabled ? 'bot_started' : 'bot_stopped',
                        globallyEnabled: settings.globallyEnabled
                    });
                    break;
                    
                case 'FORCE_REINIT':
                    console.log('🔄 Force reinitializing...');
                    initializeBot();
                    sendResponse({ status: 'reinitialized' });
                    break;
                    
                default:
                    console.log('❓ Unknown message type:', request.type);
                    sendResponse({ status: 'unknown_message' });
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            sendResponse({ status: 'error', error: error.message });
        }
        
        return true; // Keep message channel open for async response
    });

    // 🎯 Global State Handler
    function handleGlobalStateChange(enabled) {
        if (enabled) {
            if (!isInitialized) {
                initializeBot();
            } else if (socialBotInstance) {
                socialBotInstance.start();
            }
        } else {
            if (socialBotInstance) {
                socialBotInstance.stop();
            }
        }
    }

    // 🚀 Bot Initialization
    function initializeBot() {
        try {
            console.log('🔄 Initializing SocialBot...');
            
            // יצירת מופע חדש רק אם לא קיים
            if (!socialBotInstance) {
                socialBotInstance = new SocialBotContentScript();
            }
            
            isInitialized = true;
            console.log('✅ SocialBot initialized successfully');
            
            // התחלה אוטומטית אם מופעל גלובלית - אבל לא גלילה אוטומטית
            if (settings.globallyEnabled) {
                setTimeout(() => {
                    if (socialBotInstance) {
                        console.log('🚀 Starting bot (without auto-scroll unless explicitly enabled)');
                        socialBotInstance.start();
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.error('❌ Error initializing bot:', error);
            isInitialized = false;
        }
    }

    // 📊 Status Functions
    function getCurrentActivity() {
        if (!isInitialized || !socialBotInstance) return 'לא מאותחל';
        if (!settings.globallyEnabled) return 'מושבת';
        
        try {
            if (socialBotInstance.autoScrollActive) return 'גלילה אוטומטית';
            if (socialBotInstance.isProcessing) return 'מעבד פוסטים';
            return 'מחכה לפעילות';
        } catch (error) {
            return 'מחכה לפעילות';
        }
    }

    function getStats() {
        return {
            totalLikes: totalLikes,
            totalComments: totalComments,
            totalPosts: totalPosts,
            totalScrolls: totalScrolls
        };
    }

    // 🔄 Load Settings on Startup
    chrome.storage.sync.get([
        'globallyEnabled',
        'autoLikes', 
        'autoComments',
        'autoScroll',
        'scrollSpeed',
        'language',
        'linkedinEnabled',
        'facebookEnabled'
    ]).then(stored => {
        settings = {
            globallyEnabled: stored.globallyEnabled !== false,
            autoLikes: stored.autoLikes !== false,
            autoComments: stored.autoComments !== false,
            autoScroll: stored.autoScroll !== false,
            scrollSpeed: stored.scrollSpeed || 2,
            language: stored.language || 'he',
            linkedinEnabled: stored.linkedinEnabled !== false,
            facebookEnabled: stored.facebookEnabled !== false
        };
        
        console.log('✅ Content script settings loaded:', settings);
        
        // אתחול הבוט
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeBot);
        } else {
            initializeBot();
        }
        
    }).catch(error => {
        console.error('❌ Error loading settings:', error);
        // אתחול עם הגדרות ברירת מחדל
        settings = {
            globallyEnabled: true,
            autoLikes: true,
            autoComments: false,
            autoScroll: false,
            scrollSpeed: 2,
            language: 'he',
            linkedinEnabled: true,
            facebookEnabled: true
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeBot);
        } else {
            initializeBot();
        }
    });

    // יצירת מחלקה לניהול התוסף
    class SocialBotContentScript {
        constructor() {
            console.log('🎯 SocialBotContentScript constructor called');
            
            // בדיקה אם כבר קיים מופע
            if (socialBotInstance && socialBotInstance !== this) {
                console.log('⚠️ SocialBot instance already exists, returning existing instance');
                return socialBotInstance;
            }
            
            // Core state
            this.isRunning = false;
            this.isProcessing = false;
            this.autoScrollActive = false;
            this.platform = this.detectPlatform();
            this.settings = { ...settings }; // Copy global settings
            
            // Post tracking
            this.processedPosts = new Set();
            this.commentedPosts = new Set();
            this.viewTimers = new Map();
            this.observedElements = new WeakSet();
            
            // Comment system
            this.commentQueue = [];
            this.isProcessingQueue = false;
            
            // Scroll tracking
            this.isScrolling = false;
            this.lastScrollTime = 0;
            this.scrollTimeout = null;
            
            // Auto-scroll functionality
            this.autoScrollEnabled = false;
            this.isAutoScrolling = false;
            this.currentScrollPosition = 0;
            this.scrollPausedForPost = false;
            this.waitingForUserAction = false;
            this.autoScrollSpeed = 1;
            this.scrollPauseTimeout = null;
            this.pendingScrollContinue = null;
            
            // Session tracking
            this.sessionId = Date.now();
            this.sessionData = {
                startTime: Date.now(),
                postsViewed: 0,
                likesGiven: 0,
                commentsPosted: 0,
                scrollDistance: 0
            };
            
            // Database
            this.db = null;
            
            // Settings
            this.currentPersonaId = null;
            this.isGloballyEnabled = true;
            
            this.init();
            return this;
        }

        async init() {
            console.log('YUV.AI SocialBot Pro - Content Script initialized on', this.platform);
            await this.loadSettings();
            await this.initAnalyticsDB();
            this.setupEventListeners();
            this.startScrollMonitoring();
            this.startPostMonitoring();
            this.processCommentQueue();
            this.startSessionTracking();
        }

        async initAnalyticsDB() {
            try {
                // בדיקה אם המחלקה כבר קיימת
                if (window.SocialBotDB) {
                    this.db = new window.SocialBotDB();
                    await this.db.init();
                    console.log('Analytics DB initialized successfully (class already loaded)');
                    return;
                }
                
                // טעינת הסקריפט של בסיס הנתונים עם fetch במקום script tag
                console.log('Loading db.js script...');
                try {
                    const response = await fetch(chrome.runtime.getURL('db.js'));
                    const scriptText = await response.text();
                    
                    // הרצת הקוד ישירות
                    eval(scriptText);
                    
                    // המתנה קצרה לוודא שהמחלקה נטענה
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (window.SocialBotDB) {
                        console.log('✅ SocialBotDB class loaded successfully via fetch');
                        this.db = new window.SocialBotDB();
                        await this.db.init();
                        console.log('Analytics DB initialized successfully');
                        return;
                    }
                } catch (fetchError) {
                    console.log('Fetch method failed, trying script tag method...', fetchError);
                }
                
                // אם fetch נכשל, נסה עם script tag
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('db.js');
                
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 15;
                    
                    const checkLoaded = () => {
                        attempts++;
                        console.log(`Checking for SocialBotDB class, attempt ${attempts}/${maxAttempts}`);
                        
                        if (window.SocialBotDB) {
                            console.log('✅ SocialBotDB class found!');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            console.log('❌ SocialBotDB class not found after max attempts');
                            reject(new Error('SocialBotDB class not available after loading script'));
                        } else {
                            setTimeout(checkLoaded, 300);
                        }
                    };
                    
                    script.onload = () => {
                        console.log('db.js script loaded, checking for class...');
                        setTimeout(checkLoaded, 200);
                    };
                    
                    script.onerror = () => {
                        reject(new Error('Failed to load db.js script'));
                    };
                    
                    document.head.appendChild(script);
                    
                    // התחל בדיקה גם ללא onload
                    setTimeout(checkLoaded, 500);
                });
                
                // יצירת המופע
                if (window.SocialBotDB) {
                    this.db = new window.SocialBotDB();
                    await this.db.init();
                    console.log('Analytics DB initialized successfully');
                } else {
                    throw new Error('SocialBotDB class still not available');
                }
                
            } catch (error) {
                console.error('Failed to initialize analytics DB:', error);
                console.log('Analytics will be disabled for this session');
                this.db = null;
            }
        }

        startSessionTracking() {
            // מעקב אחר גלילה
            let lastScrollY = window.scrollY;
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                this.sessionData.scrollDistance += Math.abs(currentScrollY - lastScrollY);
                lastScrollY = currentScrollY;
            });

            // שמירת נתוני הסשן בעת סגירת הדף
            window.addEventListener('beforeunload', () => {
                this.saveSessionData();
            });

            // שמירת נתונים כל 5 דקות
            setInterval(() => {
                this.saveSessionData();
            }, 300000);
        }

        async saveSessionData() {
            if (!this.db) return;
            
            try {
                const sessionData = {
                    ...this.sessionData,
                    endTime: Date.now(),
                    platform: this.platform,
                    url: window.location.href
                };
                
                await this.db.recordSession(sessionData);
            } catch (error) {
                console.error('Failed to save session data:', error);
            }
        }

        detectPlatform() {
            const hostname = window.location.hostname;
            if (hostname.includes('linkedin.com')) return 'linkedin';
            if (hostname.includes('facebook.com')) return 'facebook';
            return 'unknown';
        }

        async loadSettings() {
            try {
                // טעינת הגדרות ישירות מ-storage
                const stored = await chrome.storage.sync.get([
                    'globallyEnabled',
                    'autoLikes',
                    'autoComments',
                    'autoScroll',
                    'scrollSpeed',
                    'linkedinEnabled',
                    'facebookEnabled',
                    'preferHeartReaction',
                    'language',
                    'currentPersonaId',
                    'autoScrollEnabled',
                    'autoScrollSpeed'
                ]);

                this.settings = {
                    globallyEnabled: stored.globallyEnabled !== false,
                    autoLikes: stored.autoLikes !== false,
                    autoComments: stored.autoComments !== false,
                    autoScroll: stored.autoScroll !== false,
                    scrollSpeed: stored.scrollSpeed || 2,
                    linkedinEnabled: stored.linkedinEnabled !== false,
                    facebookEnabled: stored.facebookEnabled !== false,
                    preferHeartReaction: stored.preferHeartReaction !== false,
                    language: stored.language || 'he'
                };

                this.currentPersonaId = stored.currentPersonaId;
                this.isGloballyEnabled = this.settings.globallyEnabled;
                this.autoScrollEnabled = stored.autoScrollEnabled || false;
                this.autoScrollSpeed = stored.autoScrollSpeed || 1;
                
                // עדכון הגדרות גלובליות
                settings = { ...this.settings };
                
                console.log('🔄 Settings loaded:', {
                    globallyEnabled: this.isGloballyEnabled,
                    autoScrollEnabled: this.autoScrollEnabled,
                    autoScrollSpeed: this.autoScrollSpeed,
                    autoLikes: this.settings.autoLikes,
                    autoComments: this.settings.autoComments,
                    persona: this.currentPersonaId
                });
                
            } catch (error) {
                console.error('Failed to load settings:', error);
                // אם יש שגיאה, השאר את המצב הגלובלי כמופעל
                this.isGloballyEnabled = true;
                this.settings = {
                    globallyEnabled: true,
                    autoLikes: true,
                    autoComments: false,
                    autoScroll: false,
                    scrollSpeed: 2,
                    linkedinEnabled: true,
                    facebookEnabled: true,
                    preferHeartReaction: false,
                    language: 'he'
                };
            }
        }

        setupEventListeners() {
            // Remove duplicate message listener - we have one global listener
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            document.addEventListener('mousemove', () => this.handleMouseMove());
            document.addEventListener('click', (e) => this.handleClick(e), true);
        }

        handleMessage(message) {
            switch (message.type) {
                case 'SETTINGS_CHANGED':
                case 'SYNC_SETTINGS':
                    if (message.settings) {
                        this.settings = { ...this.settings, ...message.settings };
                        this.isGloballyEnabled = this.settings.globallyEnabled;
                        
                        // עדכון הגדרות גלובליות
                        settings = { ...this.settings };
                        
                        console.log('🔄 Settings synced:', this.settings);
                        
                        // אם התוסף נכבה, עצור את כל הפעילויות
                        if (!this.isGloballyEnabled) {
                            this.commentQueue = [];
                            this.processedPosts.clear();
                            this.stopAutoScroll();
                            console.log('🛑 All activities stopped - Extension DISABLED');
                        }
                    }
                    break;
                case 'PERSONA_CHANGED':
                    this.currentPersonaId = message.personaId;
                    break;
                case 'TOGGLE_GLOBAL_STATE':
                    this.isGloballyEnabled = message.enabled;
                    this.settings.globallyEnabled = message.enabled;
                    console.log('🔄 Global state changed:', this.isGloballyEnabled ? 'ENABLED' : 'DISABLED');
                    if (!this.isGloballyEnabled) {
                        // נקה את התורים בעת כיבוי
                        this.commentQueue = [];
                        this.processedPosts.clear();
                        this.stopAutoScroll();
                        console.log('🛑 All queues cleared - Extension DISABLED');
                    }
                    break;
                case 'TOGGLE_AUTO_SCROLL':
                    this.autoScrollEnabled = message.enabled;
                    this.autoScrollSpeed = message.speed || 1;
                    console.log('📜 Auto-scroll state changed:', this.autoScrollEnabled ? 'ENABLED' : 'DISABLED', 'Speed:', this.autoScrollSpeed);
                    if (this.autoScrollEnabled && this.isGloballyEnabled) {
                        this.startAutoScroll();
                    } else {
                        this.stopAutoScroll();
                    }
                    break;
                case 'MANUAL_LIKE':
                    return this.executeManualLike();
                case 'MANUAL_COMMENT':
                    return this.executeManualComment();
                case 'PING':
                    return { status: 'ready', platform: this.platform };
                case 'FORCE_REINIT':
                    console.log('🔄 Force reinitialization requested');
                    this.init();
                    break;
            }
        }

        handleScroll() {
            this.isScrolling = true;
            this.lastScrollTime = Date.now();
            if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
                this.checkVisiblePosts();
            }, 100);
        }

        handleMouseMove() {
            if (this.isScrolling && Date.now() - this.lastScrollTime > 500) {
                this.isScrolling = false;
            }
        }

        handleClick(event) {
            const clickedElement = event.target;
            
            // בדיקה אם זה כפתור Reply או אלמנט בתוכו
            if (this.isReplyButton(clickedElement) || this.findParentReplyButton(clickedElement)) {
                const replyButton = this.isReplyButton(clickedElement) ? clickedElement : this.findParentReplyButton(clickedElement);
                console.log('💬 Reply button clicked, scheduling reply generation...');
                setTimeout(() => this.handleReplyClick(replyButton), 1000);
            }
        }

        findParentReplyButton(element) {
            // חיפוש כפתור Reply בהיררכיה של האלמנט
            let current = element;
            while (current && current !== document.body) {
                if (this.isReplyButton(current)) {
                    return current;
                }
                current = current.parentElement;
            }
            return null;
        }

        startScrollMonitoring() {
            this.checkVisiblePosts();
            setInterval(() => {
                if (!this.isScrolling) this.checkVisiblePosts();
            }, 2000);
        }

        startPostMonitoring() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.handlePostVisible(entry.target);
                    } else {
                        this.handlePostHidden(entry.target);
                    }
                });
            }, { threshold: 0.5, rootMargin: '0px' });

            this.observeExistingPosts(observer);
            this.watchForNewPosts(observer);
            this.startReplyMonitoring();
        }

        startReplyMonitoring() {
            // מעקב אחר כפתורי תגובה חדשים
            setInterval(() => {
                if (this.settings.autoComments && this.currentPersonaId) {
                    this.checkForNewReplyButtons();
                }
            }, 3000);
        }

        checkForNewReplyButtons() {
            try {
                const replyButtons = document.querySelectorAll('button[aria-label*="Reply"], button[aria-label*="השב"], .reply-button, [data-control-name="reply"]');
                
                replyButtons.forEach(button => {
                    if (!button.dataset.monitored) {
                        button.dataset.monitored = 'true';
                        button.addEventListener('click', () => {
                            setTimeout(() => this.handleReplyClick(button), 500);
                        });
                        console.log('💬 Added reply button listener');
                    }
                });
            } catch (error) {
                console.error('Error checking for reply buttons:', error);
            }
        }

        async handleReplyClick(replyButton) {
            try {
                console.log('💬 Handling reply button click...');
                
                // מצא את הפוסט או התגובה שמשיבים אליה
                const parentPost = this.findParentPost(replyButton);
                const parentComment = this.findParentComment(replyButton);
                
                if (!parentPost) {
                    console.log('❌ Could not find parent post for reply');
                    return;
                }
                
                // חכה שתיבת התגובה תיפתח
                await this.sleep(1000);
                
                const commentBox = this.findCommentBox(parentPost);
                if (!commentBox) {
                    console.log('❌ Could not find comment box after reply click');
                    return;
                }
                
                // בדוק אם יש פרסונה פעילה
                if (!this.currentPersonaId) {
                    console.log('❌ No active persona for auto-reply');
                    return;
                }
                
                // הפק תגובה
                const postContent = this.extractPostContent(parentPost);
                const postAuthor = this.extractPostAuthor(parentPost);
                
                let contextContent = postContent;
                if (parentComment) {
                    contextContent += '\n\nתגובה מקורית: ' + this.extractCommentContent(parentComment);
                }
                
                const comment = await this.generateComment(contextContent, postAuthor, this.currentPersonaId);
                
                if (comment) {
                    await this.typeInCommentBox(commentBox, comment, parentPost);
                } else {
                    console.log('❌ Failed to generate reply comment');
                }
                
            } catch (error) {
                console.error('Error handling reply click:', error);
            }
        }

        observeExistingPosts(observer) {
            // בדיקת בטיחות
            if (!this.observedElements) {
                console.log('⚠️ observedElements not initialized yet');
                return;
            }
            
            const posts = this.findPosts();
            posts.forEach(post => {
                if (!this.observedElements.has(post)) {
                    observer.observe(post);
                    this.observedElements.add(post);
                }
            });
        }

        watchForNewPosts(observer) {
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const posts = this.findPostsInElement(node);
                            posts.forEach(post => {
                                // בדיקת בטיחות
                                if (this.observedElements && !this.observedElements.has(post)) {
                                    observer.observe(post);
                                    this.observedElements.add(post);
                                }
                            });
                        }
                    });
                });
            });
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }

        findPosts() {
            if (this.platform === 'linkedin') {
                // סלקטורים מדויקים יותר לפוסטים של LinkedIn
                const selectors = [
                    '.feed-shared-update-v2',
                    '[data-id*="urn:li:activity:"]',
                    '.occludable-update',
                    '.feed-shared-update'
                ];
                
                let posts = [];
                for (const selector of selectors) {
                    const foundPosts = Array.from(document.querySelectorAll(selector));
                    // סינון כדי לוודא שזה באמת פוסט ולא אלמנט אחר
                    const validPosts = foundPosts.filter(post => {
                        // בדיקה שיש תוכן פוסט
                        const hasContent = post.querySelector('.feed-shared-text, .feed-shared-inline-show-more-text, [data-test-id="main-feed-activity-card"]');
                        // בדיקה שיש כפתורי פעולה
                        const hasActions = post.querySelector('[aria-label*="Like"], [aria-label*="Comment"], .social-actions-button');
                        // בדיקה שזה לא פוסט מקונן
                        const isMainPost = !post.closest('.comments-comments-list');
                        
                        return hasContent && hasActions && isMainPost;
                    });
                    posts = posts.concat(validPosts);
                }
                
                // הסרת כפילויות
                const uniquePosts = posts.filter((post, index, self) => 
                    index === self.findIndex(p => this.getPostId(p) === this.getPostId(post))
                );
                
                console.log('🔍 Found', uniquePosts.length, 'valid LinkedIn posts');
                return uniquePosts;
                
            } else if (this.platform === 'facebook') {
                return Array.from(document.querySelectorAll('[data-pagelet*="FeedUnit"], [role="article"]'));
            }
            
            return [];
        }

        findPostsInElement(element) {
            if (this.platform === 'linkedin') {
                return element.querySelectorAll('div[data-id^="urn:li:activity:"], .feed-shared-update-v2, .occludable-update');
            } else if (this.platform === 'facebook') {
                return element.querySelectorAll('[data-pagelet="FeedUnit"]');
            }
            return [];
        }

        checkVisiblePosts() {
            const posts = this.findPosts();
            posts.forEach(post => {
                if (this.isElementVisible(post)) {
                    this.handlePostVisible(post);
                }
            });
        }

        isElementVisible(element) {
            if (!element) return false;
            
            const rect = element.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            const viewWidth = window.innerWidth;
            
            // בדיקה שהאלמנט נמצא בתחום הנראה
            const isInViewport = (
                rect.top >= -100 && // מעט מעל המסך
                rect.left >= 0 && 
                rect.bottom <= viewHeight + 100 && // מעט מתחת למסך
                rect.right <= viewWidth && 
                rect.height > 50 && // גובה מינימלי
                rect.width > 100 // רוחב מינימלי
            );
            
            // בדיקה נוספת שהאלמנט אכן גלוי
            const computedStyle = window.getComputedStyle(element);
            const isVisible = (
                computedStyle.display !== 'none' &&
                computedStyle.visibility !== 'hidden' &&
                computedStyle.opacity !== '0'
            );
            
            // בדיקה מיוחדת לפוסטים של LinkedIn
            const isLinkedInPost = element.querySelector('[data-id*="urn:li:activity:"]') || 
                                   element.closest('[data-id*="urn:li:activity:"]') ||
                                   element.classList.contains('feed-shared-update-v2') ||
                                   element.querySelector('.feed-shared-update-v2');
            
            const result = isInViewport && isVisible;
            
            if (result && isLinkedInPost) {
                console.log('👀 LinkedIn post is visible:', {
                    postId: this.getPostId(element).substring(0, 20) + '...',
                    rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
                    viewport: { height: viewHeight }
                });
            }
            
            return result;
        }

        async handlePostVisible(postElement) {
            // בדיקת בטיחות - וודא שכל הפרופרטיז אותחלו
            if (!this.processedPosts || !this.viewTimers || !this.settings) {
                console.log('⚠️ Class not fully initialized yet, skipping post processing');
                return;
            }
            
            const postId = this.getPostId(postElement);
            
            // בדיקה אם התוסף מופעל גלובלית - בדיקה מחמירה
            if (!this.isGloballyEnabled || !this.settings.globallyEnabled || !settings.globallyEnabled) {
                console.log('🛑 Extension globally disabled - skipping post processing:', {
                    thisEnabled: this.isGloballyEnabled,
                    settingsEnabled: this.settings.globallyEnabled,
                    globalSettingsEnabled: settings.globallyEnabled
                });
                return;
            }
            
            if (!postId || this.processedPosts.has(postId) || !this.isPlatformEnabled()) {
                console.log('Post skipped:', {
                    hasPostId: !!postId,
                    alreadyProcessed: this.processedPosts.has(postId),
                    platformEnabled: this.isPlatformEnabled(),
                    globallyEnabled: this.isGloballyEnabled,
                    currentPlatform: this.platform,
                    settings: this.settings
                });
                return;
            }

            if (!this.viewTimers.has(postId)) {
                const timer = { startTime: Date.now(), likeProcessed: false, commentProcessed: false, element: postElement };
                this.viewTimers.set(postId, timer);

                console.log('📄 New post detected:', {
                    postId: postId.substring(0, 20) + '...',
                    platform: this.platform,
                    autoLikes: this.settings.autoLikes,
                    autoComments: this.settings.autoComments,
                    author: this.extractPostAuthor(postElement)
                });

                // רישום הפוסט שנצפה
                if (this.sessionData) {
                    this.sessionData.postsViewed++;
                }
                await this.recordViewedPost(postElement);

                if (this.settings.autoLikes) {
                    console.log('👍 Scheduling auto-like in 1.5 seconds...');
                    setTimeout(() => this.processAutoLike(postId, postElement), 1500);
                } else {
                    console.log('👍 Auto-likes disabled');
                }
                
                // עיבוד תגובות אוטומטיות
                if (this.settings.autoComments && this.currentPersonaId) {
                    setTimeout(() => this.processAutoComment(postId, postElement), 3000);
                }
                
                // אם גלילה אוטומטית מופעלת, עצור את הגלילה עבור הפוסט הזה
                if (this.autoScrollEnabled && this.isAutoScrolling) {
                    this.pauseAutoScrollForPost(postElement, postId);
                }
            }
        }

        async recordViewedPost(postElement) {
            if (!this.db) return;
            
            try {
                const postData = {
                    platform: this.platform,
                    postId: this.getPostId(postElement),
                    author: this.extractPostAuthor(postElement),
                    content: this.extractPostContent(postElement),
                    url: window.location.href,
                    authorProfile: this.extractAuthorProfile(postElement)
                };

                await this.db.recordViewedPost(postData);
            } catch (error) {
                console.error('Failed to record viewed post:', error);
            }
        }

        handlePostHidden(postElement) {
            // בדיקת בטיחות
            if (!this.viewTimers) {
                return;
            }
            
            const postId = this.getPostId(postElement);
            if (postId && this.viewTimers.has(postId)) {
                this.viewTimers.delete(postId);
            }
        }

        getPostId(postElement) {
            if (this.platform === 'linkedin') {
                const dataId = postElement.getAttribute('data-id');
                if (dataId) return dataId;
                const activityId = postElement.querySelector('[data-id^="urn:li:activity:"]');
                if (activityId) return activityId.getAttribute('data-data-id');
            } else if (this.platform === 'facebook') {
                const feedUnit = postElement.getAttribute('data-pagelet');
                if (feedUnit) return feedUnit + '_' + Date.now();
            }
            const textContent = postElement.textContent.substring(0, 100);
            return btoa(textContent).substring(0, 20);
        }

        isPlatformEnabled() {
            if (this.platform === 'linkedin') return this.settings.linkedinEnabled;
            if (this.platform === 'facebook') return this.settings.facebookEnabled;
            return false;
        }

        async processAutoLike(postId, postElement) {
            // בדיקה אם התוסף מופעל גלובלית - בדיקה כפולה
            if (!this.isGloballyEnabled || !this.settings.globallyEnabled || !this.settings.autoLikes) {
                console.log('🛑 Auto-like cancelled - extension disabled:', {
                    isGloballyEnabled: this.isGloballyEnabled,
                    settingsGloballyEnabled: this.settings.globallyEnabled,
                    autoLikes: this.settings.autoLikes
                });
                return;
            }
            
            const timer = this.viewTimers.get(postId);
            if (!timer || timer.likeProcessed) return;
            timer.likeProcessed = true;

            try {
                const likeButton = this.findLikeButton(postElement);
                if (!likeButton) {
                    console.log('Like button not found for post:', postId);
                    return;
                }
                
                const wasAlreadyLiked = this.isAlreadyLiked(likeButton);
                console.log('Like button state:', {
                    postId: postId,
                    alreadyLiked: wasAlreadyLiked,
                    buttonType: likeButton.tagName,
                    className: likeButton.className,
                    ariaPressed: likeButton.getAttribute('aria-pressed')
                });
                
                if (wasAlreadyLiked) {
                    console.log('Post already liked, skipping:', postId);
                    return;
                }

                // הוספת עיכוב אקראי למניעת זיהוי בוט
                await this.sleep(500 + Math.random() * 1000);
                
                // בדיקה אם להשתמש בלב אהבה
                if (this.settings.preferHeartReaction && this.platform === 'linkedin') {
                    const heartSuccess = await this.tryHeartReaction(likeButton, postElement);
                    if (heartSuccess) {
                        this.sessionData.likesGiven++;
                        await this.recordLike(postElement, 'heart');
                        
                        const author = this.extractPostAuthor(postElement);
                        this.addRealtimeActivity(`❤️ נתתי לב אהבה לפוסט של ${author}`);
                        this.addActivityNotification('like', `לב אהבה נשלח לפוסט של ${author}`);
                        
                        // עדכון סטטיסטיקות אם ההקשר תקף
                        if (chrome.runtime?.id) {
                            chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { likes: 1 } });
                        }
                        console.log('❤️ Successfully auto-hearted post:', postId);
                        return;
                    }
                }
                
                await this.simulateHumanClick(likeButton);
                
                // חכה ובדוק שהלייק אכן נוסף
                await this.sleep(1000);
                const newState = this.isAlreadyLiked(likeButton);
                
                if (newState) {
                    // רישום הלייק באנליטיקה רק אם הלייק אכן נוסף
                    this.sessionData.likesGiven++;
                    await this.recordLike(postElement);
                    
                    // עדכון סטטיסטיקות אם ההקשר תקף
                    if (chrome.runtime?.id) {
                        chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { likes: 1 } });
                    }
                    
                    const author = this.extractPostAuthor(postElement);
                    this.addActivityNotification('like', `לייק נשלח לפוסט של ${author}`);
                    console.log('Successfully auto-liked post:', postId);
                } else {
                    console.log('Like may not have been registered for post:', postId);
                }
            } catch (error) {
                console.error('Error processing auto-like:', error);
                await this.recordError(error, 'auto-like', postElement);
            }
        }

        async tryHeartReaction(likeButton, postElement) {
            try {
                console.log('🔄 Attempting heart reaction...');
                
                // לחץ לחיצה ארוכה על כפתור הלייק כדי להציג תגובות
                const longPressEvent = new MouseEvent('mousedown', { 
                    bubbles: true, 
                    cancelable: true, 
                    view: window,
                    button: 0
                });
                likeButton.dispatchEvent(longPressEvent);
                
                // המתן לטעינת תפריט התגובות
                await this.sleep(800);
                
                // חפש את כפתור הלב
                const heartButton = document.querySelector('button[aria-label*="Love"], button[data-reaction-type="LOVE"], .reactions-menu button[aria-label*="❤"], .reactions-menu .reaction-love');
                
                if (heartButton) {
                    console.log('❤️ Found heart reaction button');
                    await this.simulateHumanClick(heartButton);
                    
                    // המתן לוודא שהתגובה נרשמה
                    await this.sleep(500);
                    
                    // בדיקה אם הלב נבחר
                    const isHeartSelected = likeButton.querySelector('svg[aria-label*="Love"]') || 
                                          likeButton.classList.contains('love-reaction') ||
                                          likeButton.getAttribute('aria-pressed') === 'true';
                    
                    if (isHeartSelected) {
                        console.log('❤️ Heart reaction successfully applied!');
                        return true;
                    }
                } else {
                    console.log('❤️ Heart reaction button not found, falling back to regular like');
                }
                
                // אם לא מצאנו לב או שזה לא עבד, בטל את הלחיצה הארוכה
                const mouseUpEvent = new MouseEvent('mouseup', { 
                    bubbles: true, 
                    cancelable: true, 
                    view: window 
                });
                likeButton.dispatchEvent(mouseUpEvent);
                
                return false;
            } catch (error) {
                console.error('Error trying heart reaction:', error);
                return false;
            }
        }

        async recordLike(postElement, reactionType = 'like') {
            if (!this.db) {
                console.error('Analytics DB not initialized');
                return;
            }
            
            try {
                const postData = {
                    platform: this.platform,
                    postId: this.getPostId(postElement),
                    author: this.extractPostAuthor(postElement),
                    content: this.extractPostContent(postElement),
                    url: window.location.href,
                    authorProfile: this.extractAuthorProfile(postElement),
                    likesCount: this.extractLikesCount(postElement),
                    commentsCount: this.extractCommentsCount(postElement),
                    reactionType: reactionType
                };

                console.log('Recording like for post:', {
                    postId: postData.postId,
                    author: postData.author,
                    platform: postData.platform,
                    reactionType: reactionType,
                    likesCount: postData.likesCount
                });

                const result = await this.db.recordLike(postData);
                console.log('Like recorded successfully:', result);
                
                // עדכון הפיד הזמן-אמת
                const emoji = reactionType === 'heart' ? '❤️' : '👍';
                this.addRealtimeActivity(`${emoji} נתן ${reactionType === 'heart' ? 'לב אהבה' : 'לייק'} לפוסט של ${postData.author}`);
                
            } catch (error) {
                console.error('Failed to record like:', error);
                await this.recordError(error, 'record-like', postElement);
            }
        }

        // הוספת פעילות זמן-אמת
        addRealtimeActivity(text) {
            try {
                // בדיקה אם ההקשר של התוסף עדיין תקף
                if (!chrome.runtime?.id) {
                    console.log('Extension context invalidated, cannot send realtime activity');
                    return;
                }
                
                chrome.runtime.sendMessage({
                    type: 'REALTIME_ACTIVITY',
                    data: {
                        text: text,
                        timestamp: Date.now(),
                        type: 'like'
                    }
                });
            } catch (error) {
                console.log('Could not send realtime activity:', error);
            }
        }

        async processAutoComment(postId, postElement) {
            // בדיקת בטיחות ובדיקת הפעלה גלובלית
            if (!this.commentedPosts || !this.settings) {
                console.log('⚠️ Class not fully initialized for comments');
                return;
            }
            
            // בדיקה אם התוסף מופעל גלובלית ותגובות מופעלות
            if (!this.isGloballyEnabled || !this.settings.globallyEnabled || !this.settings.autoComments) {
                console.log('🛑 Auto-comment cancelled - extension or comments disabled:', {
                    isGloballyEnabled: this.isGloballyEnabled,
                    settingsGloballyEnabled: this.settings.globallyEnabled,
                    autoComments: this.settings.autoComments
                });
                return;
            }
            

            
            // בדיקה אם כבר הגבנו לפוסט הזה
            if (this.commentedPosts.has(postId)) {
                console.log('💬 Already commented on this post, skipping');
                return;
            }
            
            // בדיקה אם יש תגובה קיימת שלי
            if (this.hasMyExistingComment(postElement)) {
                console.log('💬 My comment already exists on this post');
                this.commentedPosts.add(postId);
                return;
            }

            try {
                console.log('💬 Processing auto-comment for post:', postId);
                
                // מציאת כפתור התגובה
                const commentButton = this.findCommentButton(postElement);
                if (!commentButton) {
                    console.log('Comment button not found');
                    return;
                }

                // לחיצה על כפתור התגובה לפתיחת תיבת הטקסט
                await this.simulateHumanClick(commentButton);
                await this.sleep(1000);

                // מציאת תיבת הטקסט
                const commentBox = this.findCommentBox(postElement);
                if (!commentBox) {
                    console.log('Comment box not found after clicking comment button');
                    return;
                }

                // יצירת תגובה
                const postContent = this.extractPostContent(postElement);
                const author = this.extractPostAuthor(postElement);
                
                const commentText = await this.generateComment(postContent, author, this.currentPersonaId);
                if (!commentText) {
                    console.log('Failed to generate comment');
                    return;
                }

                console.log('💬 Generated comment:', commentText.substring(0, 50) + '...');

                // הקלדת התגובה
                await this.typeInCommentBox(commentBox, commentText, postElement);
                
                // סימון שהגבנו לפוסט הזה
                this.commentedPosts.add(postId);
                
                // עדכון סטטיסטיקות
                if (this.sessionData) {
                    this.sessionData.commentsPosted++;
                }
                
                console.log('💬 Auto-comment completed for post:', postId);
                
            } catch (error) {
                console.error('Error in auto-comment:', error);
                await this.recordError(error, 'auto-comment', postElement);
            }
        }

        hasMyExistingComment(postElement) {
            try {
                // חיפוש תגובות בפוסט
                const commentSelectors = [
                    '.comments-comment-item',
                    '[data-id*="comment"]',
                    '.feed-shared-comment',
                    '.comment',
                    '[class*="comment"]'
                ];

                for (const selector of commentSelectors) {
                    const comments = postElement.querySelectorAll(selector);
                    for (const comment of comments) {
                        if (this.isMyComment(comment)) {
                            console.log('💬 Found my existing comment in post');
                            return true;
                        }
                    }
                }

                return false;
            } catch (error) {
                console.error('Error checking for existing comments:', error);
                return false;
            }
        }

        isMyComment(commentElement) {
            try {
                // בדיקות שונות לזיהוי התגובה שלי
                const indicators = [
                    // חיפוש כפתור מחיקה/עריכה (רק בתגובות שלי)
                    commentElement.querySelector('[aria-label*="Delete"], [aria-label*="Edit"], [aria-label*="מחק"], [aria-label*="ערוך"]'),
                    // חיפוש אינדיקטור "You" או השם שלי
                    commentElement.querySelector('[data-test-id*="author-you"], .comment-author-you'),
                    // בדיקה אם יש תפריט פעולות (רק בתגובות שלי)
                    commentElement.querySelector('.comment-actions-menu, [data-test-id*="comment-overflow-menu"]')
                ];

                return indicators.some(indicator => indicator !== null);
            } catch (error) {
                console.error('Error checking if comment is mine:', error);
                return false;
            }
        }

        findSubmitButton(commentBox) {
            if (this.platform === 'linkedin') {
                // חיפוש כפתור שליחה בקרבת תיבת התגובה
                const parentContainer = commentBox.closest('.comments-comment-box, .comments-comment-texteditor, .comment-form');
                if (parentContainer) {
                    const selectors = [
                        'button[data-control-name="comment.post"]',
                        'button[type="submit"]',
                        'button.comments-comment-box__submit-button',
                        'button[aria-label*="Post"]',
                        'button[aria-label*="שלח"]',
                        '.comments-comment-box__submit-button',
                        'button.artdeco-button--primary'
                    ];
                    
                    for (const selector of selectors) {
                        const button = parentContainer.querySelector(selector);
                        if (button && button.offsetHeight > 0) {
                            console.log('💬 Found submit button with selector:', selector);
                            return button;
                        }
                    }
                }
                
                // חיפוש בכל המסמך
                const globalSelectors = [
                    'button[data-control-name="comment.post"]',
                    '.comments-comment-box__submit-button:not([disabled])'
                ];
                
                for (const selector of globalSelectors) {
                    const button = document.querySelector(selector);
                    if (button && this.isElementVisible(button)) {
                        console.log('💬 Found submit button in document with selector:', selector);
                        return button;
                    }
                }
            }
            return null;
        }

        isReplyButton(element) {
            if (!element) return false;
            
            const text = element.textContent?.toLowerCase() || '';
            const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
            const className = element.className?.toLowerCase() || '';
            const dataControlName = element.getAttribute('data-control-name') || '';
            
            // בדיקות מרובות לזיהוי כפתור Reply
            const conditions = [
                text.includes('reply'),
                text.includes('השב'),
                ariaLabel.includes('reply'),
                ariaLabel.includes('השב'),
                className.includes('reply'),
                dataControlName.includes('reply'),
                element.tagName === 'BUTTON' && (text === 'reply' || ariaLabel === 'reply')
            ];
            
            const isReply = conditions.some(condition => condition);
            
            if (isReply) {
                console.log('💬 Reply button detected:', {
                    text: text,
                    ariaLabel: ariaLabel,
                    className: className,
                    dataControlName: dataControlName
                });
            }
            
            return isReply;
        }

        isAlreadyLiked(likeButton) {
            if (!likeButton) return false;
            
            // בדיקות שונות לזיהוי לייק קיים
            const ariaPressed = likeButton.getAttribute('aria-pressed');
            if (ariaPressed === 'true') return true;
            
            const ariaLabel = likeButton.getAttribute('aria-label');
            if (ariaLabel && (ariaLabel.includes('Unlike') || ariaLabel.includes('בטל לייק'))) return true;
            
            // בדיקת מחלקות CSS
            const classList = likeButton.classList;
            if (classList.contains('liked') || 
                classList.contains('active') || 
                classList.contains('artdeco-button--primary') ||
                classList.contains('react-button--active')) {
                return true;
            }
            
            // בדיקת צבע הכפתור (כחול = לייק קיים)
            const computedStyle = window.getComputedStyle(likeButton);
            const color = computedStyle.color;
            if (color.includes('rgb(0, 119, 181)') || color.includes('rgb(10, 102, 194)')) {
                return true;
            }
            
            // בדיקת אייקון מלא
            const icon = likeButton.querySelector('svg path, .like-icon');
            if (icon) {
                const fillColor = icon.getAttribute('fill') || window.getComputedStyle(icon).fill;
                if (fillColor && (fillColor.includes('#0077b5') || fillColor.includes('#0a66c2'))) {
                    return true;
                }
            }
            
            return false;
        }

        extractPostContent(postElement) {
            if (this.platform === 'linkedin') {
                const content = postElement.querySelector('.feed-shared-text, .feed-shared-update-v2__description');
                return content ? content.textContent.trim() : '';
            } else if (this.platform === 'facebook') {
                const content = postElement.querySelector('[data-testid="post_message"]');
                return content ? content.textContent.trim() : '';
            }
            return '';
        }

        extractCommentContent(commentElement) {
            if (!commentElement) return '';
            
            // נסה למצוא את תוכן התגובה עם סלקטורים ספציפיים
            const contentSelectors = [
                '.comments-comment-item__main-content',
                '.comment-content',
                '.comments-comment-item-content-body',
                '.feed-shared-text',
                '.attributed-text-segment-list__content'
            ];
            
            for (const selector of contentSelectors) {
                const content = commentElement.querySelector(selector);
                if (content) {
                    const text = content.textContent.trim();
                    console.log('💬 Extracted comment content:', text.substring(0, 50) + '...');
                    return text;
                }
            }
            
            // אם לא נמצא עם סלקטורים ספציפיים, קח את כל הטקסט
            const fallbackText = commentElement.textContent.trim();
            console.log('💬 Extracted comment content (fallback):', fallbackText.substring(0, 50) + '...');
            return fallbackText;
        }

        findParentComment(element) {
            const selectors = [
                '.comments-comment-item',
                '.comment',
                '.comments-comment',
                '[data-test-id="comment"]',
                '.social-details-social-activity__comment'
            ];
            
            for (const selector of selectors) {
                const comment = element.closest(selector);
                if (comment) {
                    console.log('💬 Found parent comment with selector:', selector);
                    return comment;
                }
            }
            
            console.log('💬 No parent comment found');
            return null;
        }

        findParentPost(element) {
            const selectors = [
                '.feed-shared-update-v2',
                '.occludable-update',
                '[data-pagelet="FeedUnit"]',
                '.feed-shared-update',
                '.update-components-update-v2'
            ];
            
            for (const selector of selectors) {
                const post = element.closest(selector);
                if (post) {
                    console.log('💬 Found parent post with selector:', selector);
                    return post;
                }
            }
            
            console.log('💬 No parent post found');
            return null;
        }

        async simulateHumanClick(element) {
            await this.sleep(100 + Math.random() * 200);
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            element.dispatchEvent(clickEvent);
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Helper methods for analytics data extraction
        extractPostAuthor(postElement) {
            if (this.platform === 'linkedin') {
                const authorElement = postElement.querySelector('.feed-shared-actor__name, .update-components-actor__name, .feed-shared-actor__title');
                return authorElement ? authorElement.textContent.trim() : 'Unknown Author';
            } else if (this.platform === 'facebook') {
                const authorElement = postElement.querySelector('[data-testid="post_author_name"], strong');
                return authorElement ? authorElement.textContent.trim() : 'Unknown Author';
            }
            return 'Unknown Author';
        }

        extractAuthorProfile(postElement) {
            if (this.platform === 'linkedin') {
                const profileLink = postElement.querySelector('.feed-shared-actor__container-link, .update-components-actor__container a');
                return profileLink ? profileLink.href : '';
            } else if (this.platform === 'facebook') {
                const profileLink = postElement.querySelector('a[role="link"]');
                return profileLink ? profileLink.href : '';
            }
            return '';
        }

        extractLikesCount(postElement) {
            if (this.platform === 'linkedin') {
                const likesElement = postElement.querySelector('.social-counts-reactions__count, .social-counts__reactions-count');
                if (likesElement) {
                    const text = likesElement.textContent.trim();
                    const match = text.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }
            } else if (this.platform === 'facebook') {
                const likesElement = postElement.querySelector('[data-testid="like_count"]');
                if (likesElement) {
                    const text = likesElement.textContent.trim();
                    const match = text.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }
            }
            return 0;
        }

        extractCommentsCount(postElement) {
            if (this.platform === 'linkedin') {
                const commentsElement = postElement.querySelector('.social-counts__comments, .social-counts-comments');
                if (commentsElement) {
                    const text = commentsElement.textContent.trim();
                    const match = text.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }
            } else if (this.platform === 'facebook') {
                const commentsElement = postElement.querySelector('[data-testid="comments_count"]');
                if (commentsElement) {
                    const text = commentsElement.textContent.trim();
                    const match = text.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }
            }
            return 0;
        }

        async recordError(error, context, postElement = null) {
            if (!this.db) return;
            
            try {
                const errorData = {
                    type: error.name || 'UnknownError',
                    message: error.message || 'Unknown error',
                    stack: error.stack || '',
                    platform: this.platform,
                    url: window.location.href,
                    context: context
                };

                if (postElement) {
                    errorData.postId = this.getPostId(postElement);
                    errorData.postAuthor = this.extractPostAuthor(postElement);
                }

                await this.db.recordError(errorData);
            } catch (recordError) {
                console.error('Failed to record error:', recordError);
            }
        }

        // פונקציות לפעולות ידניות מהדשבורד
        async executeManualLike() {
            try {
                console.log('Starting manual like execution...');
                
                // מוצא פוסטים גלויים
                const visiblePosts = this.findPosts().filter(post => this.isElementVisible(post));
                console.log(`Found ${visiblePosts.length} visible posts`);
                
                if (visiblePosts.length === 0) {
                    return { success: false, error: 'לא נמצאו פוסטים גלויים' };
                }

                // מוצא פוסט ראשון שלא קיבל לייק
                for (const post of visiblePosts) {
                    const likeButton = this.findLikeButton(post);
                    if (likeButton && !this.isAlreadyLiked(likeButton)) {
                        console.log('Found post suitable for manual like');
                        
                        // מבצע לייק
                        await this.simulateHumanClick(likeButton);
                        await this.sleep(1000);
                        
                        // מוודא שהלייק התקבל
                        if (this.isAlreadyLiked(likeButton)) {
                            console.log('Manual like successful');
                            
                            // רושם בבסיס הנתונים
                            await this.recordLike(post);
                            this.addRealtimeActivity('לייק ידני מהדשבורד');
                            
                            return { 
                                success: true, 
                                message: 'לייק ידני בוצע בהצלחה',
                                postAuthor: this.extractPostAuthor(post)
                            };
                        } else {
                            console.log('Like button click did not register');
                            continue; // מנסה פוסט הבא
                        }
                    }
                }
                
                return { success: false, error: 'כל הפוסטים הגלויים כבר קיבלו לייק' };
                
            } catch (error) {
                console.error('Manual like error:', error);
                return { success: false, error: `שגיאה: ${error.message}` };
            }
        }

        async executeManualComment() {
            try {
                console.log('Starting manual comment execution...');
                
                // מוצא פוסטים גלויים
                const visiblePosts = this.findPosts().filter(post => this.isElementVisible(post));
                console.log(`Found ${visiblePosts.length} visible posts`);
                
                if (visiblePosts.length === 0) {
                    return { success: false, error: 'לא נמצאו פוסטים גלויים' };
                }

                // בוחר פוסט ראשון
                const post = visiblePosts[0];
                const postContent = this.extractPostContent(post);
                const postId = this.getPostId(post);
                
                console.log('Generating comment for manual execution...');
                
                // יוצר תגובה
                const result = await this.generateAndPostComment({
                    postId,
                    postElement: post,
                    postContent
                });
                
                if (result.success) {
                    this.addRealtimeActivity(`תגובה ידנית: "${result.commentText}"`);
                    return { 
                        success: true, 
                        comment: result.commentText,
                        postAuthor: this.extractPostAuthor(post)
                    };
                } else {
                    return { success: false, error: result.error || 'נכשל ביצירת תגובה' };
                }
                
            } catch (error) {
                console.error('Manual comment error:', error);
                return { success: false, error: `שגיאה: ${error.message}` };
            }
        }

        // Auto-scroll functionality
        startAutoScroll() {
            if (!this.isGloballyEnabled) {
                console.log('🛑 Cannot start auto-scroll - extension disabled globally');
                return;
            }
            
            if (!this.autoScrollEnabled) {
                console.log('🛑 Cannot start auto-scroll - auto-scroll disabled');
                return;
            }
            
            if (this.isAutoScrolling) {
                console.log('📜 Auto-scroll already running');
                return;
            }
            
            this.isAutoScrolling = true;
            this.currentScrollPosition = window.scrollY;
            this.scrollPausedForPost = false;
            this.waitingForUserAction = false;
            
            console.log('📜 🚀 Starting auto-scroll with speed:', this.autoScrollSpeed);
            
            // הוספת אינדיקטור ויזואלי
            this.showAutoScrollIndicator(true);
            
            // התחלת הגלילה
            this.performAutoScroll();
        }

        stopAutoScroll() {
            if (!this.isAutoScrolling) return;
            
            this.isAutoScrolling = false;
            this.scrollPausedForPost = false;
            this.waitingForUserAction = false;
            
            if (this.scrollPauseTimeout) {
                clearTimeout(this.scrollPauseTimeout);
                this.scrollPauseTimeout = null;
            }
            
            if (this.pendingScrollContinue) {
                clearTimeout(this.pendingScrollContinue);
                this.pendingScrollContinue = null;
            }
            
            console.log('📜 🛑 Auto-scroll stopped');
            this.showAutoScrollIndicator(false);
        }

        performAutoScroll() {
            if (!this.isAutoScrolling || !this.isGloballyEnabled || !this.autoScrollEnabled) return;
            
            if (this.scrollPausedForPost || this.waitingForUserAction) {
                // אם מחכים לפעולת משתמש, בדוק שוב בעוד זמן קצר
                setTimeout(() => this.performAutoScroll(), 1000);
                return;
            }
            
            try {
                // 🎯 Smart Post Detection and Positioning
                const smartPosts = this.findSmartVisiblePosts();
                const unprocessedPosts = smartPosts.filter(post => 
                    !this.processedPosts.has(this.getPostId(post.element))
                );
                
                if (unprocessedPosts.length > 0) {
                    console.log('📜 Smart scroll: Found', unprocessedPosts.length, 'unprocessed posts');
                    
                    // מצא את הפוסט הטוב ביותר לעיבוד
                    const targetPost = this.selectOptimalPost(unprocessedPosts);
                    this.scrollToOptimalPosition(targetPost);
                    
                    // המתן לעיבוד הפוסט עם timeout חכם
                    this.waitForPostProcessing(targetPost);
                    return;
                }

                // 🚀 Intelligent Scrolling - חפש פוסט הבא
                const nextPostPosition = this.findNextPostPosition();
                if (nextPostPosition !== null) {
                    this.smoothScrollToPosition(nextPostPosition);
                } else {
                    // גלילה רגילה אם לא מצאנו פוסט ספציפי
                    this.performRegularScroll();
                }
                
            } catch (error) {
                console.error('Error in smart auto-scroll:', error);
                // חזור לגלילה רגילה במקרה של שגיאה
                this.performRegularScroll();
            }
        }

        // 🎯 Smart Post Detection
        findSmartVisiblePosts() {
            const posts = this.findPosts();
            const viewport = {
                top: window.scrollY,
                bottom: window.scrollY + window.innerHeight,
                center: window.scrollY + (window.innerHeight / 2)
            };

            return posts.map(post => {
                const rect = post.getBoundingClientRect();
                const absoluteTop = rect.top + window.scrollY;
                const absoluteBottom = rect.bottom + window.scrollY;
                const postCenter = absoluteTop + (rect.height / 2);
                
                return {
                    element: post,
                    rect: rect,
                    absoluteTop: absoluteTop,
                    absoluteBottom: absoluteBottom,
                    postCenter: postCenter,
                    distanceFromViewportCenter: Math.abs(postCenter - viewport.center),
                    isVisible: rect.top >= -200 && rect.bottom <= window.innerHeight + 200,
                    isOptimallyVisible: rect.top >= 100 && rect.bottom <= window.innerHeight - 100,
                    visibilityPercentage: this.calculateVisibilityPercentage(rect)
                };
            }).filter(post => post.isVisible);
        }

        // 📐 Calculate visibility percentage
        calculateVisibilityPercentage(rect) {
            const viewportTop = 0;
            const viewportBottom = window.innerHeight;
            
            const visibleTop = Math.max(viewportTop, rect.top);
            const visibleBottom = Math.min(viewportBottom, rect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            return (visibleHeight / rect.height) * 100;
        }

        // 🎯 Select optimal post for processing
        selectOptimalPost(posts) {
            // מיין לפי מרחק ממרכז המסך ואחוז הנראות
            return posts.sort((a, b) => {
                const scoreA = a.visibilityPercentage - (a.distanceFromViewportCenter / 10);
                const scoreB = b.visibilityPercentage - (b.distanceFromViewportCenter / 10);
                return scoreB - scoreA;
            })[0];
        }

        // 🎯 Position optimally for post processing
        scrollToOptimalPosition(targetPost) {
            const optimalPosition = targetPost.absoluteTop - (window.innerHeight * 0.25); // 25% from top
            const currentPosition = window.scrollY;
            const distance = Math.abs(optimalPosition - currentPosition);
            
            if (distance > 100) { // Only scroll if significant distance
                console.log('🎯 Positioning for optimal post processing...', distance, 'px');
                window.scrollTo({
                    top: optimalPosition,
                    behavior: 'smooth'
                });
                
                // המתן לסיום הגלילה
                setTimeout(() => {
                    console.log('📍 Positioned at optimal location for post processing');
                }, Math.min(distance / 2, 1000)); // זמן המתנה יחסי למרחק
            }
        }

        // ⏳ Smart wait for post processing
        waitForPostProcessing(targetPost) {
            const postId = this.getPostId(targetPost.element);
            const maxWaitTime = 12000; // 12 seconds max
            const checkInterval = 500; // Check every 500ms
            let elapsedTime = 0;
            
            console.log('⏳ Waiting for post processing:', postId.substring(0, 20) + '...');
            
            const checkProcessing = () => {
                elapsedTime += checkInterval;
                
                // Check if post was processed
                if (this.processedPosts.has(postId)) {
                    console.log('✅ Post processed successfully, continuing scroll...');
                    setTimeout(() => this.performAutoScroll(), 1500);
                    return;
                }
                
                // Check if max wait time reached
                if (elapsedTime >= maxWaitTime) {
                    console.log('⏰ Max wait time reached for post, continuing scroll...');
                    this.processedPosts.add(postId); // Mark as processed to avoid infinite loop
                    setTimeout(() => this.performAutoScroll(), 500);
                    return;
                }
                
                // Continue waiting
                setTimeout(checkProcessing, checkInterval);
            };
            
            setTimeout(checkProcessing, checkInterval);
        }

        // 🔍 Find next post position
        findNextPostPosition() {
            const posts = this.findPosts();
            const currentScroll = window.scrollY;
            const viewportHeight = window.innerHeight;
            
            // Find the next post below current viewport
            for (const post of posts) {
                const rect = post.getBoundingClientRect();
                const absoluteTop = rect.top + currentScroll;
                
                if (absoluteTop > currentScroll + viewportHeight + 100) {
                    return absoluteTop - (viewportHeight * 0.25);
                }
            }
            
            return null; // No next post found
        }

        // 🌊 Smooth scroll to position
        smoothScrollToPosition(targetPosition) {
            const currentPosition = window.scrollY;
            const distance = targetPosition - currentPosition;
            
            console.log('🌊 Smooth scrolling to next post position...');
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Continue scrolling after reaching target
            const scrollTime = Math.min(Math.abs(distance) / 2, 2000);
            setTimeout(() => this.performAutoScroll(), scrollTime);
        }

        // 📜 Regular scroll fallback
        performRegularScroll() {
            // חישוב מהירות גלילה בהתאם להגדרה
            const baseSpeed = 4; // פיקסלים בסיסיים (מעט יותר מהיר)
            const scrollAmount = baseSpeed * this.autoScrollSpeed;
            
            // גלילה עם וריאציה אקראית לתחושה אנושית
            const randomVariation = Math.random() * 0.4 + 0.8; // בין 0.8 ל-1.2
            const actualScrollAmount = Math.round(scrollAmount * randomVariation);
            
            // ביצוע הגלילה
            this.currentScrollPosition += actualScrollAmount;
            window.scrollTo({
                top: this.currentScrollPosition,
                behavior: 'smooth'
            });
            
            // בדיקה אם הגענו לסוף הדף
            if (this.currentScrollPosition >= document.body.scrollHeight - window.innerHeight - 300) {
                console.log('📜 Reached end of page, pausing auto-scroll');
                setTimeout(() => {
                    if (this.isAutoScrolling) {
                        // נסה לטעון עוד תוכן או המשך
                        this.currentScrollPosition = document.body.scrollHeight - window.innerHeight - 200;
                        this.performAutoScroll();
                    }
                }, 5000);
                return;
            }
            
            // המשך גלילה עם השהייה אקראית
            const nextScrollDelay = this.getHumanScrollDelay();
            setTimeout(() => this.performAutoScroll(), nextScrollDelay);
        }

        findVisibleUnprocessedPosts() {
            // בדיקת בטיחות
            if (!this.processedPosts) {
                return [];
            }
            
            const posts = this.findPosts();
            return posts.filter(post => {
                const postId = this.getPostId(post);
                return postId && !this.processedPosts.has(postId) && this.isElementVisible(post);
            });
        }

        pauseAutoScrollForPost(postElement, postId) {
            if (!this.isAutoScrolling) return;
            
            this.scrollPausedForPost = true;
            console.log('📜 ⏸️ Auto-scroll paused for post:', postId.substring(0, 20) + '...');
            
            // חכה לסיום עיבוד הפוסט
            const checkProcessingComplete = () => {
                const timer = this.viewTimers.get(postId);
                
                // בדוק אם הפוסט סיים להתעבד
                const likesComplete = !this.settings.autoLikes || (timer && timer.likeProcessed);
                const commentsComplete = !this.settings.autoComments || !this.currentPersonaId || (timer && timer.commentProcessed);
                
                if (likesComplete && commentsComplete) {
                    console.log('📜 ✅ Post processing complete, resuming scroll...');
                    setTimeout(() => this.resumeAutoScroll(), 1000);
                } else {
                    // בדוק שוב בעוד שנייה
                    setTimeout(checkProcessingComplete, 1000);
                }
            };
            
            // התחל בדיקה אחרי 2 שניות (זמן לעיבוד ראשוני)
            setTimeout(checkProcessingComplete, 2000);
            
            // timeout לביטול המעקב אם לוקח יותר מדי זמן
            setTimeout(() => {
                if (this.scrollPausedForPost) {
                    console.log('📜 ⏰ Post processing timeout, resuming auto-scroll...');
                    this.resumeAutoScroll();
                }
            }, 15000); // 15 שניות timeout
        }

        resumeAutoScroll() {
            if (!this.isAutoScrolling) return;
            
            this.scrollPausedForPost = false;
            this.waitingForUserAction = false;
            
            if (this.scrollPauseTimeout) {
                clearTimeout(this.scrollPauseTimeout);
                this.scrollPauseTimeout = null;
            }
            
            console.log('📜 ▶️ Resuming auto-scroll...');
            
            // המשך גלילה אחרי השהייה קצרה
            setTimeout(() => this.performAutoScroll(), 1000);
        }

        getHumanScrollDelay() {
            // חישוב השהייה אנושית בהתאם למהירות
            const baseDelay = {
                1: 150, // איטי
                2: 100, // בינוני  
                3: 50   // מהיר
            };
            
            const delay = baseDelay[this.autoScrollSpeed] || 100;
            const randomVariation = Math.random() * 50; // וריאציה של עד 50ms
            
            return delay + randomVariation;
        }

        showAutoScrollIndicator(show) {
            const existingIndicator = document.getElementById('auto-scroll-indicator');
            
            if (show && !existingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'auto-scroll-indicator';
                indicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    animation: pulse 2s infinite;
                    min-width: 200px;
                `;
                
                this.updateScrollIndicatorContent(indicator);
                document.body.appendChild(indicator);
                
                // הוספת אנימציה
                if (!document.getElementById('scroll-indicator-style')) {
                    const style = document.createElement('style');
                    style.id = 'scroll-indicator-style';
                    style.textContent = `
                        @keyframes pulse {
                            0%, 100% { opacity: 1; transform: scale(1); }
                            50% { opacity: 0.8; transform: scale(1.05); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // עדכון תקופתי של המידע באינדיקטור
                this.indicatorUpdateInterval = setInterval(() => {
                    if (this.isAutoScrolling) {
                        this.updateScrollIndicatorContent(indicator);
                    }
                }, 2000);
                
            } else if (!show && existingIndicator) {
                existingIndicator.remove();
                if (this.indicatorUpdateInterval) {
                    clearInterval(this.indicatorUpdateInterval);
                    this.indicatorUpdateInterval = null;
                }
            }
        }

        updateScrollIndicatorContent(indicator) {
            if (!indicator) return;
            
            const visiblePosts = this.findVisibleUnprocessedPosts();
            const scrollProgress = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            
            const speedEmoji = {
                1: '🐌',
                2: '🚶', 
                3: '🏃'
            };
            
            // 🎯 Enhanced Status Detection
            let statusText = '📜 גולל...';
            let statusColor = '#4CAF50';
            
            if (!this.isGloballyEnabled || !this.settings.globallyEnabled) {
                statusText = '🛑 מושבת';
                statusColor = '#f44336';
            } else if (this.scrollPausedForPost) {
                statusText = '⏸️ מחכה לעיבוד...';
                statusColor = '#FF9800';
            } else if (this.waitingForUserAction) {
                statusText = '👤 מחכה לפעולת משתמש...';
                statusColor = '#2196F3';
            } else if (this.isProcessing) {
                statusText = '🔄 מעבד פוסט...';
                statusColor = '#9C27B0';
            }
            
            // 📊 Session Statistics
            const sessionStats = this.sessionData || { likesGiven: 0, commentsPosted: 0, postsViewed: 0 };
            
            indicator.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px; min-width: 220px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="font-size: 16px;">${speedEmoji[this.autoScrollSpeed] || '🚶'}</div>
                        <div style="flex: 1;">
                            <div style="font-size: 11px; color: ${statusColor}; font-weight: bold;">
                                ${statusText}
                            </div>
                            <div style="font-size: 10px; opacity: 0.8;">
                                פוסטים גלויים: ${visiblePosts.length} | התקדמות: ${scrollProgress}%
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; font-size: 10px; opacity: 0.9; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px;">
                        <span>👍 ${sessionStats.likesGiven}</span>
                        <span>💬 ${sessionStats.commentsPosted || 0}</span>
                        <span>👀 ${sessionStats.postsViewed}</span>
                    </div>
                </div>
            `;
        }

        // 🎯 Enhanced Activity Monitoring
        addActivityNotification(type, message, duration = 3000) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
            `;
            
            const emoji = {
                'like': '👍',
                'comment': '💬',
                'scroll': '📜',
                'error': '❌',
                'success': '✅'
            };
            
            notification.innerHTML = `${emoji[type] || '🤖'} ${message}`;
            document.body.appendChild(notification);
            
            // Add slide-in animation if not exists
            if (!document.getElementById('activity-notification-style')) {
                const style = document.createElement('style');
                style.id = 'activity-notification-style';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Auto remove
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
        }

        // 🚀 Start Bot
        start() {
            if (this.isRunning) return;
            
            console.log('🚀 Starting SocialBot Pro...');
            this.isRunning = true;
            
            // התחלת הפעילות לפי הגדרות - רק אם גלילה אוטומטית מופעלת במפורש
            if (this.autoScrollEnabled && this.settings.autoScroll) {
                console.log('📜 Auto-scroll is enabled, starting...');
                this.startAutoScroll();
            } else {
                console.log('📜 Auto-scroll disabled or not enabled by user');
            }
            
            console.log('✅ SocialBot Pro started successfully');
        }

        // 🛑 Stop Bot
        stop() {
            if (!this.isRunning) return;
            
            console.log('🛑 Stopping SocialBot Pro...');
            this.isRunning = false;
            this.autoScrollActive = false;
            
            // עצירת כל הפעילויות
            this.stopAutoScroll();
            
            // ניקוי תורים
            this.commentQueue = [];
            this.processedPosts.clear();
            
            console.log('✅ SocialBot Pro stopped successfully');
        }

        // ⚙️ Update Settings
        updateSettings(newSettings) {
            this.settings = { ...this.settings, ...newSettings };
            console.log('⚙️ Settings updated:', this.settings);
            
            // עדכון פעילות בהתאם להגדרות
            if (this.isRunning) {
                if (this.settings.autoScroll && !this.autoScrollActive) {
                    this.startAutoScroll();
                } else if (!this.settings.autoScroll && this.autoScrollActive) {
                    this.stopAutoScroll();
                }
            }
        }

        async processCommentQueue() {
            // עיבוד תור התגובות
            if (this.isProcessingQueue || this.commentQueue.length === 0) {
                return;
            }
            
            this.isProcessingQueue = true;
            console.log('🔄 Processing comment queue...');
            
            try {
                while (this.commentQueue.length > 0) {
                    const commentTask = this.commentQueue.shift();
                    if (commentTask && commentTask.postElement) {
                        await this.processAutoComment(commentTask.postId, commentTask.postElement);
                        await this.sleep(2000); // המתנה בין תגובות
                    }
                }
            } catch (error) {
                console.error('❌ Error processing comment queue:', error);
            } finally {
                this.isProcessingQueue = false;
            }
        }

        findLikeButton(postElement) {
            // סלקטורים שונים לכפתור הלייק ב-LinkedIn
            const selectors = [
                'button[aria-label*="Like"]',
                'button[aria-label*="לייק"]', 
                'button[data-control-name="like"]',
                'button[data-control-name="reactions"]',
                '.social-actions-button[aria-label*="Like"]',
                '.artdeco-button[aria-label*="Like"]',
                '.react-button__trigger[aria-label*="Like"]',
                'button.react-button__trigger'
            ];
            
            for (const selector of selectors) {
                const button = postElement.querySelector(selector);
                if (button) {
                    console.log('👍 Found like button with selector:', selector);
                    return button;
                }
            }
            
            console.log('❌ Like button not found in post');
            return null;
        }

        findCommentButton(postElement) {
            // סלקטורים לכפתור התגובה
            const selectors = [
                'button[aria-label*="Comment"]',
                'button[aria-label*="תגובה"]',
                'button[data-control-name="comment"]',
                '.social-actions-button[aria-label*="Comment"]',
                '.artdeco-button[aria-label*="Comment"]'
            ];
            
            for (const selector of selectors) {
                const button = postElement.querySelector(selector);
                if (button) {
                    console.log('💬 Found comment button with selector:', selector);
                    return button;
                }
            }
            
            console.log('❌ Comment button not found in post');
            return null;
        }

        findCommentBox(postElement) {
            // 🔍 Enhanced Comment Box Detection
            const selectors = [
                // LinkedIn specific selectors
                'div[contenteditable="true"][role="textbox"]',
                '.ql-editor[contenteditable="true"]',
                '.mentions-texteditor__content[contenteditable="true"]',
                '.comments-comment-texteditor .ql-editor',
                'div[data-placeholder*="comment"]',
                'div[data-placeholder*="תגובה"]',
                
                // Generic selectors
                'div[contenteditable="true"]',
                'textarea[placeholder*="comment"]',
                'textarea[placeholder*="תגובה"]',
                'textarea[placeholder*="Comment"]',
                'textarea[aria-label*="comment"]',
                'textarea[aria-label*="תגובה"]',
                
                // Fallback selectors
                '.comment-box',
                '.comment-input',
                '[data-test-id="comment-texteditor"]'
            ];
            
            // First, try to find within the post element
            for (const selector of selectors) {
                const commentBox = postElement.querySelector(selector);
                if (commentBox && this.isValidCommentBox(commentBox)) {
                    console.log('💬 Found comment box in post with selector:', selector);
                    return commentBox;
                }
            }
            
            // Then, try to find in the document (for modal comment boxes)
            for (const selector of selectors) {
                const commentBoxes = document.querySelectorAll(selector);
                for (const commentBox of commentBoxes) {
                    if (this.isValidCommentBox(commentBox) && this.isCommentBoxVisible(commentBox)) {
                        console.log('💬 Found visible comment box in document with selector:', selector);
                        return commentBox;
                    }
                }
            }
            
            console.log('❌ Comment box not found for post');
            return null;
        }

        // 🔍 Validate if element is a proper comment box
        isValidCommentBox(element) {
            if (!element) return false;
            
            // Check if it's editable
            const isEditable = element.contentEditable === 'true' || 
                              element.tagName === 'TEXTAREA' ||
                              element.getAttribute('role') === 'textbox';
            
            // Check if it's not disabled
            const isEnabled = !element.disabled && !element.hasAttribute('disabled');
            
            // Check minimum size (avoid tiny elements)
            const rect = element.getBoundingClientRect();
            const hasReasonableSize = rect.width > 50 && rect.height > 20;
            
            return isEditable && isEnabled && hasReasonableSize;
        }

        // 👁️ Check if comment box is visible
        isCommentBoxVisible(element) {
            if (!element || !element.offsetParent) return false;
            
            const style = window.getComputedStyle(element);
            const isVisible = style.display !== 'none' && 
                            style.visibility !== 'hidden' && 
                            style.opacity !== '0';
            
            const rect = element.getBoundingClientRect();
            const isInViewport = rect.top >= -100 && rect.bottom <= window.innerHeight + 100;
            
            return isVisible && isInViewport;
        }

        async generateComment(postContent, author, personaId) {
            try {
                console.log('🤖 Generating comment for post by:', author);
                
                // בדיקה אם ההקשר של התוסף עדיין תקף
                if (!chrome.runtime?.id) {
                    console.error('Extension context invalidated, cannot generate comment');
                    return null;
                }
                
                const response = await chrome.runtime.sendMessage({
                    type: 'GENERATE_COMMENT',
                    postContent: postContent,
                    author: author,
                    personaId: personaId
                });
                
                if (response && response.success && response.comment) {
                    return response.comment;
                } else {
                    console.error('Failed to generate comment:', response?.error);
                    return null;
                }
            } catch (error) {
                console.error('Error generating comment:', error);
                if (error.message.includes('Extension context invalidated')) {
                    console.log('Extension was reloaded, comment generation unavailable');
                }
                return null;
            }
        }

        async typeInCommentBox(commentBox, text, postElement) {
            try {
                console.log('⌨️ Typing comment in box...');
                
                // מיקוד בתיבת הטקסט
                commentBox.focus();
                await this.sleep(500);
                
                // ניקוי תוכן קיים
                commentBox.innerHTML = '';
                commentBox.textContent = '';
                
                // הקלדה אנושית
                for (let i = 0; i < text.length; i++) {
                    commentBox.textContent += text[i];
                    commentBox.innerHTML = commentBox.textContent;
                    
                    // עיכוב אקראי בין תווים
                    await this.sleep(50 + Math.random() * 100);
                }
                
                // הפעלת אירועי input
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                commentBox.dispatchEvent(inputEvent);
                
                const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                commentBox.dispatchEvent(changeEvent);
                
                await this.sleep(1000);
                
                // מציאת כפתור השליחה
                const submitButton = this.findSubmitButton(commentBox);
                if (submitButton) {
                    // במקום לחיצה אוטומטית, נוסיף סגנון חזותי ונודיע למשתמש
                    submitButton.style.border = '3px solid #00ff00';
                    submitButton.style.boxShadow = '0 0 15px #00ff00';
                    submitButton.style.animation = 'pulse 1s infinite';
                    
                    // הצגת הודעה למשתמש
                    this.showCommentReadyNotification();
                    
                    console.log('✅ Comment ready for manual submission');
                } else {
                    console.log('⚠️ Submit button not found - comment typed but needs manual submission');
                }
                
            } catch (error) {
                console.error('Error typing comment:', error);
                throw error;
            }
        }

        showCommentReadyNotification() {
            // יצירת הודעה קופצת
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                font-size: 16px;
                font-weight: bold;
                z-index: 10001;
                box-shadow: 0 5px 25px rgba(0,0,0,0.3);
                text-align: center;
                min-width: 300px;
            `;
            
            notification.innerHTML = `
                <div>✅ תגובה מוכנה!</div>
                <div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
                    לחץ על כפתור השליחה לאישור
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // הסרת ההודעה אחרי 5 שניות
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
    }
} 