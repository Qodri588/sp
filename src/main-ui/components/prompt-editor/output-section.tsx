import { Check, Copy, Eye, EyeOff, Shuffle, WandSparkles } from 'lucide-react';

import { PromptOutput } from '@/components/prompt-output';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/section-label';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

import type { ReactElement } from 'react';

interface OutputSectionProps {
  label: string;
  content: string;
  onRemix?: () => void;
  isRemixing?: boolean;
  scrollable?: boolean;
  onInjectExtend?: () => void;
  isInjectingExtend?: boolean;
  hasExtend?: boolean;
  showExtend?: boolean;
  onToggleExtend?: () => void;
}

// eslint-disable-next-line complexity
export function OutputSection({
  label,
  content,
  onRemix,
  isRemixing = false,
  scrollable = false,
  onInjectExtend,
  isInjectingExtend = false,
  hasExtend = false,
  showExtend = false,
  onToggleExtend,
}: OutputSectionProps): ReactElement {
  const { copied, copy } = useCopyToClipboard();
  const displayContent = content
    .replace(/^\s*\/\/\/\*{5}\/\/\/\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const handleCopy = (): void => {
    void copy(displayContent);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <SectionLabel>{label}</SectionLabel>
      </div>
      <Card className="relative border bg-surface overflow-hidden">
        <CardContent className="p-4 sm:pr-36">
          {scrollable ? (
            <PromptOutput text={displayContent} />
          ) : (
            <div className="font-mono text-[length:var(--text-body)] leading-[1.6]">
              {displayContent}
            </div>
          )}
        </CardContent>
        <div className="absolute top-4 right-4 flex gap-2">
          {onRemix && (
            <Button variant="outline" size="sm" onClick={onRemix} autoDisable className="font-bold">
              <Shuffle className={cn('w-3.5 h-3.5', isRemixing && 'animate-spin')} />
              REMIX
            </Button>
          )}
          {onInjectExtend && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInjectExtend}
              disabled={isInjectingExtend}
              className="font-bold"
            >
              <WandSparkles className={cn('w-3.5 h-3.5', isInjectingExtend && 'animate-pulse')} />
              {isInjectingExtend ? 'EXTENDING...' : 'INJECT EXTEND TAGS'}
            </Button>
          )}
          {hasExtend && onToggleExtend && (
            <Button variant="outline" size="sm" onClick={onToggleExtend} className="font-bold">
              {showExtend ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showExtend ? 'HIDE EXTEND' : 'SHOW EXTEND'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              'font-bold',
              copied &&
                'bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400'
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED' : 'COPY'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
