import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';

// Message types for our WebSocket communication
type MessageType = 'welcome' | 'broadcast' | 'ping' | 'pong' | 'error' | 'notification' | 'chat';

interface WebSocketMessage {
  type: MessageType;
  message?: string;
  data?: any;
  timestamp?: string;
}

interface WebSocketContextType {
  status: 'connecting' | 'open' | 'closing' | 'closed' | 'error';
  messages: WebSocketMessage[];
  sendMessage: (data: any) => void;
  sendPing: () => void;
  clearMessages: () => void;
  isConnected: boolean;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  status: 'closed',
  messages: [],
  sendMessage: () => {},
  sendPing: () => {},
  clearMessages: () => {},
  isConnected: false
});

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Handle incoming messages
  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('WebSocket message received:', data);
    setMessages(prev => [...prev, data]);
    
    // If we receive a welcome message, mark as connected
    if (data.type === 'welcome') {
      setIsConnected(true);
    }
  }, []);

  // Use our custom WebSocket hook
  const { 
    status, 
    sendJsonMessage, 
    lastMessage 
  } = useWebSocket({
    onMessage: handleMessage,
    autoReconnect: true,
    reconnectInterval: 2000,
    maxReconnectAttempts: 10
  });

  // Update connection status based on WebSocket status
  useEffect(() => {
    if (status === 'open') {
      setIsConnected(true);
    } else if (status === 'closed' || status === 'error') {
      // Don't immediately set to disconnected to prevent UI flashing
      // Wait a short delay before showing disconnected state
      const timer = setTimeout(() => {
        if (status === 'closed' || status === 'error') {
          setIsConnected(false);
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Function to send a ping message
  const sendPing = useCallback(() => {
    sendJsonMessage({ type: 'ping', timestamp: new Date().toISOString() });
  }, [sendJsonMessage]);

  // Function to clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Context value
  const value = {
    status,
    messages,
    sendMessage: sendJsonMessage,
    sendPing,
    clearMessages,
    isConnected
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}