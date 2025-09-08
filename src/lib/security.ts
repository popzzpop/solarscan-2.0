// Security utilities and rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimit {
  private storage = new Map<string, RateLimitEntry>();
  
  constructor(
    private maxRequests: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.storage.get(key);

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      this.storage.delete(key);
    }

    const currentEntry = this.storage.get(key);
    
    if (!currentEntry) {
      this.storage.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (currentEntry.count >= this.maxRequests) {
      return false;
    }

    currentEntry.count++;
    this.storage.set(key, currentEntry);
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.storage.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.storage.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.resetTime;
  }
}

// Rate limiters for different actions
export const emailRateLimit = new RateLimit(3, 300000); // 3 emails per 5 minutes
export const searchRateLimit = new RateLimit(30, 60000); // 30 searches per minute
export const apiRateLimit = new RateLimit(100, 60000); // 100 API calls per minute

// Input validation and sanitization
export const validation = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  isValidPhone(phone: string): boolean {
    // Supports international formats
    const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
  },

  sanitizeString(input: string): string {
    return input
      .replace(/[<>\"']/g, '') // Remove potential XSS characters
      .slice(0, 500) // Limit length
      .trim();
  },

  isValidMonthlyBill(bill: number): boolean {
    return Number.isFinite(bill) && bill >= 0 && bill <= 10000;
  },

  sanitizeLeadData(data: any): any {
    return {
      type: this.sanitizeString(data.type || ''),
      value: this.sanitizeString(data.value || ''),
      name: this.sanitizeString(data.name || ''),
      provider: data.provider ? this.sanitizeString(data.provider) : undefined,
      source: this.sanitizeString(data.source || ''),
      monthlyBill: this.isValidMonthlyBill(data.monthlyBill) ? data.monthlyBill : 0,
      address: this.sanitizeString(data.address || ''),
      yearlyProduction: data.yearlyProduction,
      panelCount: data.panelCount,
      systemSize: data.systemSize ? this.sanitizeString(data.systemSize) : undefined,
      timestamp: data.timestamp || new Date().toISOString()
    };
  }
};

// Security headers helper
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://cdn.emailjs.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://maps.googleapis.com https://solar.googleapis.com https://api.emailjs.com",
      "frame-src https://maps.googleapis.com"
    ].join('; ')
  };
}

// Client fingerprinting for rate limiting
export function getClientFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString()
  ];
  
  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString();
}

// Error logging (without sensitive data)
export function logSecurityEvent(event: string, details?: Record<string, any>) {
  const safeDetails = details ? Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === 'string' && value.length > 50 ? 
        value.substring(0, 50) + '...' : value
    ])
  ) : {};

  console.warn(`🔒 Security Event: ${event}`, safeDetails);
}