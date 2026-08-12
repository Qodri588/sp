import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/section-label';
import { toSunoNativeStyle } from '@shared/suno-native-format';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ReactElement } from 'react';

interface SunoNativeOutputProps {
  prompt: string;
}

export function SunoNativeOutput({ prompt }: SunoNativeOutputProps): ReactElement | null {
  const { copied, copy } = useCopyToClipboard();

  const sunoNative = useMemo(() => toSunoNativeStyle(prompt), [prompt]);

  if (!sunoNative) return null;

  const handleCopy = (): void => {
    void copy(sunoNative);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <SectionLabel>Suno Style (Native)</SectionLabel>
      </div>
      <Card className="relative group border bg-surface overflow-hidden">
        <CardContent className="p-4 sm:pr-28">
          <div className="font-mono text-[length:var(--text-body)] leading-[1.7] whitespace-pre-wrap break-words text-muted-foreground">
            {sunoNative}
          </div>
        </CardContent>
        <div className="absolute top-4 right-4 flex gap-2">
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
