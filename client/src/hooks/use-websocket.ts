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

/**
 * Custom hook for managing WebSocket connections
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

  // Create WebSocket connection
  const connect = useCallback(() => {
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      setStatus('connecting');
      
      // Detect if we're using HTTPS and use the appropriate WebSocket protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Connection opened
      socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        setStatus('open');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      });

      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      });

      // Connection closed
      socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setStatus('closed');
        
        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }, reconnectInterval);
        }
      });

      // Connection error
      socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
        setStatus('error');
        
        // We don't want to block the app due to WebSocket errors
        // Just continue in error state and allow reconnection attempts
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setStatus('error');
      
      // If we can't even create the connection, retry after a delay
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect after initial error (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          connect();
        }, reconnectInterval);
      }
    }
  }, [autoReconnect, maxReconnectAttempts, onMessage, reconnectInterval]);

  // Initialize WebSocket connection
  useEffect(() => {
    connect();

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

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