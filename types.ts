
export enum RiskLevel {
  LOW = 'Low Risk',
  MEDIUM = 'Medium Risk',
  HIGH = 'High Risk'
}

export interface AnalysisResult {
  url: string;
  score: number; // 0-100
  level: RiskLevel;
  reasons: string[];
  timestamp: string;
}

export interface ApiResponse {
  score: number;
  level: RiskLevel;
  reasons: string[];
}
