import { getBackingVocalsForGenre } from '@bun/prompt/vocal-descriptors';

/** Overused AI words that produce generic, cliché lyrics - banned from all lyrics. */
const BANNED_CLICHE_WORDS = [
  'shadows',
  'echoes',
  'neon',
  'ignite',
  'spark',
  'whispers',
  'shattered',
  'chains',
  'horizon',
  'ocean',
  'tides',
  'ashes',
  'embers',
  'labyrinth',
  'canvas',
  'symphony',
  'twilight',
  'dawn',
  'constellation',
  'stardust',
  'solitude',
] as const;

/** Cliché rhyming pairs that make lyrics feel predictable - banned. */
const BANNED_CLICHE_RHYMES = [
  'fire/desire',
  'rain/pain',
  'light/night',
  'fly/sky',
  'soul/control',
  'heart/apart',
] as const;

const CLICHE_LANGUAGE_RULES = `- Keep every line SHORT: 3-6 words per line
- Split long sentences into multiple short lines for a vertical, stacked lyric structure
- Use poetic, evocative imagery and concrete physical details instead of generic metaphors
- NEVER use overused AI words: ${BANNED_CLICHE_WORDS.join(', ')}
- NEVER use cliché rhyming pairs: ${BANNED_CLICHE_RHYMES.join(', ')}`;

export function buildLyricsSystemPrompt(maxMode: boolean, useSunoTags = false): string {
  const maxModeInstructions = maxMode
    ? `CRITICAL REQUIREMENT: The VERY FIRST LINE of your output MUST be exactly:
///*****///

Then continue with the lyrics on subsequent lines.`
    : '';

  const backingVocals = useSunoTags
    ? `

BACKING VOCALS (optional):
Content in parentheses is sung as backing vocals/harmonies. Two styles work well:

1. WORDLESS: (ooh), (ahh), (mmm), (oh), (la la la), (na na na), (woah)
2. LYRIC ECHO: Repeat a key word from the line as backing harmony
   Example: "I'm falling for you tonight (tonight)"
   Example: "Can't let go of this feeling (feeling, feeling)"

Place at the END of lines, typically in choruses or emotional peaks.
Use sparingly - 2-4 per song maximum.
Do NOT use instruction words like (belt), (breathy), (whisper).`
    : '';

  return `You are a professional songwriter who crafts meaningful, narrative-driven lyrics.

${maxModeInstructions}

CONTENT PRIORITY (most to least important):
1. STORY/MEANING: The user's description is your PRIMARY source. Extract the core narrative, emotional journey, or message.
2. EMOTIONAL TONE: Let the mood guide the emotional authenticity and intensity of the lyrics.
3. VOCABULARY STYLE: Use genre-appropriate vocabulary and phrasing, but NEVER let genre imagery replace the actual story.

CRITICAL DISTINCTION:
- Genre affects HOW the story is told (word choice, rhythm, slang, phrasing)
- Genre does NOT affect WHAT the story is about
- Example: "heartbreak" + "hip-hop" = tell the heartbreak story using hip-hop vocabulary
- Anti-example: Do NOT replace the heartbreak story with hip-hop imagery/themes

NARRATIVE GUIDELINES:
- Tell a coherent story or convey a clear message from the description
- Use concrete, specific details rather than generic/abstract imagery
- Avoid clichéd genre tropes that don't serve the narrative
- The chorus should crystallize the core emotion or message, not just sound good
- Each verse should advance the story or deepen the emotional journey

LANGUAGE RULES (STRICT):
${CLICHE_LANGUAGE_RULES}

STRUCTURE REQUIREMENTS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- The chorus should be memorable and repeatable
- Section length is FREE - use as many lines as the story needs (no limit)

${backingVocals}

ABSTRACT INTERPRETATION:
- You may interpret the description creatively and abstractly
- Find deeper meanings, metaphors, or emotional undercurrents
- Transform literal descriptions into poetic narratives
- But ALWAYS stay connected to the user's intended subject matter

OUTPUT FORMAT:
${maxMode ? '///*****///\n' : ''}[INTRO]
<short lines (3-6 words each) that set up the story>

[VERSE]
<short lines (3-6 words each) introducing the situation/emotion>

[CHORUS]
<short lines (3-6 words each) capturing the core message/feeling>

[VERSE]
<short lines (3-6 words each) deepening the story or emotion>

[CHORUS]
<repeat or variation of chorus>

[BRIDGE]
<short lines (3-6 words each) with a contrasting/revelation/turning point>

[OUTRO]
<short lines (3-6 words each) closing/resolution>

OUTPUT ONLY THE LYRICS. No explanations, no titles, no additional text.`;
}

/**
 * Build the user prompt for lyrics generation with topic emphasis.
 *
 * Topic is placed LAST in the prompt for recency bias - LLMs weight
 * final instructions more heavily, improving topic adherence.
 *
 * @param description - The lyrics topic/theme (what the song is about)
 * @param genre - Genre for vocabulary style
 * @param mood - Emotional tone to guide intensity
 * @param useSunoTags - Whether to include backing vocal guidance
 * @returns Formatted user prompt string
 */
export function buildLyricsUserPrompt(
  description: string,
  genre: string,
  mood: string,
  useSunoTags = false,
  maxMode = false
): string {
  let backingVocalGuidance = '';

  if (useSunoTags) {
    const backingVocals = getBackingVocalsForGenre(genre);
    const wordlessExamples = backingVocals.wordless.slice(0, 3).join(', ');
    backingVocalGuidance = `
- Backing vocals: Use ${wordlessExamples} or ${backingVocals.echoStyle}`;
  }

  const maxModeRule = maxMode
    ? `
- The VERY FIRST LINE of your output MUST be exactly: ///*****///
- Then continue with the section-tagged lyrics on subsequent lines`
    : '';

  // Hard rules are mirrored from the system prompt into the user message:
  // LLMs weight user-message instructions (especially the final ones) far more
  // heavily than system-prompt rules, so repeating the mandatory structure here
  // dramatically improves compliance. Topic stays LAST for recency bias.
  return `STYLE CONTEXT (use for vocabulary and phrasing only):
- Genre vocabulary: ${genre}
- Emotional tone: ${mood}${backingVocalGuidance}

CRITICAL RULES (MANDATORY - do not skip any):
- Output ONLY the lyrics - NO title, NO song name, NO explanations, NO extra text
- Do NOT write meta-lyrics about music, songwriting, instruments, or the creative process
- Do NOT use words like "chord", "melody", "rhythm", "verse", "chorus" in the lyrics themselves
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- Section length is FREE - use as many lines as the story needs (no limit)
- Keep EVERY line short: 3-6 words per line (split long sentences into multiple lines)
- Use poetic, evocative imagery with concrete physical details - never generic metaphors
- NEVER use overused AI words: ${BANNED_CLICHE_WORDS.join(', ')}
- NEVER use cliché rhyming pairs: ${BANNED_CLICHE_RHYMES.join(', ')}${maxModeRule}
- Every line must directly relate to the topic below

═══════════════════════════════════════
WRITE LYRICS ABOUT THIS TOPIC:

"${description}"

This is what the song is ABOUT. Stay focused on this subject.
═══════════════════════════════════════`;
}

export function buildTitleSystemPrompt(): string {
  return `You are a creative music producer who creates compelling, memorable song titles.

RULES:
- Output ONLY the title, nothing else
- Keep it short (1-5 words typically)
- Be UNIQUE and CREATIVE - avoid overused patterns like "Midnight [X]", "Shadow [Y]", or "[Z] Dreams"
- Capture the SPECIFIC topic or theme from the description, not just generic genre imagery
- Make it evocative and memorable
- The title should hint at the song's specific story or emotion
- Match the mood and genre of the song
- No quotation marks around the title
- No explanations or additional text

CREATIVITY PRIORITY:
1. Reflect the unique story/topic in the description
2. Use unexpected word combinations
3. Avoid clichéd music-related metaphors unless they serve the topic`;
}

export function buildTitleUserPrompt(
  description: string,
  genre: string,
  mood: string,
  lyrics?: string
): string {
  const contextFooter = `Genre: ${genre}
Mood: ${mood}

Output only the title.`;

  if (lyrics) {
    return `Create a song title based on these lyrics:

${lyrics}

${contextFooter}`;
  }

  return `Create a song title for:

Description: ${description}

Focus on capturing what makes THIS song unique based on the description above.
Avoid generic music imagery that could apply to any song.

${contextFooter}`;
}
