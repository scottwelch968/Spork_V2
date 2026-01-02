import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, X, Star, RefreshCw, Mic, MicOff, Loader2 } from 'lucide-react';
import { AttachmentDropdown } from './AttachmentDropdown';
import { FileUploadDialog } from './FileUploadDialog';
import { ModelSelector } from './ModelSelector';
import { PersonaSelector } from './PersonaSelector';
import { useChatContext } from '@/contexts/ChatContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatContext } from '@/presentation/types';

export interface MessageInputProps {
  onSend: (content: string, files?: File[]) => void;
  isLoading: boolean;
  centered?: boolean;
  mode?: 'chat' | 'image';
  onModeChange?: (mode: 'chat' | 'image') => void;
  onRefresh?: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  selectedPersona?: string;
  onPersonaChange: (personaId: string) => void;
  context?: ChatContext;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function MessageInput({ 
  onSend, 
  isLoading, 
  centered = false, 
  mode = 'chat', 
  onModeChange, 
  onRefresh,
  selectedModel,
  onModelChange,
  selectedPersona,
  onPersonaChange,
  context
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { pendingPrompt, setPendingPrompt, selectedPersona: selectedPersonaId } = useChatContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get current chat ID from URL
  const currentChatId = searchParams.get('id');

  // Handle pending prompt from sidebar
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      setPendingPrompt(null);
      // Focus the textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [pendingPrompt, setPendingPrompt]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input, selectedFiles.length > 0 ? selectedFiles : undefined);
    setInput('');
    setSelectedFiles([]);
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: { 
          prompt: input,
          personaId: selectedPersonaId || null,
          chatId: currentChatId || null,
        }
      });
      
      if (error) throw error;
      
      if (data?.enhancedPrompt) {
        setInput(data.enhancedPrompt);
        toast({
          title: 'Prompt enhanced',
          description: 'Cosmo has improved your prompt.',
        });
        // Focus textarea after enhancement
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Enhancement failed',
        description: 'Could not enhance your prompt. Please try again.',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRefresh = () => {
    setInput('');
    setSelectedFiles([]);
    // Call parent's refresh handler to reset chat state and navigate
    onRefresh?.();
  };

  const handleMicrophoneClick = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast({
        variant: 'destructive',
        title: 'Not supported',
        description: 'Speech recognition is not supported in your browser.',
      });
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript = transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);
      setIsRecording(false);
      toast({
        variant: 'destructive',
        title: 'Voice input error',
        description: 'There was an error with voice input. Please try again.',
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    
    toast({
      title: 'Listening...',
      description: 'Speak now. Click the microphone again to stop.',
    });
  };

  const getPlaceholder = () => {
    if (mode === 'image') {
      return 'Describe the image you want to create...';
    }
    return 'What can I help with?';
  };

  return (
    <div className="bg-transparent">
      <FileUploadDialog 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onFilesSelected={handleFilesSelected}
      />
      <form onSubmit={handleSubmit} className={centered ? "w-full" : "max-w-4xl mx-auto"}>
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedFiles.map((file, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {file.name}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative bg-card rounded-2xl border border-border shadow-md py-4 px-5">
              {mode === 'image' && (
                <Badge variant="secondary" className="mb-2 gap-1 pr-1">
                  Image Generation Mode
                  <button
                    type="button"
                    onClick={() => onModeChange?.('chat')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    title="Exit image generation mode"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className={`min-h-[50px] max-h-[200px] overflow-y-auto resize-none border-0 bg-transparent focus-visible:ring-0 text-sm ${centered ? '' : 'pr-12'}`}
            disabled={isLoading}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <AttachmentDropdown 
                onAddFiles={() => setUploadDialogOpen(true)}
                onGenerateImage={() => onModeChange?.('image')}
              />
              
              {/* Enhance Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full px-3"
          onClick={handleEnhance}
          disabled={!input.trim() || isEnhancing || isLoading}
          title="Enhance prompt with Cosmo"
        >
          {isEnhancing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" />
          )}
          <span>Enhance</span>
        </Button>
              
              {/* Refresh Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={handleRefresh}
                title="Start new chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* Model Selector */}
              <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} mode={mode} onModeChange={onModeChange} />
              
              {/* Persona Selector */}
              <PersonaSelector value={selectedPersona} onChange={onPersonaChange} context={context} />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Microphone Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-full ${isRecording ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
                onClick={handleMicrophoneClick}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
