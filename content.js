// YUV.AI SocialBot Pro - Content Script
class SocialBotContentScript {
    constructor() {
        this.settings = {};
        this.currentPersonaId = null;
        this.currentPlatform = this.detectPlatform();
        this.processedPosts = new Set();
        this.viewTimers = new Map();
        this.scrollTimeout = null;
        this.isScrolling = false;
        this.lastScrollTime = 0;
        this.commentQueue = [];
        this.isProcessingQueue = false;
        this.observedElements = new WeakSet();
        this.analyticsDB = null;
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
        } catch (error) {
            console.error('Failed to load settings:', error);
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
        if (this.isReplyButton(event.target)) {
            setTimeout(() => this.handleReplyClick(event.target), 500);
        }
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
        if (!postId || this.processedPosts.has(postId) || !this.isPlatformEnabled()) return;

        if (!this.viewTimers.has(postId)) {
            const timer = { startTime: Date.now(), likeProcessed: false, commentProcessed: false, element: postElement };
            this.viewTimers.set(postId, timer);

            // רישום הפוסט שנצפה
            this.sessionData.postsViewed++;
            await this.recordViewedPost(postElement);

            if (this.settings.autoLikes) {
                setTimeout(() => this.processAutoLike(postId, postElement), 1500);
            }
            if (this.settings.autoComments) {
                setTimeout(() => this.processAutoComment(postId, postElement), 3000);
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

    async recordLike(postElement) {
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
                commentsCount: this.extractCommentsCount(postElement)
            };

            console.log('Recording like for post:', {
                postId: postData.postId,
                author: postData.author,
                platform: postData.platform,
                likesCount: postData.likesCount
            });

            const result = await this.analyticsDB.recordLike(postData);
            console.log('Like recorded successfully:', result);
            
            // עדכון הפיד הזמן-אמת
            this.addRealtimeActivity(`נתן לייק לפוסט של ${postData.author}`);
            
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
        const timer = this.viewTimers.get(postId);
        if (!timer || timer.commentProcessed) return;
        timer.commentProcessed = true;

        try {
            const postContent = this.extractPostContent(postElement);
            if (!postContent || postContent.length < 20) return;

            this.commentQueue.push({
                postId, postElement, postContent, timestamp: Date.now()
            });
            console.log('Added post to comment queue:', postId);
        } catch (error) {
            console.error('Error processing auto-comment:', error);
        }
    }

    async processCommentQueue() {
        if (this.isProcessingQueue || this.commentQueue.length === 0) {
            setTimeout(() => this.processCommentQueue(), 5000);
            return;
        }
        this.isProcessingQueue = true;

        try {
            const item = this.commentQueue.shift();
            await this.generateAndPostComment(item);
        } catch (error) {
            console.error('Error processing comment queue:', error);
        } finally {
            this.isProcessingQueue = false;
            setTimeout(() => this.processCommentQueue(), 3000);
        }
    }

    async generateAndPostComment({ postId, postElement, postContent }) {
        if (!this.currentPersonaId) {
            console.log('No persona selected, skipping comment generation');
            return;
        }

        const startTime = Date.now();
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_COMMENT',
                data: { postContent, personaId: this.currentPersonaId }
            });

            if (response && response.success && response.comment) {
                await this.insertComment(postElement, response.comment);
                
                // רישום התגובה באנליטיקה
                this.sessionData.commentsPosted++;
                await this.recordComment(postElement, {
                    text: response.comment,
                    persona: this.currentPersonaId,
                    responseTime: Date.now() - startTime
                });
                
                chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { comments: 1 } });
                console.log('Generated comment for post:', postId);
            }
        } catch (error) {
            console.error('Error generating comment:', error);
            await this.recordError(error, 'comment-generation', postElement);
        }
    }

    async recordComment(postElement, commentData) {
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

            await this.analyticsDB.recordComment(postData, commentData);
        } catch (error) {
            console.error('Failed to record comment:', error);
        }
    }

    async insertComment(postElement, commentText) {
        try {
            let commentBox = this.findCommentBox(postElement);
            if (!commentBox) {
                const commentButton = this.findCommentButton(postElement);
                if (commentButton) {
                    await this.simulateHumanClick(commentButton);
                    await this.sleep(1000);
                    commentBox = this.findCommentBox(postElement);
                }
            }
            if (commentBox) {
                await this.typeInCommentBox(commentBox, commentText);
            }
        } catch (error) {
            console.error('Error inserting comment:', error);
        }
    }

    async typeInCommentBox(commentBox, text) {
        commentBox.focus();
        await this.sleep(500);
        commentBox.value = '';
        commentBox.textContent = '';
        await this.simulateTyping(commentBox, text);
        console.log('Comment inserted, waiting for user to review and submit');
    }

    async simulateTyping(element, text) {
        const words = text.split(' ');
        let typedText = '';

        for (let i = 0; i < Math.min(3, words.length); i++) {
            typedText += (i > 0 ? ' ' : '') + words[i];
            
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                element.value = typedText;
                element.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                element.textContent = typedText;
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
            await this.sleep(300 + Math.random() * 200);
        }

        await this.sleep(500);
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            element.textContent = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await this.sleep(1000);
    }

    async handleReplyClick(replyButton) {
        if (!this.settings.autoComments || !this.currentPersonaId) return;

        try {
            const commentElement = this.findParentComment(replyButton);
            const postElement = this.findParentPost(replyButton);
            
            if (!commentElement || !postElement) return;

            const replyContext = this.extractCommentContent(commentElement);
            const postContent = this.extractPostContent(postElement);

            if (!replyContext || !postContent) return;

            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_COMMENT',
                data: { postContent, replyContext, personaId: this.currentPersonaId }
            });

            if (response && response.success && response.comment) {
                await this.sleep(1000);
                const replyBox = this.findReplyBox(commentElement);
                if (replyBox) {
                    await this.typeInCommentBox(replyBox, response.comment);
                }
            }
        } catch (error) {
            console.error('Error handling reply:', error);
        }
    }

    // Platform-specific selectors
    findLikeButton(postElement) {
        if (this.currentPlatform === 'linkedin') {
            // מחפש כפתורי לייק עם סלקטורים מורחבים
            const selectors = [
                'button[aria-label*="Like"]',
                'button[aria-label*="לייק"]',
                'button[data-control-name="like"]',
                'button.react-button__trigger[aria-label*="Like"]',
                '.social-actions-button[aria-label*="Like"]',
                'button.social-action[aria-label*="Like"]',
                'button[aria-label^="Like "]',
                'button.social-actions-button--like'
            ];
            
            for (const selector of selectors) {
                const button = postElement.querySelector(selector);
                if (button) {
                    console.log('Found like button with selector:', selector);
                    return button;
                }
            }
        } else if (this.currentPlatform === 'facebook') {
            return postElement.querySelector('div[aria-label*="Like"], div[role="button"][aria-label*="Like"]');
        }
        return null;
    }

    findCommentButton(postElement) {
        if (this.currentPlatform === 'linkedin') {
            return postElement.querySelector('button[aria-label*="Comment"], button[aria-label*="תגובה"], .comment-button');
        } else if (this.currentPlatform === 'facebook') {
            return postElement.querySelector('div[aria-label*="Comment"], div[role="button"]:contains("Comment")');
        }
        return null;
    }

    findCommentBox(postElement) {
        if (this.currentPlatform === 'linkedin') {
            return postElement.querySelector('.ql-editor, .comment-texteditor, textarea[placeholder*="comment"], textarea[placeholder*="תגובה"]');
        } else if (this.currentPlatform === 'facebook') {
            return postElement.querySelector('div[contenteditable="true"][data-testid="comment-input"]');
        }
        return null;
    }

    findReplyBox(commentElement) {
        if (this.currentPlatform === 'linkedin') {
            return commentElement.querySelector('.ql-editor, textarea[placeholder*="reply"], textarea[placeholder*="השב"]');
        } else if (this.currentPlatform === 'facebook') {
            return commentElement.querySelector('div[contenteditable="true"][data-testid="reply-input"]');
        }
        return null;
    }

    isReplyButton(element) {
        const text = element.textContent.toLowerCase();
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        return text.includes('reply') || text.includes('השב') || ariaLabel.includes('reply') || ariaLabel.includes('השב');
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
        return commentElement.textContent.trim();
    }

    findParentComment(element) {
        return element.closest('.comment, .comments-comment-item');
    }

    findParentPost(element) {
        return element.closest('.feed-shared-update-v2, .occludable-update, [data-pagelet="FeedUnit"]');
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