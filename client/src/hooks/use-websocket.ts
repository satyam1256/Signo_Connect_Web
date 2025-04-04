import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';
type MessageHandler = (data: any) => void;

interface UseWebSocketProps {
  onMessage?: MessageHandler;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  sendMessage: (data: any) => void;
  sendJsonMessage: (data: any) => void;
  lastMessage: any;
  closeConnection: () => void;
}

// Global state to prevent multiple simultaneous connections
const globalConnections = {
  connectionCount: 0,
  isInitializing: false
};

/**
 * Custom hook for managing WebSocket connections with improved stability
 */
export function useWebSocket({
  onMessage,
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketProps = {}): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Create WebSocket connection with debouncing to prevent connection storms
  const connect = useCallback(() => {
    // If we already have a socket and it's in a working state, don't reconnect
    if (
      socketRef.current && 
      (socketRef.current.readyState === WebSocket.OPEN || 
       socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      console.log('WebSocket already connected or connecting, skipping reconnection');
      return;
    }
    
    // Prevent multiple connections during initialization
    if (globalConnections.isInitializing) {
      console.log('WebSocket global connection in progress, deferring');
      
      // Try again later if another connection is already being established
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 500);
      
      return;
    }
    
    globalConnections.isInitializing = true;
    
    // Clean up any existing connection
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {
        console.log('Error closing existing socket:', e);
      }
    }

    try {
      setStatus('connecting');
      
      // Detect if we're using HTTPS and use the appropriate WebSocket protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      globalConnections.connectionCount++;
      
      // Connection opened
      socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        setStatus('open');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        globalConnections.isInitializing = false;
        hasInitializedRef.current = true;
      });

      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          // Still set the raw message
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      });

      // Connection closed
      socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setStatus('closed');
        globalConnections.isInitializing = false;
        globalConnections.connectionCount--;
        
        // Don't try to reconnect if the application is being unloaded
        const isPageUnloading = document.visibilityState === 'hidden' || 
                               (event.wasClean && event.code === 1000);
        
        // Attempt to reconnect if enabled and not unloading
        if (autoReconnect && 
            !isPageUnloading && 
            reconnectAttemptsRef.current < maxReconnectAttempts) {
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Exponential backoff for reconnection attempts
          const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        }
      });

      // Connection error
      socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
        setStatus('error');
        globalConnections.isInitializing = false;
        // We don't do anything here as the close handler will handle reconnection
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setStatus('error');
      globalConnections.isInitializing = false;
      
      // If we can't even create the connection, retry after a delay
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect after initial error (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          connect();
        }, reconnectInterval);
      }
    }
  }, [autoReconnect, maxReconnectAttempts, onMessage, reconnectInterval]);

  // Initialize WebSocket connection only once
  useEffect(() => {
    // Only connect if we haven't already connected
    if (!hasInitializedRef.current) {
      // Delay initial connection to allow page to stabilize
      const timer = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // No cleanup needed if we're not connecting
    return undefined;
  }, [connect]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'Component unmounting');
        } catch (e) {
          console.log('Error during WebSocket cleanup:', e);
        }
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.warn('Cannot send message, WebSocket is not connected.');
    }
  }, []);

  // Send a JSON message through the WebSocket
  const sendJsonMessage = useCallback((data: any) => {
    try {
      const message = JSON.stringify(data);
      sendMessage(message);
    } catch (error) {
      console.error('Error stringifying message:', error);
    }
  }, [sendMessage]);

  // Close the WebSocket connection
  const closeConnection = useCallback(() => {
    if (socketRef.current) {
      setStatus('closing');
      socketRef.current.close();
    }
  }, []);

  return {
    status,
    sendMessage,
    sendJsonMessage,
    lastMessage,
    closeConnection
  };
}