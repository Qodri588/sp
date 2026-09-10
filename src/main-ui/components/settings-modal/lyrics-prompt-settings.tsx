import { Ban, FileText, LogIn, LogOut, WandSparkles } from 'lucide-react';

import { FormLabel } from '@/components/ui/form-label';
import { SectionLabel } from '@/components/ui/section-label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleRow } from '@/components/ui/toggle-row';

import type { ReactElement } from 'react';

interface LyricsPromptSettingsProps {
  lyricsPrompt: string;
  lyricsExtensionPrompt: string;
  bannedLyricsWords: string;
  includeLyricsIntro: boolean;
  includeLyricsOutro: boolean;
  loading: boolean;
  onLyricsPromptChange: (value: string) => void;
  onLyricsExtensionPromptChange: (value: string) => void;
  onBannedLyricsWordsChange: (value: string) => void;
  onIncludeLyricsIntroChange: (value: boolean) => void;
  onIncludeLyricsOutroChange: (value: boolean) => void;
}

export function LyricsPromptSettingsSection({
  lyricsPrompt,
  lyricsExtensionPrompt,
  bannedLyricsWords,
  includeLyricsIntro,
  includeLyricsOutro,
  loading,
  onLyricsPromptChange,
  onLyricsExtensionPromptChange,
  onBannedLyricsWordsChange,
  onIncludeLyricsIntroChange,
  onIncludeLyricsOutroChange,
}: LyricsPromptSettingsProps): ReactElement {
  return (
    <div className="space-y-4 border-t border-border/50 pt-[var(--space-4)]">
      <div>
        <SectionLabel>Lyrics AI Instructions</SectionLabel>
        <p className="ui-helper mt-1">
          These instructions are sent to the AI for every lyrics generation and refinement request.
        </p>
      </div>

      <div className="space-y-2">
        <FormLabel icon={<FileText className="w-3.5 h-3.5" />}>Lyrics generation prompt</FormLabel>
        <Textarea
          id="settings-lyrics-prompt"
          value={lyricsPrompt}
          onChange={(event) => {
            onLyricsPromptChange(event.target.value);
          }}
          disabled={loading}
          rows={6}
          spellCheck={false}
          className="min-h-32 resize-y font-mono text-[length:var(--text-caption)] leading-relaxed bg-input"
          placeholder="Write lyrics about {{topic}} using {{genre}} style and {{mood}} mood..."
        />
        <p className="ui-helper">
          Placeholders: {'{{topic}}'}, {'{{genre}}'}, {'{{mood}}'}, {'{{banned_words}}'}.
        </p>
      </div>

      <div className="space-y-2">
        <FormLabel icon={<WandSparkles className="w-3.5 h-3.5" />}>Extend lyrics prompt</FormLabel>
        <Textarea
          id="settings-lyrics-extension-prompt"
          value={lyricsExtensionPrompt}
          onChange={(event) => {
            onLyricsExtensionPromptChange(event.target.value);
          }}
          disabled={loading}
          rows={5}
          spellCheck={false}
          className="min-h-28 resize-y font-mono text-[length:var(--text-caption)] leading-relaxed bg-input"
          placeholder="Extend the existing lyrics with original content..."
        />
        <p className="ui-helper">
          Used by the <span className="font-mono">INJECT EXTEND TAGS</span> action. The AI still
          receives the existing lyrics as context.
        </p>
      </div>

      <div className="space-y-2">
        <FormLabel icon={<Ban className="w-3.5 h-3.5" />}>Words the AI must not use</FormLabel>
        <Textarea
          id="settings-banned-lyrics-words"
          value={bannedLyricsWords}
          onChange={(event) => {
            onBannedLyricsWordsChange(event.target.value);
          }}
          disabled={loading}
          rows={5}
          spellCheck={false}
          className="min-h-24 resize-y font-mono text-[length:var(--text-caption)] leading-relaxed bg-input"
          placeholder="shadows\nechoes\nword or phrase"
        />
        <p className="ui-helper">One word or phrase per line. Leave empty to disable this list.</p>
      </div>

      <div className="space-y-1">
        <ToggleRow
          id="settings-lyrics-intro"
          icon={<LogIn className="w-3.5 h-3.5" />}
          label="Include intro"
          helperText="Generate an [INTRO] section"
          checked={includeLyricsIntro}
          onChange={onIncludeLyricsIntroChange}
          disabled={loading}
        />
        <ToggleRow
          id="settings-lyrics-outro"
          icon={<LogOut className="w-3.5 h-3.5" />}
          label="Include outro"
          helperText="Generate an [OUTRO] section"
          checked={includeLyricsOutro}
          onChange={onIncludeLyricsOutroChange}
          disabled={loading}
        />
      </div>
    </div>
  );
}
