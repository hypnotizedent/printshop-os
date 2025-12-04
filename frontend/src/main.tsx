import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Re-enable transitions after styles are loaded
window.addEventListener('load', () => {
  // Remove the transition prevention from critical CSS
  const style = document.createElement('style');
  style.textContent = '* { transition: inherit !important; }';
  document.head.appendChild(style);
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('Service Worker registered:', registration);
      },
      (error) => {
        console.error('Service Worker registration failed:', error);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
    </AuthProvider>
  </ThemeProvider>
)
