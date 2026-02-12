
import { api } from './api.js';
import { ui } from './ui.js';

const state = {
    history: [],
    isAnalyzing: false
};

/**
 * Initialize HUD clock
 */
const updateClock = () => {
    const clock = document.getElementById('hud-clock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
};
setInterval(updateClock, 1000);

/**
 * Handle Analysis Submission
 */
const handleAnalyze = async (e) => {
    e.preventDefault();
    if (state.isAnalyzing) return;

    const url = ui.input.value.trim();
    if (!url) return;

    // Reset UI
    state.isAnalyzing = true;
    ui.setLoading(true);
    ui.clearTerminal();
    ui.log('SYSTEM_PROTOCOL_INITIATED', 'process');
    ui.log(`INTERROGATING_TARGET: ${url}`, 'system');

    // Simulated scanning steps for "Appealing" UX
    await new Promise(r => setTimeout(r, 600));
    ui.log('PERFORMING_LEXICAL_EXTRACTION...', 'process');
    await new Promise(r => setTimeout(r, 800));
    ui.log('DECRYPTING_ENTROPY_SIGNATURES...', 'process');
    await new Promise(r => setTimeout(r, 600));
    ui.log('CROSS_REFERENCING_GLOBAL_THREAT_INDEX...', 'process');

    const response = await api.analyze(url);

    if (response.success) {
        ui.log('ANALYSIS_COMPLETE_VERDICT_GENERATED', 'success');
        ui.renderResults(response.data, url);
        
        // Add to history
        const historyItem = {
            ...response.data,
            url,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        state.history = [historyItem, ...state.history.slice(0, 9)];
        ui.updateHistory(state.history);
    } else {
        ui.log('CRITICAL_ANALYSIS_FAILURE: ' + response.message, 'danger');
        ui.showError(response.message);
    }

    state.isAnalyzing = false;
    ui.setLoading(false);
};

// Event Listeners
ui.form.addEventListener('submit', handleAnalyze);

// Initial System Message
updateClock();
console.log("SENTINEL_V4_CORE_LOADED");
