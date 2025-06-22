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
        
        this.init();
    }

    async init() {
        console.log('YUV.AI SocialBot Pro - Content Script initialized on', this.currentPlatform);
        await this.loadSettings();
        this.setupEventListeners();
        this.startScrollMonitoring();
        this.startPostMonitoring();
        this.processCommentQueue();
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
        chrome.runtime.onMessage.addListener((message) => {
            this.handleMessage(message);
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

            if (this.settings.autoLikes) {
                setTimeout(() => this.processAutoLike(postId, postElement), 1500);
            }
            if (this.settings.autoComments) {
                setTimeout(() => this.processAutoComment(postId, postElement), 3000);
            }
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
            if (likeButton && !this.isAlreadyLiked(likeButton)) {
                await this.simulateHumanClick(likeButton);
                chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { likes: 1 } });
                console.log('Auto-liked post:', postId);
            }
        } catch (error) {
            console.error('Error processing auto-like:', error);
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

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_COMMENT',
                data: { postContent, personaId: this.currentPersonaId }
            });

            if (response && response.success && response.comment) {
                await this.insertComment(postElement, response.comment);
                chrome.runtime.sendMessage({ type: 'UPDATE_STATS', data: { comments: 1 } });
                console.log('Generated comment for post:', postId);
            }
        } catch (error) {
            console.error('Error generating comment:', error);
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
            return postElement.querySelector('button[aria-label*="Like"], button[aria-label*="לייק"], .react-button__trigger');
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
        return ariaPressed === 'true' || className.includes('active') || className.includes('liked') || className.includes('selected');
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
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SocialBotContentScript();
    });
} else {
    new SocialBotContentScript();
} 