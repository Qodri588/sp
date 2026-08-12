import { Input } from '@/components/ui/input';
import { SectionLabel } from '@/components/ui/section-label';

import type { AIProvider } from '@shared/types';
import type { ReactElement } from 'react';

interface ModelSectionProps {
  provider: AIProvider;
  model: string;
  openaiBaseUrl: string;
  loading: boolean;
  onModelChange: (model: string) => void;
}

export function ModelSection({
  model,
  loading,
  onModelChange,
}: ModelSectionProps): ReactElement {
  return (
    <div className="space-y-2">
      <SectionLabel>AI Model</SectionLabel>
      <Input
        type="text"
        value={model}
        onChange={(e) => {
          onModelChange(e.target.value);
        }}
        disabled={loading}
        placeholder="e.g. gpt-5-mini, claude-sonnet-4-5-20250929"
        className="bg-input"
      />
      <p className="ui-helper">
        Enter the model ID accepted by your AI provider
      </p>
    </div>
  );
}
