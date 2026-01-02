import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { GitBranch, ChevronDown, Plus, Check } from 'lucide-react';
import { GitHubBranch } from '@/hooks/useGitHubSync';

interface BranchSelectorProps {
  branches: GitHubBranch[];
  currentBranch: string;
  isLoading: boolean;
  onBranchChange: (branch: string) => void;
  onCreateBranch: (branchName: string, fromBranch: string) => Promise<void>;
  disabled?: boolean;
}

export function BranchSelector({
  branches,
  currentBranch,
  isLoading,
  onBranchChange,
  onCreateBranch,
  disabled
}: BranchSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateBranch(newBranchName.trim(), currentBranch);
      setNewBranchName('');
      setIsCreateDialogOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const defaultBranch = branches.find(b => b.isDefault);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={disabled || isLoading}
            className="gap-2"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span className="max-w-24 truncate">{currentBranch}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.name}
              onClick={() => onBranchChange(branch.name)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{branch.name}</span>
              </span>
              <span className="flex items-center gap-1">
                {branch.isDefault && (
                  <Badge variant="secondary" className="text-[10px]">
                    default
                  </Badge>
                )}
                {branch.name === currentBranch && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </span>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-2" />
            Create new branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch name</Label>
              <Input
                id="branchName"
                placeholder="feature/my-new-feature"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBranch();
                }}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Creating from: <span className="font-mono">{currentBranch}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={!newBranchName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
