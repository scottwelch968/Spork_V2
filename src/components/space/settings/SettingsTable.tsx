import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Pencil, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EditSpaceNameDialog } from './EditSpaceNameDialog';
import { EditDescriptionDialog } from './EditDescriptionDialog';
import { EditAIModelDialog } from './EditAIModelDialog';
import { EditAIInstructionsDialog } from './EditAIInstructionsDialog';
import { EditComplianceRuleDialog } from './EditComplianceRuleDialog';
import { usePublicModels } from '@/hooks/usePublicModels';
import { COSMO_AI_AUTO_DESCRIPTION } from '@/utils/modelDisplayName';

interface SettingsTableProps {
  space: {
    id: string;
    name: string;
    description?: string | null;
    ai_model?: string | null;
    ai_instructions?: string | null;
    compliance_rule?: string | null;
    is_default?: boolean;
  };
  isOwner: boolean;
  isDefaultWorkspace?: boolean;
  onUpdate: (updates: any) => void;
}

export function SettingsTable({ space, isOwner, isDefaultWorkspace = false, onUpdate }: SettingsTableProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const { models } = usePublicModels();

  const truncate = (text: string | null | undefined, maxLength: number = 50) => {
    if (!text) return <span className="text-muted-foreground italic">Not set</span>;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getModelName = (modelId: string | null | undefined) => {
    if (!modelId) return COSMO_AI_AUTO_DESCRIPTION;
    const model = models.find(m => m.model_id === modelId);
    return model?.name || modelId;
  };

  const settingsRows = [
    {
      key: 'name',
      label: 'Space Name',
      value: space.name,
      ownerOnly: false,
      disabled: isDefaultWorkspace, // Cannot rename default workspace
    },
    {
      key: 'description',
      label: 'Description',
      value: truncate(space.description),
      ownerOnly: false,
      disabled: false,
    },
    {
      key: 'ai_model',
      label: 'AI Model',
      value: getModelName(space.ai_model),
      ownerOnly: false,
      disabled: false,
    },
    {
      key: 'ai_instructions',
      label: 'AI Instructions',
      value: truncate(space.ai_instructions),
      ownerOnly: false,
      disabled: false,
    },
    {
      key: 'compliance_rule',
      label: 'Compliance Rule',
      value: truncate(space.compliance_rule),
      ownerOnly: true,
      disabled: false,
    },
  ];

  const visibleRows = settingsRows.filter(row => !row.ownerOnly || isOwner);

  return (
    <>
      <Card>
        <Table>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium w-40">{row.label}</TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell className="w-16 text-right">
                  {row.disabled ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="cursor-not-allowed opacity-50"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>System workspace - cannot be renamed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingField(row.key)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EditSpaceNameDialog
        open={editingField === 'name'}
        onOpenChange={(open) => !open && setEditingField(null)}
        currentName={space.name}
        onSave={(name) => onUpdate({ name })}
      />

      <EditDescriptionDialog
        open={editingField === 'description'}
        onOpenChange={(open) => !open && setEditingField(null)}
        currentDescription={space.description}
        onSave={(description) => onUpdate({ description })}
      />

      <EditAIModelDialog
        open={editingField === 'ai_model'}
        onOpenChange={(open) => !open && setEditingField(null)}
        currentModel={space.ai_model}
        onSave={(ai_model) => onUpdate({ ai_model })}
      />

      <EditAIInstructionsDialog
        open={editingField === 'ai_instructions'}
        onOpenChange={(open) => !open && setEditingField(null)}
        currentInstructions={space.ai_instructions}
        onSave={(ai_instructions) => onUpdate({ ai_instructions })}
      />

      {isOwner && (
        <EditComplianceRuleDialog
          open={editingField === 'compliance_rule'}
          onOpenChange={(open) => !open && setEditingField(null)}
          currentRule={space.compliance_rule}
          onSave={(compliance_rule) => onUpdate({ compliance_rule })}
        />
      )}
    </>
  );
}
