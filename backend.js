
import { GoogleGenAI, Type } from "@google/genai";

// Initialization with platform-injected API KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SSRF_BLOCKLIST = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, 
    /^169\.254\./, /^localhost$/, /^0\.0\.0\.0$/, /^\[::1\]$/
];

/**
 * Heuristic Engine: Lexical Analysis
 */
const extractFeatures = (urlStr) => {
    let url;
    try {
        url = new URL(urlStr);
    } catch {
        url = new URL(urlStr.includes('://') ? urlStr : 'http://' + urlStr);
    }
    const hostname = url.hostname.toLowerCase();
    
    return {
        hostname,
        isIp: /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname),
        length: urlStr.length,
        isEncoded: /%[0-9A-F]{2}/i.test(urlStr)
    };
};

/**
 * Scoring Core
 */
const calculateLocalRisk = (features) => {
    let score = 0;
    const reasons = [];

    if (features.isIp) {
        score += 45;
        reasons.push("Protocol Violation: Direct IP addressing detected. Evades domain reputation services.");
    }
    if (features.length > 80) {
        score += 15;
        reasons.push("Structural Anomaly: Unusual URL length detected, often used to hide payload strings.");
    }
    
    return { score, reasons };
};

/**
 * Public Handler (Simulating Node.js Controller)
 */
export const handleAnalysis = async (urlInput) => {
    try {
        const features = extractFeatures(urlInput);
        
        // Guardrail: SSRF Prevention
        if (SSRF_BLOCKLIST.some(p => p.test(features.hostname))) {
            throw new Error("403_ACCESS_FORBIDDEN: Analysis of restricted infrastructure is prohibited.");
        }

        const local = calculateLocalRisk(features);

        // Hybrid Intelligence: Gemini Verification
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `As a Lead Security Analyst, evaluate this URL for phishing/malware patterns: "${urlInput}". 
            Detected local signals: ${JSON.stringify(features)}.
            Return JSON with:
            - intelScore: 0-100 (risk index)
            - intelReasons: array of strings (technical explanations for non-technical users).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intelScore: { type: Type.NUMBER },
                        intelReasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["intelScore", "intelReasons"]
                }
            }
        });

        const intel = JSON.parse(response.text.trim());
        
        // Final Weighting (70% AI Intelligence + 30% Hardcoded Heuristics)
        const finalScore = Math.min(100, Math.round((local.score * 0.3) + (intel.intelScore * 0.7)));
        const allReasons = Array.from(new Set([...local.reasons, ...intel.intelReasons]));
        
        let level = "LOW RISK";
        if (finalScore >= 70) level = "HIGH RISK";
        else if (finalScore >= 35) level = "MEDIUM RISK";

        return {
            score: finalScore,
            level,
            reasons: allReasons.length > 0 ? allReasons : ["URL verified against standard baseline patterns."]
        };

    } catch (error) {
        console.error("ANALYSIS_KERNEL_PANIC:", error);
        throw error;
    }
};
