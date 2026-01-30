import { useState, useEffect, useCallback, useRef } from 'react';
import { getLeaderboardStreamUrl } from '../services/api';

export function useSSE(onLeaderboardUpdate) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = getLeaderboardStreamUrl();
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      console.log('SSE connected');
    });

    eventSource.addEventListener('leaderboard-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastUpdate(Date.now());
        if (onLeaderboardUpdate) {
          onLeaderboardUpdate(data);
        }
      } catch (error) {
        console.error('Error parsing leaderboard update:', error);
      }
    });

    eventSource.addEventListener('settings-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastUpdate(Date.now());
        if (onLeaderboardUpdate) {
          onLeaderboardUpdate({ settingsUpdate: data });
        }
      } catch (error) {
        console.error('Error parsing settings update:', error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive, no action needed
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      console.log(`SSE disconnected, reconnecting in ${delay}ms...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [onLeaderboardUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastUpdate,
    reconnect: connect,
    disconnect
  };
}
