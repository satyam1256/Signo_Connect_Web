import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error' | 'message';

// Type for message data - exported for use in other files
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
  initialConnectionDelay?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  sendMessage: (data: string) => void;
  sendJsonMessage: (data: WebSocketData) => void;
  lastMessage: WebSocketData | null;
  closeConnection: () => void;
  isConnected: boolean;
}

// Use a singleton pattern to track WebSocket connections across the app
// This prevents multiple connections being created and avoids race conditions
const WebSocketSingleton = {
  instance: null as WebSocket | null,
  isConnecting: false,
  connectionCount: 0,
  listeners: new Set<(status: WebSocketStatus, data?: any) => void>(),
  
  // Register a status change listener
  addListener(callback: (status: WebSocketStatus, data?: any) => void): void {
    this.listeners.add(callback);
  },
  
  // Remove a status change listener
  removeListener(callback: (status: WebSocketStatus, data?: any) => void): void {
    this.listeners.delete(callback);
  },
  
  // Notify all listeners of a status change
  notifyListeners(status: WebSocketStatus, data?: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(status, data);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }
};

/**
 * Enhanced WebSocket hook with improved stability, error handling, and reconnection logic
 */
export function useWebSocket({
  onMessage,
  autoReconnect = true,
  reconnectInterval = 5000, // 5 seconds delay as requested
  maxReconnectAttempts = 5,
  initialConnectionDelay = 2000
}: UseWebSocketProps = {}): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [lastMessage, setLastMessage] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Use refs to maintain state across renders without triggering re-renders
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const isUnmountingRef = useRef<boolean>(false);
  
  // Status change handler
  const handleStatusChange = useCallback((newStatus: WebSocketStatus, data?: any) => {
    // Skip updates if component is unmounting
    if (isUnmountingRef.current) return;
    
    setStatus(newStatus);
    
    if (newStatus === 'open') {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    } else if (newStatus === 'closed' || newStatus === 'error') {
      setIsConnected(false);
    }
    
    if (data && newStatus === 'message') {
      setLastMessage(data);
      onMessage?.(data);
    }
  }, [onMessage]);
  
  // Register status change listener
  useEffect(() => {
    WebSocketSingleton.addListener(handleStatusChange);
    
    return () => {
      WebSocketSingleton.removeListener(handleStatusChange);
    };
  }, [handleStatusChange]);
  
  // Create or get WebSocket connection
  const connect = useCallback(() => {
    // Skip if unmounting
    if (isUnmountingRef.current) return;
    
    // If already connecting, wait
    if (WebSocketSingleton.isConnecting) {
      console.log('WebSocket connection already in progress, waiting...');
      return;
    }
    
    // If we already have a working connection, use it
    if (
      WebSocketSingleton.instance && 
      (WebSocketSingleton.instance.readyState === WebSocket.OPEN || 
       WebSocketSingleton.instance.readyState === WebSocket.CONNECTING)
    ) {
      console.log('Using existing WebSocket connection');
      
      // If open, immediately update state
      if (WebSocketSingleton.instance.readyState === WebSocket.OPEN) {
        handleStatusChange('open');
      }
      
      return;
    }
    
    // Mark as connecting to prevent multiple connection attempts
    WebSocketSingleton.isConnecting = true;
    handleStatusChange('connecting');
    
    // Clean up any existing dead connection
    if (WebSocketSingleton.instance) {
      try {
        WebSocketSingleton.instance.close();
        WebSocketSingleton.instance = null;
      } catch (error) {
        console.warn('Error closing previous WebSocket connection:', error);
      }
    }
    
    try {
      // Determine the WebSocket URL based on the current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      WebSocketSingleton.instance = socket;
      WebSocketSingleton.connectionCount++;
      
      // Connection opened
      socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        WebSocketSingleton.isConnecting = false;
        WebSocketSingleton.notifyListeners('open');
        hasInitializedRef.current = true;
      });
      
      // Listen for messages
      socket.addEventListener('message', (event) => {
        let parsedData: WebSocketData;
        
        try {
          parsedData = JSON.parse(event.data) as WebSocketData;
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error);
          // Create a fallback object if parsing fails
          parsedData = {
            type: 'unknown',
            rawMessage: event.data,
            parseError: true
          };
        }
        
        WebSocketSingleton.notifyListeners('message', parsedData);
      });
      
      // Connection closed
      socket.addEventListener('close', (event) => {
        console.log(`WebSocket closed with code ${event.code}${event.reason ? ': ' + event.reason : ''}`);
        WebSocketSingleton.isConnecting = false;
        WebSocketSingleton.notifyListeners('closed');
        WebSocketSingleton.instance = null;
        
        // Don't attempt to reconnect if:
        // 1. Auto-reconnect is disabled
        // 2. Component is unmounting
        // 3. Page is unloading (visibility state is hidden)
        // 4. We've exceeded max reconnection attempts
        // 5. This was a clean closure with code 1000 (normal closure)
        const shouldSkipReconnect = 
          !autoReconnect ||
          isUnmountingRef.current ||
          document.visibilityState === 'hidden' ||
          reconnectAttemptsRef.current >= maxReconnectAttempts ||
          (event.wasClean && event.code === 1000);
        
        if (shouldSkipReconnect) {
          console.log('Skipping WebSocket reconnection');
          return;
        }
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Set reconnection timeout with the fixed 5-second delay
        reconnectTimeoutRef.current = setTimeout(() => {
          // Final check to avoid reconnection after unmount
          if (!isUnmountingRef.current) {
            reconnectAttemptsRef.current++;
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }
        }, reconnectInterval);
      });
      
      // Connection error
      socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
        WebSocketSingleton.isConnecting = false;
        WebSocketSingleton.notifyListeners('error');
        // No need to do anything else here, the close handler will be called next
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      WebSocketSingleton.isConnecting = false;
      WebSocketSingleton.notifyListeners('error');
      
      // Try to reconnect after a delay if conditions allow
      if (autoReconnect && 
          !isUnmountingRef.current && 
          reconnectAttemptsRef.current < maxReconnectAttempts) {
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountingRef.current) {
            reconnectAttemptsRef.current++;
            console.log(`Attempting to reconnect after error (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }
        }, reconnectInterval);
      }
    }
  }, [autoReconnect, handleStatusChange, maxReconnectAttempts, reconnectInterval]);
  
  // Initialize connection with a delay to prevent issues during app startup
  useEffect(() => {
    // Only connect once
    if (hasInitializedRef.current) {
      return;
    }
    
    const timer = setTimeout(() => {
      if (!isUnmountingRef.current && !hasInitializedRef.current) {
        connect();
      }
    }, initialConnectionDelay);
    
    return () => clearTimeout(timer);
  }, [connect, initialConnectionDelay]);
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      // Mark as unmounting to prevent further state updates
      isUnmountingRef.current = true;
      
      // Clean up any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // If this is the last component using the WebSocket, close it
      WebSocketSingleton.connectionCount--;
      
      if (WebSocketSingleton.connectionCount <= 0) {
        if (WebSocketSingleton.instance) {
          try {
            WebSocketSingleton.instance.close(1000, 'Application unmounting');
          } catch (error) {
            console.warn('Error during WebSocket cleanup:', error);
          }
        }
      }
    };
  }, []);
  
  // Send a text message through the WebSocket
  const sendMessage = useCallback((message: string): void => {
    if (WebSocketSingleton.instance?.readyState === WebSocket.OPEN) {
      try {
        WebSocketSingleton.instance.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  }, []);
  
  // Send a structured message as JSON
  const sendJsonMessage = useCallback((data: WebSocketData): void => {
    try {
      const jsonString = JSON.stringify(data);
      sendMessage(jsonString);
    } catch (error) {
      console.error('Error stringifying message for WebSocket:', error);
    }
  }, [sendMessage]);
  
  // Close the WebSocket connection
  const closeConnection = useCallback((): void => {
    if (WebSocketSingleton.instance) {
      try {
        handleStatusChange('closing');
        WebSocketSingleton.instance.close(1000, 'User initiated closure');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    }
  }, [handleStatusChange]);
  
  return {
    status,
    sendMessage,
    sendJsonMessage,
    lastMessage,
    closeConnection,
    isConnected
  };
}