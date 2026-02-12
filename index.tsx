
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
    qaList: document.getElementById('qa-test-cases') as HTMLElement,

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
        this.errorBox.classList.add('hidden');
        
        // Gauge Update
        const arcLength = 335;
        const offset = arcLength - (arcLength * data.riskScore) / 100;
        this.gaugePath.style.strokeDashoffset = offset.toString();
        
        // Counter Animation
        let current = 0;
        const target = data.riskScore;
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
        if (data.riskScore >= 70) color = '#f43f5e'; // Rose
        else if (data.riskScore >= 35) color = '#fca311'; // Orange

        this.gaugePath.style.stroke = color;
        this.riskText.style.color = color;
        this.riskText.textContent = data.riskLevel;

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

const TEST_CASES = [
    // POSITIVE
    { id: 'TC-001', type: 'valid', input: 'https://www.google.com', expected: 'Success' },
    { id: 'TC-002', type: 'valid', input: 'http://example.org/path?q=test', expected: 'Success' },
    { id: 'TC-003', type: 'valid', input: 'https://sub.my-site.io', expected: 'Success' },
    { id: 'TC-004', type: 'valid', input: 'HtTpS://MIXED-case.net', expected: 'Success' },
    
    // NEGATIVE
    { id: 'TC-101', type: 'invalid', input: 'hello', expected: 'Rejected: Valid URL req' },
    { id: 'TC-102', type: 'invalid', input: '123', expected: 'Rejected: Valid URL req' },
    { id: 'TC-103', type: 'invalid', input: 'test.com', expected: 'Rejected: No Protocol' },
    { id: 'TC-104', type: 'invalid', input: 'http://', expected: 'Rejected: Malformed' },
    { id: 'TC-105', type: 'invalid', input: 'https://with space.com', expected: 'Rejected: Malformed' },

    // SECURITY
    { id: 'TC-666', type: 'security', input: 'http://localhost:8080', expected: '403 Forbidden (SSRF)' },
    { id: 'TC-667', type: 'security', input: 'http://169.254.169.254/latest', expected: '403 Forbidden (SSRF)' },
    { id: 'TC-668', type: 'security', input: 'javascript:alert("XSS")', expected: '400 Protocol Failure' }
];

const updateClock = () => {
    const clock = document.getElementById('hud-clock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
};
setInterval(updateClock, 1000);

const handleAnalyze = async (e: Event | null, manualUrl?: string) => {
    if (e) e.preventDefault();
    if (state.isAnalyzing) return;

    const urlInput = manualUrl || ui.input.value.trim();
    if (!urlInput && !manualUrl) return;

    if (manualUrl) ui.input.value = manualUrl;

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
                <td>${item.riskScore}</td>
                <td><span class="history-badge ${item.riskLevel.includes('High') ? 'badge-high' : item.riskLevel.includes('Medium') ? 'badge-medium' : 'badge-low'}">${item.riskLevel.split(' ')[0]}</span></td>
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

// QA Test Case Rendering
const renderTestCases = () => {
    ui.qaList.innerHTML = TEST_CASES.map(tc => `
        <tr>
            <td>${tc.id}</td>
            <td><span class="qa-tag ${tc.type}">${tc.type.toUpperCase()}</span></td>
            <td><div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${tc.input}</div></td>
            <td>${tc.expected}</td>
            <td><button class="run-tc-btn" data-url="${tc.input}"><i class="fa-solid fa-play"></i></button></td>
        </tr>
    `).join('');

    document.querySelectorAll('.run-tc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = (e.currentTarget as HTMLElement).getAttribute('data-url');
            if (url) handleAnalyze(null, url);
        });
    });
};

// Start application
ui.form.addEventListener('submit', handleAnalyze);
updateClock();
renderTestCases();
