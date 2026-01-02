import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Plus, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LaunchpadSuggestionBlock } from './LaunchpadSuggestionBlock';
import { useSporkEditorChat, ChatMessage } from '@/hooks/useSporkEditorChat';
import ReactMarkdown from 'react-markdown';

interface LaunchpadChatPanelProps {
  selectedModel: string;
  activeFile: string | null;
  activeFileContent: string;
  onApplyChanges: (filePath: string, content: string) => void;
}

const quickSuggestions = [
  "Fix errors",
  "Add feature",
  "Improve code",
  "Explain this"
];

export function LaunchpadChatPanel({ 
  selectedModel, 
  activeFile, 
  activeFileContent,
  onApplyChanges 
}: LaunchpadChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'discuss' | 'build'>('build');
  
  const { 
    messages, 
    isStreaming, 
    sendMessage, 
    clearMessages 
  } = useSporkEditorChat({
    modelId: selectedModel,
    activeFile,
    activeFileContent
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="h-full flex flex-col lp-chat-panel border-r">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0 lp-chat-header">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg lp-chat-icon flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm">Ai Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 lp-chat-mode-toggle rounded-full p-0.5 mr-2">
            <button
              onClick={() => setMode('build')}
              className={`px-2.5 py-1 text-xs font-medium rounded-full lp-chat-mode-btn ${
                mode === 'build' ? 'active' : ''
              }`}
            >
              Build
            </button>
            <button
              onClick={() => setMode('discuss')}
              className={`px-2.5 py-1 text-xs font-medium rounded-full lp-chat-mode-btn ${
                mode === 'discuss' ? 'active' : ''
              }`}
            >
              Discuss
            </button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Context indicator */}
      {activeFile && (
        <div className="px-4 py-2 lp-chat-context border-b text-xs shrink-0 flex items-center gap-2">
          <span>Context:</span>
          <span className="font-mono lp-chat-context-file px-1.5 py-0.5 rounded">{activeFile}</span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl lp-chat-empty flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 lp-chat-empty-icon" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Let's Build Your App</h3>
              <p className="text-sm lp-message-timestamp text-center max-w-xs">
                Describe what you want to create or modify, and I'll help you build it.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                onApplyChanges={onApplyChanges}
              />
            ))
          )}
          
          {isStreaming && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full lp-message-avatar-assistant flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 lp-thinking-indicator rounded-2xl px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin lp-chat-empty-icon" />
                  <span className="text-sm lp-message-timestamp">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Suggestions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
          {quickSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 text-xs font-medium lp-chat-suggestion rounded-full"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t lp-chat-input-area shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="min-h-[80px] max-h-[160px] resize-none pr-24 rounded-xl lp-chat-input"
            disabled={isStreaming}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Button 
              type="button"
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <button 
              type="submit" 
              disabled={!input.trim() || isStreaming}
              className="h-8 w-8 rounded-full lp-chat-send-btn flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  onApplyChanges 
}: { 
  message: ChatMessage;
  onApplyChanges: (filePath: string, content: string) => void;
}) {
  const isUser = message.role === 'user';

  // Calculate relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 120) return 'a minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200) return 'an hour ago';
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="lp-message-avatar-user text-xs">
            U
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-7 h-7 rounded-full lp-message-avatar-assistant flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-2.5 ${
          isUser ? 'lp-message-user' : 'lp-message-assistant'
        }`}>
          {message.codeChanges && message.codeChanges.length > 0 ? (
            <div className="space-y-3">
              {message.explanation && (
                <p className="text-sm mb-2">{message.explanation}</p>
              )}
              {message.codeChanges.map((change, idx) => (
                <LaunchpadSuggestionBlock
                  key={idx}
                  filePath={change.file}
                  content={change.content}
                  action={change.action}
                  onApply={() => onApplyChanges(change.file, change.content)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="text-[10px] lp-message-timestamp mt-1 px-1">
          {getRelativeTime(typeof message.timestamp === 'number' ? message.timestamp : new Date(message.timestamp).getTime())}
        </div>
      </div>
    </div>
  );
}
