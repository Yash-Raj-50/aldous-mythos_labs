/**
 * Global error handler to suppress known development warnings and errors
 * This should only be used in development to reduce console noise
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Patterns to suppress
const SUPPRESS_PATTERNS = [
  /punycode/i,
  /The requested resource isn't a valid image/i,
  /Failed to load resource.*dummy_agent_logo\.png/i,
  /404.*dummy_agent_logo\.png/i,
  /404.*assets/i,
  /net::ERR_NAME_NOT_RESOLVED.*s3\./i,
  /aldous-dummy-uploads\.s3\./i,
  /Critical dependency.*punycode/i,
  /Module not found.*punycode/i,
];

function shouldSuppressMessage(message: string): boolean {
  return SUPPRESS_PATTERNS.some(pattern => pattern.test(message));
}

// Override console.error only in development
if (process.env.NODE_ENV === 'development') {
  console.error = (...args: unknown[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleError.apply(console, args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };
}

// Suppress unhandled promise rejections for known issues
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason.message === 'string') {
      if (shouldSuppressMessage(event.reason.message)) {
        event.preventDefault();
      }
    }
  });

  // Suppress resource loading errors
  window.addEventListener('error', (event) => {
    if (event.message && shouldSuppressMessage(event.message)) {
      event.preventDefault();
    }
    // Also handle image loading errors
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      const imgSrc = (event.target as HTMLImageElement).src;
      if (imgSrc.includes('s3.') || imgSrc.includes('dummy_agent_logo.png')) {
        event.preventDefault();
      }
    }
  }, true);
}

export {}
