import React from "react";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface ChatHistoryProps {
  data?: Message[];
}

const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return '';
  }
};

const ChatHistory: React.FC<ChatHistoryProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700">No Conversation History</h3>
        <p className="text-gray-500 mt-2">There are no messages in this conversation yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-3xl mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-[#253A5C] border-b pb-2">Conversation History</h3>
      
      <div className="space-y-4">
        {data.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-[#3A5B85] text-white rounded-tr-none' 
                  : message.role === 'assistant'
                    ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                    : 'bg-gray-200 text-gray-700 italic text-sm w-full' // system message
              }`}
            >
              {message.role === 'system' ? (
                <div className="text-xs font-medium text-gray-500 mb-1">SYSTEM</div>
              ) : null}
              
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.timestamp && (
                <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-gray-200' : 'text-gray-500'}`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );  
};

export default ChatHistory;