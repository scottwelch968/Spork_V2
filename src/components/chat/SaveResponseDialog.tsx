import { useState } from 'react';
import { Loader2, FileText, FileType, FileSpreadsheet, File } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SaveResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedName: string;
  onSave: (fileName: string, format: string) => Promise<void>;
  saving: boolean;
}

const FORMAT_OPTIONS = [
  { value: 'txt', label: 'Text (.txt)', icon: FileText, enabled: true },
  { value: 'pdf', label: 'PDF (.pdf)', icon: FileType, enabled: true },
  { value: 'gdocs', label: 'Google Docs', icon: FileSpreadsheet, enabled: false },
  { value: 'docx', label: 'MS Word (.docx)', icon: File, enabled: false },
];

export function SaveResponseDialog({
  open,
  onOpenChange,
  suggestedName,
  onSave,
  saving,
}: SaveResponseDialogProps) {
  const [fileName, setFileName] = useState(suggestedName);
  const [format, setFormat] = useState('txt');

  const handleSave = async () => {
    if (!fileName.trim()) return;
    await onSave(fileName.trim(), format);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFileName(suggestedName);
      setFormat('txt');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Response</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              disabled={saving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={!option.enabled}
                    className="flex items-center"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                      {!option.enabled && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !fileName.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
