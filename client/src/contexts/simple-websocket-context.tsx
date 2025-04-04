import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useSimpleWebSocket, WebSocketData } from '@/hooks/use-simple-websocket';

// Context type definition
interface WebSocketContextType {
  status: 'connecting' | 'open' | 'closing' | 'closed' | 'error' | 'message';
  messages: WebSocketData[];
  sendMessage: (data: WebSocketData) => void;
  sendPing: () => void;
  clearMessages: () => void;
  isConnected: boolean;
  connectionError: Error | null;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  status: 'closed',
  messages: [],
  sendMessage: () => console.warn('WebSocket context not initialized'),
  sendPing: () => console.warn('WebSocket context not initialized'),
  clearMessages: () => {},
  isConnected: false,
  connectionError: null
});

// Provider props
interface SimpleWebSocketProviderProps {
  children: ReactNode;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Simple WebSocket Provider without complex singleton management
 */
export function SimpleWebSocketProvider({
  children,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10
}: SimpleWebSocketProviderProps) {
  // Message history
  const [messages, setMessages] = useState<WebSocketData[]>([]);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  // Handle incoming messages
  const handleMessage = useCallback((data: WebSocketData) => {
    console.log('WebSocket message received:', data);
    
    try {
      // Add to message history
      setMessages(prev => [...prev, data]);
      
      // Clear connection error if we're getting messages
      if (connectionError) {
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [connectionError]);
  
  // Use our simpler WebSocket hook
  const { 
    status, 
    sendJsonMessage, 
    isConnected 
  } = useSimpleWebSocket({
    onMessage: handleMessage,
    autoReconnect: autoReconnect,
    reconnectInterval: reconnectInterval,
    maxReconnectAttempts: maxReconnectAttempts
  });
  
  // Update error state based on connection status
  React.useEffect(() => {
    if (status === 'error') {
      setConnectionError(new Error('WebSocket connection error occurred'));
    } else if (status === 'open') {
      setConnectionError(null);
    }
  }, [status]);
  
  // Send ping message
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
  
  // Clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Create context value
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

// Hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);