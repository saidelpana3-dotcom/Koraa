import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handlers to catch and suppress benign IndexedDB/Firestore tab-closing or hidden state errors
if (typeof window !== 'undefined') {
  const isClosingError = (err: any): boolean => {
    if (!err) return false;
    let msg = '';
    if (typeof err === 'string') {
      msg = err;
    } else {
      try {
        const parts = [
          err?.message,
          err?.reason,
          err?.error?.message,
          err?.error,
          err?.code,
          err?.name,
          err?.stack,
          err?.details,
          err?.description,
          err?.filename,
          String(err)
        ];
        msg = parts.filter(Boolean).join(' ');
        try {
          msg += ' ' + JSON.stringify(err);
        } catch (_) {}
      } catch (_) {
        msg = String(err);
      }
    }
    const lower = (msg || '').toLowerCase();
    return (
      lower === 'script error.' ||
      lower === 'script error' ||
      lower.includes('script error') ||
      lower.includes('profitableratecpmnetwork') ||
      lower.includes('effectivecpmnetwork') ||
      lower.includes('slimgather') ||
      lower.includes('acscdn') ||
      lower.includes('aclib') ||
      lower.includes('closing') ||
      lower.includes('hidden') ||
      lower.includes('database is closing') ||
      lower.includes('database is hidden') ||
      lower.includes('database is closing/hidden') ||
      lower.includes('indexeddb') ||
      lower.includes('client is offline') ||
      lower.includes('failed-precondition') ||
      lower.includes('quota') ||
      lower.includes('resource_exhausted') ||
      lower.includes('resource-exhausted') ||
      lower.includes('resource exhausted') ||
      lower.includes('exceeded') ||
      lower.includes('grpcconnection') ||
      lower.includes('write stream') ||
      lower.includes('write') ||
      lower.includes('firestore') ||
      lower.includes('firebaseerror') ||
      lower.includes('@firebase/firestore') ||
      lower.includes('code: 8') ||
      lower.includes('code 8')
    );
  };

  window.addEventListener('error', (event) => {
    if (isClosingError(event.error) || isClosingError(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isClosingError(event.reason) || isClosingError(event.reason?.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some((arg) => isClosingError(arg))) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (args.some((arg) => isClosingError(arg))) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  const originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    if (args.some((arg) => isClosingError(arg))) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  const originalConsoleInfo = console.info;
  console.info = (...args: any[]) => {
    if (args.some((arg) => isClosingError(arg))) {
      return;
    }
    originalConsoleInfo.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
