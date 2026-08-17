import { describe, it, expect } from 'bun:test';

import {
  buildLyricsSystemPrompt,
  buildLyricsUserPrompt,
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
} from '@bun/prompt/lyrics-builder';

describe('lyrics-builder', () => {
  describe('buildLyricsSystemPrompt', () => {
    it('should include section tags in prompt', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain('[INTRO]');
      expect(prompt).toContain('[VERSE]');
      expect(prompt).toContain('[CHORUS]');
      expect(prompt).toContain('[BRIDGE]');
      expect(prompt).toContain('[OUTRO]');
    });

    it('should not include max mode prefix when maxMode is false', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).not.toContain('///*****///');
      expect(prompt).not.toContain('CRITICAL REQUIREMENT');
    });

    it('should include max mode prefix instructions when maxMode is true', () => {
      const prompt = buildLyricsSystemPrompt(true);
      expect(prompt).toContain('///*****///');
      expect(prompt).toContain('CRITICAL REQUIREMENT');
      expect(prompt).toContain('VERY FIRST LINE');
    });

    it('should prioritize story/meaning in prompt', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain('CONTENT PRIORITY');
      expect(prompt).toContain('STORY/MEANING');
      expect(prompt).toContain('PRIMARY source');
    });

    it('should include critical distinction between genre and content', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain('CRITICAL DISTINCTION');
      expect(prompt).toContain('Genre affects HOW the story is told');
      expect(prompt).toContain('Genre does NOT affect WHAT the story is about');
    });

    it('should include narrative guidelines', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain('NARRATIVE GUIDELINES');
      expect(prompt).toContain('coherent story');
      expect(prompt).toContain('concrete, specific details');
    });

    it('should NOT contain old genre-matching instruction', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).not.toContain("Match the genre's typical lyrical style and vocabulary");
    });

    it('includes language rules with banned cliché words and rhymes', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain('LANGUAGE RULES (STRICT)');
      expect(prompt).toContain('3-6 words per line');
      expect(prompt).toContain('vertical, stacked');
      expect(prompt).toContain('shadows');
      expect(prompt).toContain('constellation');
      expect(prompt).toContain('fire/desire');
      expect(prompt).toContain('soul/control');
    });

    it('allows optional extended tags without a fixed template', () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain('EXTENDED TAGS (optional');
      expect(prompt).toContain('NO fixed template');
      expect(prompt).toContain('[Female Vocal]');
      expect(prompt).toContain('[Spoken Word]');
      expect(prompt).toContain('never force them');
      expect(prompt).toContain('MATCH the genre, vibe, and story');
      expect(prompt).toContain('[Guitar Solo]');
      expect(prompt).toContain('[Sax Solo]');
      expect(prompt).toContain('[Choir]');
      expect(prompt).toContain('[Percussion Break]');
      expect(prompt).toContain('ILLUSTRATIONS, NOT rules');
      expect(prompt).toContain('vary them per song');
      expect(prompt).toContain('use NONE - tags are never required');
      expect(prompt).toContain('stack MULTIPLE tags');
      expect(prompt).toContain('slow bluesy slide guitar');
      expect(prompt).toContain('2-5 words');
    });

    it('includes backing vocals guidance when useSunoTags is true', () => {
      const prompt = buildLyricsSystemPrompt(false, true);
      expect(prompt).toContain('BACKING VOCALS');
      expect(prompt).toContain('(ooh)');
      expect(prompt).toContain('LYRIC ECHO');
      expect(prompt).toContain('Do NOT use instruction words like (belt)');
    });

    it('does not include backing vocals guidance when useSunoTags is false', () => {
      const prompt = buildLyricsSystemPrompt(false, false);
      expect(prompt).not.toContain('BACKING VOCALS');
      expect(prompt).not.toContain('(ooh)');
    });
  });

  describe('buildLyricsUserPrompt', () => {
    it('should include description, genre, and mood', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('A song about the ocean');
      expect(prompt).toContain('ambient');
      expect(prompt).toContain('peaceful');
    });

    it('should present description as the topic to write about', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('WRITE LYRICS ABOUT THIS TOPIC');
      expect(prompt).toContain('"A song about the ocean"');
      expect(prompt).toContain('Stay focused on this subject');
    });

    it('should include style context with genre and mood', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('STYLE CONTEXT');
      expect(prompt).toContain('Genre vocabulary: ambient');
      expect(prompt).toContain('Emotional tone: peaceful');
    });

    it('should include critical rules against meta-lyrics', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('CRITICAL RULES');
      expect(prompt).toContain('Do NOT write meta-lyrics about music, songwriting');
      expect(prompt).toContain('Do NOT use words like "chord", "melody"');
    });

    it('includes genre-specific backing vocals when useSunoTags is true', () => {
      const prompt = buildLyricsUserPrompt('A song about love', 'soul', 'emotional', true);
      expect(prompt).toContain('Backing vocals');
      expect(prompt).toContain('(oh yeah)');
      expect(prompt).toContain('call and response style');
    });

    it('uses genre-specific backing vocals for rock', () => {
      const prompt = buildLyricsUserPrompt('A song about freedom', 'rock', 'powerful', true);
      expect(prompt).toContain('Backing vocals');
      expect(prompt).toContain('(hey!)');
      expect(prompt).toContain('repeat with intensity');
    });

    it('does not include backing vocals when useSunoTags is false', () => {
      const prompt = buildLyricsUserPrompt('A song about love', 'soul', 'emotional', false);
      expect(prompt).not.toContain('Backing vocals');
    });

    it('uses default backing vocals for unknown genre', () => {
      const prompt = buildLyricsUserPrompt('A song', 'unknowngenre', 'calm', true);
      expect(prompt).toContain('Backing vocals');
      expect(prompt).toContain('(ooh)');
      expect(prompt).toContain('repeat key word');
    });

    it('mirrors mandatory structure rules into the user prompt for compliance', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('CRITICAL RULES (MANDATORY');
      expect(prompt).toContain('Output ONLY the lyrics - NO title, NO song name');
      expect(prompt).toContain('[INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]');
      expect(prompt).toContain('1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro');
      expect(prompt).toContain('Section length is FREE - use as many lines as the story needs');
    });

    it('includes max mode first-line rule when maxMode is true', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful', false, true);
      expect(prompt).toContain('///*****///');
      expect(prompt).toContain('VERY FIRST LINE');
    });

    it('does not include max mode first-line rule when maxMode is false', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).not.toContain('///*****///');
    });

    it('includes short-line and cliché-banned rules', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('3-6 words per line');
      expect(prompt).toContain('shadows');
      expect(prompt).toContain('stardust');
      expect(prompt).toContain('fire/desire');
      expect(prompt).toContain('heart/apart');
      expect(prompt).toContain('concrete physical details');
    });

    it('allows optional extended tags in user prompt', () => {
      const prompt = buildLyricsUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('extended tags freely');
      expect(prompt).toContain('[Female Vocal]');
      expect(prompt).toContain('no fixed template');
    });
  });

  describe('buildTitleSystemPrompt', () => {
    it('should include rules for title generation', () => {
      const prompt = buildTitleSystemPrompt();
      expect(prompt).toContain('title');
      expect(prompt).toContain('short');
      expect(prompt).toContain('1-5 words');
    });
  });

  describe('buildTitleUserPrompt', () => {
    it('should include description, genre, and mood', () => {
      const prompt = buildTitleUserPrompt('A song about the ocean', 'ambient', 'peaceful');
      expect(prompt).toContain('A song about the ocean');
      expect(prompt).toContain('ambient');
      expect(prompt).toContain('peaceful');
    });
  });
});
