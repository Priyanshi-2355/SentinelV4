
import { GoogleGenAI, Type } from "@google/genai";
import { ApiResponse, RiskLevel } from "../types";
import { extractFeatures } from "./featureExtractor";
import { calculateRiskScore } from "./scoringEngine";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SSRF_BLOCKLIST = [
  /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, 
  /^169\.254\./, /^localhost$/, /^0\.0\.0\.0$/, /^\[::1\]$/
];

/**
 * Stage 1: Validation
 */
const validateUrl = (input: string): URL => {
    try {
        const url = new URL(input);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error("400: Please enter a valid URL (HTTP/HTTPS only)");
        }
        if (SSRF_BLOCKLIST.some(p => p.test(url.hostname))) {
            throw new Error("403: Access forbidden to restricted networks.");
        }
        return url;
    } catch (e: any) {
        if (e.message.startsWith("400:") || e.message.startsWith("403:")) throw e;
        throw new Error("400: Please enter a valid URL");
    }
}

/**
 * Integrated Deterministic API
 */
export const analyzeUrl = async (urlStr: string): Promise<any> => {
  try {
    // 1. Validation
    const url = validateUrl(urlStr);

    // 2. Feature Extraction
    const features = extractFeatures(url.toString());
    
    // 3. Deterministic Heuristics
    const heuristicResult = calculateRiskScore(features);

    // If no API key, return local-only analysis
    if (!ai) {
      return {
        url: url.toString(),
        riskScore: heuristicResult.score,
        riskLevel: heuristicResult.level,
        reasons: heuristicResult.reasons
      };
    }

    // 4. Deterministic AI (Temperature 0 + Seed)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `System Role: Cybersecurity Analyst.
      Analyze the reputation and context of this URL: "${url.toString()}".
      Local Features Detected: ${JSON.stringify(features)}.
      Task: Provide a 0-100 'intelScore' based on known TLD reputation, brand impersonation risks, and phishing trends.
      Output format: JSON with 'intelScore' and an array of 'intelReasons'.`,
      config: {
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
    const intelData = JSON.parse(responseText.trim());
    
    // Weighted Aggregation
    const finalScore = Math.max(0, Math.min(100, Math.round((heuristicResult.score * 0.7) + (intelData.intelScore * 0.3))));
    
    let finalLevel = "Low Risk";
    if (finalScore >= 70) finalLevel = "High Risk";
    else if (finalScore >= 31) finalLevel = "Medium Risk";

    const allReasons = Array.from(new Set([...heuristicResult.reasons, ...intelData.intelReasons]));

    return {
      url: url.toString(),
      riskScore: finalScore,
      riskLevel: finalLevel,
      reasons: allReasons
    };
  } catch (error: any) {
    if (error.message.startsWith("400:") || error.message.startsWith("403:")) {
        const [code, msg] = error.message.split(": ");
        return { error: "InvalidInput", message: msg };
    }
    return { error: "InternalError", message: "Interrogation protocol failed." };
  }
};
