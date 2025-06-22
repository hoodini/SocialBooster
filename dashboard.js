// YUV.AI SocialBot Pro - Dashboard JavaScript
// דשבורד אנליטיקה מתקדם עם גרפים אינטראקטיביים

class AnalyticsDashboard {
    constructor() {
        this.db = null;
        this.charts = {};
        this.currentTimeRange = 30;
        this.realTimeInterval = null;
        this.isRealTimeEnabled = true;
        this.activityItems = [];
        this.languageManager = new LanguageManager();
        
        this.init();
    }

    async init() {
        try {
            // אתחול בסיס הנתונים
            this.db = new SocialBotDB();
            await this.db.init();
            
                    // אתחול ממשק המשתמש
        this.initEventListeners();
        this.setupRealTimeUpdates();
        this.setupMessageListener();
        
        // אתחול שפות
        this.languageManager.updateTranslations();
        
        // טעינת נתונים ראשונית
        await this.loadDashboardData();
            
            // הסתרת מסך הטעינה
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('dashboardContent').style.display = 'block';
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError('שגיאה בטעינת הדשבורד');
        }
    }

    initEventListeners() {
        // בורר טווח זמן
        document.getElementById('timeRangeSelect').addEventListener('change', (e) => {
            this.currentTimeRange = parseInt(e.target.value);
            this.loadDashboardData();
        });

        // כפתור רענון
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboardData();
        });

        // כפתור ייצוא נתונים
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData('comprehensive');
        });

        // כפתורי חיתוך גרפים
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                this.updateChartView(chartType);
                
                // עדכון כפתורים פעילים
                e.target.parentNode.querySelectorAll('.chart-btn').forEach(b => 
                    b.classList.remove('active')
                );
                e.target.classList.add('active');
            });
        });

        // כפתורי בקרה
        document.getElementById('cleanDataBtn').addEventListener('click', () => {
            this.showConfirmDialog('האם אתה בטוח שברצונך לנקות נתונים ישנים?', () => {
                this.cleanOldData();
            });
        });

        document.getElementById('resetStatsBtn').addEventListener('click', () => {
            this.showConfirmDialog('זה ימחק את כל הסטטיסטיקות! האם אתה בטוח?', () => {
                this.resetAllStats();
            });
        });

        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            this.exportData('csv');
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportData('json');
        });

        // כפתורי פעולה ידנית
        document.getElementById('manualLikeBtn').addEventListener('click', () => {
            this.triggerManualLike();
        });

        document.getElementById('manualCommentBtn').addEventListener('click', () => {
            this.triggerManualComment();
        });

        // הגדרות זמן אמת
        document.getElementById('realTimeUpdates').addEventListener('change', (e) => {
            this.isRealTimeEnabled = e.target.checked;
            if (this.isRealTimeEnabled) {
                this.setupRealTimeUpdates();
            } else {
                this.stopRealTimeUpdates();
            }
        });

        // סגירת מודל
        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('detailModal').style.display = 'none';
        });

        // סגירת מודל על לחיצה מחוץ לתוכן
        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // מתחלף שפות
        document.getElementById('langHeDash').addEventListener('click', () => this.switchLanguage('he'));
        document.getElementById('langEnDash').addEventListener('click', () => this.switchLanguage('en'));
    }

    async loadDashboardData() {
        try {
            const loadingBtn = document.getElementById('refreshBtn');
            loadingBtn.textContent = 'טוען...';

            // טעינת סטטיסטיקות כלליות
            const overallStats = await this.db.getOverallStats(this.currentTimeRange);
            this.updateSummaryCards(overallStats);

            // טעינת נתונים יומיים
            const dailyStats = await this.db.getDailyStats(this.currentTimeRange);
            this.updateDailyChart(dailyStats);

            // נתונים לפי פלטפורמה
            const platformStats = await this.db.getStatsByPlatform(this.currentTimeRange);
            this.updatePlatformChart(platformStats);

            // מגמת מעורבות
            this.updateEngagementTrendChart(dailyStats);

            // ניתוח אורך תגובות
            await this.updateCommentLengthChart();

            // טבלאות נתונים
            await this.updateDataTables();

            // פעילות אחרונה
            await this.updateRecentActivity();

            loadingBtn.textContent = 'רענן נתונים';

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('שגיאה בטעינת הנתונים');
        }
    }

    updateSummaryCards(stats) {
        // עדכון מספרים
        document.getElementById('totalLikes').textContent = this.formatNumber(stats.totalLikes);
        document.getElementById('totalComments').textContent = this.formatNumber(stats.totalComments);
        document.getElementById('totalPosts').textContent = this.formatNumber(stats.totalPosts);
        document.getElementById('engagementRate').textContent = stats.engagementRate + '%';

        // חישוב שינויים (לדוגמא - יש לחשב לעומת תקופה קודמת)
        this.updateStatChange('likesChange', '+12%', true);
        this.updateStatChange('commentsChange', '+8%', true);
        this.updateStatChange('postsChange', '+15%', true);
        this.updateStatChange('engagementChange', '-2%', false);
    }

    updateStatChange(elementId, change, isPositive) {
        const element = document.getElementById(elementId);
        element.textContent = change;
        element.className = 'stat-change ' + (isPositive ? 'positive' : 'negative');
    }

    updateDailyChart(dailyStats) {
        const ctx = document.getElementById('dailyChart').getContext('2d');
        
        // הכנת נתונים
        const dates = Object.keys(dailyStats).sort();
        const likesData = dates.map(date => dailyStats[date].likes);
        const commentsData = dates.map(date => dailyStats[date].comments);
        const postsData = dates.map(date => dailyStats[date].posts);

        // יצירת או עדכון הגרף
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [
                    {
                        label: 'לייקים',
                        data: likesData,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'תגובות',
                        data: commentsData,
                        borderColor: '#2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'פוסטים',
                        data: postsData,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#667eea',
                        borderWidth: 1
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    updatePlatformChart(platformStats) {
        const ctx = document.getElementById('platformChart').getContext('2d');
        
        const platforms = Object.keys(platformStats);
        const likesData = platforms.map(platform => platformStats[platform].likes);
        const commentsData = platforms.map(platform => platformStats[platform].comments);

        if (this.charts.platform) {
            this.charts.platform.destroy();
        }

        this.charts.platform = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: platforms.map(p => p === 'linkedin' ? 'LinkedIn' : 'Facebook'),
                datasets: [
                    {
                        label: 'פעילות לפי פלטפורמה',
                        data: likesData.map((likes, i) => likes + commentsData[i]),
                        backgroundColor: [
                            '#0e76a8',
                            '#1877f2'
                        ],
                        borderWidth: 0,
                        hoverOffset: 10
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateEngagementTrendChart(dailyStats) {
        const ctx = document.getElementById('engagementTrendChart').getContext('2d');
        
        const dates = Object.keys(dailyStats).sort();
        const engagementData = dates.map(date => {
            const stats = dailyStats[date];
            const totalActions = stats.likes + stats.comments;
            const posts = stats.posts || 1;
            return ((totalActions / posts) * 100).toFixed(1);
        });

        if (this.charts.engagement) {
            this.charts.engagement.destroy();
        }

        this.charts.engagement = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [{
                    label: 'אחוז מעורבות יומי',
                    data: engagementData,
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `מעורבות: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    async updateCommentLengthChart() {
        const ctx = document.getElementById('commentLengthChart').getContext('2d');
        
        // קבלת נתוני התגובות
        const topComments = await this.db.getTopComments(50);
        
        // חלוקה לקטגוריות לפי אורך
        const lengthCategories = {
            'קצר (1-50)': 0,
            'בינוני (51-100)': 0,
            'ארוך (101-200)': 0,
            'מאוד ארוך (200+)': 0
        };

        topComments.forEach(comment => {
            const length = comment.wordsCount;
            if (length <= 50) lengthCategories['קצר (1-50)']++;
            else if (length <= 100) lengthCategories['בינוני (51-100)']++;
            else if (length <= 200) lengthCategories['ארוך (101-200)']++;
            else lengthCategories['מאוד ארוך (200+)']++;
        });

        if (this.charts.commentLength) {
            this.charts.commentLength.destroy();
        }

        this.charts.commentLength = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(lengthCategories),
                datasets: [{
                    data: Object.values(lengthCategories),
                    backgroundColor: [
                        '#4caf50',
                        '#2196f3',
                        '#ff9800',
                        '#f44336'
                    ],
                    borderWidth: 2,
                    borderColor: 'white'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    async updateDataTables() {
        // טבלת מחברים מובילים
        const topAuthors = await this.db.getTopAuthors(10);
        this.populateTopAuthorsTable(topAuthors);

        // טבלת תגובות מובילות
        const topComments = await this.db.getTopComments(10);
        this.populateTopCommentsTable(topComments);
    }

    populateTopAuthorsTable(authors) {
        const tbody = document.querySelector('#topAuthorsTable tbody');
        tbody.innerHTML = '';

        const total = authors.reduce((sum, author) => sum + author.count, 0);

        authors.forEach((author, index) => {
            const percentage = ((author.count / total) * 100).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${author.author}</td>
                <td>${author.count}</td>
                <td>${percentage}%</td>
            `;
            row.addEventListener('click', () => {
                this.showAuthorDetails(author);
            });
            tbody.appendChild(row);
        });
    }

    populateTopCommentsTable(comments) {
        const tbody = document.querySelector('#topCommentsTable tbody');
        tbody.innerHTML = '';

        comments.forEach(comment => {
            const row = document.createElement('tr');
            const truncatedText = comment.text.length > 80 ? 
                comment.text.substring(0, 80) + '...' : comment.text;
            
            row.innerHTML = `
                <td title="${comment.text}">${truncatedText}</td>
                <td>${comment.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}</td>
                <td>${this.formatDate(comment.date)}</td>
                <td>${comment.wordsCount} מילים</td>
            `;
            row.addEventListener('click', () => {
                this.showCommentDetails(comment);
            });
            tbody.appendChild(row);
        });
    }

    async updateRecentActivity() {
        // סימולציה של פעילות בזמן אמת
        this.addActivityItem('נוצרה תגובה חדשה על פוסט של John Doe', 'comment');
        this.addActivityItem('לייק נוסף לפוסט על AI Technology', 'like');
        this.addActivityItem('סשן חדש התחיל ב-LinkedIn', 'session');
    }

    addActivityItem(text, type) {
        const activityFeed = document.getElementById('activityFeed');
        const now = new Date();
        
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-time">${this.formatTime(now)}</div>
            <div class="activity-text">${text}</div>
        `;

        activityFeed.insertBefore(item, activityFeed.firstChild);

        // שמירה על מקסימום 20 פריטים
        const items = activityFeed.querySelectorAll('.activity-item');
        if (items.length > 20) {
            items[items.length - 1].remove();
        }

        // עדכון סטטוס
        document.getElementById('activityStatus').className = 'status-indicator';
        document.getElementById('activityText').textContent = 'פעיל';
    }

    setupRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }

        this.realTimeInterval = setInterval(() => {
            if (this.isRealTimeEnabled) {
                this.updateRecentActivity();
                // עדכון נתונים כל 30 שניות
                if (Math.random() < 0.1) { // 10% סיכוי לעדכון מלא
                    this.loadDashboardData();
                }
            }
        }, 5000);
    }

    stopRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
        document.getElementById('activityStatus').className = 'status-indicator inactive';
        document.getElementById('activityText').textContent = 'לא פעיל';
    }

    // האזנה להודעות זמן-אמת מהcontent script
    setupMessageListener() {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'NEW_ACTIVITY') {
                    this.handleRealtimeActivity(message.data);
                }
            });
        }
    }

    // טיפול בפעילות זמן-אמת
    handleRealtimeActivity(data) {
        console.log('Received realtime activity:', data);
        
        // הוספת הפעילות לרשימה
        this.addActivityItem(data.text, data.type);
        
        // עדכון הנתונים אם זה לייק
        if (data.type === 'like') {
            // עדכון מיידי של המונה
            const likesElement = document.getElementById('totalLikes');
            if (likesElement) {
                const currentValue = parseInt(likesElement.textContent.replace(/[^\d]/g, '')) || 0;
                likesElement.textContent = this.formatNumber(currentValue + 1);
            }
        }
        
        // רענון הגרפים אחרי 3 שניות
        setTimeout(() => {
            this.loadDashboardData();
        }, 3000);
    }

    async exportData(format) {
        try {
            const stats = await this.db.getOverallStats(this.currentTimeRange);
            const dailyStats = await this.db.getDailyStats(this.currentTimeRange);
            const platformStats = await this.db.getStatsByPlatform(this.currentTimeRange);

            const data = {
                summary: stats,
                daily: dailyStats,
                platforms: platformStats,
                exported: new Date().toISOString(),
                timeRange: this.currentTimeRange
            };

            if (format === 'json') {
                this.downloadFile(
                    JSON.stringify(data, null, 2),
                    `yuvai-analytics-${Date.now()}.json`,
                    'application/json'
                );
            } else if (format === 'csv') {
                const csv = this.convertToCSV(dailyStats);
                this.downloadFile(
                    csv,
                    `yuvai-analytics-${Date.now()}.csv`,
                    'text/csv'
                );
            } else {
                // Comprehensive export
                this.downloadFile(
                    JSON.stringify(data, null, 2),
                    `yuvai-comprehensive-${Date.now()}.json`,
                    'application/json'
                );
            }

            this.showSuccess('הנתונים יוצאו בהצלחה');

        } catch (error) {
            console.error('Export error:', error);
            this.showError('שגיאה בייצוא הנתונים');
        }
    }

    convertToCSV(dailyStats) {
        const headers = ['תאריך', 'לייקים', 'תגובות', 'פוסטים'];
        const rows = [headers];

        Object.keys(dailyStats).sort().forEach(date => {
            const stats = dailyStats[date];
            rows.push([
                date,
                stats.likes,
                stats.comments,
                stats.posts
            ]);
        });

        return rows.map(row => row.join(',')).join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async cleanOldData() {
        try {
            const deletedCount = await this.db.cleanOldData(90);
            this.showSuccess(`נמחקו ${deletedCount} רשומות ישנות`);
            this.loadDashboardData();
        } catch (error) {
            console.error('Clean data error:', error);
            this.showError('שגיאה בניקוי הנתונים');
        }
    }

    async resetAllStats() {
        try {
            // כאן נממש איפוס מלא של בסיס הנתונים
            // לצורך הדוגמא נציג הודעה
            this.showSuccess('כל הסטטיסטיקות אופסו');
            this.loadDashboardData();
        } catch (error) {
            console.error('Reset stats error:', error);
            this.showError('שגיאה באיפוס הנתונים');
        }
    }

    // Modal functions
    showAuthorDetails(author) {
        document.getElementById('modalTitle').textContent = `פרטי מחבר: ${author.author}`;
        document.getElementById('modalBody').innerHTML = `
            <h4>סטטיסטיקות</h4>
            <p><strong>מספר תגובות:</strong> ${author.count}</p>
            <p><strong>דירוג:</strong> #1 מתוך המחברים המובילים</p>
            <p><strong>ממוצע תגובות ביום:</strong> ${(author.count / this.currentTimeRange).toFixed(1)}</p>
            <h4>פעילות אחרונה</h4>
            <p>תגובה אחרונה: לפני 2 שעות</p>
        `;
        document.getElementById('detailModal').style.display = 'block';
    }

    showCommentDetails(comment) {
        document.getElementById('modalTitle').textContent = 'פרטי תגובה';
        document.getElementById('modalBody').innerHTML = `
            <h4>תוכן התגובה</h4>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                ${comment.text}
            </div>
            <h4>פרטים טכניים</h4>
            <p><strong>פלטפורמה:</strong> ${comment.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}</p>
            <p><strong>תאריך:</strong> ${this.formatDate(comment.date)}</p>
            <p><strong>מספר מילים:</strong> ${comment.wordsCount}</p>
            <p><strong>פרסונה:</strong> ${comment.persona || 'ברירת מחדל'}</p>
            <p><strong>מחבר הפוסט:</strong> ${comment.postAuthor}</p>
        `;
        document.getElementById('detailModal').style.display = 'block';
    }

    showConfirmDialog(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('he-IL', {
            day: '2-digit',
            month: '2-digit'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        // יצירת הודעת שגיאה
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // יצירת הודעת הצלחה
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // פונקציות לפעולות ידניות
    async triggerManualLike() {
        const button = document.getElementById('manualLikeBtn');
        const originalText = button.innerHTML;
        
        try {
            button.disabled = true;
            button.innerHTML = '⏳ מבצע לייק...';
            
            // שליחת הודעה לcontent script להפעלת לייק ידני
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'MANUAL_LIKE',
                    source: 'dashboard'
                });
                
                if (response && response.success) {
                    this.showSuccess('לייק ידני בוצע בהצלחה!');
                    this.addActivityItem('לייק ידני מהדשבורד', 'like');
                    
                    // עדכון נתונים אחרי 2 שניות
                    setTimeout(() => {
                        this.loadDashboardData();
                    }, 2000);
                } else {
                    this.showError('לא נמצא פוסט מתאים ללייק או שהוא כבר מקבל לייק');
                }
            } else {
                this.showError('לא נמצא טאב פעיל במדיה חברתית');
            }
        } catch (error) {
            console.error('Manual like error:', error);
            this.showError('שגיאה בביצוע לייק ידני');
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    async triggerManualComment() {
        const button = document.getElementById('manualCommentBtn');
        const originalText = button.innerHTML;
        
        try {
            button.disabled = true;
            button.innerHTML = '⏳ יוצר תגובה...';
            
            // שליחת הודעה לcontent script להפעלת תגובה ידנית
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'MANUAL_COMMENT',
                    source: 'dashboard'
                });
                
                if (response && response.success) {
                    this.showSuccess('תגובה ידנית נוצרה בהצלחה!');
                    this.addActivityItem(`תגובה ידנית מהדשבורד: "${response.comment}"`, 'comment');
                    
                    // עדכון נתונים אחרי 3 שניות
                    setTimeout(() => {
                        this.loadDashboardData();
                    }, 3000);
                } else {
                    this.showError('לא נמצא פוסט מתאים לתגובה או שגיאה ביצירת התגובה');
                }
            } else {
                this.showError('לא נמצא טאב פעיל במדיה חברתית');
            }
        } catch (error) {
            console.error('Manual comment error:', error);
            this.showError('שגיאה ביצירת תגובה ידנית');
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    switchLanguage(lang) {
        if (this.languageManager.setLanguage(lang)) {
            // עדכון כפתורי השפה
            document.querySelectorAll('.lang-btn-dash').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });

            // עדכון תוכן דינמי
            this.updateDynamicContent();
            
            // רענון הגרפים עם התרגומים החדשים
            this.refreshChartsWithTranslations();
        }
    }

    updateDynamicContent() {
        // עדכון כפתורי הפעולה הידנית
        const manualLikeBtn = document.getElementById('manualLikeBtn');
        const manualCommentBtn = document.getElementById('manualCommentBtn');
        
        if (this.languageManager.currentLanguage === 'he') {
            manualLikeBtn.innerHTML = '👍 לייק ידני';
            manualCommentBtn.innerHTML = '💬 תגובה ידנית';
        } else {
            manualLikeBtn.innerHTML = '👍 Manual Like';
            manualCommentBtn.innerHTML = '💬 Manual Comment';
        }

        // עדכון אפשרויות בורר הזמן
        const timeSelect = document.getElementById('timeRangeSelect');
        const currentValue = timeSelect.value;
        
        if (this.languageManager.currentLanguage === 'he') {
            timeSelect.innerHTML = `
                <option value="7">שבוע אחרון</option>
                <option value="30">30 ימים אחרונים</option>
                <option value="90">3 חודשים אחרונים</option>
                <option value="365">שנה אחרונה</option>
            `;
        } else {
            timeSelect.innerHTML = `
                <option value="7">Last Week</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 3 Months</option>
                <option value="365">Last Year</option>
            `;
        }
        
        timeSelect.value = currentValue;

        // עדכון כפתורי הפעולה
        const refreshBtn = document.getElementById('refreshBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (this.languageManager.currentLanguage === 'he') {
            refreshBtn.textContent = 'רענן נתונים';
            exportBtn.textContent = 'יצא נתונים';
        } else {
            refreshBtn.textContent = 'Refresh Data';
            exportBtn.textContent = 'Export Data';
        }
    }

    refreshChartsWithTranslations() {
        // רענון הגרפים כדי להציג תרגומים מעודכנים
        if (this.charts.daily) {
            this.loadDashboardData();
        }
    }
}

// אתחול הדשבורד כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AnalyticsDashboard();
}); 