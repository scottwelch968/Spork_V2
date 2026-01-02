import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  UserMessageContainer, 
  ActionMessageContainer, 
  ModelResponseContainer, 
  ButtonsContainer 
} from './containers';
import { MessageInput } from './MessageInput';
import { useViewportPosition } from '@/hooks/useViewportPosition';
import { ImageIntentDialog } from './ImageIntentDialog';
import { useChatUnified } from '@/hooks/useChatUnified';
import { useChatState } from '@/hooks/useChatState';
import { useAuth } from '@/hooks/useAuth';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useImageIntent } from '@/hooks/useImageIntent';
import { usePublicModels } from '@/hooks/usePublicModels';
import { useChatInput } from '@/contexts/ChatInputContext';

import { supabase } from '@/integrations/supabase/client';
import type { ChatContext as ChatContextType, ChatConfig } from '@/presentation/types';

interface UnifiedChatInterfaceProps {
  context: ChatContextType;
  chatId?: string;
  config?: ChatConfig;
  onChatCreated?: (chatId: string) => void;
  onUpdateChat?: (updates: { title?: string; model?: string; persona_id?: string }) => void;
}

export function UnifiedChatInterface({ 
  context, 
  chatId, 
  config,
  onChatCreated,
  onUpdateChat 
}: UnifiedChatInterfaceProps) {
  const { user, profile } = useAuth();
  const isWorkspaceChat = context.type === 'workspace';
  const workspaceId = isWorkspaceChat ? context.workspaceId : undefined;
  
  // Consolidated state management
  const {
    selectedModel,
    selectedPersona,
    chatMode,
    setSelectedModel,
    handleModelChange,
    handlePersonaChange,
    setChatMode,
  } = useChatState({ context, onUpdateChat });

  const { 
    messages, 
    streamingMessage,
    isLoading, 
    isLoadingExistingChat, 
    hasExistingChat, 
    sendMessage, 
    sendImageMessage, 
    resetChat,
  } = useChatUnified({ 
    context, 
    chatId, 
    config,
    onChatCreated,
    onModelSync: setSelectedModel,
  });
  
  const { generateImageSimple } = useImageGeneration(user?.id, isWorkspaceChat, workspaceId);
  const { activeModels } = usePublicModels();
  const { hasImageIntent, isImageModel, getConfiguredImageModelName } = useImageIntent();
  
  // Connect to ChatInputContext for FloatingChatInput
  const { setIsVisible, setActions, setState } = useChatInput();
  
  const [keepChatLayout, setKeepChatLayout] = useState(false);
  

  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showImageIntentDialog, setShowImageIntentDialog] = useState(false);
  const [pendingImageMessage, setPendingImageMessage] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[] | undefined>();

  const getModelDisplayName = (modelId: string) => {
    if (modelId === 'auto') return 'Cosmo Ai | Auto Select Model';
    return activeModels.find(m => m.model_id === modelId)?.name || modelId;
  };

  const handleSend = async (content: string, files?: File[]) => {
    if (chatMode === 'image') {
      await sendImageMessage(content, generateImageSimple, selectedModel);
      setChatMode('chat');
      return;
    }

    const imageIntent = hasImageIntent(content);
    
    if (imageIntent) {
      const selectedModelData = activeModels.find(m => m.model_id === selectedModel);
      
      if (selectedModel === 'auto') {
        await sendImageMessage(content, generateImageSimple, selectedModel);
        return;
      }
      
      if (isImageModel(selectedModelData)) {
        await sendImageMessage(content, generateImageSimple, selectedModel);
        return;
      }
      
      setPendingImageMessage(content);
      setPendingFiles(files);
      setShowImageIntentDialog(true);
      return;
    }
    
    sendMessage(content, selectedModel, selectedPersona, files);
  };

  const handleContinueWithChat = () => {
    sendMessage(pendingImageMessage, selectedModel, selectedPersona, pendingFiles);
    setShowImageIntentDialog(false);
    setPendingImageMessage('');
    setPendingFiles(undefined);
  };

  const userName = (profile?.first_name && profile.first_name.trim()) || 'there';

  const handleGenerateImage = async () => {
    setShowImageIntentDialog(false);
    setPendingImageMessage('');
    setPendingFiles(undefined);
    await sendImageMessage(pendingImageMessage, generateImageSimple, selectedModel);
  };

  const handleSaveToMedia = async (imageUrl: string, prompt: string, messageId?: string, model?: string): Promise<void> => {
    if (!user?.id) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('save-image-to-media', {
      body: {
        imageUrl,
        userId: user.id,
        workspaceId: isWorkspaceChat ? workspaceId : undefined,
        prompt,
        model,
        messageId,
        messageTable: isWorkspaceChat ? 'space_chat_messages' : 'messages',
      }
    });

    if (error) {
      console.error('Save to media error:', error);
      throw new Error(error.message || 'Failed to save image');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to save image');
    }
  };

  const isImageExpired = (content: string) => {
    return content.startsWith('[IMAGE:EXPIRED]');
  };

  const getExpiredImagePrompt = (content: string) => {
    if (content.includes('\n')) {
      return content.split('\n').slice(1).join('\n').trim() || 'the same image';
    }
    return 'the same image';
  };

  // Register FloatingChatInput visibility and actions
  useEffect(() => {
    setIsVisible(true);
    setActions({
      onSend: handleSend,
      onModelChange: handleModelChange,
      onPersonaChange: handlePersonaChange,
      onModeChange: setChatMode,
      onRefresh: resetChat,
    });
    
    return () => {
      setIsVisible(false);
    };
  }, []);
  
  // Keep ChatInputContext state in sync
  useEffect(() => {
    setState({
      selectedModel,
      selectedPersona,
      chatMode,
      isLoading,
      context,
    });
  }, [selectedModel, selectedPersona, chatMode, isLoading, context, setState]);

  const { scrollContainerToTop } = useViewportPosition(containerRef);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const currentCount = messages.length + (streamingMessage ? 1 : 0);
    const prevCount = prevMessageCountRef.current;
    
    // Only act on new messages
    if (currentCount > prevCount && currentCount > 0) {
      const lastMessage = streamingMessage ?? messages[messages.length - 1];
      
      if (lastMessage?.role === 'user') {
        // User message: scroll to top with 24px padding
        const userMessageIndex = messages.length - 1;
        requestAnimationFrame(() => {
          scrollContainerToTop('user-message', userMessageIndex, 24);
        });
      }
      // Assistant messages: let them stream naturally
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages.length, streamingMessage?.role, scrollContainerToTop]);

  const isSpaceChat = isWorkspaceChat;
  const spaceId = workspaceId;

  const lastUserMessageIndex = messages.reduce(
    (lastIdx, msg, idx) => (msg.role === 'user' ? idx : lastIdx),
    -1
  );

  return (
    <div className="flex flex-col h-full">
      {(hasExistingChat || messages.length > 0 || keepChatLayout || chatId) ? (
        <>
          <div className="flex-1 relative overflow-hidden">
            {isLoadingExistingChat ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div 
                ref={containerRef}
                className="h-full overflow-y-auto w-full relative"
                style={{ paddingTop: '24px', paddingBottom: '70vh' }}
              >
                {messages.map((message, index) => {
                  const expired = isImageExpired(message.content);
                  
                  if (message.role === 'user') {
                    return (
                      <UserMessageContainer
                        key={`user-${index}`}
                        index={index}
                        content={message.content}
                        senderName={message.senderName}
                        isWorkspace={isSpaceChat}
                      />
                    );
                  }
                  
                  // Assistant message - render 3 distinct containers
                  return (
                    <div key={`assistant-${index}`} className="space-y-3 mb-6">
                      <ActionMessageContainer
                        index={index}
                        modelInfo={{
                          modelId: message.model || 'unknown',
                          modelName: activeModels.find(m => m.model_id === message.model)?.name || message.model || 'Ai',
                          isAuto: message.cosmo_selected === true,
                          category: message.detected_category,
                        }}
                      />
                      <ModelResponseContainer
                        index={index}
                        content={expired ? getExpiredImagePrompt(message.content) : message.content}
                        type={message.type}
                        imageUrl={message.imageUrl}
                        isExpired={expired}
                        isSavedToMedia={message.isSavedToMedia}
                        messageId={message.messageId}
                        model={message.model}
                        onSaveToMedia={handleSaveToMedia}
                      />
                      <ButtonsContainer
                        index={index}
                        content={expired ? getExpiredImagePrompt(message.content) : message.content}
                        isSpaceChat={isSpaceChat}
                        spaceId={spaceId}
                      />
                    </div>
                  );
                })}

                {streamingMessage && (
                  <div className="space-y-3 mb-6">
                    <ActionMessageContainer
                      index={messages.length}
                      modelInfo={{
                        modelId: streamingMessage.model || selectedModel,
                        modelName: activeModels.find(m => m.model_id === (streamingMessage.model || selectedModel))?.name || 'Ai',
                        isAuto: streamingMessage.cosmo_selected === true,
                        category: streamingMessage.detected_category,
                      }}
                      isStreaming
                    />
                    <ModelResponseContainer
                      index={messages.length}
                      content={streamingMessage.content}
                      isStreaming
                    />
                    {/* No ButtonsContainer while streaming */}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-background border-t px-6 py-4">
            <div className="max-w-[920px] mx-auto">
              <MessageInput
                onSend={handleSend}
                isLoading={isLoading}
                selectedModel={selectedModel}
                selectedPersona={selectedPersona}
                onModelChange={handleModelChange}
                onPersonaChange={handlePersonaChange}
                mode={chatMode}
                onModeChange={setChatMode}
                context={context}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-[150px]">
          <div className="w-full max-w-[920px] px-6 space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground">
                Hey, {userName} what's on your mind?
              </h1>
            </div>
            
            <MessageInput
              onSend={handleSend}
              isLoading={isLoading}
              centered={true}
              selectedModel={selectedModel}
              selectedPersona={selectedPersona}
              onModelChange={handleModelChange}
              onPersonaChange={handlePersonaChange}
              mode={chatMode}
              onModeChange={setChatMode}
              context={context}
            />
          </div>
        </div>
      )}

      <ImageIntentDialog
        open={showImageIntentDialog}
        onOpenChange={setShowImageIntentDialog}
        message={pendingImageMessage}
        selectedModelName={getModelDisplayName(selectedModel)}
        imageModelName={getConfiguredImageModelName()}
        onContinueWithChat={handleContinueWithChat}
        onGenerateImage={handleGenerateImage}
      />
    </div>
  );
}
