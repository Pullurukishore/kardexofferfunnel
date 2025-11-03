/**
 * Utility functions for safely accessing browser APIs
 */

export const isBrowser = typeof window !== 'undefined';

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return isBrowser ? window.localStorage.getItem(key) : null;
    } catch (e) {
      console.error('localStorage access error:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (isBrowser) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('localStorage setItem error:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (isBrowser) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('localStorage removeItem error:', e);
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return isBrowser ? window.sessionStorage.getItem(key) : null;
    } catch (e) {
      console.error('sessionStorage access error:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (isBrowser) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('sessionStorage setItem error:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (isBrowser) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.error('sessionStorage removeItem error:', e);
    }
  },
};

export const safeMatchMedia = (query: string): MediaQueryList | null => {
  try {
    return isBrowser ? window.matchMedia(query) : null;
  } catch (e) {
    console.error('matchMedia error:', e);
    return null;
  }
};

export const executeClientSide = <T>(callback: () => T): T | undefined => {
  if (isBrowser) {
    try {
      return callback();
    } catch (e) {
      console.error('Client-side execution error:', e);
      return undefined;
    }
  }
  return undefined;
};

// Helper to safely add event listeners
export const safeAddEventListener = (
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): (() => void) => {
  if (isBrowser) {
    try {
      target.addEventListener(type, listener, options);
      return () => {
        target.removeEventListener(type, listener, options);
      };
    } catch (e) {
      console.error('Error adding event listener:', e);
      return () => {};
    }
  }
  return () => {};
};

// Helper to preload routes for faster navigation
export const preloadRoute = (href: string): void => {
  if (!isBrowser) return;
  
  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  } catch (e) {
    console.error('Error preloading route:', e);
  }
};

// Helper to detect if we're in a hydration phase
export const isHydrating = (): boolean => {
  if (!isBrowser) return false;
  
  try {
    return document.readyState === 'loading' || 
           !document.querySelector('[data-reactroot]') ||
           window.location.pathname !== window.history.state?.url;
  } catch (e) {
    return false;
  }
};
