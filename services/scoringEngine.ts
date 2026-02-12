
import { ExtractedFeatures } from './featureExtractor';
import { RiskLevel } from '../types';

export interface ScoringResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

/**
 * Production-grade weighted scoring logic.
 * Weights are derived from common phishing detection research benchmarks.
 */
export const calculateRiskScore = (features: ExtractedFeatures): ScoringResult => {
  let score = 0;
  const reasons: string[] = [];

  // 1. IP Address Hosting (Critical Signal)
  if (features.isIpAddress) {
    score += 45;
    reasons.push("URL uses a raw IP address instead of a domain name, a common tactic for bypassing reputation-based filters.");
  }

  // 2. Homograph Attacks (Critical Signal)
  if (features.hasHomographs) {
    score += 40;
    reasons.push("Contains non-standard ASCII characters; this is often a 'homograph' attack used to impersonate legitimate domains.");
  }

  // 3. High Entropy (Suspicious Signal - DGA)
  if (features.entropy > 4.2) {
    score += 25;
    reasons.push(`High lexical entropy (${features.entropy.toFixed(2)}) detected; the domain name appears to be randomly generated (DGA).`);
  }

  // 4. Misleading Keywords (Suspicious Signal)
  if (features.suspiciousTokens.length > 0) {
    const penalty = Math.min(30, features.suspiciousTokens.length * 15);
    score += penalty;
    reasons.push(`Contains misleading security/authentication keywords: ${features.suspiciousTokens.join(', ')}.`);
  }

  // 5. URL Shorteners (Cautionary Signal)
  if (features.hasShortener) {
    score += 20;
    reasons.push("Uses a known URL shortener service, which is frequently used to obfuscate malicious destinations.");
  }

  // 6. Subdomain depth (Cautionary Signal)
  if (features.subdomainCount > 3) {
    score += 15;
    reasons.push(`Excessive subdomain depth (${features.subdomainCount}) detected, common in phishing kits hosted on free platforms.`);
  }

  // 7. Non-standard ports
  if (features.hasSuspiciousPort) {
    score += 15;
    reasons.push("The URL targets an unconventional network port, which may indicate a rogue service or command-and-control server.");
  }

  // 8. Abnormal URL Length
  if (features.length > 100) {
    score += 10;
    reasons.push("The URL is unusually long, which can be used to hide the true destination from the user's address bar.");
  }

  // Cap final score at 100
  const finalScore = Math.min(100, score);
  
  let level = RiskLevel.LOW;
  if (finalScore >= 70) level = RiskLevel.HIGH;
  else if (finalScore >= 31) level = RiskLevel.MEDIUM;

  return {
    score: finalScore,
    level,
    reasons: reasons.length > 0 ? reasons : ["No significant risk patterns detected in lexical or structural analysis."]
  };
};
