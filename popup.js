// YUV.AI SocialBot Pro - Popup Logic
class SocialBotPopup {
    constructor() {
        this.currentPersonas = [];
        this.currentPersonaId = null;
        this.exampleCount = 1;
        this.languageManager = new LanguageManager();
        this.init();
    }

    async init() {
        await this.loadStoredData();
        this.setupEventListeners();
        this.updateUI();
        this.startStatsUpdater();
        this.languageManager.updateTranslations();
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

            // Load stats
            if (result.stats) {
                this.updateStatsDisplay(result.stats);
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    setupEventListeners() {
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
        // Any additional UI updates
        console.log('YUV.AI SocialBot Pro initialized');
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
            // שמירה ב-storage
            await chrome.storage.sync.set({ globallyEnabled: enabled });
            
            // עדכון ה-UI
            this.updateGlobalToggleUI(enabled);
            
            // שליחת הודעה לכל הטאבים הפעילים
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.url && (tab.url.includes('linkedin.com') || tab.url.includes('facebook.com'))) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            type: 'TOGGLE_GLOBAL_STATE',
                            enabled: enabled
                        });
                    } catch (error) {
                        // Tab might not have content script loaded
                        console.log('Could not send message to tab:', tab.id);
                    }
                }
            }
            
            // הודעת סטטוס
            const statusMessage = enabled ? 
                '✅ התוסף הופעל - פעילות אוטומטית מתחילה' : 
                '🛑 התוסף כובה - כל הפעילות האוטומטית הופסקה';
            
            this.showStatus(statusMessage, enabled ? 'success' : 'warning');
            
            console.log('🔄 Global state changed:', enabled ? 'ENABLED' : 'DISABLED');
            
        } catch (error) {
            console.error('Error toggling global state:', error);
            this.showStatus('שגיאה בשינוי מצב התוסף', 'error');
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SocialBotPopup();
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