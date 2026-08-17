import type { GenreDefinition } from '@bun/instruments/genres/types';

/**
 * Phonk family genres.
 *
 * Phonk is a dark, Memphis rap-inspired hip-hop subgenre built on dusty
 * drum breaks, cowbell-driven melodies, and heavy distorted 808s. The family
 * covers the main style plus its most popular subgenres.
 */
export const PHONK_GENRE: GenreDefinition = {
  name: 'Phonk',
  keywords: ['phonk', 'classic phonk', 'phonk rap', 'dark phonk', 'gym phonk', 'aggressive phonk'],
  description:
    'Dark Memphis-influenced hip-hop with dusty drum breaks, cowbell melodies, and heavy 808 bass',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['dark piano', 'felt piano', 'guitar', 'strings', 'bells'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['synth pad', 'ambient pad', 'vinyl noise'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['flute', 'organ'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['808', 'trap hi hats', 'kick drum', 'snare drum', 'cowbell'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['vocal chops', 'FX risers', 'pizzicato strings'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'pad', 'color', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['808', 'kick drum'],
    ['synth pad', 'ambient pad'],
  ],
  bpm: { min: 115, max: 140, typical: 125 },
  moods: [
    'Dark',
    'Menacing',
    'Brooding',
    'Heavy',
    'Haunting',
    'Gritty',
    'Moody',
    'Ominous',
  ],
};

export const DRIFTPHONK_GENRE: GenreDefinition = {
  name: 'Drift Phonk',
  keywords: ['drift phonk', 'driftphonk', 'drift phonk beat'],
  description:
    'High-energy phonk with distorted aggressive 808s, relentless cowbell, and frantic hi-hats',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['dark piano', 'electric guitar', 'pluck synth', 'strings'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth pad', 'choir'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['distorted 808', 'cowbell', 'trap hi hats', 'kick drum', 'snare drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['vocal chops', 'impacts', 'FX risers'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'pad', 'rare'],
  maxTags: 4,
  exclusionRules: [['distorted 808', 'kick drum']],
  bpm: { min: 140, max: 170, typical: 155 },
  moods: [
    'Aggressive',
    'Energetic',
    'Menacing',
    'Hard',
    'Intense',
    'Hype',
    'Gritty',
    'Dark',
  ],
};

export const MEMPHISPHONK_GENRE: GenreDefinition = {
  name: 'Memphis Phonk',
  keywords: ['memphis phonk', 'memphis rap', 'memphis style', 'old school phonk'],
  description:
    'Original 90s Memphis rap sound: lo-fi tape warmth, haunted melodies, and gritty boom-bap drums',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['dark piano', 'felt piano', 'strings', 'bells'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.6,
      instruments: ['vinyl noise', 'ambient pad'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['808', 'kick drum', 'snare drum', 'trap hi hats'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['vocal chops', 'pizzicato strings', 'FX risers'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [['808', 'kick drum']],
  bpm: { min: 100, max: 125, typical: 115 },
  moods: [
    'Dark',
    'Haunting',
    'Grimy',
    'Menacing',
    'Nostalgic',
    'Raw',
    'Ominous',
    'Moody',
  ],
};

export const BRAZILIANPHONK_GENRE: GenreDefinition = {
  name: 'Brazilian Phonk',
  keywords: ['brazilian phonk', 'brazil phonk', 'brasil phonk', 'baile phonk'],
  description:
    'Favela funk-infused phonk: fast, aggressive, with punchy percussion stabs and pounding 808s',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['dark piano', 'pluck synth', 'brass stabs', 'strings'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth pad', 'choir'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['distorted 808', 'cowbell', 'kick drum', 'trap hi hats', 'claps'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['vocal chops', 'impacts', 'FX risers'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'pad', 'rare'],
  maxTags: 4,
  exclusionRules: [['distorted 808', 'kick drum']],
  bpm: { min: 135, max: 155, typical: 145 },
  moods: [
    'Aggressive',
    'Intense',
    'Energetic',
    'Hype',
    'Menacing',
    'Chaotic',
    'Hard',
    'Dark',
  ],
};

export const PHONKHOUSE_GENRE: GenreDefinition = {
  name: 'Phonk House',
  keywords: ['phonk house', 'house phonk', 'phonk house music'],
  description:
    'Club-ready fusion of phonk cowbell melodies and four-on-the-floor house rhythms',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['dark piano', 'pluck synth', 'strings', 'organ'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['synth pad', 'ambient pad', 'choir'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['808', 'kick drum', 'cowbell', 'hi-hat', 'claps'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['vocal chops', 'FX risers', 'impacts'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [['808', 'kick drum']],
  bpm: { min: 124, max: 132, typical: 128 },
  moods: [
    'Energetic',
    'Hype',
    'Dark',
    'Groovy',
    'Menacing',
    'Club',
    'Aggressive',
    'Moody',
  ],
};

export const WAVEPHONK_GENRE: GenreDefinition = {
  name: 'Wave Phonk',
  keywords: ['wave phonk', 'emotional phonk', 'sad phonk', 'melodic phonk'],
  description:
    'Melodic, atmospheric phonk with emotional autotuned vocals, dreamy pads, and gentle 808s',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['dark piano', 'felt piano', 'strings', 'bells', 'guitar'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.6,
      instruments: ['synth pad', 'ambient pad', 'choir'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['808', 'trap hi hats', 'kick drum', 'snare drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['vocal chops', 'pizzicato strings', 'FX risers'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['808', 'kick drum'],
    ['synth pad', 'ambient pad'],
  ],
  bpm: { min: 105, max: 125, typical: 115 },
  moods: [
    'Emotional',
    'Melancholic',
    'Dreamy',
    'Moody',
    'Sad',
    'Nostalgic',
    'Atmospheric',
    'Melodic',
  ],
};
