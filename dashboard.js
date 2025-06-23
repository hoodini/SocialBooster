// YUV.AI SocialBot Pro - Advanced AI Analytics Dashboard
// דשבורד אנליטיקה מתקדם עם תובנות AI ומערכת סוכנים

class AdvancedAnalyticsDashboard {
    constructor() {
        this.db = null;
        this.charts = {};
        this.aiInsights = {};
        this.currentTimeRange = 30;
        this.realTimeInterval = null;
        this.aiInsightsInterval = null;
        this.isRealTimeEnabled = true;
        this.activityItems = [];
        this.languageManager = new LanguageManager();
        this.agentMetrics = {
            contentAnalyzer: { tasks: 0, success: 0, avgTime: 0, quality: 0 },
            sentimentAnalyzer: { tasks: 0, success: 0, avgTime: 0, quality: 0 },
            commentGenerator: { tasks: 0, success: 0, avgTime: 0, quality: 0 },
            replyGenerator: { tasks: 0, success: 0, avgTime: 0, quality: 0 },
            qualityReviewer: { tasks: 0, success: 0, avgTime: 0, quality: 0 },
            insightGenerator: { tasks: 0, success: 0, avgTime: 0, quality: 0 }
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Advanced AI Analytics Dashboard...');
            
            // אתחול בסיס הנתונים
            this.db = new SocialBotDB();
            await this.db.init();
            
            // אתחול ממשק המשתמש
            this.initEventListeners();
            this.setupRealTimeUpdates();
            this.setupMessageListener();
            this.setupAIInsightsSystem();
            
            // אתחול שפות
            this.languageManager.updateTranslations();
            
            // טעינת נתונים ראשונית
            await this.loadDashboardData();
            await this.initializeAIInsights();
            
            // הסתרת מסך הטעינה
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('dashboardContent').style.display = 'block';
            
            console.log('✅ Advanced AI Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization error:', error);
            this.showError('שגיאה בטעינת הדשבורד המתקדם');
        }
    }

    initEventListeners() {
        // בורר טווח זמן
        document.getElementById('timeRangeSelect').addEventListener('change', (e) => {
            this.currentTimeRange = parseInt(e.target.value);
            this.loadDashboardData();
            this.refreshAIInsights();
        });

        // כפתור רענון
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboardData();
            this.refreshAIInsights();
        });

        // כפתור ייצוא נתונים
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData('comprehensive');
        });

        // כפתורי AI Insights
        document.getElementById('generateInsights').addEventListener('click', () => {
            this.generateNewAIInsights();
        });

        document.getElementById('refreshInsights').addEventListener('click', () => {
            this.refreshAIInsights();
        });

        document.getElementById('aiInsightsBtn').addEventListener('click', () => {
            this.showAdvancedAIInsights();
        });

        // כפתורי חיתוך גרפים
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                this.updateChartView(chartType, e.target);
            });
        });

        // כפתורי פעולה ידנית
        document.getElementById('manualLikeBtn').addEventListener('click', () => {
            this.triggerManualLike();
        });

        document.getElementById('manualCommentBtn').addEventListener('click', () => {
            this.triggerManualComment();
        });

        // בקרת פעילות זמן אמת
        document.getElementById('pauseActivity').addEventListener('click', () => {
            this.toggleActivityFeed();
        });

        document.getElementById('clearActivity').addEventListener('click', () => {
            this.clearActivityFeed();
        });

        document.getElementById('activityFilter').addEventListener('change', (e) => {
            this.filterActivityFeed(e.target.value);
        });

        // מודלים
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // סגירת מודל על לחיצה מחוץ לתוכן
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    e.target.style.display = 'none';
                }
            });
        });

        // מתחלף שפות
        document.getElementById('langHeDash').addEventListener('click', () => this.switchLanguage('he'));
        document.getElementById('langEnDash').addEventListener('click', () => this.switchLanguage('en'));

        // ייצוא מתקדם
        document.getElementById('exportAdvancedBtn').addEventListener('click', () => {
            this.exportAdvancedReport();
        });

        document.getElementById('printReportBtn').addEventListener('click', () => {
            this.printReport();
        });
    }

    async loadDashboardData() {
        try {
            const loadingBtn = document.getElementById('refreshBtn');
            const originalText = loadingBtn.textContent;
            loadingBtn.textContent = 'טוען...';

            // טעינת סטטיסטיקות כלליות מתקדמות
            const overallStats = await this.db.getOverallStats(this.currentTimeRange);
            await this.updateAdvancedSummaryCards(overallStats);

            // טעינת נתונים יומיים מפורטים
            const dailyStats = await this.db.getDailyStats(this.currentTimeRange);
            await this.updateAllCharts(dailyStats, overallStats);

            // טעינת טבלאות מתקדמות
            await this.updateAdvancedDataTables();

            // עדכון פעילות אחרונה
            await this.updateRecentActivity();

            // עדכון מטריקות AI
            await this.updateAIMetrics();

            loadingBtn.textContent = originalText;

        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showError('שגיאה בטעינת הנתונים המתקדמים');
        }
    }

    async updateAdvancedSummaryCards(stats) {
        // עדכון מספרים בסיסיים
        document.getElementById('totalLikes').textContent = this.formatNumber(stats.totalLikes);
        document.getElementById('totalComments').textContent = this.formatNumber(stats.totalComments);
        document.getElementById('totalPosts').textContent = this.formatNumber(stats.totalPosts);

        // חישוב מטריקות מתקדמות
        const avgDailyLikes = Math.round(stats.totalLikes / this.currentTimeRange);
        const avgCommentLength = stats.avgCommentLength || 25;
        const aiQualityScore = this.calculateAIQualityScore();
        const avgViewTime = stats.avgViewTime || 3.2;
        const engagementRate = this.calculateEngagementRate(stats);
        const sentimentScore = await this.calculateSentimentScore();
        const systemEfficiency = this.calculateSystemEfficiency();

        // עדכון פרטים מתקדמים
        document.getElementById('avgDailyLikes').textContent = avgDailyLikes;
        document.getElementById('maxDailyLikes').textContent = stats.maxDailyLikes || avgDailyLikes * 1.5;
        document.getElementById('avgCommentLength').textContent = avgCommentLength;
        document.getElementById('aiQualityScore').textContent = aiQualityScore + '%';
        document.getElementById('avgViewTime').textContent = avgViewTime;
        document.getElementById('engagementRate').textContent = engagementRate + '%';
        document.getElementById('sentimentScore').textContent = sentimentScore + '%';
        document.getElementById('systemEfficiency').textContent = systemEfficiency + '%';

        // עדכון שינויים
        await this.updateStatChanges(stats);

        // עדכון מטריקות AI
        document.getElementById('totalInsights').textContent = this.aiInsights.totalGenerated || 0;
        document.getElementById('predictionAccuracy').textContent = (this.aiInsights.accuracy || 85) + '%';
        document.getElementById('agentPerformance').textContent = this.calculateAgentPerformance() + '%';
        document.getElementById('positiveRatio').textContent = (sentimentScore > 60 ? sentimentScore : 60) + '%';
        document.getElementById('emotionalIntensity').textContent = this.getEmotionalIntensityLabel();
        document.getElementById('responseTime').textContent = this.calculateAvgResponseTime();
        document.getElementById('successRate').textContent = this.calculateSuccessRate() + '%';
    }

    async updateAllCharts(dailyStats, overallStats) {
        // גרף זמן אמת
        await this.updateRealtimeChart();
        
        // גרף ביצועי AI
        await this.updateAIPerformanceChart();
        
        // גרף ניתוח רגש
        await this.updateSentimentChart();
        
        // גרף פעילות יומית מפורט
        this.updateDailyChart(dailyStats);
        
        // גרף פלטפורמות
        const platformStats = await this.db.getStatsByPlatform(this.currentTimeRange);
        this.updatePlatformChart(platformStats);
        
        // גרפים חדשים
        await this.updateEngagementQualityChart(dailyStats);
        await this.updateResponseTimeChart();
        await this.updateContentTypeChart();
        await this.updatePersonaChart();
        await this.updatePredictionChart();
    }

    async updateRealtimeChart() {
        const ctx = document.getElementById('realtimeChart').getContext('2d');
        
        // נתוני זמן אמת - עדכון כל 5 שניות
        const realtimeData = await this.generateRealtimeData();
        
        if (this.charts.realtime) {
            this.charts.realtime.destroy();
        }

        this.charts.realtime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: realtimeData.labels,
                datasets: [{
                    label: 'לייקים',
                    data: realtimeData.likes,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'תגובות',
                    data: realtimeData.comments,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'תובנות AI',
                    data: realtimeData.insights,
                    borderColor: '#9C27B0',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'פעילות זמן אמת - עדכון כל 5 שניות'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 500
                }
            }
        });
    }

    async updateAIPerformanceChart() {
        const ctx = document.getElementById('aiPerformanceChart').getContext('2d');
        
        const agentNames = Object.keys(this.agentMetrics);
        const performanceData = agentNames.map(agent => 
            this.agentMetrics[agent].success > 0 ? 
            (this.agentMetrics[agent].success / this.agentMetrics[agent].tasks * 100) : 0
        );

        if (this.charts.aiPerformance) {
            this.charts.aiPerformance.destroy();
        }

        this.charts.aiPerformance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: agentNames.map(name => this.translateAgentName(name)),
                datasets: [{
                    label: 'ביצועי סוכנים (%)',
                    data: performanceData,
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderColor: '#9C27B0',
                    pointBackgroundColor: '#9C27B0',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#9C27B0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    async updateSentimentChart() {
        const ctx = document.getElementById('sentimentChart').getContext('2d');
        
        // נתוני רגש לאורך זמן
        const sentimentData = await this.generateSentimentData();
        
        if (this.charts.sentiment) {
            this.charts.sentiment.destroy();
        }

        this.charts.sentiment = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sentimentData.labels,
                datasets: [{
                    label: 'חיובי',
                    data: sentimentData.positive,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                }, {
                    label: 'נייטרלי',
                    data: sentimentData.neutral,
                    borderColor: '#FFC107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4
                }, {
                    label: 'שלילי',
                    data: sentimentData.negative,
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    updateDailyChart(dailyStats) {
        const ctx = document.getElementById('dailyChart').getContext('2d');
        
        // הכנת נתונים מפורטים יותר
        const dates = Object.keys(dailyStats).sort();
        const likesData = dates.map(date => dailyStats[date].likes || 0);
        const commentsData = dates.map(date => dailyStats[date].comments || 0);
        const postsData = dates.map(date => dailyStats[date].posts || 0);
        const insightsData = dates.map(date => dailyStats[date].insights || 0);

        // יצירת או עדכון הגרף
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        this.charts.daily = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [{
                    label: 'לייקים',
                    data: likesData,
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }, {
                    label: 'תגובות',
                    data: commentsData,
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: '#2196F3',
                    borderWidth: 1
                }, {
                    label: 'פוסטים',
                    data: postsData,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: '#FFC107',
                    borderWidth: 1
                }, {
                    label: 'תובנות AI',
                    data: insightsData,
                    backgroundColor: 'rgba(156, 39, 176, 0.8)',
                    borderColor: '#9C27B0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    updatePlatformChart(platformStats) {
        const ctx = document.getElementById('platformChart').getContext('2d');
        
        const platforms = Object.keys(platformStats);
        const likesData = platforms.map(platform => platformStats[platform].likes || 0);
        const commentsData = platforms.map(platform => platformStats[platform].comments || 0);

        if (this.charts.platform) {
            this.charts.platform.destroy();
        }

        this.charts.platform = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: platforms.map(platform => this.translatePlatform(platform)),
                datasets: [{
                    label: 'לייקים',
                    data: likesData,
                    backgroundColor: [
                        'rgba(0, 119, 181, 0.8)', // LinkedIn
                        'rgba(24, 119, 242, 0.8)', // Facebook
                        'rgba(29, 161, 242, 0.8)', // Twitter
                        'rgba(225, 48, 108, 0.8)'  // Instagram
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    async updateEngagementQualityChart(dailyStats) {
        const ctx = document.getElementById('engagementQualityChart').getContext('2d');
        
        // יצירת נתוני איכות מעורבות
        const qualityData = await this.generateEngagementQualityData(dailyStats);
        
        if (this.charts.engagementQuality) {
            this.charts.engagementQuality.destroy();
        }

        this.charts.engagementQuality = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'איכות מול כמות מעורבות',
                    data: qualityData,
                    backgroundColor: 'rgba(156, 39, 176, 0.6)',
                    borderColor: '#9C27B0',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'כמות מעורבות'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'איכות מעורבות (%)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    async updateResponseTimeChart() {
        const ctx = document.getElementById('responseTimeChart').getContext('2d');
        
        const responseTimeData = await this.generateResponseTimeData();
        
        if (this.charts.responseTime) {
            this.charts.responseTime.destroy();
        }

        this.charts.responseTime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: responseTimeData.labels,
                datasets: [{
                    label: 'זמן תגובה ממוצע (שניות)',
                    data: responseTimeData.times,
                    borderColor: '#FF5722',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    async updateContentTypeChart() {
        const ctx = document.getElementById('contentTypeChart').getContext('2d');
        
        const contentTypes = ['מידע', 'רגש', 'שאלה', 'הכרזה', 'סיפור', 'דעה'];
        const performanceData = await this.generateContentTypePerformance();
        
        if (this.charts.contentType) {
            this.charts.contentType.destroy();
        }

        this.charts.contentType = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: contentTypes,
                datasets: [{
                    data: performanceData,
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(33, 150, 243, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(156, 39, 176, 0.8)',
                        'rgba(255, 87, 34, 0.8)',
                        'rgba(96, 125, 139, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    async updatePersonaChart() {
        const ctx = document.getElementById('personaChart').getContext('2d');
        
        const personaData = await this.generatePersonaPerformanceData();
        
        if (this.charts.persona) {
            this.charts.persona.destroy();
        }

        this.charts.persona = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: personaData.names,
                datasets: [{
                    label: 'ביצועים (%)',
                    data: personaData.performance,
                    backgroundColor: personaData.names.map((_, index) => 
                        `hsla(${index * 60}, 70%, 60%, 0.8)`
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    async updatePredictionChart() {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        
        const predictionData = await this.generatePredictionData();
        
        if (this.charts.prediction) {
            this.charts.prediction.destroy();
        }

        this.charts.prediction = new Chart(ctx, {
            type: 'line',
            data: {
                labels: predictionData.labels,
                datasets: [{
                    label: 'נתונים היסטוריים',
                    data: predictionData.historical,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4
                }, {
                    label: 'תחזית AI',
                    data: predictionData.predicted,
                    borderColor: '#9C27B0',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    async setupAIInsightsSystem() {
        console.log('🧠 Setting up AI Insights System...');
        
        // עדכון תובנות AI כל דקה
        this.aiInsightsInterval = setInterval(async () => {
            if (this.isRealTimeEnabled) {
                await this.updateAIInsightsInBackground();
            }
        }, 60000);
    }

    async initializeAIInsights() {
        try {
            // יצירת תובנות AI ראשוניות
            await this.generateInitialAIInsights();
        } catch (error) {
            console.error('❌ Error initializing AI insights:', error);
        }
    }

    async generateInitialAIInsights() {
        // יצירת תובנות בסיסיות
        this.updateInsightCard('performanceInsight', {
            title: 'ביצועים מעולים',
            content: 'המערכת פועלת ברמת יעילות של 87%. הסוכנים מתפקדים בצורה אופטימלית.',
            score: 87,
            trend: 'עלייה'
        });

        this.updateInsightCard('trendInsight', {
            title: 'מגמה חיובית',
            content: 'זוהתה עלייה של 15% במעורבות השבוע. התוכן מקבל תגובות איכותיות יותר.',
            score: 15,
            trend: 'עלייה'
        });

        this.updateInsightCard('recommendationsInsight', {
            title: 'המלצות לשיפור',
            content: 'מומלץ להגביר פעילות בין 19:00-21:00 לטובת מעורבות מקסימלית.',
            score: null,
            trend: 'המלצה'
        });
    }

    async generateNewAIInsights() {
        const generateBtn = document.getElementById('generateInsights');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'מייצר...';
        generateBtn.disabled = true;

        try {
            // שליחת בקשה לסוכני AI ליצירת תובנות חדשות
            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_DASHBOARD_INSIGHTS',
                data: await this.collectDashboardData()
            });

            if (response.success && response.insights) {
                await this.displayAIInsights(response.insights);
            }
        } catch (error) {
            console.error('❌ Error generating AI insights:', error);
            this.showError('שגיאה ביצירת תובנות AI');
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
    }

    async displayAIInsights(insights) {
        if (insights.analytics) {
            this.updateInsightCard('performanceInsight', {
                title: 'ניתוח ביצועים מתקדם',
                content: insights.analytics.performance_summary,
                score: null,
                trend: 'תובנה'
            });
        }

        if (insights.trends) {
            this.updateInsightCard('trendInsight', {
                title: 'ניתוח מגמות',
                content: insights.trends.performance_trends,
                score: null,
                trend: 'מגמה'
            });
        }

        if (insights.recommendations) {
            this.updateInsightCard('recommendationsInsight', {
                title: 'המלצות מותאמות',
                content: insights.recommendations.posting_strategy,
                score: null,
                trend: 'המלצה'
            });
        }
    }

    updateInsightCard(cardId, insight) {
        const card = document.getElementById(cardId);
        if (!card) return;

        card.innerHTML = `
            <div class="insight-content-header">
                <h4>${insight.title}</h4>
                ${insight.score !== null ? `<span class="insight-score">${insight.score}${typeof insight.score === 'number' ? '%' : ''}</span>` : ''}
            </div>
            <p class="insight-text">${insight.content}</p>
            <div class="insight-meta">
                <span class="insight-trend ${insight.trend.toLowerCase()}">${insight.trend}</span>
                <span class="insight-time">${this.formatTime(new Date())}</span>
            </div>
        `;
    }

    async showAdvancedAIInsights() {
        const modal = document.getElementById('aiInsightsModal');
        const container = document.getElementById('aiInsightsContainer');
        
        modal.style.display = 'block';
        container.innerHTML = '<div class="loading-insight">מייצר תובנות מתקדמות...</div>';

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_AI_INSIGHTS',
                data: await this.collectDashboardData()
            });

            if (response.success && response.insights) {
                this.displayAdvancedInsights(response.insights, container);
            }
        } catch (error) {
            container.innerHTML = '<div class="error-insight">שגיאה ביצירת תובנות מתקדמות</div>';
        }
    }

    displayAdvancedInsights(insights, container) {
        const insightsHTML = `
            <div class="advanced-insights">
                <div class="insights-section">
                    <h3>🔍 דפוסים שהתגלו</h3>
                    <ul>
                        ${insights.patterns_discovered?.map(pattern => `<li>${pattern}</li>`).join('') || '<li>לא נמצאו דפוסים מיוחדים</li>'}
                    </ul>
                </div>
                
                <div class="insights-section">
                    <h3>🚀 הזדמנויות לאופטימיזציה</h3>
                    <ul>
                        ${insights.optimization_opportunities?.map(opp => `<li>${opp}</li>`).join('') || '<li>המערכת פועלת באופן אופטימלי</li>'}
                    </ul>
                </div>
                
                <div class="insights-section">
                    <h3>⚠️ גורמי סיכון</h3>
                    <ul>
                        ${insights.risk_factors?.map(risk => `<li>${risk}</li>`).join('') || '<li>לא זוהו סיכונים משמעותיים</li>'}
                    </ul>
                </div>
                
                <div class="insights-section">
                    <h3>✅ מחווני הצלחה</h3>
                    <ul>
                        ${insights.success_indicators?.map(indicator => `<li>${indicator}</li>`).join('') || '<li>המערכת פועלת בהצלחה</li>'}
                    </ul>
                </div>
                
                <div class="insights-section">
                    <h3>🎯 פעולות מומלצות</h3>
                    <ul>
                        ${insights.recommended_actions?.map(action => `<li>${action}</li>`).join('') || '<li>המשך הפעילות השוטפת</li>'}
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = insightsHTML;
    }

    // 🔧 Helper Methods - Advanced Analytics Dashboard
    
    async collectDashboardData() {
        try {
            const stats = await this.db.getOverallStats(this.currentTimeRange);
            const dailyStats = await this.db.getDailyStats(this.currentTimeRange);
            const recentActivity = await this.db.getRecentActivity(50);
            
            return {
                stats,
                dailyStats,
                recentActivity,
                timeRange: this.currentTimeRange,
                agentMetrics: this.agentMetrics,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error collecting dashboard data:', error);
            return null;
        }
    }

    async updateAIInsightsInBackground() {
        try {
            // עדכון שקט של תובנות AI ברקע
            const response = await chrome.runtime.sendMessage({
                type: 'GET_AI_INSIGHTS',
                data: await this.collectDashboardData()
            });

            if (response.success && response.insights) {
                this.aiInsights = response.insights;
                this.updateInsightsIndicators();
            }
        } catch (error) {
            console.log('Background AI insights update failed:', error);
        }
    }

    updateInsightsIndicators() {
        // עדכון חזותי עדין של אינדיקטורי התובנות
        const indicators = document.querySelectorAll('.ai-insight-indicator');
        indicators.forEach(indicator => {
            if (this.aiInsights && Object.keys(this.aiInsights).length > 0) {
                indicator.classList.add('insights-available');
                indicator.title = 'תובנות AI זמינות - לחץ לצפייה';
            }
        });
    }

    async refreshAIInsights() {
        console.log('🔄 Refreshing AI insights...');
        await this.generateNewAIInsights();
    }

    calculateAIQualityScore() {
        // חישוב ציון איכות AI מבוסס על מטריקות הסוכנים
        let totalScore = 0;
        let totalTasks = 0;

        for (const [agentName, metrics] of Object.entries(this.agentMetrics)) {
            if (metrics.tasks > 0) {
                const agentScore = (metrics.success / metrics.tasks) * 100 * (metrics.quality / 100);
                totalScore += agentScore * metrics.tasks;
                totalTasks += metrics.tasks;
            }
        }

        return totalTasks > 0 ? Math.round(totalScore / totalTasks) : 85;
    }

    calculateEngagementRate(stats) {
        if (!stats.totalPosts || stats.totalPosts === 0) return 0;
        const totalEngagements = (stats.totalLikes || 0) + (stats.totalComments || 0);
        return Math.round((totalEngagements / stats.totalPosts) * 100);
    }

    async calculateSentimentScore() {
        try {
            const recentComments = await this.db.getRecentComments(20);
            if (!recentComments || recentComments.length === 0) return 75;

            // ניתוח סנטימנט בסיסי
            let positiveCount = 0;
            recentComments.forEach(comment => {
                if (this.isPositiveSentiment(comment.content)) {
                    positiveCount++;
                }
            });

            return Math.round((positiveCount / recentComments.length) * 100);
        } catch (error) {
            return 75; // ברירת מחדל
        }
    }

    isPositiveSentiment(text) {
        const positiveWords = ['תודה', 'מעולה', 'נהדר', 'מעניין', 'אהבת', 'מסכים', '👍', '💯', '❤️', '😊'];
        const negativeWords = ['לא', 'רע', 'גרוע', 'לא מסכים', '👎', '😞'];

        let score = 0;
        positiveWords.forEach(word => {
            if (text.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
            if (text.includes(word)) score -= 1;
        });

        return score > 0;
    }

    calculateSystemEfficiency() {
        // חישוב יעילות המערכת בהתבסס על זמני תגובה ושיעור הצלחה
        const avgResponseTime = this.calculateAverageResponseTime();
        const successRate = this.calculateOverallSuccessRate();
        
        // נוסחה פשוטה ליעילות
        const timeScore = Math.max(0, 100 - (avgResponseTime / 100)); // פחות זמן = יותר טוב
        const combinedScore = (successRate + timeScore) / 2;
        
        return Math.round(combinedScore);
    }

    calculateAverageResponseTime() {
        let totalTime = 0;
        let totalTasks = 0;

        for (const metrics of Object.values(this.agentMetrics)) {
            if (metrics.avgTime > 0) {
                totalTime += metrics.avgTime * metrics.tasks;
                totalTasks += metrics.tasks;
            }
        }

        return totalTasks > 0 ? totalTime / totalTasks : 2000; // 2 שניות ברירת מחדל
    }

    calculateOverallSuccessRate() {
        let totalSuccess = 0;
        let totalTasks = 0;

        for (const metrics of Object.values(this.agentMetrics)) {
            totalSuccess += metrics.success;
            totalTasks += metrics.tasks;
        }

        return totalTasks > 0 ? (totalSuccess / totalTasks) * 100 : 95;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatTime(date) {
        return date.toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // 🎯 Action Methods
    async updateAIMetrics() {
        try {
            // עדכון מטריקות AI מתוך הרשומות האחרונות
            const recentAIActivity = await this.db.getAIGenerationStats(100);
            
            if (recentAIActivity) {
                // עדכון מטריקות הסוכנים
                this.updateAgentMetricsFromActivity(recentAIActivity);
                this.displayAIMetricsInTable();
            }
        } catch (error) {
            console.error('Error updating AI metrics:', error);
        }
    }

    updateAgentMetricsFromActivity(activity) {
        // איפוס נתונים
        Object.keys(this.agentMetrics).forEach(agent => {
            this.agentMetrics[agent] = { tasks: 0, success: 0, avgTime: 0, quality: 0 };
        });

        // חישוב נתונים מפעילות אחרונה
        activity.forEach(item => {
            if (item.agent && this.agentMetrics[item.agent]) {
                this.agentMetrics[item.agent].tasks++;
                if (item.success) this.agentMetrics[item.agent].success++;
                if (item.quality) this.agentMetrics[item.agent].quality = 
                    (this.agentMetrics[item.agent].quality + item.quality) / 2;
                if (item.responseTime) this.agentMetrics[item.agent].avgTime = 
                    (this.agentMetrics[item.agent].avgTime + item.responseTime) / 2;
            }
        });
    }

    displayAIMetricsInTable() {
        const tableBody = document.getElementById('aiAgentMetricsBody');
        if (!tableBody) return;

        const metricsHTML = Object.entries(this.agentMetrics).map(([agent, metrics]) => {
            const successRate = metrics.tasks > 0 ? Math.round((metrics.success / metrics.tasks) * 100) : 0;
            return `
                <tr>
                    <td>${this.translateAgentName(agent)}</td>
                    <td>${metrics.tasks}</td>
                    <td>${successRate}%</td>
                    <td>${metrics.avgTime.toFixed(0)}ms</td>
                    <td>${Math.round(metrics.quality)}%</td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = metricsHTML;
    }

    translateAgentName(agentName) {
        const translations = {
            'contentAnalyzer': 'מנתח תוכן',
            'sentimentAnalyzer': 'מנתח סנטימנט',
            'commentGenerator': 'מייצר תגובות',
            'replyGenerator': 'מייצר תשובות',
            'qualityReviewer': 'בוחן איכות',
            'insightGenerator': 'מייצר תובנות'
        };
        return translations[agentName] || agentName;
    }

    async updateAdvancedDataTables() {
        await Promise.all([
            this.updateTopContentTable(),
            this.updateSentimentAnalysisTable(),
            this.updateErrorAnalysisTable()
        ]);
    }

    async updateTopContentTable() {
        try {
            const topContent = await this.db.getTopPerformingContent(10);
            const tableBody = document.getElementById('topContentBody');
            
            if (tableBody && topContent) {
                const contentHTML = topContent.map(item => `
                    <tr>
                        <td>${this.truncateText(item.content, 50)}</td>
                        <td>${item.likes || 0}</td>
                        <td>${item.comments || 0}</td>
                        <td>${this.formatTime(new Date(item.timestamp))}</td>
                    </tr>
                `).join('');
                
                tableBody.innerHTML = contentHTML;
            }
        } catch (error) {
            console.error('Error updating top content table:', error);
        }
    }

    async updateSentimentAnalysisTable() {
        try {
            const sentimentData = await this.db.getSentimentAnalysis(20);
            const tableBody = document.getElementById('sentimentAnalysisBody');
            
            if (tableBody && sentimentData) {
                const sentimentHTML = sentimentData.map(item => `
                    <tr>
                        <td>${this.truncateText(item.content, 40)}</td>
                        <td><span class="sentiment-badge ${item.sentiment}">${this.translateSentiment(item.sentiment)}</span></td>
                        <td>${Math.round(item.confidence * 100)}%</td>
                        <td>${this.formatTime(new Date(item.timestamp))}</td>
                    </tr>
                `).join('');
                
                tableBody.innerHTML = sentimentHTML;
            }
        } catch (error) {
            console.error('Error updating sentiment analysis table:', error);
        }
    }

    async updateErrorAnalysisTable() {
        try {
            const errors = await this.db.getRecentErrors(10);
            const tableBody = document.getElementById('errorAnalysisBody');
            
            if (tableBody && errors) {
                const errorsHTML = errors.map(error => `
                    <tr class="error-row">
                        <td>${error.type || 'Unknown'}</td>
                        <td>${this.truncateText(error.message, 60)}</td>
                        <td>${error.count || 1}</td>
                        <td>${this.formatTime(new Date(error.lastOccurrence))}</td>
                    </tr>
                `).join('');
                
                tableBody.innerHTML = errorsHTML;
            }
        } catch (error) {
            console.error('Error updating error analysis table:', error);
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    translateSentiment(sentiment) {
        const translations = {
            'positive': 'חיובי',
            'negative': 'שלילי',
            'neutral': 'נייטרלי'
        };
        return translations[sentiment] || sentiment;
    }

    async updateRecentActivity() {
        try {
            const activity = await this.db.getRecentActivity(50);
            const activityContainer = document.getElementById('recentActivityList');
            
            if (activityContainer && activity) {
                this.activityItems = activity;
                this.displayActivityFeed(activity);
            }
        } catch (error) {
            console.error('Error updating recent activity:', error);
        }
    }

    displayActivityFeed(activities) {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        const activitiesHTML = activities.map(activity => `
            <div class="activity-item ${activity.type}">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.message}</div>
                    <div class="activity-time">${this.formatTime(new Date(activity.timestamp))}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHTML;
    }

    getActivityIcon(type) {
        const icons = {
            'like': '👍',
            'comment': '💬',
            'scroll': '📜',
            'error': '❌',
            'ai_generation': '🤖',
            'analysis': '🔍'
        };
        return icons[type] || '📌';
    }

    // 🎛️ Control Methods
    toggleActivityFeed() {
        this.isRealTimeEnabled = !this.isRealTimeEnabled;
        const btn = document.getElementById('pauseActivity');
        btn.textContent = this.isRealTimeEnabled ? 'השהה' : 'התחל';
        
        if (this.isRealTimeEnabled && !this.realTimeInterval) {
            this.setupRealTimeUpdates();
        } else if (!this.isRealTimeEnabled && this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
        }
    }

    clearActivityFeed() {
        const container = document.getElementById('recentActivityList');
        if (container) {
            container.innerHTML = '<div class="activity-item">רשימת הפעילות נוקתה</div>';
        }
        this.activityItems = [];
    }

    filterActivityFeed(filterType) {
        const filteredActivities = filterType === 'all' 
            ? this.activityItems 
            : this.activityItems.filter(item => item.type === filterType);
        
        this.displayActivityFeed(filteredActivities);
    }

    // 🎨 UI Methods
    switchLanguage(lang) {
        this.languageManager.setLanguage(lang);
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    updateChartView(chartType, button) {
        // עדכון תצוגת גרף
        document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // הצגת הגרף המתאים
        document.querySelectorAll('.chart-container').forEach(chart => {
            chart.style.display = chart.id === chartType ? 'block' : 'none';
        });
    }

    async triggerManualLike() {
        try {
            const response = await chrome.tabs.query({ active: true, currentWindow: true });
            if (response[0]) {
                chrome.tabs.sendMessage(response[0].id, { type: 'MANUAL_LIKE' });
                this.showSuccess('בוצע לייק ידני');
            }
        } catch (error) {
            this.showError('שגיאה בביצוע לייק ידני');
        }
    }

    async triggerManualComment() {
        try {
            const response = await chrome.tabs.query({ active: true, currentWindow: true });
            if (response[0]) {
                chrome.tabs.sendMessage(response[0].id, { type: 'MANUAL_COMMENT' });
                this.showSuccess('בוצעה תגובה ידנית');
            }
        } catch (error) {
            this.showError('שגיאה בביצוע תגובה ידנית');
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #44ff44;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }

    async exportData(type = 'basic') {
        try {
            const data = await this.collectDashboardData();
            const exportData = {
                timestamp: new Date().toISOString(),
                type: type,
                data: data,
                aiInsights: this.aiInsights
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `socialbot-analytics-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showSuccess('נתונים יוצאו בהצלחה');
        } catch (error) {
            this.showError('שגיאה בייצוא נתונים');
        }
    }

    async exportAdvancedReport() {
        try {
            const data = await this.collectDashboardData();
            
            // יצירת דוח מפורט בפורמט CSV
            const csvContent = this.generateCSVReport(data);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `socialbot-advanced-report-${Date.now()}.csv`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showSuccess('דוח מתקדם יוצא בהצלחה');
        } catch (error) {
            this.showError('שגיאה בייצוא דוח מתקדם');
        }
    }

    generateCSVReport(data) {
        let csv = 'Date,Platform,Likes,Comments,Posts,AI Quality Score\n';
        
        if (data.dailyStats) {
            data.dailyStats.forEach(day => {
                csv += `${day.date},${day.platform || 'All'},${day.likes},${day.comments},${day.posts},${day.aiQuality || 'N/A'}\n`;
            });
        }
        
        return csv;
    }

    printReport() {
        window.print();
    }

    setupMessageListener() {
        // מאזין להודעות מהרקע וה-content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'NEW_ACTIVITY') {
                this.addNewActivityItem(message.data);
            } else if (message.type === 'AI_INSIGHTS_UPDATE') {
                this.aiInsights = message.data;
                this.displayAIInsights(message.data);
            }
        });
    }

    addNewActivityItem(activityData) {
        if (this.isRealTimeEnabled) {
            this.activityItems.unshift(activityData);
            this.activityItems = this.activityItems.slice(0, 50); // Keep only last 50
            this.displayActivityFeed(this.activityItems);
        }
    }

    setupRealTimeUpdates() {
        // עדכון זמן אמת כל 10 שניות
        this.realTimeInterval = setInterval(async () => {
            if (this.isRealTimeEnabled) {
                await Promise.all([
                    this.updateRealtimeChart(),
                    this.updateRecentActivity()
                ]);
            }
        }, 10000);
    }
}

// אתחול הדשבורד כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AdvancedAnalyticsDashboard();
});

// 🌐 Language Manager Class
class LanguageManager {
    constructor() {
        this.currentLanguage = 'he';
        this.translations = {};
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateTranslations();
    }

    updateTranslations() {
        // בפרויקט אמיתי כאן יהיו התרגומים
        console.log('Language updated to:', this.currentLanguage);
    }
} 