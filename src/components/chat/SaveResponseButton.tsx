import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SaveResponseDialog } from './SaveResponseDialog';
import { exportChatResponseToPdf, blobToBase64 } from '@/utils/exportChatResponsePdf';

interface SaveResponseButtonProps {
  messageContent: string;
  chatTitle?: string;
  isSpaceChat?: boolean;
  spaceId?: string;
  iconOnly?: boolean;
}

export function SaveResponseButton({ 
  messageContent, 
  chatTitle, 
  isSpaceChat = false,
  spaceId,
  iconOnly = false,
}: SaveResponseButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateSuggestedName = () => {
    const sanitized = messageContent
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (sanitized.length === 0) {
      const date = new Date();
      return `Response ${date.toLocaleDateString()}`;
    }
    
    if (sanitized.length <= 50) {
      return sanitized;
    }
    
    const truncated = sanitized.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 20) {
      return truncated.substring(0, lastSpace).trim();
    }
    
    return truncated.trim();
  };

  const handleSave = async (fileName: string, format: string) => {
    setSaving(true);

    try {
      let pdfBase64: string | null = null;
      let contentToSend = messageContent;

      if (format === 'pdf') {
        const pdfBlob = await exportChatResponseToPdf(messageContent, fileName);
        pdfBase64 = await blobToBase64(pdfBlob);
        contentToSend = '';
      }

      const { data, error } = await supabase.functions.invoke('save-response-to-file', {
        body: {
          messageContent: contentToSend,
          chatTitle,
          isSpaceChat,
          spaceId,
          customFileName: fileName,
          format,
          pdfBase64,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        if (data.code === 'QUOTA_EXCEEDED') {
          toast({
            title: 'Storage quota exceeded',
            description: 'Please delete some files or upgrade your plan.',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setSaved(true);
      setDialogOpen(false);
      toast({
        title: 'Response saved',
        description: (
          <span>
            Saved as {data.file.name}.{' '}
            <button 
              className="underline font-medium"
              onClick={() => navigate('/files')}
            >
              View in Files
            </button>
          </span>
        ),
      });

    } catch (error: any) {
      console.error('Error saving response:', error);
      toast({
        title: 'Failed to save response',
        description: error.message || 'An error occurred while saving.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (iconOnly) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
              disabled={saved}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              {saved ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{saved ? 'Saved!' : 'Save to Files'}</p>
          </TooltipContent>
        </Tooltip>
        
        <SaveResponseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          suggestedName={generateSuggestedName()}
          onSave={handleSave}
          saving={saving}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        disabled={saved}
        className="h-8 px-4"
      >
        {saved ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        <span className="ml-1 text-xs">
          {saved ? 'Saved' : 'Save'}
        </span>
      </Button>
      
      <SaveResponseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        suggestedName={generateSuggestedName()}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
}
