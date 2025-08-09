// Database types
export interface Profile {
  id: string;
  updated_at: string;
  paddle_customer_id?: string;
  status: 'free' | 'active' | 'canceled' | 'past_due';
  active_price_id?: string;
  generation_count: number;
  rewrite_count: number;
  usage_last_reset: string;
}

export interface Generation {
  id: number;
  user_id: string;
  created_at: string;
  language?: string;
  music_style?: string;
  music_theme?: string;
  length_option?: string;
  lyric_style?: string;
  intent_or_request?: string;
  artist_style?: string;
  emotion_intensity?: number;
  rhyme_requirement?: string;
  song_structure?: string;
  paragraph_length?: string;
  bpm?: number;
  generated_lyrics: string;
  model_used: string;
  is_favorited: boolean;
}

export interface Category {
  id: number;
  created_at: string;
  name: string;
  slug: string;
  seo_title?: string;
  meta_description?: string;
}

export interface Post {
  id: number;
  created_at: string;
  category_id: number;
  title: string;
  content?: string;
  status: 'draft' | 'published';
  slug: string;
  seo_title?: string;
  meta_description?: string;
  category?: Category;
}

// Form types
export interface LyricsGenerationParams {
  language: string;
  musicStyle: string;
  musicTheme: string;
  lengthOption: string;
  lyricStyle: string;
  intentOrRequest: string;
  artistStyle: string;
  emotionIntensity: number;
  rhymeRequirement: string;
  songStructure: string;
  paragraphLength: string;
  bpm: number;
  modelType: 'basic' | 'pro';
}

// API response types
export interface GenerationResponse {
  success: boolean;
  lyrics?: string;
  generationId?: number;
  error?: string;
  remainingGenerations?: number;
}

export interface RewriteResponse {
  success: boolean;
  rewrittenLyrics?: string;
  error?: string;
  remainingRewrites?: number;
}

// User subscription types
export interface SubscriptionLimits {
  maxGenerations: number;
  maxRewrites: number;
  canEditLyrics: boolean;
  canUseProModel: boolean;
  maxFavorites: number;
}

// SEO types
export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
}