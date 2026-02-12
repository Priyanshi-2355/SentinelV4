
/**
 * Sentinel UI Controller
 * Manages all DOM interactions and dynamic animations.
 */
export const ui = {
    // DOM Selectors
    form: document.getElementById('analysis-form'),
    input: document.getElementById('url-input'),
    submitBtn: document.getElementById('submit-btn'),
    btnText: document.querySelector('.btn-text'),
    loader: document.querySelector('.btn-loader'),
    terminal: document.getElementById('terminal-output'),
    results: document.getElementById('results-display'),
    errorBox: document.getElementById('error-message'),
    errorContent: document.getElementById('error-content'),
    scoreVal: document.getElementById('score-value'),
    gaugePath: document.getElementById('gauge-path'),
    riskText: document.getElementById('risk-level-text'),
    signalsList: document.getElementById('signals-list'),
    historySection: document.getElementById('history-section'),
    historyBody: document.getElementById('history-body'),

    /**
     * Update loading state for form
     */
    setLoading: (isLoading) => {
        ui.submitBtn.disabled = isLoading;
        ui.input.disabled = isLoading;
        if (isLoading) {
            ui.btnText.classList.add('hidden');
            ui.loader.classList.remove('hidden');
            ui.errorBox.classList.add('hidden');
        } else {
            ui.btnText.classList.remove('hidden');
            ui.loader.classList.add('hidden');
        }
    },

    /**
     * Terminal Logging
     */
    log: (msg, type = 'system') => {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        ui.terminal.appendChild(line);
        ui.terminal.scrollTop = ui.terminal.scrollHeight;
    },

    clearTerminal: () => {
        ui.terminal.innerHTML = '';
    },

    /**
     * Error Handling
     */
    showError: (msg) => {
        ui.errorContent.textContent = msg;
        ui.errorBox.classList.remove('hidden');
        ui.results.classList.add('hidden');
    },

    /**
     * Results Rendering & Gauge Animation
     */
    renderResults: (data, url) => {
        ui.results.classList.remove('hidden');
        ui.errorBox.classList.add('hidden');
        
        // Arc Math (240 deg arc: length 335, total circumference 502)
        const arcLength = 335;
        const offset = arcLength - (arcLength * data.score) / 100;
        ui.gaugePath.style.strokeDashoffset = offset;
        
        // Counter Animation
        let current = 0;
        const target = data.score;
        const timer = setInterval(() => {
            if (current >= target) {
                ui.scoreVal.textContent = target;
                clearInterval(timer);
            } else {
                current += 1;
                ui.scoreVal.textContent = current;
            }
        }, 15);

        // Dynamic Styling Based on Risk
        let color = '#10b981'; // Emerald (Safe)
        if (data.score >= 70) color = '#f43f5e'; // Rose (High)
        else if (data.score >= 35) color = '#fca311'; // Orange (Medium)

        ui.gaugePath.style.stroke = color;
        ui.riskText.style.color = color;
        ui.riskText.textContent = data.level;

        // Signals Population
        ui.signalsList.innerHTML = data.reasons.map((reason, i) => `
            <div class="signal-node">
                <div class="node-icon"><i class="fa-solid fa-microchip"></i></div>
                <div class="node-text">
                    <h4>SIG_EXTRACTION_0${i + 1}</h4>
                    <p>${reason}</p>
                </div>
            </div>
        `).join('');

        ui.results.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Audit History Management
     */
    updateHistory: (history) => {
        if (history.length === 0) return;
        ui.historySection.classList.remove('hidden');
        ui.historyBody.innerHTML = history.map(item => {
            const riskClass = item.level.includes('HIGH') ? 'badge-high' : 
                             item.level.includes('MEDIUM') ? 'badge-medium' : 'badge-low';
            return `
                <tr>
                    <td><div class="history-url" title="${item.url}">${item.url}</div></td>
                    <td>${item.score}</td>
                    <td><span class="history-badge ${riskClass}">${item.level.split(' ')[0]}</span></td>
                    <td class="history-time">${item.timestamp}</td>
                </tr>
            `;
        }).join('');
    }
};
