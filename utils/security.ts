/**
 * Web3 Security Utilities
 * 
 * Helper functions for securing web3 applications
 */

import { ENV } from './env';

/**
 * Validate a message signature from a wallet
 * @param address Ethereum address
 * @param message Original message
 * @param signature Signed message
 * @returns Whether signature is valid
 */
export async function validateSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // Use ethers.js to recover the address from the signature
    const ethers = await import('ethers');
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Check if the recovered address matches the provided address
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

/**
 * Generate a nonce for authentication
 * @param prefix Optional prefix
 * @returns Random nonce
 */
export function generateNonce(prefix: string = 'auth'): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const nonce = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${prefix}-${nonce}`;
}

/**
 * Create authentication message for signing
 * @param address Wallet address
 * @param nonce Unique nonce
 * @param expiration Expiration time in seconds
 * @returns Message to sign
 */
export function createAuthMessage(
  address: string,
  nonce: string,
  expiration: number = 3600 // 1 hour
): string {
  const expirationTime = Math.floor(Date.now() / 1000) + expiration;
  
  return `Sign this message to authenticate with WowzaRush
  
Address: ${address}
Nonce: ${nonce}
Expiration: ${expirationTime}

This signature will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Verify CSRF token
 * @param token CSRF token from client
 * @param session CSRF token from session
 * @returns Whether token is valid
 */
export function verifyCsrfToken(token: string, session: string): boolean {
  if (!token || !session) return false;
  
  // Use a timing-safe comparison to prevent timing attacks
  let mismatch = 0;
  const tokenBuffer = Buffer.from(token);
  const sessionBuffer = Buffer.from(session);
  
  // Check for length mismatch
  if (tokenBuffer.length !== sessionBuffer.length) return false;
  
  // Compare each byte
  for (let i = 0; i < tokenBuffer.length; i++) {
    mismatch |= tokenBuffer[i] ^ sessionBuffer[i];
  }
  
  return mismatch === 0;
}

/**
 * Generate CSRF token
 * @returns Random CSRF token
 */
export function generateCsrfToken(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sanitize user input to prevent XSS
 * @param input User input
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Replace HTML special chars with entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Detect phishing attempts in URLs
 * @param url URL to check
 * @returns Whether URL is suspicious
 */
export function isPhishingAttempt(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // List of known phishing domains
    const knownPhishingDomains = [
      'metamaks.io',
      'wallletconnect.com',
      'etherdrop.org',
      'etherswop.io',
      'myetherwallets.com',
    ];
    
    // Check for known phishing domains
    if (knownPhishingDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    )) {
      return true;
    }
    
    // Check for suspicious URL patterns
    const suspiciousPatterns = [
      /\.(io|com|org|net)\.[\w-]+$/, // Domain TLD confusion, e.g. metamask.io.phishing
      /free(-|)eth(ereum|)/i,        // Free ETH scams
      /airdrop|claim|verify/i,       // Common airdrop scam keywords
      /connect.*wallet/i,            // Connect wallet phishing
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If URL parsing fails, consider it suspicious
    return true;
  }
}

/**
 * Rate limit helper
 */
export default class RateLimiter {
  private attempts: Map<string, { count: number, resetAt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  
  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if a key has exceeded rate limits
   * @param key Identifier (IP, user ID, etc.)
   * @returns Whether rate limit is exceeded
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(key);
    
    // Clean up expired entries
    this.cleanup(now);
    
    if (!entry) {
      // First attempt
      this.attempts.set(key, { 
        count: 1, 
        resetAt: now + this.windowMs 
      });
      return false;
    }
    
    if (entry.resetAt < now) {
      // Window expired, reset counter
      this.attempts.set(key, { 
        count: 1, 
        resetAt: now + this.windowMs 
      });
      return false;
    }
    
    // Increment counter
    entry.count += 1;
    
    // Check if over limit
    return entry.count > this.maxAttempts;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(now: number): void {
    for (const [key, entry] of this.attempts.entries()) {
      if (entry.resetAt < now) {
        this.attempts.delete(key);
      }
    }
  }
  
  /**
   * Reset a specific key
   * @param key Identifier to reset
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
} 