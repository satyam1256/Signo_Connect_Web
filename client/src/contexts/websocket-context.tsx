import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket, WebSocketData, MessageHandler } from '@/hooks/use-websocket';

// Use the WebSocketData type from the hook to ensure compatibility
type WebSocketMessage = WebSocketData;

interface WebSocketContextType {
  status: 'connecting' | 'open' | 'closing' | 'closed' | 'error' | 'message';
  messages: WebSocketMessage[];
  sendMessage: (data: WebSocketMessage) => void;
  sendPing: () => void;
  clearMessages: () => void;
  isConnected: boolean;
  connectionError: Error | null;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  status: 'closed',
  messages: [],
  sendMessage: () => {},
  sendPing: () => {},
  clearMessages: () => {},
  isConnected: false,
  connectionError: null
});

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
  // Optional props for testing or configuration
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket Provider with improved error handling and reconnection logic
 * Provides WebSocket functionality to the entire application
 */
export function WebSocketProvider({ 
  children, 
  autoConnect = true,
  reconnectInterval = 5000, // 5 seconds as requested
  maxReconnectAttempts = 10
}: WebSocketProviderProps) {
  // Store messages in state
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  // Track any connection errors
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  // Track if the component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  
  // Handle incoming messages in a safe way
  const handleMessage = useCallback((data: WebSocketMessage) => {
    // Safety check for mounted state
    if (!isMountedRef.current) return;
    
    // Log the message for debugging
    console.log('WebSocket message received:', data);
    
    try {
      // Add to message history
      setMessages(prev => [...prev, data]);
      
      // Clear any previous connection errors since we're receiving messages
      if (connectionError) {
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [connectionError]);

  // Use our enhanced WebSocket hook with proper error handling
  const { 
    status, 
    sendJsonMessage, 
    lastMessage,
    isConnected 
  } = useWebSocket({
    onMessage: handleMessage,
    autoReconnect: autoConnect,
    reconnectInterval: reconnectInterval,
    maxReconnectAttempts: maxReconnectAttempts,
    initialConnectionDelay: 2000 // Delay initial connection to allow UI to stabilize
  });

  // Handle status changes for error reporting
  useEffect(() => {
    if (status === 'error') {
      // Create a standardized error object
      setConnectionError(new Error('WebSocket connection error occurred'));
    } else if (status === 'open') {
      // Clear errors when connected
      setConnectionError(null);
    }
  }, [status]);

  // Function to send a ping message
  const sendPing = useCallback(() => {
    try {
      sendJsonMessage({ 
        type: 'ping', 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Error sending ping:', error);
    }
  }, [sendJsonMessage]);

  // Function to clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create the context value
  const contextValue: WebSocketContextType = {
    status,
    messages,
    sendMessage: sendJsonMessage,
    sendPing,
    clearMessages,
    isConnected,
    connectionError
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}