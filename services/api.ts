
import { GoogleGenAI, Type } from "@google/genai";
import { ApiResponse, RiskLevel } from "../types";
import { extractFeatures } from "./featureExtractor";
import { calculateRiskScore } from "./scoringEngine";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// SSRF Protection: Private, local, and reserved IP ranges
const SSRF_BLOCKLIST = [
  /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, 
  /^169\.254\./, /^localhost$/, /^0\.0\.0\.0$/, /^\[::1\]$/
];

/**
 * Simulated Backend API Endpoint: POST /analyze-url
 * Implements strict sanitization, guardrails, and hybrid intelligence analysis.
 */
export const analyzeUrl = async (urlStr: string): Promise<ApiResponse> => {
  try {
    // 1. Validation & Sanitization (Backend Guardrail)
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      throw new Error("400: Malformed URL format. The server cannot process this request.");
    }

    const hostname = url.hostname.toLowerCase();
    
    // SSRF Check
    if (SSRF_BLOCKLIST.some(pattern => pattern.test(hostname))) {
      throw new Error("403: Forbidden. Analysis of internal or private network resources is prohibited.");
    }

    // Protocol Enforcement
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`400: Unsupported protocol '${url.protocol}'. Only web-based protocols (HTTP/HTTPS) are analyzed.`);
    }

    // 2. Production Heuristic Engine
    const features = extractFeatures(urlStr);
    const heuristicResult = calculateRiskScore(features);

    // 3. AI Hybrid Verification (Contextual Intelligence)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `System Role: Cybersecurity Analyst.
      Analyze the reputation and context of this URL: "${urlStr}".
      Local Features Detected: ${JSON.stringify(features)}.
      Task: Provide a 0-100 'intelScore' based on known TLD reputation, brand impersonation risks, and phishing trends.
      Output format: JSON with 'intelScore' and an array of 'intelReasons'.`,
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

    const intelData = JSON.parse(response.text.trim());
    
    // 4. Weighted Aggregation
    // Combined Score = (70% Deterministic Heuristics + 30% Contextual Intelligence)
    const finalScore = Math.min(100, Math.round((heuristicResult.score * 0.7) + (intelData.intelScore * 0.3)));
    
    let finalLevel: RiskLevel = RiskLevel.LOW;
    if (finalScore >= 70) finalLevel = RiskLevel.HIGH;
    else if (finalScore >= 31) finalLevel = RiskLevel.MEDIUM;

    // Deduplicate and merge reasons
    const allReasons = Array.from(new Set([...heuristicResult.reasons, ...intelData.intelReasons]));

    return {
      score: finalScore,
      level: finalLevel,
      reasons: allReasons
    };
  } catch (error: any) {
    console.error("[API Error]", error);
    // Mimic Express centralized error handling
    throw new Error(error.message.includes("400:") || error.message.includes("403:") 
      ? error.message 
      : "500: Internal server error. The analysis engine failed to initialize.");
  }
};
