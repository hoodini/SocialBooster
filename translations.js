const translations = {
    he: {
        // Status
        statusConnected: "מחובר",
        statusDisconnected: "לא מחובר",
        
        // API Key Section
        apiKeyTitle: "🔑 הגדרת מפתח API",
        apiKeyPlaceholder: "הזן מפתח API של Cohere",
        saveButton: "שמור",
        modelLabel: "מודל:",
        statusLabel: "סטטוס:",
        statusConnectedText: "✅ מחובר",
        
        // Personas Section
        personasTitle: "🎭 ניהול פרסונות",
        selectPersona: "בחר פרסונה",
        addPersona: "➕ הוסף",
        editPersona: "✏️ ערוך",
        deletePersona: "🗑️ מחק",
        personaNamePlaceholder: "שם הפרסונה",
        personaDescriptionPlaceholder: "תיאור אופי וטונציה של הפרסונה",
        examplesLabel: "דוגמאות לכתיבה:",
        examplePlaceholder: "דוגמה",
        addExample: "➕ הוסף דוגמה",
        savePersona: "שמור פרסונה",
        cancelButton: "ביטול",
        personaNote: "💡 הדוגמאות והתיאורים יהיו חלק מהפרומפט שנשלח למודל השפה",
        
        // Automation Settings
        automationTitle: "🤖 הגדרות אוטומציה",
        autoLikes: "לייקים אוטומטיים (1.5 שניות)",
        preferHeartReaction: "העדף לב אהבה ❤️ במקום לייק רגיל 👍",
        autoComments: "תגובות אוטומטיות (3 שניות)",
        platformsTitle: "פלטפורמות:",
        saveAutomationSettings: "💾 שמור הגדרות אוטומציה",
        settingsSaved: "✅ הגדרות נשמרו בהצלחה!",
        
        // Statistics
        statisticsTitle: "📊 סטטיסטיקות",
        likesLabel: "לייקים",
        commentsLabel: "תגובות",
        activeSessionLabel: "דקות פעילות",
        openDashboard: "📈 פתח דשבורד אנליטיקה מפורט",
        
        // Global Toggle
        globalToggleTitle: "🔄 מתג הפעלה כללי",
        extensionEnabled: "התוסף מופעל",
        extensionDisabled: "התוסף כבוי",
        toggleDescription: "השתמש במתג זה כדי להפעיל או לכבות את כל הפעילות האוטומטית של התוסף",

        // Footer
        createdBy: "יצר: יובל אבידני",
        
        // Dashboard
        dashboardTitle: "דשבורד אנליטיקה - YUV.AI SocialBot Pro",
        totalActivity: "סה\"כ פעילות",
        todayActivity: "פעילות היום",
        weekActivity: "פעילות השבוע",
        monthActivity: "פעילות החודש",
        likesGiven: "לייקים שניתנו",
        commentsPosted: "תגובות שפורסמו",
        postsViewed: "פוסטים שנצפו",
        activeTime: "זמן פעיל",
        lastActive: "פעיל לאחרונה",
        platform: "פלטפורמה",
        activityOverTime: "פעילות לאורך זמן",
        engagementBreakdown: "פילוח אינטראקציות",
        recentActivity: "פעילות אחרונה",
        exportData: "ייצא נתונים",
        clearData: "נקה נתונים",
        refreshData: "רענן נתונים"
    },
    
    en: {
        // Status
        statusConnected: "Connected",
        statusDisconnected: "Disconnected",
        
        // API Key Section
        apiKeyTitle: "🔑 API Key Setup",
        apiKeyPlaceholder: "Enter your Cohere API key",
        saveButton: "Save",
        modelLabel: "Model:",
        statusLabel: "Status:",
        statusConnectedText: "✅ Connected",
        
        // Personas Section
        personasTitle: "🎭 Persona Management",
        selectPersona: "Select Persona",
        addPersona: "➕ Add",
        editPersona: "✏️ Edit",
        deletePersona: "🗑️ Delete",
        personaNamePlaceholder: "Persona Name",
        personaDescriptionPlaceholder: "Describe the personality and tone of the persona",
        examplesLabel: "Writing Examples:",
        examplePlaceholder: "Example",
        addExample: "➕ Add Example",
        savePersona: "Save Persona",
        cancelButton: "Cancel",
        personaNote: "💡 Examples and descriptions will be part of the prompt sent to the language model",
        
        // Automation Settings
        automationTitle: "🤖 Automation Settings",
        autoLikes: "Auto Likes (1.5 seconds)",
        preferHeartReaction: "Prefer Heart ❤️ over regular Like 👍",
        autoComments: "Auto Comments (3 seconds)",
        platformsTitle: "Platforms:",
        saveAutomationSettings: "💾 Save Automation Settings",
        settingsSaved: "✅ Settings saved successfully!",
        
        // Statistics
        statisticsTitle: "📊 Statistics",
        likesLabel: "Likes",
        commentsLabel: "Comments",
        activeSessionLabel: "Active Minutes",
        openDashboard: "📈 Open Detailed Analytics Dashboard",
        
        // Global Toggle
        globalToggleTitle: "🔄 Global Toggle",
        extensionEnabled: "Extension Enabled",
        extensionDisabled: "Extension Disabled", 
        toggleDescription: "Use this toggle to enable or disable all automatic extension activity",

        // Footer
        createdBy: "Created by: Yuval Avidani",
        
        // Dashboard
        dashboardTitle: "Analytics Dashboard - YUV.AI SocialBot Pro",
        totalActivity: "Total Activity",
        todayActivity: "Today's Activity",
        weekActivity: "This Week",
        monthActivity: "This Month",
        likesGiven: "Likes Given",
        commentsPosted: "Comments Posted",
        postsViewed: "Posts Viewed",
        activeTime: "Active Time",
        lastActive: "Last Active",
        platform: "Platform",
        activityOverTime: "Activity Over Time",
        engagementBreakdown: "Engagement Breakdown",
        recentActivity: "Recent Activity",
        exportData: "Export Data",
        clearData: "Clear Data",
        refreshData: "Refresh Data"
    }
};

// Language management functions
class LanguageManager {
    constructor() {
        this.currentLanguage = 'he'; // Default to Hebrew
        this.loadLanguage();
    }
    
    loadLanguage() {
        const saved = localStorage.getItem('yuv-ai-language');
        if (saved && translations[saved]) {
            this.currentLanguage = saved;
        }
    }
    
    setLanguage(lang) {
        if (!translations[lang]) return false;
        
        this.currentLanguage = lang;
        localStorage.setItem('yuv-ai-language', lang);
        
        // Update document direction and language
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        
        // Update all translated elements
        this.updateTranslations();
        
        return true;
    }
    
    get(key) {
        return translations[this.currentLanguage][key] || key;
    }
    
    updateTranslations() {
        // Update all elements with data-translate attribute
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.get(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update language switcher buttons
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, LanguageManager };
} 