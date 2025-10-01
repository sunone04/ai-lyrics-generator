export const SITE_CONFIG = {
  name: 'AI Lyrics Generator',
  description: 'Create professional song and rap lyrics with AI. Generate original lyrics in 100+ languages for any style. Free to start with premium features.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-lyrics-generator.net',
  keywords: [
    'ai lyrics generator',
    'ai lyric generator', 
    'ai rap lyrics generator',
    'lyric generator',
    'lyrics generator',
    'rap lyric generator',
    'song lyrics generator',
    'rap lyrics generator',
    'hip hop lyrics generator',
    'song writer',
    'music lyrics',
    'songwriting tool',
    'rap generator',
    'freestyle rap generator',
    'professional lyrics generator',
    'ai songwriting',
    'lyric writing tool',
    'music composition',
    'rap verse generator',
    'chorus generator'
  ]
};

// Global SEO limits and helpers
export const SEO_LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 160,
};

export const TITLE_BRAND = 'AI Lyrics Generator';
export const TITLE_SEPARATOR = ' | ';
export const TITLE_SUFFIX = `${TITLE_SEPARATOR}${TITLE_BRAND}`; // used by layout template

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxGenerations: 1,
    maxLyricOptimizations: 1,
    canEditLyrics: false,
    canUseProModel: false,
    maxFavorites: 10
  },
  active: {
    maxGenerations: 30,
    maxLyricOptimizations: 30,
    canEditLyrics: true,
    canUseProModel: true,
    maxFavorites: 300
  },
  // 保持向后兼容
  paid: {
    maxGenerations: 30,
    maxLyricOptimizations: 30,
    canEditLyrics: true,
    canUseProModel: true,
    maxFavorites: 300
  }
};



export const FORM_OPTIONS = {
  languages: [
    'English',
    'Chinese',
    'French',
    'Russian',
    'Arabic',
    'Spanish',
    'German',
    'Portuguese',
    'Japanese',
    'Other'
  ],
  musicStyles: [
    'Pop',
    'Hip-Hop/Rap',
    'R&B/Soul',
    'Rock',
    'Electronic',
    'Country',
    'Folk',
    'Jazz',
    'Blues',
    'Latin Pop',
    'Reggaeton',
    'Indie',
    'Alternative',
    'Afrobeat',
    'Other'
  ],
  musicThemes: [
    'Love & Romance',
    'Heartbreak',
    'Friendship',
    'Perseverance & Success',
    'Empowerment',
    'Party',
    'Nostalgia',
    'Family',
    'Spirituality & Faith',
    'Social Issues',
    'Adventure',
    'Other'
  ],
  lengthOptions: [
    'Default',
    'Short (1-2 verses)',
    'Medium (2-3 verses + chorus)',
    'Long (3+ verses + bridge)',
    'Other'
  ],
  lyricStyles: [
    'Default',
    'Narrative',
    'Conversational',
    'Poetic',
    'Metaphorical',
    'Confessional',
    'Direct',
    'Playful/Humorous',
    'Stream-of-Consciousness',
    'Other'
  ],
  rhymeRequirements: [
    'Perfect Rhymes',
    'Near Rhymes (Slant)',
    'Internal Rhymes',
    'Multisyllabic Focus',
    'Flexible (Near/Internal)',
    'No Strict Rhymes',
    'Other'
  ],
  songStructures: [
    'Default',
    'Verse–Chorus',
    'Verse–Pre-Chorus–Chorus',
    'Verse–Chorus–Bridge (ABABCB)',
    'Verse–Hook (Rap)',
    'AABA',
    'EDM (Intro–Build–Drop–Break)',
    'Free form',
    'Other'
  ]
};

export const BLOG_CATEGORIES = [
  { id: 1, name: 'Lyrical Techniques', slug: 'lyrical-techniques', created_at: '2024-01-01T00:00:00Z', sort_order: 1, is_active: true },
  { id: 2, name: 'AI Tools Usage', slug: 'ai-tools-usage', created_at: '2024-01-01T00:00:00Z', sort_order: 2, is_active: true },
  { id: 3, name: 'Hip-Hop & Rap', slug: 'hip-hop-rap', created_at: '2024-01-01T00:00:00Z', sort_order: 3, is_active: true },
  { id: 4, name: 'Pop & Hits', slug: 'pop-hits', created_at: '2024-01-01T00:00:00Z', sort_order: 4, is_active: true },
  { id: 5, name: 'Rock & Alternative', slug: 'rock-alternative', created_at: '2024-01-01T00:00:00Z', sort_order: 5, is_active: true },
  { id: 6, name: 'Country & Folk', slug: 'country-folk', created_at: '2024-01-01T00:00:00Z', sort_order: 6, is_active: true },
  { id: 7, name: 'R&B & Soul', slug: 'rnb-soul', created_at: '2024-01-01T00:00:00Z', sort_order: 7, is_active: true }
];

export const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'Generate', href: '/generate' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'FAQ', href: '/faq' }
];
