// /components/ChatMessage.tsx
import React from 'react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  // Function to format message by highlighting citations
  const formatMessage = (text: string) => {
    // Regular expression to match [Section: X] or [Page: Y] patterns
    const citationRegex = /\[(Section|Page):\s*([^\]]+)\]/g;
    
    // Split the text at citation points and reassemble with highlighting
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add the citation with highlighting
      parts.push({
        type: 'citation',
        content: match[0],
        citationType: match[1],
        citation: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text after the last citation
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // If no citations were found, return the original text
    if (parts.length === 0) {
      return <p>{text}</p>;
    }
    
    // Render the parts with appropriate styling
    return (
      <div>
        {parts.map((part, index) => {
          if (part.type === 'citation') {
            return (
              <span 
                key={index} 
                className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded text-xs font-medium"
                title={`${part.citationType}: ${part.citation}`}
              >
                {part.content}
              </span>
            );
          } else {
            return <span key={index}>{part.content}</span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`rounded-lg px-4 py-2 max-w-[80%] ${
          isUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <div className="text-sm">{formatMessage(message)}</div>
        {timestamp && (
          <div className={`text-xs mt-1 text-right ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;