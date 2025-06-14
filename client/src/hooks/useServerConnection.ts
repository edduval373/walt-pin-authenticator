import { useState, useEffect } from 'react';

export interface ServerConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastChecked: Date | null;
  retryCount: number;
}

export function useServerConnection(checkInterval: number = 30000) {
  const [state, setState] = useState<ServerConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastChecked: null,
    retryCount: 0
  });

  const checkConnection = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const response = await fetch('https://master.pinauth.com/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          lastChecked: new Date(),
          retryCount: 0
        }));
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
        lastChecked: new Date(),
        retryCount: prev.retryCount + 1
      }));
    }
  };

  const retry = () => {
    checkConnection();
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up interval checking
    const interval = setInterval(checkConnection, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return {
    ...state,
    retry,
    checkConnection
  };
}