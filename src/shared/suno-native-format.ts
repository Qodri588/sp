/**
 * Suno Native Format Converter
 *
 * Converts the app's structured key-value prompt format into Suno's
 * recommended comma-separated freeform style prompt.
 *
 * Suno official guide recommends combining: genre + mood + tempo + instruments +
 * vocal style + dynamics + production effects in a single comma-separated string.
 *
 * @module shared/suno-native-format
 */

import { stripMaxModeHeader, isStructuredPrompt } from './prompt-utils';

interface ParsedPromptFields {
  genre: string;
  bpm: string;
  mood: string;
  instruments: string;
  styleTags: string;
  recording: string;
}

/**
 * Parse a structured prompt (Max or Standard format) into individual fields.
 */
function parseStructuredPrompt(text: string): ParsedPromptFields {
  const body = stripMaxModeHeader(text);

  const fields: ParsedPromptFields = {
    genre: '',
    bpm: '',
    mood: '',
    instruments: '',
    styleTags: '',
    recording: '',
  };

  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue;

    const genreMatch = /^(?:Genre|genre):\s*["']?(.+?)["']?\s*$/i.exec(trimmed);
    if (genreMatch && genreMatch[1]) {
      fields.genre = cleanField(genreMatch[1]);
      continue;
    }

    const bpmMatch = /^(?:BPM|bpm):\s*["']?(.+?)["']?\s*$/i.exec(trimmed);
    if (bpmMatch && bpmMatch[1]) {
      fields.bpm = cleanField(bpmMatch[1]);
      continue;
    }

    const moodMatch = /^(?:Mood|mood):\s*["']?(.+?)["']?\s*$/i.exec(trimmed);
    if (moodMatch && moodMatch[1]) {
      fields.mood = cleanField(moodMatch[1]);
      continue;
    }

    const instrumentsMatch = /^(?:Instruments|instruments):\s*["']?(.+?)["']?\s*$/i.exec(trimmed);
    if (instrumentsMatch && instrumentsMatch[1]) {
      fields.instruments = cleanField(instrumentsMatch[1]);
      continue;
    }

    const styleTagsMatch = /^style tags:\s*["']?(.+?)["']?\s*$/i.exec(trimmed);
    if (styleTagsMatch && styleTagsMatch[1]) {
      fields.styleTags = cleanField(styleTagsMatch[1]);
      continue;
    }

    const recordingMatch = /^recording:\s*["']?(.+?)["']?\s*$/i.exec(trimmed);
    if (recordingMatch && recordingMatch[1]) {
      fields.recording = cleanField(recordingMatch[1]);
    }
  }

  return fields;
}

function cleanField(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim();
}

/**
 * Convert a structured prompt to Suno-native comma-separated freeform style.
 *
 * Follows the Suno official documentation recommendation:
 * "genre, mood, instruments, texture, dynamics, production effects"
 *
 * Example output:
 * "upbeat allegro pop, warm analog texture, synth bass, wide stereo, reverb-heavy,
 *  crescendo into powerful chorus, studio polish, natural dynamics"
 *
 * @param promptText - The current prompt text from the app
 * @returns Suno-native freeform style string, or empty string if prompt is empty
 */
export function toSunoNativeStyle(promptText: string): string {
  if (!promptText || promptText.trim().length === 0) return '';

  if (!isStructuredPrompt(promptText)) {
    return promptText.trim();
  }

  const fields = parseStructuredPrompt(promptText);

  const parts: string[] = [];

  if (fields.genre) {
    parts.push(fields.genre);
  }

  if (fields.mood) {
    parts.push(fields.mood);
  }

  if (fields.instruments) {
    parts.push(fields.instruments);
  }

  if (fields.styleTags) {
    parts.push(fields.styleTags);
  }

  if (fields.recording) {
    parts.push(fields.recording);
  }

  return parts.join(', ');
}
