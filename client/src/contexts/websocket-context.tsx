import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
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
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  status: 'closed',
  messages: [],
  sendMessage: () => {},
  sendPing: () => {},
  clearMessages: () => {}
});

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  // Handle incoming messages
  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('WebSocket message received:', data);
    setMessages(prev => [...prev, data]);
  }, []);

  // Use our custom WebSocket hook
  const { 
    status, 
    sendJsonMessage, 
    lastMessage 
  } = useWebSocket({
    onMessage: handleMessage,
    autoReconnect: true
  });

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
    clearMessages
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}