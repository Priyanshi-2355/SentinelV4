
import { GoogleGenAI, Type } from "@google/genai";

// Initialization with platform-injected API KEY
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('SENTINEL_WARNING: No GEMINI_API_KEY configured. Set it in .env.local to enable AI-powered analysis.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SSRF_BLOCKLIST = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, 
    /^169\.254\./, /^localhost$/, /^0\.0\.0\.0$/, /^\[::1\]$/
];

/**
 * Stage 1: Input Validation
 * Strict check for protocol and structural validity.
 */
const validateInput = (urlInput) => {
    if (!urlInput || typeof urlInput !== 'string') {
        throw new Error("400: Please enter a valid URL");
    }

    try {
        const url = new URL(urlInput);
        
        // Explicit protocol check
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error("400: Please enter a valid URL (HTTP/HTTPS only)");
        }

        const hostname = url.hostname.toLowerCase();
        
        // Guardrail: SSRF Prevention
        if (SSRF_BLOCKLIST.some(p => p.test(hostname))) {
            throw new Error("403: Forbidden: Analysis of restricted infrastructure is prohibited.");
        }

        return url;
    } catch (e) {
        // Distinguish between our thrown 400s and native URL parse errors
        if (e.message.startsWith("400:") || e.message.startsWith("403:")) throw e;
        throw new Error("400: Please enter a valid URL");
    }
};

/**
 * Stage 2: Feature Extraction
 * Pure deterministic lexical analysis.
 */
const extractFeatures = (url) => {
    const urlStr = url.toString();
    const hostname = url.hostname.toLowerCase();
    
    return {
        hostname,
        isIp: /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname),
        length: urlStr.length,
        isEncoded: /%[0-9A-F]{2}/i.test(urlStr)
    };
};

/**
 * Stage 3: Risk Scoring (Deterministic Heuristics)
 */
const calculateLocalRisk = (features) => {
    let score = 0;
    const reasons = [];

    // Fixed documented weights
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
 * Public Handler (Entry Point)
 */
export const handleAnalysis = async (urlInput) => {
    try {
        // 1. Validation Stage
        const url = validateInput(urlInput);

        // 2. Feature Extraction Stage
        const features = extractFeatures(url);

        // 3. Deterministic Local Scoring Stage
        const local = calculateLocalRisk(features);

        // 4. Response Generation (including Deterministic AI Stage)
        if (!ai) {
            // Fallback: return local-only analysis when no API key is configured
            let riskLevel = "Low Risk";
            if (local.score >= 70) riskLevel = "High Risk";
            else if (local.score >= 35) riskLevel = "Medium Risk";
            return {
                url: url.toString(),
                riskScore: Math.max(0, Math.min(100, local.score)),
                riskLevel,
                reasons: local.reasons.length > 0 ? local.reasons : ["URL verified against standard baseline patterns. (AI analysis unavailable — set GEMINI_API_KEY in .env.local)"]
            };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: `As a Lead Security Analyst, evaluate this URL for phishing/malware patterns: "${url.toString()}". 
            Detected local signals: ${JSON.stringify(features)}.
            Return JSON with:
            - intelScore: 0-100 (risk index)
            - intelReasons: array of strings (technical explanations for non-technical users).`,
            config: {
                // Ensure determinism: Seed and Temperature
                seed: 42,
                temperature: 0,
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

        const responseText = response.text || '';
        if (!responseText) {
            throw new Error('500: Empty response from AI model');
        }
        const intel = JSON.parse(responseText.trim());
        
        // Final Weighting: 30% local + 70% AI (Deterministic)
        // Normalize and clamp to 0-100
        const rawScore = (local.score * 0.3) + (intel.intelScore * 0.7);
        const riskScore = Math.max(0, Math.min(100, Math.round(rawScore)));
        
        const allReasons = Array.from(new Set([...local.reasons, ...intel.intelReasons]));
        
        let riskLevel = "Low Risk";
        if (riskScore >= 70) riskLevel = "High Risk";
        else if (riskScore >= 35) riskLevel = "Medium Risk";

        return {
            url: url.toString(),
            riskScore,
            riskLevel,
            reasons: allReasons.length > 0 ? allReasons : ["URL verified against standard baseline patterns."]
        };

    } catch (error) {
        const errMsg = error?.message || String(error);
        console.error("ANALYSIS_PIPELINE_ERROR:", errMsg, error);
        
        // Standardized Error Response Stage
        if (errMsg.startsWith("400:")) {
            return {
                error: "InvalidInput",
                message: errMsg.replace("400: ", "")
            };
        }
        if (errMsg.startsWith("403:")) {
            return {
                error: "AccessForbidden",
                message: errMsg.replace("403: ", "")
            };
        }
        
        return {
            error: "InternalError",
            message: errMsg || "A server exception occurred during interrogation."
        };
    }
};
