// YUV.AI SocialBot Pro - Content Script
class SocialBotContentScript {
    constructor() {
        this.settings = {};
        this.currentPersonaId = null;
        this.currentPlatform = this.detectPlatform();
        this.processedPosts = new Set();
        this.commentedPosts = new Set(); // מעקב אחר פוסטים שכבר הגבתי להם
        this.viewTimers = new Map();
        this.scrollTimeout = null;
        this.isScrolling = false;
        this.lastScrollTime = 0;
        this.commentQueue = [];
        this.isProcessingQueue = false;
        this.observedElements = new WeakSet();
        this.analyticsDB = null;
        this.isGloballyEnabled = true; // מתג הפעלה כללי
        this.sessionData = {
            startTime: Date.now(),
            postsViewed: 0,
            likesGiven: 0,
            commentsPosted: 0,
            scrollDistance: 0
        };
        
        this.init();
    }

    async init() {
        console.log('YUV.AI SocialBot Pro - Content Script initialized on', this.currentPlatform);
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
            // טעינת הסקריפט של בסיס הנתונים
            if (!window.SocialBotDB) {
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('db.js');
                document.head.appendChild(script);
                
                // המתנה לטעינת הסקריפט
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }
            
            this.analyticsDB = new window.SocialBotDB();
            await this.analyticsDB.init();
            console.log('Analytics DB initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize analytics DB:', error);
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
        if (!this.analyticsDB) return;
        
        try {
            const sessionData = {
                ...this.sessionData,
                endTime: Date.now(),
                platform: this.currentPlatform,
                url: window.location.href
            };
            
            await this.analyticsDB.recordSession(sessionData);
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
            const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
            if (response && response.success) {
                this.settings = response.settings;
                this.currentPersonaId = response.settings.selectedPersonaId;
            }
            
            // טעינת המצב הגלובלי
            const result = await chrome.storage.sync.get(['globallyEnabled']);
            this.isGloballyEnabled = result.globallyEnabled !== false; // Default to true
            
            console.log('🔄 Settings loaded:', {
                globallyEnabled: this.isGloballyEnabled,
                autoLikes: this.settings.autoLikes,
                autoComments: this.settings.autoComments,
                persona: this.currentPersonaId
            });
            
        } catch (error) {
            console.error('Failed to load settings:', error);
            // אם יש שגיאה, השאר את המצב הגלובלי כמופעל
            this.isGloballyEnabled = true;
        }
    }

    setupEventListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const result = this.handleMessage(message);
            if (result instanceof Promise) {
                result.then(sendResponse);
                return true; // Keeps the message channel open for async response
            }
            return false;
        });
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        document.addEventListener('mousemove', () => this.handleMouseMove());
        document.addEventListener('click', (e) => this.handleClick(e), true);
    }

    handleMessage(message) {
        switch (message.type) {
            case 'SETTINGS_CHANGED':
                this.settings = { ...this.settings, ...message.settings };
                break;
            case 'PERSONA_CHANGED':
                this.currentPersonaId = message.personaId;
                break;
            case 'TOGGLE_GLOBAL_STATE':
                this.isGloballyEnabled = message.enabled;
                console.log('🔄 Global state changed:', this.isGloballyEnabled ? 'ENABLED' : 'DISABLED');
                if (!this.isGloballyEnabled) {
                    // נקה את התורים בעת כיבוי
                    this.commentQueue = [];
                    this.processedPosts.clear();
                    console.log('🛑 All queues cleared - Extension DISABLED');
                }
                break;
            case 'MANUAL_LIKE':
                return this.executeManualLike();
            case 'MANUAL_COMMENT':
                return this.executeManualComment();
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

    observeExistingPosts(observer) {
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
                            if (!this.observedElements.has(post)) {
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
        if (this.currentPlatform === 'linkedin') {
            return document.querySelectorAll('div[data-id^="urn:li:activity:"], .feed-shared-update-v2, .occludable-update');
        } else if (this.currentPlatform === 'facebook') {
            return document.querySelectorAll('[data-pagelet="FeedUnit"]');
        }
        return [];
    }

    findPostsInElement(element) {
        if (this.currentPlatform === 'linkedin') {
            return element.querySelectorAll('div[data-id^="urn:li:activity:"], .feed-shared-update-v2, .occludable-update');
        } else if (this.currentPlatform === 'facebook') {
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
        const rect = element.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        const viewWidth = window.innerWidth;
        return (rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewHeight && rect.right <= viewWidth && rect.height > 100);
    }

    async handlePostVisible(postElement) {
        const postId = this.getPostId(postElement);
        
        // בדיקה אם התוסף מופעל גלובלית
        if (!this.isGloballyEnabled) {
            console.log('🛑 Extension globally disabled - skipping post processing');
            return;
        }
        
        if (!postId || this.processedPosts.has(postId) || !this.isPlatformEnabled()) {
            console.log('Post skipped:', {
                hasPostId: !!postId,
                alreadyProcessed: this.processedPosts.has(postId),
                platformEnabled: this.isPlatformEnabled(),
                globallyEnabled: this.isGloballyEnabled,
                currentPlatform: this.currentPlatform,
                settings: this.settings
            });
            return;
        }

        if (!this.viewTimers.has(postId)) {
            const timer = { startTime: Date.now(), likeProcessed: false, commentProcessed: false, element: postElement };
            this.viewTimers.set(postId, timer);

            console.log('📄 New post detected:', {
                postId: postId.substring(0, 20) + '...',
                platform: this.currentPlatform,
                autoLikes: this.settings.autoLikes,
                autoComments: this.settings.autoComments,
                author: this.extractPostAuthor(postElement)
            });

            // רישום הפוסט שנצפה
            this.sessionData.postsViewed++;
            await this.recordViewedPost(postElement);

            if (this.settings.autoLikes) {
                console.log('👍 Scheduling auto-like in 1.5 seconds...');
                setTimeout(() => this.processAutoLike(postId, postElement), 1500);
            } else {
                console.log('👍 Auto-likes disabled');
            }
            
            if (this.settings.autoComments) {
                console.log('💬 Scheduling auto-comment in 3 seconds...');
                setTimeout(() => this.processAutoComment(postId, postElement), 3000);
            } else {
                console.log('💬 Auto-comments disabled');
            }
        }
    }

    async recordViewedPost(postElement) {
        if (!this.analyticsDB) return;
        
        try {
            const postData = {
                platform: this.currentPlatform,
                postId: this.getPostId(postElement),
                author: this.extractPostAuthor(postElement),
                content: this.extractPostContent(postElement),
                url: window.location.href,
                authorProfile: this.extractAuthorProfile(postElement)
            };

            await this.analyticsDB.recordViewedPost(postData);
        } catch (error) {
            console.error('Failed to record viewed post:', error);
        }
    }

    handlePostHidden(postElement) {
        const postId = this.getPostId(postElement);
        if (postId && this.viewTimers.has(postId)) {
            this.viewTimers.delete(postId);
        }
    }

    getPostId(postElement) {
        if (this.currentPlatform === 'linkedin') {
            const dataId = postElement.getAttribute('data-id');
            if (dataId) return dataId;
            const activityId = postElement.querySelector('[data-id^="urn:li:activity:"]');
            if (activityId) return activityId.getAttribute('data-id');
        } else if (this.currentPlatform === 'facebook') {
            const feedUnit = postElement.getAttribute('data-pagelet');
            if (feedUnit) return feedUnit + '_' + Date.now();
        }
        const textContent = postElement.textContent.substring(0, 100);
        return btoa(textContent).substring(0, 20);
    }

    isPlatformEnabled() {
        if (this.currentPlatform === 'linkedin') return this.settings.linkedinEnabled;
        if (this.currentPlatform === 'facebook') return this.settings.facebookEnabled;
        return false;
    }

    async processAutoLike(postId, postElement) {
        // בדיקה אם התוסף מופעל גלובלית
        if (!this.isGloballyEnabled) {
            console.log('🛑 Auto-like cancelled - extension disabled globally');
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
            if (this.settings.preferHeartReaction && this.currentPlatform === 'linkedin') {
                const heartSuccess = await this.tryHeartReaction(likeButton, postElement);
                if (heartSuccess) {
                    this.sessionData.likesGiven++;
                    await this.recordLike(postElement, 'heart');
                    
                    const author = this.extractPostAuthor(postElement);
                    this.addRealtimeActivity(`❤️ נתתי לב אהבה לפוסט של ${author}`);
                    
                    chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { likes: 1 } });
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
                
                chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { likes: 1 } });
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
        if (!this.analyticsDB) {
            console.error('Analytics DB not initialized');
            return;
        }
        
        try {
            const postData = {
                platform: this.currentPlatform,
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

            const result = await this.analyticsDB.recordLike(postData);
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
        // בדיקה אם התוסף מופעל גלובלית
        if (!this.isGloballyEnabled) {
            console.log('🛑 Auto-comment cancelled - extension disabled globally');
            return;
        }
        
        // בדיקה אם כבר הגבתי לפוסט הזה (בזיכרון)
        if (this.commentedPosts.has(postId)) {
            console.log('💬 Already commented on this post (in memory), skipping:', postId.substring(0, 20) + '...');
            return;
        }

        // בדיקה האם כבר יש תגובה שלי בפוסט (בדיקה ויזואלית)
        if (this.hasMyExistingComment(postElement)) {
            console.log('💬 Found existing comment from me, adding to memory and skipping:', postId.substring(0, 20) + '...');
            this.commentedPosts.add(postId);
            return;
        }
        
        const timer = this.viewTimers.get(postId);
        if (!timer || timer.commentProcessed) return;
        timer.commentProcessed = true;

        try {
            const postContent = this.extractPostContent(postElement);
            if (!postContent || postContent.length < 20) {
                console.log('💬 Post content too short for comment:', postContent.length, 'chars');
                return;
            }

            console.log('💬 Adding post to comment queue:', {
                postId: postId.substring(0, 20) + '...',
                author: this.extractPostAuthor(postElement),
                contentLength: postContent.length
            });

            this.commentQueue.push({
                postId, postElement, postContent, timestamp: Date.now()
            });
            console.log('💬 Comment queue length:', this.commentQueue.length);
        } catch (error) {
            console.error('Error processing auto-comment:', error);
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
        if (this.currentPlatform === 'linkedin') {
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
        const ariaPressed = likeButton.getAttribute('aria-pressed');
        const className = likeButton.className;
        const ariaLabel = likeButton.getAttribute('aria-label') || '';
        
        // בדיקות מרובות לזיהוי לייק קיים
        const conditions = [
            ariaPressed === 'true',
            className.includes('active'),
            className.includes('liked'), 
            className.includes('selected'),
            className.includes('artdeco-button--primary'),
            className.includes('social-actions-button--active'),
            ariaLabel.toLowerCase().includes('unlike'),
            ariaLabel.includes('ביטול לייק'),
            // בדיקה לפי צבע הכפתור או אייקון
            likeButton.querySelector('svg[fill="#0a66c2"]'), // צבע לייק של LinkedIn
            likeButton.querySelector('.like-icon--liked')
        ];
        
        const isLiked = conditions.some(condition => condition);
        
        if (isLiked) {
            console.log('Post is already liked - detected by:', {
                ariaPressed,
                className,
                ariaLabel,
                hasActiveClass: className.includes('active'),
                hasPrimaryClass: className.includes('artdeco-button--primary')
            });
        }
        
        return isLiked;
    }

    extractPostContent(postElement) {
        if (this.currentPlatform === 'linkedin') {
            const content = postElement.querySelector('.feed-shared-text, .feed-shared-update-v2__description');
            return content ? content.textContent.trim() : '';
        } else if (this.currentPlatform === 'facebook') {
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
        if (this.currentPlatform === 'linkedin') {
            const authorElement = postElement.querySelector('.feed-shared-actor__name, .update-components-actor__name, .feed-shared-actor__title');
            return authorElement ? authorElement.textContent.trim() : 'Unknown Author';
        } else if (this.currentPlatform === 'facebook') {
            const authorElement = postElement.querySelector('[data-testid="post_author_name"], strong');
            return authorElement ? authorElement.textContent.trim() : 'Unknown Author';
        }
        return 'Unknown Author';
    }

    extractAuthorProfile(postElement) {
        if (this.currentPlatform === 'linkedin') {
            const profileLink = postElement.querySelector('.feed-shared-actor__container-link, .update-components-actor__container a');
            return profileLink ? profileLink.href : '';
        } else if (this.currentPlatform === 'facebook') {
            const profileLink = postElement.querySelector('a[role="link"]');
            return profileLink ? profileLink.href : '';
        }
        return '';
    }

    extractLikesCount(postElement) {
        if (this.currentPlatform === 'linkedin') {
            const likesElement = postElement.querySelector('.social-counts-reactions__count, .social-counts__reactions-count');
            if (likesElement) {
                const text = likesElement.textContent.trim();
                const match = text.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }
        } else if (this.currentPlatform === 'facebook') {
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
        if (this.currentPlatform === 'linkedin') {
            const commentsElement = postElement.querySelector('.social-counts__comments, .social-counts-comments');
            if (commentsElement) {
                const text = commentsElement.textContent.trim();
                const match = text.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }
        } else if (this.currentPlatform === 'facebook') {
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
        if (!this.analyticsDB) return;
        
        try {
            const errorData = {
                type: error.name || 'UnknownError',
                message: error.message || 'Unknown error',
                stack: error.stack || '',
                platform: this.currentPlatform,
                url: window.location.href,
                context: context
            };

            if (postElement) {
                errorData.postId = this.getPostId(postElement);
                errorData.postAuthor = this.extractPostAuthor(postElement);
            }

            await this.analyticsDB.recordError(errorData);
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
}

// Initialize content script - create only one instance
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SocialBotContentScript();
    });
} else {
    new SocialBotContentScript();
} 