// Global popup instance
let popupInstance = null;

// YUV.AI SocialBot Pro - Popup Logic
class SocialBotPopup {
    constructor() {
        // Singleton pattern - prevent multiple instances
        if (popupInstance) {
            return popupInstance;
        }
        
        this.settings = {};
        this.apiKey = '';
        this.isInitialized = false;
        this.languageManager = new LanguageManager();
        this.statusMonitoringInterval = null;
        this.lastSuccessfulConnection = null;
        
        popupInstance = this;
        return this;
    }

    async init() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('🔄 Popup already initialized, refreshing...');
            await this.refreshData();
            return;
        }
        
        console.log('🚀 SocialBot Pro initializing...');
        
        try {
            // בדיקה אם יש טאב פעיל מתאים
            const activeTab = await this.getActiveTab();
            if (!activeTab) {
                this.showStatus('פתח דף LinkedIn או Facebook כדי להתחיל', 'info');
                return;
            }
            
            // טעינת הגדרות
            await this.loadSettings();
            console.log('✅ Settings loaded');
            
            // אתחול UI
            this.setupEventListeners();
            this.updateUI();
            console.log('✅ UI initialized');
            
            // חיבור לטאב הפעיל
            await this.connectToActiveTab();
            
            // התחלת ניטור סטטוס
            this.startStatusMonitoring();
            
            this.isInitialized = true;
            console.log('🎉 SocialBot Pro initialized successfully');
            
        } catch (error) {
            console.error('❌ Error during initialization:', error);
            this.showStatus('שגיאה באתחול התוסף - נסה לרענן', 'error');
        }
    }

    async refreshData() {
        try {
            // טעינת הגדרות מחדש
            await this.loadSettings();
            
            // עדכון UI
            this.updateUI();
            
            // חיבור מחדש לטאב
            await this.connectToActiveTab();
            
            console.log('🔄 Popup data refreshed');
            
        } catch (error) {
            console.error('❌ Error refreshing popup data:', error);
            this.showStatus('שגיאה ברענון נתונים', 'error');
        }
    }

    async connectToActiveTab() {
        try {
            const activeTab = await this.getActiveTab();
            if (!activeTab) return;
            
            console.log('🔗 Connecting to active tab:', activeTab.id);
            
            // ניסיון חיבור לטאב
            const response = await chrome.tabs.sendMessage(activeTab.id, {
                type: 'PING'
            });
            
            if (response && response.status === 'ready') {
                console.log('✅ Connected to content script');
                this.showStatus('מחובר ומוכן לפעולה', 'success');
                
                // שליחת הגדרות נוכחיות
                await this.syncSettingsToTab(activeTab.id);
                
            } else {
                throw new Error('Content script not ready');
            }
            
        } catch (error) {
            console.log('ℹ️ Content script not loaded, attempting injection...');
            await this.injectContentScript();
        }
    }

    async injectContentScript() {
        try {
            const activeTab = await this.getActiveTab();
            if (!activeTab) return;
            
            console.log('💉 Injecting content script...');
            
            // הזרקת content script
            await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            });
            
            // המתנה לטעינה
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // ניסיון חיבור
            const response = await chrome.tabs.sendMessage(activeTab.id, {
                type: 'PING'
            });
            
            if (response && response.status === 'ready') {
                console.log('✅ Content script injected and connected');
                await this.syncSettingsToTab(activeTab.id);
                this.showStatus('תוסף הוזרק ומחובר', 'success');
            } else {
                // אם עדיין לא עובד, נאלץ content script להתאתחל
                await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'FORCE_REINIT'
                });
                console.log('🔄 Forced content script reinitialization');
            }
            
        } catch (error) {
            console.error('❌ Failed to inject content script:', error);
            this.showStatus('לא ניתן להתחבר - רענן את הדף', 'error');
        }
    }

    async syncSettingsToTab(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, {
                type: 'SYNC_SETTINGS',
                settings: {
                    globallyEnabled: this.settings.globallyEnabled,
                    autoLike: this.settings.autoLike,
                    autoComment: this.settings.autoComment,
                    autoScroll: this.settings.autoScroll,
                    scrollSpeed: this.settings.scrollSpeed,
                    language: this.settings.language
                }
            });
            console.log('✅ Settings synced to tab');
        } catch (error) {
            console.warn('Warning syncing settings:', error);
        }
    }

    startStatusMonitoring() {
        // ניטור סטטוס מתקדם כל 3 שניות
        if (this.statusMonitoringInterval) {
            clearInterval(this.statusMonitoringInterval);
        }
        
        this.statusMonitoringInterval = setInterval(async () => {
            try {
                const activeTab = await this.getActiveTab();
                if (!activeTab) {
                    this.showStatus('פתח דף LinkedIn או Facebook', 'info');
                    return;
                }
                
                // ניסיון קבלת סטטוס
                const response = await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'GET_STATUS'
                });
                
                if (response && response.status) {
                    this.updateStatusDisplay(response.status);
                    this.lastSuccessfulConnection = Date.now();
                } else {
                    throw new Error('No valid response from content script');
                }
                
            } catch (error) {
                console.log('📡 Connection lost, attempting recovery...');
                await this.attemptConnectionRecovery();
            }
        }, 3000);
        
        console.log('📊 Status monitoring started');
    }

    async attemptConnectionRecovery() {
        try {
            const activeTab = await this.getActiveTab();
            if (!activeTab) return;
            
            console.log('🔄 Attempting connection recovery...');
            
            // ניסיון PING
            try {
                const pingResponse = await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'PING'
                });
                
                if (pingResponse && pingResponse.status === 'ready') {
                    console.log('✅ Connection recovered via PING');
                    await this.syncSettingsToTab(activeTab.id);
                    this.showStatus('חיבור מחדש הצליח', 'success');
                    return;
                }
            } catch (pingError) {
                console.log('📡 PING failed, trying content script injection...');
            }
            
            // אם PING נכשל, ננסה להזריק content script
            await this.injectContentScript();
            
        } catch (error) {
            console.error('❌ Connection recovery failed:', error);
            this.showStatus('חיבור נותק - רענן את הדף', 'error');
        }
    }

    async loadStoredData() {
        try {
            const result = await chrome.storage.sync.get([
                'cohereApiKey',
                'personas',
                'selectedPersonaId',
                'autoLikes',
                'autoComments', 
                'linkedinEnabled',
                'facebookEnabled',
                'preferHeartReaction',
                'globallyEnabled',
                'autoScrollEnabled',
                'autoScrollSpeed',
                'stats'
            ]);

            // Load API key
            if (result.cohereApiKey) {
                document.getElementById('apiKey').value = result.cohereApiKey;
                await this.testApiConnection(result.cohereApiKey);
            }

            // Load personas
            this.currentPersonas = result.personas || [];
            this.populatePersonaSelect();

            // Load selected persona
            if (result.selectedPersonaId) {
                this.currentPersonaId = result.selectedPersonaId;
                document.getElementById('personaSelect').value = result.selectedPersonaId;
            }

            // Load automation settings
            document.getElementById('autoLikes').checked = result.autoLikes || false;
            document.getElementById('autoComments').checked = result.autoComments || false;
            document.getElementById('preferHeartReaction').checked = result.preferHeartReaction || false;
            document.getElementById('linkedinEnabled').checked = result.linkedinEnabled !== false;
            document.getElementById('facebookEnabled').checked = result.facebookEnabled || false;

            // Load global toggle state
            const globallyEnabled = result.globallyEnabled !== false; // Default to true
            document.getElementById('globalToggle').checked = globallyEnabled;
            this.updateGlobalToggleUI(globallyEnabled);

            // Load auto-scroll settings
            document.getElementById('autoScrollEnabled').checked = result.autoScrollEnabled || false;
            const scrollSpeed = result.autoScrollSpeed || 2;
            document.querySelector(`input[name="scrollSpeed"][value="${scrollSpeed}"]`).checked = true;
            this.updateAutoScrollUI(result.autoScrollEnabled || false);

            // Load stats
            if (result.stats) {
                this.updateStatsDisplay(result.stats);
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    setupEventListeners() {
        try {
            // API Key
            document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
            document.getElementById('apiKey').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveApiKey();
            });

            // Personas
            document.getElementById('addPersona').addEventListener('click', () => this.showPersonaForm());
            document.getElementById('editPersona').addEventListener('click', () => this.editSelectedPersona());
            document.getElementById('deletePersona').addEventListener('click', () => this.deleteSelectedPersona());
            document.getElementById('personaSelect').addEventListener('change', (e) => this.selectPersona(e.target.value));

            // Persona Form
            document.getElementById('savePersona').addEventListener('click', () => this.savePersona());
            document.getElementById('cancelPersona').addEventListener('click', () => this.hidePersonaForm());
            document.getElementById('addExample').addEventListener('click', () => this.addExample());

            // Automation Settings
            document.getElementById('autoLikes').addEventListener('change', () => this.saveAutomationSettings());
            document.getElementById('autoComments').addEventListener('change', () => this.saveAutomationSettings());
            document.getElementById('preferHeartReaction').addEventListener('change', () => this.saveAutomationSettings());
            document.getElementById('linkedinEnabled').addEventListener('change', () => this.saveAutomationSettings());
            document.getElementById('facebookEnabled').addEventListener('change', () => this.saveAutomationSettings());

            // Dashboard
            document.getElementById('dashboardBtn').addEventListener('click', () => this.openDashboard());

            // Save automation settings button
            document.getElementById('saveAutomationBtn').addEventListener('click', () => {
                this.saveAutomationSettingsManually();
            });

            // Language switcher
            document.getElementById('langHe').addEventListener('click', () => this.switchLanguage('he'));
            document.getElementById('langEn').addEventListener('click', () => this.switchLanguage('en'));

            // Global toggle
            document.getElementById('globalToggle').addEventListener('change', (e) => {
                this.toggleGlobalState(e.target.checked);
            });

            // Auto-scroll controls
            document.getElementById('autoScrollEnabled').addEventListener('change', (e) => {
                this.updateAutoScrollUI(e.target.checked);
                this.saveAutoScrollSettings();
            });

            document.querySelectorAll('input[name="scrollSpeed"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    this.saveAutoScrollSettings();
                });
            });

            document.getElementById('startAutoScroll').addEventListener('click', () => {
                this.startAutoScroll();
            });

            document.getElementById('stopAutoScroll').addEventListener('click', () => {
                this.stopAutoScroll();
            });

            console.log('✅ Event listeners setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    async saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (!apiKey) {
            this.showStatus('נא להזין מפתח API', 'error');
            return;
        }

        // Validate API key format - Cohere accepts both trial keys and production keys
        if (apiKey.length < 20) {
            this.showStatus('מפתח API נראה קצר מדי', 'error');
            console.error('API key seems too short.');
            return;
        }

        // Additional validation for common patterns
        if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
            this.showStatus('מפתח API מכיל תווים לא תקינים', 'error');
            console.error('API key contains invalid characters (spaces, newlines, tabs).');
            return;
        }

        this.showStatus('בודק חיבור...', 'loading');
        
        const isValid = await this.testApiConnection(apiKey);
        
        if (isValid) {
            await chrome.storage.sync.set({ cohereApiKey: apiKey });
            this.showStatus('מפתח API נשמר בהצלחה!', 'success');
            document.getElementById('apiInfo').style.display = 'block';
        } else {
            this.showStatus('מפתח API לא תקין או אין גישה למודל', 'error');
        }
    }

    async testApiConnection(apiKey) {
        try {
            console.log('Testing API connection with Cohere v2...');
            console.log('API Key provided:', apiKey ? 'Yes' : 'No');
            console.log('API Key length:', apiKey ? apiKey.length : 'undefined');
            
            const response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'command-a-03-2025',
                    messages: [{ 
                        role: 'user', 
                        content: 'hello' 
                    }],
                    stream: false,
                    max_tokens: 5
                })
            });

            console.log('API v2 Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('API Test Success:', responseData);
                this.updateConnectionStatus(true);
                return true;
            } else if (response.status === 400) {
                // 400 might still indicate valid auth but bad request format
                console.log('Bad request but API key might be valid');
                this.updateConnectionStatus(true);
                return true;
            } else {
                const errorText = await response.text();
                console.error('API Test Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                this.updateConnectionStatus(false);
                return false;
            }
        } catch (error) {
            console.error('API connection test failed:', error);
            this.updateConnectionStatus(false);
            return false;
        }
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'מחובר ל-Cohere API v2 ✅';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'לא מחובר ❌';
        }
    }

    showPersonaForm(persona = null) {
        const form = document.getElementById('personaForm');
        const nameInput = document.getElementById('personaName');
        const descInput = document.getElementById('personaDescription');
        
        if (persona) {
            nameInput.value = persona.name;
            descInput.value = persona.description;
            this.loadExamples(persona.examples || []);
        } else {
            nameInput.value = '';
            descInput.value = '';
            this.loadExamples(['']);
        }
        
        form.style.display = 'block';
    }

    hidePersonaForm() {
        document.getElementById('personaForm').style.display = 'none';
    }

    loadExamples(examples) {
        const container = document.getElementById('examplesContainer');
        container.innerHTML = '';
        
        examples.forEach((example, index) => {
            const textarea = document.createElement('textarea');
            textarea.className = 'example-input';
            textarea.placeholder = `דוגמה ${index + 1}`;
            textarea.value = example;
            container.appendChild(textarea);
        });
        
        this.exampleCount = examples.length;
    }

    addExample() {
        this.exampleCount++;
        const container = document.getElementById('examplesContainer');
        const textarea = document.createElement('textarea');
        textarea.className = 'example-input';
        textarea.placeholder = `דוגמה ${this.exampleCount}`;
        container.appendChild(textarea);
    }

    async savePersona() {
        const name = document.getElementById('personaName').value.trim();
        const description = document.getElementById('personaDescription').value.trim();
        
        if (!name || !description) {
            this.showStatus('נא למלא שם ותיאור לפרסונה', 'error');
            return;
        }

        const examples = Array.from(document.querySelectorAll('.example-input'))
            .map(textarea => textarea.value.trim())
            .filter(example => example);

        const persona = {
            id: this.currentPersonaId || 'persona_' + Date.now(),
            name,
            description,
            examples,
            createdAt: new Date().toISOString()
        };

        // Update or add persona
        const existingIndex = this.currentPersonas.findIndex(p => p.id === persona.id);
        if (existingIndex >= 0) {
            this.currentPersonas[existingIndex] = persona;
        } else {
            this.currentPersonas.push(persona);
        }

        await chrome.storage.sync.set({ personas: this.currentPersonas });
        
        this.populatePersonaSelect();
        this.hidePersonaForm();
        this.currentPersonaId = null;
        
        this.showStatus('פרסונה נשמרה בהצלחה!', 'success');
    }

    populatePersonaSelect() {
        const select = document.getElementById('personaSelect');
        select.innerHTML = '<option value="">בחר פרסונה</option>';
        
        this.currentPersonas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.id;
            option.textContent = persona.name;
            select.appendChild(option);
        });
    }

    editSelectedPersona() {
        const selectedId = document.getElementById('personaSelect').value;
        if (!selectedId) {
            this.showStatus('נא לבחור פרסונה לעריכה', 'error');
            return;
        }

        const persona = this.currentPersonas.find(p => p.id === selectedId);
        if (persona) {
            this.currentPersonaId = selectedId;
            this.showPersonaForm(persona);
        }
    }

    async deleteSelectedPersona() {
        const selectedId = document.getElementById('personaSelect').value;
        if (!selectedId) {
            this.showStatus('נא לבחור פרסונה למחיקה', 'error');
            return;
        }

        if (confirm('האם אתה בטוח שברצונך למחוק את הפרסונה?')) {
            this.currentPersonas = this.currentPersonas.filter(p => p.id !== selectedId);
            await chrome.storage.sync.set({ personas: this.currentPersonas });
            
            this.populatePersonaSelect();
            this.showStatus('פרסונה נמחקה בהצלחה!', 'success');
        }
    }

    async selectPersona(personaId) {
        await chrome.storage.sync.set({ selectedPersonaId: personaId });
        this.currentPersonaId = personaId;
        
        // Notify content script about persona change
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'PERSONA_CHANGED',
                    personaId: personaId
                });
            }
        } catch (error) {
            console.log('Could not notify content script:', error);
        }
    }

    async saveAutomationSettings() {
        const settings = {
            autoLikes: document.getElementById('autoLikes').checked,
            autoComments: document.getElementById('autoComments').checked,
            preferHeartReaction: document.getElementById('preferHeartReaction').checked,
            linkedinEnabled: document.getElementById('linkedinEnabled').checked,
            facebookEnabled: document.getElementById('facebookEnabled').checked
        };

        await chrome.storage.sync.set(settings);
        
        // Notify content script about settings change
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'SETTINGS_CHANGED',
                    settings: settings
                });
            }
        } catch (error) {
            console.log('Could not notify content script:', error);
        }
    }

    async saveAutomationSettingsManually() {
        const settings = {
            autoLikes: document.getElementById('autoLikes').checked,
            autoComments: document.getElementById('autoComments').checked,
            preferHeartReaction: document.getElementById('preferHeartReaction').checked,
            linkedinEnabled: document.getElementById('linkedinEnabled').checked,
            facebookEnabled: document.getElementById('facebookEnabled').checked
        };

        await chrome.storage.sync.set(settings);
        
        // Show visual confirmation
        const statusElement = document.getElementById('settingsStatus');
        statusElement.style.display = 'block';
        
        // Hide after animation
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
        
        // Notify content script about settings change
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'SETTINGS_CHANGED',
                    settings: settings
                });
                console.log('Settings sent to content script:', settings);
            }
        } catch (error) {
            console.log('Could not notify content script:', error);
        }

        // Also show general status
        this.showStatus('🚀 הגדרות האוטומציה עודכנו והתחילו לפעול!', 'success');
    }

    showStatus(message, type) {
        // Create and show temporary status message
        const existingStatus = document.querySelector('.temp-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusDiv = document.createElement('div');
        statusDiv.className = `temp-status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : '#74b9ff'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }

    startStatsUpdater() {
        // Update stats every 5 seconds
        setInterval(async () => {
            try {
                const result = await chrome.storage.sync.get(['stats']);
                if (result.stats) {
                    this.updateStatsDisplay(result.stats);
                }
            } catch (error) {
                console.error('Error updating stats:', error);
            }
        }, 5000);
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalLikes').textContent = stats.totalLikes || 0;
        document.getElementById('totalComments').textContent = stats.totalComments || 0;
        document.getElementById('activeSession').textContent = Math.floor((stats.sessionTime || 0) / 60000);
    }

    updateUI() {
        try {
            // עדכון toggles לפי הגדרות
            const elements = {
                'globalToggle': this.settings.globallyEnabled,
                'autoLike': this.settings.autoLike,
                'autoComment': this.settings.autoComment,
                'autoScroll': this.settings.autoScroll
            };
            
            Object.entries(elements).forEach(([id, checked]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.checked = checked;
                }
            });
            
            // עדכון scroll speed
            const scrollSpeedSlider = document.getElementById('scrollSpeed');
            if (scrollSpeedSlider) {
                scrollSpeedSlider.value = this.settings.scrollSpeed;
            }
            
            // עדכון global toggle UI
            this.updateGlobalToggleUI(this.settings.globallyEnabled);
            
            console.log('✅ UI updated');
            
        } catch (error) {
            console.error('❌ Error updating UI:', error);
        }
    }

    openDashboard() {
        // פתיחת דשבורד האנליטיקה בחלון נפרד
        chrome.tabs.create({
            url: chrome.runtime.getURL('dashboard.html'),
            active: true
        });
    }

    switchLanguage(lang) {
        if (this.languageManager.setLanguage(lang)) {
            // Update status messages based on current state
            const statusText = document.getElementById('statusText');
            const isDotConnected = document.getElementById('statusDot').classList.contains('connected');
            
            if (isDotConnected) {
                statusText.textContent = this.languageManager.get('statusConnected') + ' ✅';
            } else {
                statusText.textContent = this.languageManager.get('statusDisconnected') + ' ❌';
            }

            // Update dynamic button text
            const dashboardBtn = document.getElementById('dashboardBtn');
            const btnText = this.languageManager.get('openDashboard');
            dashboardBtn.innerHTML = `<span class="btn-icon">📈</span> ${btnText}`;

            // Update example placeholders
            const exampleInputs = document.querySelectorAll('.example-input');
            exampleInputs.forEach((input, index) => {
                input.placeholder = this.languageManager.get('examplePlaceholder') + ' ' + (index + 1);
            });
        }
    }

    updateGlobalToggleUI(globallyEnabled) {
        const toggleStatusText = document.getElementById('toggleStatusText');
        const toggleStatus = document.getElementById('toggleStatus');
        
        if (globallyEnabled) {
            toggleStatusText.textContent = this.languageManager.translate('extensionEnabled');
            toggleStatusText.className = 'enabled';
        } else {
            toggleStatusText.textContent = this.languageManager.translate('extensionDisabled');
            toggleStatusText.className = 'disabled';
        }
        
        console.log('🔄 Global toggle UI updated:', globallyEnabled ? 'ENABLED' : 'DISABLED');
    }

    async toggleGlobalState(enabled) {
        try {
            console.log('🔄 Toggling global state to:', enabled);
            
            // שמירה ב-storage
            await chrome.storage.sync.set({ globallyEnabled: enabled });
            console.log('✅ Global state saved to storage');
            
            // עדכון ה-UI
            this.updateGlobalToggleUI(enabled);
            
            // שליחת הודעה לכל הטאבים הפעילים
            try {
                const tabs = await chrome.tabs.query({});
                let successCount = 0;
                
                for (const tab of tabs) {
                    if (tab.url && (tab.url.includes('linkedin.com') || tab.url.includes('facebook.com'))) {
                        try {
                            await chrome.tabs.sendMessage(tab.id, {
                                type: 'TOGGLE_GLOBAL_STATE',
                                enabled: enabled
                            });
                            successCount++;
                            console.log(`✅ Message sent to tab ${tab.id}`);
                        } catch (tabError) {
                            console.log(`ℹ️ Could not send message to tab ${tab.id}:`, tabError.message);
                            // זה נורמלי - לא כל הטאבים יש בהם content script
                        }
                    }
                }
                
                console.log(`📤 Sent global toggle message to ${successCount} tabs`);
                
            } catch (tabsError) {
                console.warn('Warning getting tabs:', tabsError);
                // לא חשוב מספיק כדי להכשיל את כל הפעולה
            }
            
            // הודעת סטטוס
            const statusMessage = enabled ? 
                '✅ התוסף הופעל - פעילות אוטומטית מתחילה' : 
                '🛑 התוסף כובה - כל הפעילות האוטומטית הופסקה';
            
            this.showStatus(statusMessage, enabled ? 'success' : 'warning');
            
            console.log('🔄 Global state change completed successfully');
            
        } catch (error) {
            console.error('❌ Error in toggleGlobalState:', error);
            
            // ניסיון לזהות את סוג השגיאה
            if (error.message && error.message.includes('storage')) {
                this.showStatus('שגיאה בשמירת הגדרות - נסה שוב', 'error');
            } else if (error.message && error.message.includes('tabs')) {
                this.showStatus('שגיאה בתקשורת עם טאבים - התוסף עדיין יעבוד', 'warning');
            } else {
                this.showStatus('שגיאה כללית - נסה לרענן את הדף', 'error');
            }
            
            // החזר את המתג למצב הקודם
            document.getElementById('globalToggle').checked = !enabled;
            this.updateGlobalToggleUI(!enabled);
        }
    }

    updateAutoScrollUI(enabled) {
        const speedControl = document.getElementById('speedControl');
        const startButton = document.getElementById('startAutoScroll');
        const stopButton = document.getElementById('stopAutoScroll');
        
        if (enabled) {
            speedControl.style.display = 'block';
            startButton.style.display = 'inline-block';
        } else {
            speedControl.style.display = 'none';
            startButton.style.display = 'inline-block';
            stopButton.style.display = 'none';
        }
    }

    async saveAutoScrollSettings() {
        try {
            const autoScrollEnabled = document.getElementById('autoScrollEnabled').checked;
            const autoScrollSpeed = parseInt(document.querySelector('input[name="scrollSpeed"]:checked').value);
            
            await chrome.storage.sync.set({
                autoScrollEnabled: autoScrollEnabled,
                autoScrollSpeed: autoScrollSpeed
            });
            
            console.log('📜 Auto-scroll settings saved:', { autoScrollEnabled, autoScrollSpeed });
            
        } catch (error) {
            console.error('Error saving auto-scroll settings:', error);
        }
    }

    async startAutoScroll() {
        try {
            const autoScrollEnabled = document.getElementById('autoScrollEnabled').checked;
            const autoScrollSpeed = parseInt(document.querySelector('input[name="scrollSpeed"]:checked').value);
            
            if (!autoScrollEnabled) {
                // הפעל את הגלילה האוטומטית אם לא מופעלת
                document.getElementById('autoScrollEnabled').checked = true;
                this.updateAutoScrollUI(true);
                await this.saveAutoScrollSettings();
            }
            
            // שליחת הודעה לכל הטאבים הפעילים
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.url && (tab.url.includes('linkedin.com') || tab.url.includes('facebook.com'))) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            type: 'TOGGLE_AUTO_SCROLL',
                            enabled: true,
                            speed: autoScrollSpeed
                        });
                    } catch (error) {
                        console.log('Could not send auto-scroll message to tab:', tab.id);
                    }
                }
            }
            
            // עדכון UI
            document.getElementById('startAutoScroll').style.display = 'none';
            document.getElementById('stopAutoScroll').style.display = 'inline-block';
            
            this.showStatus('📜 גלילה אוטומטית התחילה!', 'success');
            
        } catch (error) {
            console.error('Error starting auto-scroll:', error);
            this.showStatus('שגיאה בהפעלת גלילה אוטומטית', 'error');
        }
    }

    async stopAutoScroll() {
        try {
            // שליחת הודעה לכל הטאבים הפעילים
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.url && (tab.url.includes('linkedin.com') || tab.url.includes('facebook.com'))) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            type: 'TOGGLE_AUTO_SCROLL',
                            enabled: false
                        });
                    } catch (error) {
                        console.log('Could not send auto-scroll stop message to tab:', tab.id);
                    }
                }
            }
            
            // עדכון UI
            document.getElementById('startAutoScroll').style.display = 'inline-block';
            document.getElementById('stopAutoScroll').style.display = 'none';
            
            this.showStatus('📜 גלילה אוטומטית נעצרה', 'warning');
            
        } catch (error) {
            console.error('Error stopping auto-scroll:', error);
            this.showStatus('שגיאה בעצירת גלילה אוטומטית', 'error');
        }
    }

    async getActiveTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && (tab.url.includes('linkedin.com') || tab.url.includes('facebook.com'))) {
            return tab;
        }
        return null;
    }

    async loadSettings() {
        try {
            const stored = await chrome.storage.sync.get([
                'globallyEnabled',
                'autoLike', 
                'autoComment',
                'autoScroll',
                'scrollSpeed',
                'language'
            ]);
            
            this.settings = {
                globallyEnabled: stored.globallyEnabled !== false, // ברירת מחדל: מופעל
                autoLike: stored.autoLike !== false,
                autoComment: stored.autoComment !== false,
                autoScroll: stored.autoScroll !== false,
                scrollSpeed: stored.scrollSpeed || 2,
                language: stored.language || 'he'
            };
            
            console.log('📋 Settings loaded:', this.settings);
            
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            // הגדרות ברירת מחדל
            this.settings = {
                globallyEnabled: true,
                autoLike: true,
                autoComment: true,
                autoScroll: true,
                scrollSpeed: 2,
                language: 'he'
            };
        }
    }

    updateStatusDisplay(status) {
        try {
            const statusElement = document.getElementById('status');
            if (!statusElement) return;
            
            let statusText = '';
            let statusClass = '';
            
            if (status.isRunning && status.globallyEnabled) {
                statusText = `🟢 פעיל - ${status.currentActivity}`;
                statusClass = 'success';
            } else if (status.globallyEnabled) {
                statusText = '🟡 מופעל אך לא פעיל';
                statusClass = 'warning';
            } else {
                statusText = '🔴 מושבת';
                statusClass = 'error';
            }
            
            statusElement.textContent = statusText;
            statusElement.className = `status ${statusClass}`;
            
            // עדכון סטטיסטיקות אם קיימות
            if (status.stats) {
                this.updateStats(status.stats);
            }
            
        } catch (error) {
            console.error('Error updating status display:', error);
        }
    }

    updateStats(stats) {
        try {
            const elements = {
                'total-likes': stats.totalLikes || 0,
                'total-comments': stats.totalComments || 0,
                'total-posts': stats.totalPosts || 0,
                'total-scrolls': stats.totalScrolls || 0
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async updateSetting(key, value) {
        try {
            this.settings[key] = value;
            await chrome.storage.sync.set({ [key]: value });
            
            // שליחה לטאב פעיל
            const activeTab = await this.getActiveTab();
            if (activeTab) {
                await this.syncSettingsToTab(activeTab.id);
            }
            
            console.log(`✅ Setting updated: ${key} = ${value}`);
            
        } catch (error) {
            console.error(`❌ Error updating setting ${key}:`, error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const popup = new SocialBotPopup();
    await popup.init();
});

// Reinitialize when popup window gains focus (user reopens it)
window.addEventListener('focus', async () => {
    console.log('🔄 Popup window focused - refreshing...');
    try {
        if (popupInstance) {
            await popupInstance.refreshData();
        } else {
            const popup = new SocialBotPopup();
            await popup.init();
        }
    } catch (error) {
        console.error('❌ Error handling popup focus:', error);
    }
});

// Handle popup close/hide
window.addEventListener('beforeunload', () => {
    console.log('👋 Popup closing...');
    
    // ניקוי intervals
    if (popupInstance && popupInstance.statusMonitoringInterval) {
        clearInterval(popupInstance.statusMonitoringInterval);
        popupInstance.statusMonitoringInterval = null;
    }
});

// Add CSS animation for status messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style); 