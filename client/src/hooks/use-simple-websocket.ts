import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket connection states
type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error' | 'message';

// Standard message type
export type WebSocketData = {
  type: string;
  message?: string;
  [key: string]: any;
};

export type MessageHandler = (data: WebSocketData) => void;

interface UseWebSocketProps {
  onMessage?: MessageHandler;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  sendMessage: (data: string) => void;
  sendJsonMessage: (data: WebSocketData) => void;
  lastMessage: WebSocketData | null;
  closeConnection: () => void;
  isConnected: boolean;
}

/**
 * Very simple WebSocket hook without any complex singleton patterns
 * Each component using this hook gets its own independent WebSocket connection
 */
export function useSimpleWebSocket({
  onMessage,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseWebSocketProps = {}): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [lastMessage, setLastMessage] = useState<WebSocketData | null>(null);
  
  // WebSocket instance reference
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  
  // Computed state
  const isConnected = status === 'open';
  
  // Function to establish connection
  const connect = useCallback(() => {
    // Don't connect if already connecting or connected
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Clean up any existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.warn("Error closing previous connection", e);
      }
      wsRef.current = null;
    }
    
    try {
      // Update status
      setStatus('connecting');
      
      // Create WebSocket URL from current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      // Create new WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Connection opened
      ws.onopen = () => {
        if (!mounted.current) return;
        
        console.log('WebSocket connection established');
        setStatus('open');
        reconnectAttemptsRef.current = 0;
      };
      
      // Connection error
      ws.onerror = (event) => {
        if (!mounted.current) return;
        
        console.error('WebSocket error:', event);
        setStatus('error');
      };
      
      // Connection closed
      ws.onclose = (event) => {
        if (!mounted.current) return;
        
        console.log(`WebSocket closed with code ${event.code}`);
        wsRef.current = null;
        setStatus('closed');
        
        // Attempt reconnection if enabled and not exceeding max attempts
        if (autoReconnect && 
            mounted.current && 
            reconnectAttemptsRef.current < maxReconnectAttempts &&
            !(event.wasClean && event.code === 1000)) {
          
          // Clear any existing timer
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          
          // Schedule reconnection
          reconnectTimerRef.current = setTimeout(() => {
            if (mounted.current) {
              reconnectAttemptsRef.current++;
              console.log(`WebSocket reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
              connect();
            }
          }, reconnectInterval);
        }
      };
      
      // Message received
      ws.onmessage = (event) => {
        if (!mounted.current) return;
        
        try {
          // Parse message data
          const parsedData = typeof event.data === 'string' 
            ? JSON.parse(event.data) as WebSocketData 
            : { type: 'binary', data: event.data };
          
          // Update last message
          setLastMessage(parsedData);
          
          // Call message handler
          if (onMessage) {
            onMessage(parsedData);
          }
        } catch (error) {
          console.warn('Error processing WebSocket message:', error);
          
          // Handle unparseable message
          const fallbackData = { 
            type: 'error', 
            message: typeof event.data === 'string' ? event.data : 'Unparseable binary data',
            parseError: true 
          };
          
          setLastMessage(fallbackData);
          
          if (onMessage) {
            onMessage(fallbackData);
          }
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setStatus('error');
      
      // Attempt reconnection if enabled
      if (autoReconnect && 
          mounted.current && 
          reconnectAttemptsRef.current < maxReconnectAttempts) {
        
        // Clear any existing timer
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        
        // Schedule reconnection
        reconnectTimerRef.current = setTimeout(() => {
          if (mounted.current) {
            reconnectAttemptsRef.current++;
            console.log(`WebSocket reconnecting after error (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connect();
          }
        }, reconnectInterval);
      }
    }
  }, [autoReconnect, maxReconnectAttempts, onMessage, reconnectInterval]);
  
  // Send text message
  const sendMessage = useCallback((message: string): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  }, []);
  
  // Send JSON message
  const sendJsonMessage = useCallback((data: WebSocketData): void => {
    try {
      const jsonString = JSON.stringify(data);
      sendMessage(jsonString);
    } catch (error) {
      console.error('Error stringifying message for WebSocket:', error);
    }
  }, [sendMessage]);
  
  // Close connection
  const closeConnection = useCallback((): void => {
    if (wsRef.current) {
      try {
        setStatus('closing');
        wsRef.current.close(1000, 'User initiated closure');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    }
  }, []);
  
  // Connect on mount
  useEffect(() => {
    // Wait 5 seconds before connecting to ensure app is fully mounted
    const timer = setTimeout(() => {
      if (mounted.current) {
        console.log('Creating WebSocket connection after initial delay');
        connect();
      }
    }, 5000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [connect]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (error) {
          console.warn('Error closing WebSocket on unmount:', error);
        }
      }
    };
  }, []);
  
  return {
    status,
    sendMessage,
    sendJsonMessage,
    lastMessage,
    closeConnection,
    isConnected
  };
}