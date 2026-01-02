import { Card } from '@/components/ui/card';
import { SpaceModelSelector } from './SpaceModelSelector';
import { AIInstructionsEditor } from './AIInstructionsEditor';
import { ComplianceRuleEditor } from './ComplianceRuleEditor';

interface SpaceAIConfigTabProps {
  spaceId: string;
  spaceName: string;
  aiModel: string | null;
  aiInstructions: string | null;
  complianceRule: string | null;
  isOwner: boolean;
  onUpdate: (updates: { ai_model?: string; ai_instructions?: string; compliance_rule?: string }) => void;
}

export function SpaceAIConfigTab({
  spaceId,
  spaceName,
  aiModel,
  aiInstructions,
  complianceRule,
  isOwner,
  onUpdate,
}: SpaceAIConfigTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
        <SpaceModelSelector
          selectedModel={aiModel}
          onModelChange={(model) => onUpdate({ ai_model: model })}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Instructions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set custom instructions for AI behavior in this space
        </p>
        <AIInstructionsEditor
          instructions={aiInstructions || ''}
          onSave={(instructions) => onUpdate({ ai_instructions: instructions })}
        />
      </Card>

      {isOwner && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Compliance Rule</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Owner-only: Define compliance requirements for this space
          </p>
          <ComplianceRuleEditor
            complianceRule={complianceRule || ''}
            onSave={(rule) => onUpdate({ compliance_rule: rule })}
          />
        </Card>
      )}
    </div>
  );
}
