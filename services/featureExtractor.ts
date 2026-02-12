
export interface ExtractedFeatures {
  length: number;
  subdomainCount: number;
  isIpAddress: boolean;
  hasShortener: boolean;
  suspiciousTokens: string[];
  entropy: number;
  hasHomographs: boolean;
  specialCharCount: number;
  hasSuspiciousPort: boolean;
}

/**
 * Calculates Shannon Entropy to detect machine-generated domains (DGA).
 */
export const calculateEntropy = (str: string): number => {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  return Object.values(frequencies).reduce((sum, freq) => {
    const p = freq / len;
    return sum - p * Math.log2(p);
  }, 0);
};

const SUSPICIOUS_TOKENS = [
  'login', 'verify', 'update', 'secure', 'account', 'banking', 'signin', 
  'confirm', 'password', 'webscr', 'cmd', 'auth', 'payment', 'service',
  'billing', 'support', 'recovery', 'validate'
];

const URL_SHORTENERS = [
  'bit.ly', 't.co', 'tinyurl.com', 'is.gd', 'buff.ly', 'goo.gl', 'ow.ly', 't.me'
];

/**
 * Deterministic lexical and structural analysis of the URL string.
 */
export const extractFeatures = (urlStr: string): ExtractedFeatures => {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    // Attempt parsing as HTTP if protocol is missing
    url = new URL(urlStr.includes('://') ? urlStr : 'http://' + urlStr);
  }

  const hostname = url.hostname.toLowerCase();
  
  // IP Address Detection
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
  
  // Subdomain Depth
  const parts = hostname.split('.');
  const subdomainCount = parts.length > 2 ? parts.length - 2 : 0;
  
  // Keyword Matching
  const foundTokens = SUSPICIOUS_TOKENS.filter(token => 
    urlStr.toLowerCase().includes(token)
  );

  // Shortener Detection
  const hasShortener = URL_SHORTENERS.some(s => hostname.endsWith(s));

  // Internationalized Domain Names (Homograph detection)
  const hasHomographs = /[^\u0000-\u007f]/.test(hostname);

  // Non-standard port usage
  const hasSuspiciousPort = url.port !== '' && !['80', '443'].includes(url.port);

  return {
    length: urlStr.length,
    subdomainCount,
    isIpAddress,
    hasShortener,
    suspiciousTokens: foundTokens,
    entropy: calculateEntropy(hostname),
    hasHomographs,
    specialCharCount: (urlStr.match(/[^a-zA-Z0-9]/g) || []).length,
    hasSuspiciousPort
  };
};
