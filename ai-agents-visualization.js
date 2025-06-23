// AI Agents Visualization System
// מערכת ויזואליזציה לסוכני AI

class AIAgentsVisualization {
    constructor() {
        this.agentPanel = null;
        this.agentStatus = {
            scanner: { active: false, lastAction: null, count: 0 },
            liker: { active: false, lastAction: null, count: 0 },
            commenter: { active: false, lastAction: null, count: 0 },
            analyzer: { active: false, lastAction: null, count: 0 }
        };
        this.activities = [];
        this.maxActivities = 10;
        this.animationFrameId = null;
        this.init();
    }

    init() {
        this.createAgentPanel();
        this.startRealTimeUpdates();
        console.log('🤖 AI Agents Visualization System Initialized');
    }

    createAgentPanel() {
        // יצירת הפאנל הראשי
        this.agentPanel = document.createElement('div');
        this.agentPanel.id = 'ai-agents-panel';
        this.agentPanel.innerHTML = `
            <div class="ai-panel-header">
                <div class="ai-panel-title">
                    <span class="ai-icon">🤖</span>
                    <span>YUV.AI Agents</span>
                    <div class="ai-status-indicator"></div>
                </div>
                <button class="ai-panel-minimize" onclick="this.parentElement.parentElement.classList.toggle('minimized')">−</button>
            </div>
            
            <div class="ai-panel-content">
                <div class="agents-grid">
                    <div class="agent-card" data-agent="scanner">
                        <div class="agent-icon">🔍</div>
                        <div class="agent-info">
                            <div class="agent-name">Post Scanner</div>
                            <div class="agent-status">Standby</div>
                            <div class="agent-counter">0</div>
                        </div>
                        <div class="agent-activity"></div>
                    </div>
                    
                    <div class="agent-card" data-agent="liker">
                        <div class="agent-icon">❤️</div>
                        <div class="agent-info">
                            <div class="agent-name">Auto Liker</div>
                            <div class="agent-status">Standby</div>
                            <div class="agent-counter">0</div>
                        </div>
                        <div class="agent-activity"></div>
                    </div>
                    
                    <div class="agent-card" data-agent="commenter">
                        <div class="agent-icon">💬</div>
                        <div class="agent-info">
                            <div class="agent-name">AI Commenter</div>
                            <div class="agent-status">Standby</div>
                            <div class="agent-counter">0</div>
                        </div>
                        <div class="agent-activity"></div>
                    </div>
                    
                    <div class="agent-card" data-agent="analyzer">
                        <div class="agent-icon">🧠</div>
                        <div class="agent-info">
                            <div class="agent-name">Content Analyzer</div>
                            <div class="agent-status">Standby</div>
                            <div class="agent-counter">0</div>
                        </div>
                        <div class="agent-activity"></div>
                    </div>
                </div>
                
                <div class="activity-feed">
                    <div class="activity-header">🔄 Live Activity Feed</div>
                    <div class="activity-list"></div>
                </div>
            </div>
        `;

        // הוספת סטיילים
        this.addStyles();
        
        // הוספה לעמוד
        document.body.appendChild(this.agentPanel);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #ai-agents-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                z-index: 10000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                transition: all 0.3s ease;
                animation: slideInRight 0.5s ease-out;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            #ai-agents-panel.minimized {
                height: 60px;
                overflow: hidden;
            }

            .ai-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }

            .ai-panel-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 16px;
            }

            .ai-icon {
                font-size: 20px;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .ai-status-indicator {
                width: 8px;
                height: 8px;
                background: #4ade80;
                border-radius: 50%;
                animation: blink 1.5s infinite;
            }

            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }

            .ai-panel-minimize {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-panel-minimize:hover {
                background: rgba(255,255,255,0.3);
            }

            .ai-panel-content {
                padding: 15px;
            }

            .agents-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }

            .agent-card {
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 12px;
                position: relative;
                transition: transform 0.2s ease;
            }

            .agent-card:hover {
                transform: translateY(-2px);
                background: rgba(255,255,255,0.15);
            }

            .agent-card.active {
                background: rgba(76, 175, 80, 0.3);
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
            }

            .agent-icon {
                font-size: 20px;
                margin-bottom: 5px;
            }

            .agent-name {
                font-weight: 600;
                font-size: 12px;
                margin-bottom: 2px;
            }

            .agent-status {
                font-size: 10px;
                opacity: 0.8;
                margin-bottom: 2px;
            }

            .agent-counter {
                font-size: 11px;
                font-weight: 600;
                color: #4ade80;
            }

            .agent-activity {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: transparent;
                transition: background 0.3s ease;
            }

            .agent-card.active .agent-activity {
                background: #4ade80;
                animation: pulse-dot 1s infinite;
            }

            @keyframes pulse-dot {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }

            .activity-feed {
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 10px;
                max-height: 150px;
                overflow-y: auto;
            }

            .activity-header {
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .activity-list {
                font-size: 11px;
                line-height: 1.4;
            }

            .activity-item {
                padding: 4px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                animation: fadeInUp 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .activity-item:last-child {
                border-bottom: none;
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .activity-time {
                color: #a0a0a0;
                font-size: 10px;
                min-width: 40px;
            }

            /* Scrollbar styling */
            .activity-feed::-webkit-scrollbar {
                width: 4px;
            }

            .activity-feed::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
            }

            .activity-feed::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
            }

            .activity-feed::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.5);
            }
        `;
        document.head.appendChild(style);
    }

    updateAgentStatus(agentType, status, action = null) {
        if (!this.agentStatus[agentType]) return;

        this.agentStatus[agentType].active = status;
        if (action) {
            this.agentStatus[agentType].lastAction = action;
            this.agentStatus[agentType].count++;
        }

        this.updateAgentCard(agentType);
    }

    updateAgentCard(agentType) {
        const card = this.agentPanel.querySelector(`[data-agent="${agentType}"]`);
        if (!card) return;

        const agent = this.agentStatus[agentType];
        const statusElement = card.querySelector('.agent-status');
        const counterElement = card.querySelector('.agent-counter');

        if (agent.active) {
            card.classList.add('active');
            statusElement.textContent = agent.lastAction || 'Active';
        } else {
            card.classList.remove('active');
            statusElement.textContent = 'Standby';
        }

        counterElement.textContent = agent.count;
    }

    addActivity(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const activity = {
            message,
            type,
            timestamp,
            id: Date.now()
        };

        this.activities.unshift(activity);
        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }

        this.updateActivityFeed();
    }

    updateActivityFeed() {
        const activityList = this.agentPanel.querySelector('.activity-list');
        if (!activityList) return;

        activityList.innerHTML = this.activities
            .map(activity => `
                <div class="activity-item">
                    <span class="activity-time">${activity.timestamp}</span>
                    <span class="activity-message">${activity.message}</span>
                </div>
            `)
            .join('');
    }

    startRealTimeUpdates() {
        const updateLoop = () => {
            // כאן אפשר להוסיף עדכונים נוספים
            this.animationFrameId = requestAnimationFrame(updateLoop);
        };
        updateLoop();
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.agentPanel) {
            this.agentPanel.remove();
        }
    }

    // API methods לשימוש מ-content script
    scannerActive(message) {
        this.updateAgentStatus('scanner', true, message);
        this.addActivity(`🔍 ${message}`);
    }

    scannerStandby() {
        this.updateAgentStatus('scanner', false);
    }

    likerActive(message) {
        this.updateAgentStatus('liker', true, message);
        this.addActivity(`❤️ ${message}`);
    }

    likerStandby() {
        this.updateAgentStatus('liker', false);
    }

    commenterActive(message) {
        this.updateAgentStatus('commenter', true, message);
        this.addActivity(`💬 ${message}`);
    }

    commenterStandby() {
        this.updateAgentStatus('commenter', false);
    }

    analyzerActive(message) {
        this.updateAgentStatus('analyzer', true, message);
        this.addActivity(`🧠 ${message}`);
    }

    analyzerStandby() {
        this.updateAgentStatus('analyzer', false);
    }
}

// יצוא גלובלי
window.AIAgentsVisualization = AIAgentsVisualization; 