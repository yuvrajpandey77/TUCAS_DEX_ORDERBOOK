import { useState, useCallback } from 'react';

interface CircuitBreakerState {
  isCircuitBreakerActive: boolean;
  retryCount: number;
  lastError: string | null;
}

export const useCircuitBreaker = () => {
  const [state, setState] = useState<CircuitBreakerState>({
    isCircuitBreakerActive: false,
    retryCount: 0,
    lastError: null,
  });

  const detectCircuitBreakerError = useCallback((error: Error): boolean => {
    const errorMessage = error.message.toLowerCase();
    const isCircuitBreakerError = errorMessage.includes('circuit breaker') || 
                                 errorMessage.includes('execution prevented');
    
    if (isCircuitBreakerError) {
      setState(prev => ({
        ...prev,
        isCircuitBreakerActive: true,
        lastError: error.message,
      }));
    }
    
    return isCircuitBreakerError;
  }, []);

  const resetCircuitBreakerState = useCallback(() => {
    setState({
      isCircuitBreakerActive: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  const incrementRetryCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));
  }, []);

  const getCircuitBreakerGuidance = useCallback(() => {
    if (!state.isCircuitBreakerActive) return null;

    const suggestions = [
      "Wait 30-60 seconds before trying again",
      "Refresh the page to reset MetaMask state",
      "Check your internet connection",
      "Try switching networks in MetaMask",
      "Close and reopen MetaMask if the issue persists",
    ];

    return {
      title: "MetaMask Circuit Breaker Detected",
      description: "This is a MetaMask protection mechanism that prevents excessive RPC calls.",
      suggestions,
      retryCount: state.retryCount,
    };
  }, [state.isCircuitBreakerActive, state.retryCount]);

  return {
    ...state,
    detectCircuitBreakerError,
    resetCircuitBreakerState,
    incrementRetryCount,
    getCircuitBreakerGuidance,
  };
}; 