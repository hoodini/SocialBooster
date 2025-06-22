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
        if (!postId || this.processedPosts.has(postId) || !this.isPlatformEnabled()) {
            console.log('Post skipped:', {
                hasPostId: !!postId,
                alreadyProcessed: this.processedPosts.has(postId),
                platformEnabled: this.isPlatformEnabled(),
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
            console.log('💬 No persona selected, skipping comment generation');
            return;
        }

        const startTime = Date.now();
        const author = this.extractPostAuthor(postElement);
        
        try {
            console.log('💬 Generating comment for post by:', author);
            
            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_COMMENT',
                data: { postContent, personaId: this.currentPersonaId }
            });

            if (response && response.success && response.comment) {
                console.log('💬 Comment generated:', response.comment.substring(0, 50) + '...');
                
                const insertSuccess = await this.insertComment(postElement, response.comment);
                
                if (insertSuccess) {
                    // רישום התגובה באנליטיקה
                    this.sessionData.commentsPosted++;
                    await this.recordComment(postElement, {
                        text: response.comment,
                        persona: this.currentPersonaId,
                        responseTime: Date.now() - startTime
                    });
                    
                    chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { comments: 1 } });
                    console.log('💬 Successfully generated and posted comment for:', author);
                } else {
                    console.log('💬 Comment generated but failed to insert');
                }
            } else {
                console.log('💬 Failed to generate comment:', response);
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
            console.log('💬 Starting comment insertion process...');
            
            let commentBox = this.findCommentBox(postElement);
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!commentBox && attempts < maxAttempts) {
                attempts++;
                console.log(`💬 Attempt ${attempts}: Looking for comment button...`);
                
                const commentButton = this.findCommentButton(postElement);
                if (commentButton) {
                    console.log('💬 Found comment button, clicking...');
                    await this.simulateHumanClick(commentButton);
                    
                    // המתנה ארוכה יותר לפתיחת התיבה
                    await this.sleep(1500 + (attempts * 500));
                    
                    // חיפוש מחדש בפוסט
                    commentBox = this.findCommentBox(postElement);
                    
                    // אם עדיין לא נמצא, חפש בכל האזור הקרוב
                    if (!commentBox) {
                        commentBox = this.findCommentBoxNearPost(postElement);
                    }
                    if (commentBox) {
                        console.log('💬 Comment box found after clicking!');
                        break;
                    } else {
                        console.log('💬 Comment box still not found, trying again...');
                        // נסה לחפש בכל המסמך
                        commentBox = document.querySelector('.ql-editor[contenteditable="true"]');
                        if (commentBox && this.isElementVisible(commentBox)) {
                            console.log('💬 Found comment box in document');
                            break;
                        }
                    }
                } else {
                    console.log('💬 No comment button found');
                    break;
                }
            }
            
            if (commentBox) {
                console.log('💬 Comment box found, starting typing...');
                const success = await this.typeInCommentBox(commentBox, commentText);
                if (success) {
                    const author = this.extractPostAuthor(postElement);
                    this.addRealtimeActivity(`💬 כתבתי תגובה לפוסט של ${author}: "${commentText.substring(0, 50)}..."`);
                    console.log('💬 Comment inserted successfully!');
                    return true;
                }
            } else {
                console.log('💬 Failed to find comment box after', attempts, 'attempts');
                return false;
            }
        } catch (error) {
            console.error('Error inserting comment:', error);
            await this.recordError(error, 'insert-comment', postElement);
            return false;
        }
    }

    async typeInCommentBox(commentBox, text) {
        try {
            console.log('💬 Starting to type in comment box...');
            
            // מיקוד על התיבה
            commentBox.focus();
            commentBox.click();
            await this.sleep(300);
            
            // ניקוי התיבה
            if (commentBox.tagName === 'TEXTAREA' || commentBox.tagName === 'INPUT') {
                commentBox.value = '';
            } else {
                commentBox.textContent = '';
                commentBox.innerHTML = '';
            }
            
            // הקלדה מדורגת
            await this.simulateTyping(commentBox, text);
            
            // בדיקה שהטקסט נכתב
            const finalText = commentBox.tagName === 'TEXTAREA' || commentBox.tagName === 'INPUT' 
                ? commentBox.value 
                : commentBox.textContent || commentBox.innerText;
                
            if (finalText.includes(text.substring(0, 10))) {
                console.log('💬 Text successfully typed in comment box');
                
                // חיפוש כפתור שליחה
                const submitButton = this.findSubmitButton(commentBox);
                if (submitButton) {
                    console.log('💬 Found submit button, clicking...');
                    await this.sleep(500);
                    await this.simulateHumanClick(submitButton);
                    await this.sleep(1000);
                    return true;
                } else {
                    console.log('💬 Comment typed but no submit button found - user needs to submit manually');
                    return true;
                }
            } else {
                console.log('💬 Failed to type text in comment box');
                return false;
            }
        } catch (error) {
            console.error('Error typing in comment box:', error);
            return false;
        }
    }

    async simulateTyping(element, text) {
        console.log('💬 Starting typing simulation for text:', text.substring(0, 30) + '...');
        
        const isTextArea = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
        const words = text.split(' ');
        let typedText = '';

        // הקלדה מדורגת של כמה מילים ראשונות
        for (let i = 0; i < Math.min(5, words.length); i++) {
            typedText += (i > 0 ? ' ' : '') + words[i];
            
            if (isTextArea) {
                element.value = typedText;
            } else {
                element.textContent = typedText;
                element.innerHTML = typedText;
            }
            
            // שליחת אירועים שונים
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('keyup', { bubbles: true }));
            
            await this.sleep(200 + Math.random() * 300);
        }

        await this.sleep(800);
        
        // הכנסת הטקסט המלא
        if (isTextArea) {
            element.value = text;
        } else {
            element.textContent = text;
            element.innerHTML = text;
        }
        
        // שליחת אירועים מרובים לוודא שהשינוי נרשם
        const events = ['input', 'change', 'keyup', 'blur', 'focus'];
        for (const eventType of events) {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
            await this.sleep(50);
        }
        
        console.log('💬 Typing simulation completed');
        await this.sleep(500);
    }

    async handleReplyClick(replyButton) {
        if (!this.settings.autoComments || !this.currentPersonaId) {
            console.log('💬 Auto-comments disabled or no persona selected for reply');
            return;
        }

        try {
            console.log('💬 Processing reply click...');
            
            const commentElement = this.findParentComment(replyButton);
            const postElement = this.findParentPost(replyButton);
            
            if (!commentElement || !postElement) {
                console.log('💬 Could not find parent comment or post element');
                return;
            }

            const replyContext = this.extractCommentContent(commentElement);
            const postContent = this.extractPostContent(postElement);

            if (!replyContext || !postContent) {
                console.log('💬 Could not extract reply context or post content');
                return;
            }

            console.log('💬 Generating reply to comment:', replyContext.substring(0, 50) + '...');

            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_COMMENT',
                data: { postContent, replyContext, personaId: this.currentPersonaId }
            });

            if (response && response.success && response.comment) {
                console.log('💬 Reply generated:', response.comment.substring(0, 50) + '...');
                
                await this.sleep(1000);
                let replyBox = this.findReplyBox(commentElement);
                
                // אם לא נמצאה תיבת תגובה, נסה לחפש בכל המסמך
                if (!replyBox) {
                    replyBox = document.querySelector('.ql-editor[contenteditable="true"]');
                    if (replyBox && this.isElementVisible(replyBox)) {
                        console.log('💬 Found reply box in document');
                    }
                }
                
                if (replyBox) {
                    const success = await this.typeInCommentBox(replyBox, response.comment);
                    if (success) {
                        console.log('💬 Reply posted successfully');
                        this.addRealtimeActivity(`💬 השבתי לתגובה: "${response.comment.substring(0, 50)}..."`);
                    }
                } else {
                    console.log('💬 Could not find reply box');
                }
            } else {
                console.log('💬 Failed to generate reply:', response);
            }
        } catch (error) {
            console.error('Error handling reply:', error);
            await this.recordError(error, 'handle-reply');
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
            const selectors = [
                'button[aria-label*="Comment"]',
                'button[aria-label*="תגובה"]', 
                'button[data-control-name="comment"]',
                'button.social-actions-button[aria-label*="Comment"]',
                '.comment-button',
                'button[aria-label^="Comment "]',
                'button.social-action[aria-label*="Comment"]',
                'button.react-button__trigger[aria-label*="Comment"]'
            ];
            
            for (const selector of selectors) {
                const button = postElement.querySelector(selector);
                if (button) {
                    console.log('💬 Found comment button with selector:', selector);
                    return button;
                }
            }
        } else if (this.currentPlatform === 'facebook') {
            return postElement.querySelector('div[aria-label*="Comment"], div[role="button"]:contains("Comment")');
        }
        return null;
    }

    findCommentBox(postElement) {
        if (this.currentPlatform === 'linkedin') {
            const selectors = [
                '.ql-editor[contenteditable="true"]',
                '.comment-texteditor',
                'textarea[placeholder*="comment"]',
                'textarea[placeholder*="תגובה"]',
                'div[contenteditable="true"][role="textbox"]',
                '.comments-comment-texteditor .ql-editor',
                '.comments-comment-box .ql-editor',
                'div[data-placeholder*="comment"]',
                '.artdeco-text-input--input'
            ];
            
            for (const selector of selectors) {
                const box = postElement.querySelector(selector);
                if (box) {
                    console.log('💬 Found comment box with selector:', selector);
                    return box;
                }
            }
            
            // חיפוש גם בכל המסמך אם לא נמצא בפוסט
            for (const selector of selectors) {
                const box = document.querySelector(selector);
                if (box && this.isElementVisible(box)) {
                    console.log('💬 Found comment box in document with selector:', selector);
                    return box;
                }
            }
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

    findCommentBoxNearPost(postElement) {
        try {
            // חיפוש בכל האזור מתחת לפוסט
            const postContainer = postElement.closest('.feed-shared-update-v2, .occludable-update');
            if (postContainer) {
                const nextSibling = postContainer.nextElementSibling;
                if (nextSibling) {
                    const commentBox = nextSibling.querySelector('.ql-editor[contenteditable="true"]');
                    if (commentBox) {
                        console.log('💬 Found comment box near post');
                        return commentBox;
                    }
                }
            }
            
            // חיפוש בכל תיבות התגובות הגלויות
            const visibleCommentBoxes = document.querySelectorAll('.ql-editor[contenteditable="true"]');
            for (const box of visibleCommentBoxes) {
                if (this.isElementVisible(box) && box.offsetHeight > 0) {
                    console.log('💬 Found visible comment box in document');
                    return box;
                }
            }
        } catch (error) {
            console.error('Error finding comment box near post:', error);
        }
        return null;
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