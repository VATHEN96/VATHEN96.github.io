/**
 * Performance Utilities
 * 
 * Optimize bundle loading and performance in Web3 applications
 */

import { useEffect, useState } from 'react';

/**
 * Check if the current code execution is happening server-side or client-side
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Dynamically import heavy web3 libraries
 * 
 * Use this to defer loading of ethers.js, web3.js, etc. until necessary
 * @param importFn Function that returns an import promise
 * @returns Loading state and imported module
 */
export function useAsyncImport<T>(importFn: () => Promise<T>): {
  loading: boolean;
  module: T | null;
  error: Error | null;
} {
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModule = async () => {
      try {
        const importedModule = await importFn();
        if (isMounted) {
          setModule(importedModule);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error importing module:', err);
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    // Only load in browser
    if (isBrowser) {
      loadModule();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [importFn]);

  return { loading, module, error };
}

/**
 * Measure function performance
 * @param fn Function to measure
 * @param functionName Name for logging
 * @returns Result of the function
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  functionName: string
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${functionName} took ${duration.toFixed(2)}ms`);
    } else {
      // In production, only log slow operations
      if (duration > 200) {
        console.warn(`[Performance] Slow operation: ${functionName} took ${duration.toFixed(2)}ms`);
      }
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${functionName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Wrap a function with performance measurement
 * @param fn Function to measure
 * @param functionName Name for logging
 * @returns Wrapped function
 */
export function withPerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  functionName: string
): T {
  return (async (...args: Parameters<T>) => {
    return measurePerformance(() => fn(...args), functionName);
  }) as T;
}

/**
 * Track first contentful paint (FCP) and other web vitals
 * Reports to console in development
 */
export function trackWebVitals(): void {
  if (!isBrowser) return;
  
  // Only monitor in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_MONITOR_WEB_VITALS) {
    return;
  }

  try {
    const reportWebVitals = (metric: any) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Web Vital: ${metric.name}`, metric);
      } else {
        // In production, send to your analytics
        const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';
        
        const body = {
          event_type: 'web_vital',
          event_properties: {
            name: metric.name,
            value: metric.value,
            id: metric.id,
          },
          url: window.location.href,
        };
        
        // Use sendBeacon for reliability and to avoid delaying navigation
        if (navigator.sendBeacon) {
          navigator.sendBeacon(analyticsEndpoint, JSON.stringify(body));
        } else {
          // Fallback to fetch
          fetch(analyticsEndpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          }).catch(err => console.error('Error sending web vital:', err));
        }
      }
    };

    // Import and initialize web-vitals
    import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onFCP }) => {
      onFCP(reportWebVitals); // First Contentful Paint
      onLCP(reportWebVitals); // Largest Contentful Paint
      onCLS(reportWebVitals); // Cumulative Layout Shift
      onFID(reportWebVitals); // First Input Delay
      onTTFB(reportWebVitals); // Time to First Byte
    });
  } catch (error) {
    console.error('Failed to track web vitals:', error);
  }
}

/**
 * Optimize image loading
 * @param src Image source
 * @param options Image optimization options
 * @returns Optimized image URL
 */
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  } = {}
): string {
  if (!src) return '';
  
  // Don't process external URLs or data URLs
  if (src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }
  
  // Default options
  const {
    width = 800,
    height = 0, // 0 means auto
    quality = 80,
    format = 'webp',
  } = options;
  
  // Construct image URL for Next.js Image Optimization API
  try {
    const url = new URL(`/_next/image`, window.location.origin);
    url.searchParams.append('url', src);
    url.searchParams.append('w', width.toString());
    if (height > 0) {
      url.searchParams.append('h', height.toString());
    }
    url.searchParams.append('q', quality.toString());
    url.searchParams.append('f', format);
    
    return url.toString();
  } catch (error) {
    console.error('Error optimizing image:', error);
    return src;
  }
}

/**
 * Defer non-critical work until after page load
 * @param fn Function to defer
 * @param delayMs Milliseconds to delay (default: 0 = next idle period)
 */
export function defer(fn: () => void, delayMs: number = 0): void {
  if (!isBrowser) return;
  
  if (delayMs > 0) {
    // Use setTimeout for specific delay
    setTimeout(fn, delayMs);
  } else if ('requestIdleCallback' in window) {
    // Use requestIdleCallback for browser idle time
    requestIdleCallback(() => fn(), { timeout: 2000 });
  } else {
    // Fallback to setTimeout
    setTimeout(fn, 1);
  }
}

/**
 * Detect connection quality
 * @returns Connection quality information
 */
export function getConnectionQuality(): {
  speed: 'slow' | 'medium' | 'fast';
  type?: string;
  effectiveType?: string;
} {
  if (!isBrowser) {
    return { speed: 'medium' };
  }
  
  // Get connection info if available
  const connection: any = (navigator as any).connection || 
                          (navigator as any).mozConnection || 
                          (navigator as any).webkitConnection;
  
  if (!connection) {
    return { speed: 'medium' };
  }
  
  // Determine speed based on effectiveType
  let speed: 'slow' | 'medium' | 'fast' = 'medium';
  
  if (connection.effectiveType) {
    if (connection.effectiveType === '4g') {
      speed = 'fast';
    } else if (connection.effectiveType === '3g') {
      speed = 'medium';
    } else {
      speed = 'slow';
    }
  } else if (connection.downlink) {
    // Estimate based on downlink speed (Mbps)
    if (connection.downlink > 5) {
      speed = 'fast';
    } else if (connection.downlink > 1) {
      speed = 'medium';
    } else {
      speed = 'slow';
    }
  }
  
  return {
    speed,
    type: connection.type,
    effectiveType: connection.effectiveType,
  };
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (!isBrowser) return;
  
  // Track web vitals
  trackWebVitals();
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          // Log long tasks (> 50ms) which can cause jank
          if (entry.duration > 50) {
            console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Error monitoring long tasks:', e);
    }
  }
  
  // Add visibility change listener to track user presence
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // User left the page, good time to clean up resources
      // For example, pause blockchain polling
    } else {
      // User returned to the page
      // For example, resume blockchain polling
    }
  });
}

// Auto-initialize in client environment
if (isBrowser) {
  defer(() => {
    initPerformanceMonitoring();
  }, 3000); // Wait 3 seconds after page load
} 