export const SITE_CONFIG = {
  name: 'AI Lyrics Generator',
  description: 'Professional AI lyrics generator and song lyrics generator for musicians, rappers, and songwriters. Create rap lyrics, song lyrics, and professional music lyrics in 100+ languages with our advanced AI lyric generator technology.',
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

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxGenerations: 1,
    maxLyricOptimizations: 1,
    canEditLyrics: false,
    canUseProModel: false,
    maxFavorites: 3
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
    'Spanish', 
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
    'Other'
  ],
  musicStyles: [
    'Pop',
    'Rock',
    'Hip-Hop/Rap',
    'R&B',
    'Country',
    'Folk',
    'Electronic',
    'Jazz',
    'Blues',
    'Classical',
    'Alternative',
    'Indie',
    'Other'
  ],
  musicThemes: [
    'Love & Romance',
    'Heartbreak',
    'Friendship',
    'Success & Achievement',
    'Struggle & Overcoming',
    'Party & Celebration',
    'Social Issues',
    'Personal Growth',
    'Nostalgia',
    'Adventure',
    'Spirituality',
    'Other'
  ],
  lengthOptions: [
    'Short (1-2 verses)',
    'Medium (2-3 verses + chorus)',
    'Long (3+ verses + chorus + bridge)',
    'Other'
  ],
  lyricStyles: [
    'Narrative',
    'Abstract',
    'Conversational',
    'Poetic',
    'Direct',
    'Metaphorical',
    'Other'
  ],
  rhymeRequirements: [
    'Perfect rhymes',
    'Near rhymes',
    'Internal rhymes',
    'No specific requirement',
    'Other'
  ],
  songStructures: [
    'Verse-Chorus',
    'Verse-Chorus-Bridge',
    'AABA',
    'Verse-Pre-Chorus-Chorus',
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