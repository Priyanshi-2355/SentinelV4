
import { handleAnalysis } from './backend.js';

/**
 * Frontend API client.
 * Simulates a POST /api/analyze call.
 */
export const api = {
    analyze: async (url) => {
        // Simulate network latency
        await new Promise(r => setTimeout(r, 1200));
        
        try {
            const result = await handleAnalysis(url);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "A server exception occurred."
            };
        }
    }
};
