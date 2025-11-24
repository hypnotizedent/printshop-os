import { useEffect, useRef } from 'react';

export interface UseInactivityOptions {
  timeout: number; // milliseconds
  onInactive: () => void;
  events?: string[];
}

export const useInactivity = ({
  timeout,
  onInactive,
  events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']
}: UseInactivityOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      onInactive();
    }, timeout);
  };

  useEffect(() => {
    // Set up event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    // Start timer
    resetTimer();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeout, onInactive]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    resetTimer
  };
};
