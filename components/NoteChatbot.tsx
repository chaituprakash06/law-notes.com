// /components/NoteChatbot.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface NoteChatbotProps {
  noteId: string;
  noteType: 'tax' | 'jurisprudence' | 'company';
  noteTitle: string;
}

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

const NoteChatbot: React.FC<NoteChatbotProps> = ({ noteId, noteType, noteTitle }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history and thread ID from localStorage
  useEffect(() => {
    try {
      // Try to load from localStorage
      const savedMessages = localStorage.getItem(`chat_history_${noteId}`);
      const savedThreadId = localStorage.getItem(`thread_id_${noteId}_${noteType}`);
      
      if (savedThreadId) {
        setThreadId(savedThreadId);
      }
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string dates back to Date objects
        const formattedMessages = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(formattedMessages);
      } else {
        // Add welcome message if no history
        addWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      addWelcomeMessage();
    }
  }, [noteId, noteType, noteTitle]);

  // Save chat history and thread ID to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${noteId}`, JSON.stringify(messages));
    }
    
    if (threadId) {
      localStorage.setItem(`thread_id_${noteId}_${noteType}`, threadId);
    }
  }, [messages, threadId, noteId, noteType]);

  // Add welcome message based on note type
  const addWelcomeMessage = () => {
    let welcomeMessage = '';
    switch (noteType) {
      case 'tax':
        welcomeMessage = `Welcome to your Tax Law Assistant. I'm here to help with your questions about ${noteTitle}. I can assist with tax principles, cases, or statutory provisions covered in these notes.`;
        break;
      case 'jurisprudence':
        welcomeMessage = `Welcome to your Jurisprudence Assistant. I can help you understand concepts in ${noteTitle}, including legal theory, philosophical foundations, and key jurisprudential concepts.`;
        break;
      case 'company':
        welcomeMessage = `Welcome to your Company Law Assistant. Ask me about ${noteTitle}, including corporate structures, director duties, shareholder rights, or any company law topic covered in these notes.`;
        break;
      default:
        welcomeMessage = `Welcome to your Law Notes Assistant. How can I help you with questions about ${noteTitle}?`;
    }
    
    setMessages([
      {
        id: 'welcome',
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date()
      }
    ]);
  };

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Call API to get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          noteId,
          noteType,
          threadId
        }),
        credentials: 'include', // Include cookies for auth
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      // Store the thread ID for conversation continuity
      if (data.threadId) {
        setThreadId(data.threadId);
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Add error message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const clearHistory = () => {
    localStorage.removeItem(`chat_history_${noteId}`);
    localStorage.removeItem(`thread_id_${noteId}_${noteType}`);
    setThreadId(null);
    addWelcomeMessage();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 flex flex-col" style={{ height: '500px' }}>
      <div className="bg-indigo-50 p-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-md font-medium text-indigo-900">
          {noteType.charAt(0).toUpperCase() + noteType.slice(1)} Law Assistant
        </h3>
        <button 
          onClick={clearHistory}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear History
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id}
            message={message.content}
            isUser={message.role === 'user'}
            timestamp={message.timestamp}
          />
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <div className="text-sm text-gray-500">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-3">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default NoteChatbot;