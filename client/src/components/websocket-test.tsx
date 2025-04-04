import React, { useState } from 'react';
import { useWebSocketContext } from '@/contexts/simple-websocket-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WebSocketTest() {
  const { status, messages, sendMessage, sendPing, clearMessages } = useWebSocketContext();
  const [messageText, setMessageText] = useState('');

  // Status badge color mapping
  const statusColor = {
    connecting: 'bg-yellow-500',
    open: 'bg-green-500',
    closing: 'bg-orange-500',
    closed: 'bg-red-500',
    error: 'bg-red-700'
  };

  // Handle sending a chat message
  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage({
        type: 'chat',
        message: messageText,
        timestamp: new Date().toISOString()
      });
      setMessageText('');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>WebSocket Test</CardTitle>
          <Badge className={statusColor[status]}>
            {status}
          </Badge>
        </div>
        <CardDescription>
          Test the WebSocket connection here
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4 border rounded-md p-2">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center p-4">No messages yet</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-lg ${
                    msg.type === 'welcome' || msg.type === 'pong' 
                      ? 'bg-secondary text-secondary-foreground' 
                      : msg.type === 'error' 
                        ? 'bg-destructive text-destructive-foreground' 
                        : msg.type === 'chat' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{msg.type}</span>
                    <span className="text-xs opacity-70">
                      {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    {msg.message || JSON.stringify(msg.data || {})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex gap-2 w-full">
          <Input
            type="text" 
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
        <div className="flex gap-2 w-full">
          <Button onClick={sendPing} variant="outline" className="flex-1">
            Send Ping
          </Button>
          <Button onClick={clearMessages} variant="outline" className="flex-1">
            Clear Messages
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}