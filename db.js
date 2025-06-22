// מודול IndexedDB למעקב אחר נתוני הביצועים של התוסף
// YUV.AI SocialBot Pro - Analytics Database

class SocialBotDB {
    constructor() {
        this.dbName = 'SocialBotAnalytics';
        this.version = 1;
        this.db = null;
    }

    // פתיחת בסיס הנתונים
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // טבלת לייקים
                if (!db.objectStoreNames.contains('likes')) {
                    const likesStore = db.createObjectStore('likes', { keyPath: 'id', autoIncrement: true });
                    likesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    likesStore.createIndex('platform', 'platform', { unique: false });
                    likesStore.createIndex('date', 'date', { unique: false });
                    likesStore.createIndex('postAuthor', 'postAuthor', { unique: false });
                }

                // טבלת תגובות
                if (!db.objectStoreNames.contains('comments')) {
                    const commentsStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
                    commentsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    commentsStore.createIndex('platform', 'platform', { unique: false });
                    commentsStore.createIndex('date', 'date', { unique: false });
                    commentsStore.createIndex('persona', 'persona', { unique: false });
                    commentsStore.createIndex('postAuthor', 'postAuthor', { unique: false });
                }

                // טבלת פוסטים שנצפו
                if (!db.objectStoreNames.contains('viewedPosts')) {
                    const postsStore = db.createObjectStore('viewedPosts', { keyPath: 'id', autoIncrement: true });
                    postsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    postsStore.createIndex('platform', 'platform', { unique: false });
                    postsStore.createIndex('date', 'date', { unique: false });
                    postsStore.createIndex('postAuthor', 'postAuthor', { unique: false });
                    postsStore.createIndex('engaged', 'engaged', { unique: false });
                }

                // טבלת סשנים
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
                    sessionsStore.createIndex('startTime', 'startTime', { unique: false });
                    sessionsStore.createIndex('platform', 'platform', { unique: false });
                    sessionsStore.createIndex('date', 'date', { unique: false });
                }

                // טבלת שגיאות
                if (!db.objectStoreNames.contains('errors')) {
                    const errorsStore = db.createObjectStore('errors', { keyPath: 'id', autoIncrement: true });
                    errorsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    errorsStore.createIndex('type', 'type', { unique: false });
                    errorsStore.createIndex('platform', 'platform', { unique: false });
                }
            };
        });
    }

    // רישום לייק
    async recordLike(postData) {
        const transaction = this.db.transaction(['likes'], 'readwrite');
        const store = transaction.objectStore('likes');
        
        const likeRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            platform: postData.platform,
            postId: postData.postId,
            postAuthor: postData.author,
            postContent: postData.content.substring(0, 200), // רק 200 תווים ראשונים
            postUrl: postData.url,
            authorProfile: postData.authorProfile,
            likesCount: postData.likesCount,
            commentsCount: postData.commentsCount
        };

        return new Promise((resolve, reject) => {
            const request = store.add(likeRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // רישום תגובה
    async recordComment(postData, commentData) {
        const transaction = this.db.transaction(['comments'], 'readwrite');
        const store = transaction.objectStore('comments');
        
        const commentRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            platform: postData.platform,
            postId: postData.postId,
            postAuthor: postData.author,
            postContent: postData.content.substring(0, 200),
            postUrl: postData.url,
            commentText: commentData.text,
            persona: commentData.persona,
            responseTime: commentData.responseTime,
            wordsCount: commentData.text.split(' ').length,
            charactersCount: commentData.text.length,
            isReply: commentData.isReply || false,
            parentComment: commentData.parentComment || null
        };

        return new Promise((resolve, reject) => {
            const request = store.add(commentRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // רישום פוסט שנצפה
    async recordViewedPost(postData, engagementData = {}) {
        const transaction = this.db.transaction(['viewedPosts'], 'readwrite');
        const store = transaction.objectStore('viewedPosts');
        
        const postRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            platform: postData.platform,
            postId: postData.postId,
            postAuthor: postData.author,
            postContent: postData.content.substring(0, 300),
            postUrl: postData.url,
            authorProfile: postData.authorProfile,
            viewDuration: engagementData.viewDuration || 0,
            scrollPauses: engagementData.scrollPauses || 0,
            engaged: engagementData.liked || engagementData.commented || false,
            liked: engagementData.liked || false,
            commented: engagementData.commented || false
        };

        return new Promise((resolve, reject) => {
            const request = store.add(postRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // רישום סשן
    async recordSession(sessionData) {
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        
        const sessionRecord = {
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            duration: sessionData.endTime - sessionData.startTime,
            date: new Date(sessionData.startTime).toISOString().split('T')[0],
            platform: sessionData.platform,
            postsViewed: sessionData.postsViewed || 0,
            likesGiven: sessionData.likesGiven || 0,
            commentsPosted: sessionData.commentsPosted || 0,
            scrollDistance: sessionData.scrollDistance || 0,
            url: sessionData.url
        };

        return new Promise((resolve, reject) => {
            const request = store.add(sessionRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // רישום שגיאה
    async recordError(errorData) {
        const transaction = this.db.transaction(['errors'], 'readwrite');
        const store = transaction.objectStore('errors');
        
        const errorRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: errorData.type,
            message: errorData.message,
            stack: errorData.stack,
            platform: errorData.platform,
            url: errorData.url,
            context: errorData.context
        };

        return new Promise((resolve, reject) => {
            const request = store.add(errorRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // שאילתות אנליטיקה מוכנות

    // סטטיסטיקות כלליות
    async getOverallStats(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffTimestamp = cutoffDate.getTime();

        const stats = {
            totalLikes: 0,
            totalComments: 0,
            totalPosts: 0,
            totalSessions: 0,
            totalErrors: 0,
            engagementRate: 0
        };

        // ספירת לייקים
        stats.totalLikes = await this.countRecords('likes', 'timestamp', cutoffTimestamp);
        
        // ספירת תגובות
        stats.totalComments = await this.countRecords('comments', 'timestamp', cutoffTimestamp);
        
        // ספירת פוסטים
        stats.totalPosts = await this.countRecords('viewedPosts', 'timestamp', cutoffTimestamp);
        
        // ספירת סשנים
        stats.totalSessions = await this.countRecords('sessions', 'startTime', cutoffTimestamp);
        
        // ספירת שגיאות
        stats.totalErrors = await this.countRecords('errors', 'timestamp', cutoffTimestamp);

        // חישוב אחוז מעורבות
        if (stats.totalPosts > 0) {
            const engagedPosts = await this.countRecords('viewedPosts', 'timestamp', cutoffTimestamp, { engaged: true });
            stats.engagementRate = ((engagedPosts / stats.totalPosts) * 100).toFixed(1);
        }

        return stats;
    }

    // נתונים לפי יום
    async getDailyStats(days = 30) {
        const dailyStats = {};
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // יצירת מפתחות לכל הימים
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyStats[dateKey] = {
                likes: 0,
                comments: 0,
                posts: 0,
                sessions: 0
            };
        }

        // לייקים לפי יום
        const likes = await this.getRecordsByDateRange('likes', cutoffDate, new Date());
        likes.forEach(like => {
            if (dailyStats[like.date]) {
                dailyStats[like.date].likes++;
            }
        });

        // תגובות לפי יום
        const comments = await this.getRecordsByDateRange('comments', cutoffDate, new Date());
        comments.forEach(comment => {
            if (dailyStats[comment.date]) {
                dailyStats[comment.date].comments++;
            }
        });

        // פוסטים לפי יום
        const posts = await this.getRecordsByDateRange('viewedPosts', cutoffDate, new Date());
        posts.forEach(post => {
            if (dailyStats[post.date]) {
                dailyStats[post.date].posts++;
            }
        });

        return dailyStats;
    }

    // נתונים לפי פלטפורמה
    async getStatsByPlatform(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffTimestamp = cutoffDate.getTime();

        const platforms = ['linkedin', 'facebook'];
        const platformStats = {};

        for (const platform of platforms) {
            platformStats[platform] = {
                likes: await this.countRecordsByIndex('likes', 'platform', platform, cutoffTimestamp),
                comments: await this.countRecordsByIndex('comments', 'platform', platform, cutoffTimestamp),
                posts: await this.countRecordsByIndex('viewedPosts', 'platform', platform, cutoffTimestamp)
            };
        }

        return platformStats;
    }

    // התגובות הפופולריות ביותר
    async getTopComments(limit = 10) {
        const transaction = this.db.transaction(['comments'], 'readonly');
        const store = transaction.objectStore('comments');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const comments = request.result;
                // מיון לפי אורך התגובה ואיכות
                const topComments = comments
                    .sort((a, b) => b.charactersCount - a.charactersCount)
                    .slice(0, limit)
                    .map(comment => ({
                        text: comment.commentText,
                        persona: comment.persona,
                        date: comment.date,
                        platform: comment.platform,
                        postAuthor: comment.postAuthor,
                        wordsCount: comment.wordsCount
                    }));
                resolve(topComments);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // המחברים שהכי מגיבים להם
    async getTopAuthors(limit = 10) {
        const transaction = this.db.transaction(['comments'], 'readonly');
        const store = transaction.objectStore('comments');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const comments = request.result;
                const authorCounts = {};
                
                comments.forEach(comment => {
                    authorCounts[comment.postAuthor] = (authorCounts[comment.postAuthor] || 0) + 1;
                });

                const topAuthors = Object.entries(authorCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, limit)
                    .map(([author, count]) => ({ author, count }));
                
                resolve(topAuthors);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // פונקציות עזר
    async countRecords(storeName, indexName, minValue) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const request = index.count(IDBKeyRange.lowerBound(minValue));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async countRecordsByIndex(storeName, indexName, value, minTimestamp) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => {
                const records = request.result.filter(record => record.timestamp >= minTimestamp);
                resolve(records.length);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getRecordsByDateRange(storeName, startDate, endDate) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('date');
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(IDBKeyRange.bound(startDateStr, endDateStr));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ניקוי נתונים ישנים
    async cleanOldData(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffTimestamp = cutoffDate.getTime();

        const stores = ['likes', 'comments', 'viewedPosts', 'sessions', 'errors'];
        let deletedCount = 0;

        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index('timestamp');
            
            const request = index.openCursor(IDBKeyRange.upperBound(cutoffTimestamp));
            
            await new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedCount++;
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
        }

        return deletedCount;
    }
}

// יצירת instance גלובלי
window.socialBotDB = new SocialBotDB(); 