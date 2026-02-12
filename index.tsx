
import { api } from './api.js';

/**
 * Sentinel UI Controller
 */
const ui = {
    form: document.getElementById('analysis-form') as HTMLFormElement,
    input: document.getElementById('url-input') as HTMLInputElement,
    submitBtn: document.getElementById('submit-btn') as HTMLButtonElement,
    btnText: document.querySelector('.btn-text') as HTMLElement,
    loader: document.querySelector('.btn-loader') as HTMLElement,
    results: document.getElementById('results-display') as HTMLElement,
    errorBox: document.getElementById('error-message') as HTMLElement,
    errorContent: document.getElementById('error-content') as HTMLElement,
    scoreVal: document.getElementById('score-value') as HTMLElement,
    gaugePath: document.getElementById('gauge-path') as unknown as SVGCircleElement,
    riskText: document.getElementById('risk-level-text') as HTMLElement,
    signalsList: document.getElementById('signals-list') as HTMLElement,
    historySection: document.getElementById('history-section') as HTMLElement,
    historyBody: document.getElementById('history-body') as HTMLElement,

    setLoading(isLoading: boolean) {
        this.submitBtn.disabled = isLoading;
        this.input.disabled = isLoading;
        if (isLoading) {
            this.btnText.classList.add('hidden');
            this.loader.classList.remove('hidden');
            this.errorBox.classList.add('hidden');
        } else {
            this.btnText.classList.remove('hidden');
            this.loader.classList.add('hidden');
        }
    },

    renderResults(data: any) {
        this.results.classList.remove('hidden');
        
        // Gauge Update
        const arcLength = 335;
        const offset = arcLength - (arcLength * data.score) / 100;
        this.gaugePath.style.strokeDashoffset = offset.toString();
        
        // Counter Animation
        let current = 0;
        const target = data.score;
        const timer = setInterval(() => {
            if (current >= target) {
                this.scoreVal.textContent = target.toString();
                clearInterval(timer);
            } else {
                current += 1;
                this.scoreVal.textContent = current.toString();
            }
        }, 15);

        // Status Colors
        let color = '#10b981'; // Emerald
        if (data.score >= 70) color = '#f43f5e'; // Rose
        else if (data.score >= 35) color = '#fca311'; // Orange

        this.gaugePath.style.stroke = color;
        this.riskText.style.color = color;
        this.riskText.textContent = data.level;

        // Signals Population
        this.signalsList.innerHTML = data.reasons.map((reason: string, i: number) => `
            <div class="signal-node">
                <div class="node-icon"><i class="fa-solid fa-microchip"></i></div>
                <div class="node-text">
                    <h4>SIG_EXTRACTION_0${i + 1}</h4>
                    <p>${reason}</p>
                </div>
            </div>
        `).join('');

        this.results.scrollIntoView({ behavior: 'smooth' });
    }
};

const state = {
    history: [] as any[],
    isAnalyzing: false
};

const updateClock = () => {
    const clock = document.getElementById('hud-clock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
};
setInterval(updateClock, 1000);

const handleAnalyze = async (e: Event) => {
    e.preventDefault();
    if (state.isAnalyzing) return;

    const urlInput = ui.input.value.trim();
    if (!urlInput) return;

    state.isAnalyzing = true;
    ui.setLoading(true);

    const response = await api.analyze(urlInput);

    if (response.success) {
        ui.renderResults(response.data);
        
        // History Management
        const historyItem = {
            ...response.data,
            url: urlInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        state.history = [historyItem, ...state.history.slice(0, 9)];
        ui.historySection.classList.remove('hidden');
        ui.historyBody.innerHTML = state.history.map(item => `
            <tr>
                <td><div style="font-family: monospace; font-weight: bold; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.url}</div></td>
                <td>${item.score}</td>
                <td><span class="history-badge ${item.level.includes('HIGH') ? 'badge-high' : item.level.includes('MEDIUM') ? 'badge-medium' : 'badge-low'}">${item.level.split(' ')[0]}</span></td>
                <td>${item.timestamp}</td>
            </tr>
        `).join('');
    } else {
        ui.errorContent.textContent = response.message;
        ui.errorBox.classList.remove('hidden');
        ui.results.classList.add('hidden');
    }

    state.isAnalyzing = false;
    ui.setLoading(false);
};

// Start application
ui.form.addEventListener('submit', handleAnalyze);
updateClock();
