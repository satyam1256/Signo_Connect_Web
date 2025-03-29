import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/lib/i18n";

interface Message {
  id: string;
  content: string;
  fromUser: boolean;
  timestamp: Date;
}

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguageStore();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat is opened for the first time
      setMessages([
        {
          id: "welcome",
          content: t("how_can_i_help"),
          fromUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, t]);

  useEffect(() => {
    // Scroll to bottom whenever messages change or chat is opened
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const sendMessage = () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      fromUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simple automated response logic (in a real app, this would be an API call)
    setTimeout(() => {
      let responseContent = "";
      
      if (inputValue.toLowerCase().includes("license") || inputValue.toLowerCase().includes("document")) {
        responseContent = "To upload your documents, go to your Profile section, select Documents, and click on 'Upload License' or 'Upload ID Proof'. You can take a photo or upload an existing image.";
      } else if (inputValue.toLowerCase().includes("job") || inputValue.toLowerCase().includes("work")) {
        responseContent = "You can find available jobs in the Jobs section. Just tap on the Jobs icon in the bottom navigation. You can filter jobs by location or type.";
      } else if (inputValue.toLowerCase().includes("payment") || inputValue.toLowerCase().includes("salary")) {
        responseContent = "Payment terms are set by the fleet owners when they post jobs. You can see the salary details in each job listing before you apply.";
      } else {
        responseContent = "I'm here to help! You can ask me about registration, document upload, finding jobs, or other SIGNO Connect features.";
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        content: responseContent,
        fromUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-16 md:bottom-6 right-6 z-10">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{t("support_chat")}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:text-white hover:bg-primary-dark"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="h-64 p-4 overflow-y-auto bg-neutral-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex mb-4",
                  message.fromUser && "justify-end"
                )}
              >
                {!message.fromUser && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "p-3 rounded-lg shadow-sm max-w-xs",
                    message.fromUser
                      ? "bg-primary text-white"
                      : "bg-white"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-3 border-t border-neutral-200">
            <div className="flex">
              <Input
                type="text"
                placeholder={t("type_message")}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 border-r-0 rounded-r-none"
              />
              <Button
                onClick={sendMessage}
                className="rounded-l-none"
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
};
