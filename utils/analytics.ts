/**
 * Privacy-Friendly Web3 Analytics
 * 
 * Track user interactions without compromising privacy
 */

import { ENV } from './env';

// Define event types for strong typing
export enum EventType {
  // Page views
  PAGE_VIEW = 'page_view',
  
  // Wallet interactions
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  NETWORK_CHANGED = 'network_changed',
  
  // Campaign interactions
  CAMPAIGN_VIEW = 'campaign_view',
  CAMPAIGN_CREATE = 'campaign_create',
  CAMPAIGN_FUND = 'campaign_fund',
  CAMPAIGN_MILESTONE_COMPLETED = 'campaign_milestone_completed',
  
  // User profile interactions
  PROFILE_VIEW = 'profile_view',
  PROFILE_EDIT = 'profile_edit',
  PROFILE_FOLLOW = 'profile_follow',
  
  // Errors
  ERROR = 'error',
  TRANSACTION_ERROR = 'transaction_error',
  
  // Custom
  CUSTOM = 'custom'
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
}

// Default config
const defaultConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  anonymizeIp: true,
  respectDoNotTrack: true,
};

// Analytics service
class AnalyticsService {
  private config: AnalyticsConfig;
  private initialized: boolean = false;
  private userId: string | null = null;
  private sessionId: string;
  
  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
  }
  
  // Initialize analytics
  public init(): void {
    if (this.initialized) return;
    
    // Check if analytics should be disabled due to DoNotTrack
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      this.config.enabled = false;
      console.log('Analytics disabled due to Do Not Track preference');
      return;
    }
    
    this.initialized = true;
    
    // Track initial page view
    this.trackPageView();
    
    // Set up navigation tracking
    if (typeof window !== 'undefined') {
      this.setupNavigationTracking();
    }
  }
  
  // Set user ID (wallet address)
  public setUserId(id: string): void {
    // For privacy, we hash the ID before storing
    this.userId = this.hashIdentifier(id);
  }
  
  // Clear user ID
  public clearUserId(): void {
    this.userId = null;
  }
  
  // Track event
  public trackEvent(
    eventType: EventType,
    properties: Record<string, any> = {}
  ): void {
    if (!this.config.enabled || !this.initialized) return;
    
    const event = {
      event_type: eventType,
      event_properties: properties,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      language: typeof navigator !== 'undefined' ? navigator.language : '',
    };
    
    // Send to your analytics endpoint
    this.sendToAnalytics(event);
  }
  
  // Track page view
  public trackPageView(path?: string): void {
    if (!this.config.enabled || !this.initialized) return;
    
    const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    this.trackEvent(EventType.PAGE_VIEW, {
      path: currentPath,
      title: typeof document !== 'undefined' ? document.title : '',
    });
  }
  
  // Track wallet connection
  public trackWalletConnection(
    walletType: string,
    chainId: string | number
  ): void {
    this.trackEvent(EventType.WALLET_CONNECTED, {
      wallet_type: walletType,
      chain_id: chainId,
    });
  }
  
  // Track transaction
  public trackTransaction(
    txHash: string,
    type: string,
    status: 'pending' | 'success' | 'failed',
    data: Record<string, any> = {}
  ): void {
    this.trackEvent(status === 'failed' ? EventType.TRANSACTION_ERROR : EventType.CUSTOM, {
      transaction_hash: txHash,
      transaction_type: type,
      transaction_status: status,
      ...data,
    });
  }
  
  // Track error
  public trackError(
    errorMessage: string,
    errorCode?: string,
    context?: Record<string, any>
  ): void {
    this.trackEvent(EventType.ERROR, {
      error_message: errorMessage,
      error_code: errorCode,
      context,
    });
  }
  
  // Private helper methods
  private isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    const dnt = navigator.doNotTrack || 
      (window as any).doNotTrack || 
      navigator.msDoNotTrack;
      
    return dnt === '1' || dnt === 'yes';
  }
  
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  private hashIdentifier(identifier: string): string {
    // In a real implementation, you would use a proper hashing function
    // This is just a placeholder
    return `hashed_${identifier}`;
  }
  
  private setupNavigationTracking(): void {
    // Track route changes in SPA
    if ('history' in window) {
      // Save original methods
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      // Override pushState
      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        this.trackPageView();
      };
      
      // Override replaceState
      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        this.trackPageView();
      };
      
      // Add popstate listener
      window.addEventListener('popstate', () => {
        this.trackPageView();
      });
    }
  }
  
  private sendToAnalytics(event: any): void {
    // In a real implementation, you would send this to your analytics endpoint
    // This is just a placeholder that logs to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event);
    } else {
      // In production, send data to your analytics service
      // Example: using a custom endpoint
      const analyticsEndpoint = ENV.ANALYTICS_API_URL || '/api/analytics';
      
      fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        keepalive: true, // Ensures data is sent even on page unload
      }).catch(err => {
        // Silent fail - analytics should never break the app
        console.error('Analytics error:', err);
      });
    }
  }
}

// Create and export singleton instance
export const analytics = new AnalyticsService();

// Initialize on client side
if (typeof window !== 'undefined') {
  // Initialize analytics after page load to not block rendering
  window.addEventListener('load', () => {
    setTimeout(() => {
      analytics.init();
    }, 1000);
  });
} 