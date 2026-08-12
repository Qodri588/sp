import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSettingsModalState } from '@/hooks/use-settings-modal-state';

import { ApiKeySection } from './api-key-section';
import { FeatureToggles } from './feature-toggles';
import { ModelSection } from './model-section';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement {
  const [state, actions] = useSettingsModalState(isOpen);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-106.25 bg-card border shadow-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Application Settings
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2 is-scrolling">
          <ApiKeySection
            provider={state.provider}
            apiKeys={state.apiKeys}
            openaiBaseUrl={state.openaiBaseUrl}
            showKey={state.showKey}
            loading={state.loading}
            error={state.error}
            onProviderChange={actions.handleProviderChange}
            onApiKeyChange={actions.handleApiKeyChange}
            onOpenaiBaseUrlChange={actions.setOpenaiBaseUrl}
            onToggleShowKey={actions.toggleShowKey}
          />

          <ModelSection
            provider={state.provider}
            model={state.model}
            openaiBaseUrl={state.openaiBaseUrl}
            loading={state.loading}
            onModelChange={actions.setModel}
          />

          <FeatureToggles
            useSunoTags={state.useSunoTags}
            maxMode={state.maxMode}
            lyricsMode={state.lyricsMode}
            storyMode={state.storyMode}
            debugMode={state.debugMode}
            loading={state.loading}
            onUseSunoTagsChange={actions.setUseSunoTags}
            onMaxModeChange={actions.setMaxMode}
            onLyricsModeChange={actions.setLyricsMode}
            onStoryModeChange={actions.setStoryMode}
            onDebugModeChange={actions.setDebugMode}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={state.saving}>
            Cancel
          </Button>
          <Button
            onClick={() => actions.handleSave(onClose)}
            disabled={state.saving || state.loading}
          >
            {state.saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
