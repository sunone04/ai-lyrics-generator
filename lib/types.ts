// Database types
export interface Profile {
  id: string;
  email?: string;
  updated_at: string;
  paddle_customer_id?: string;
  status: 'free' | 'active' | 'canceled' | 'past_due';
  active_price_id?: string;
  generation_count: number;
  rewrite_count: number;
  usage_last_reset: string;
  favorite_count: number;
  is_admin: boolean;
  last_login_ip?: string;
  last_login_at?: string;
  browser_fingerprint?: string;
  // optional subscription fields for UI convenience
  paddle_subscription_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  next_billing_date?: string;
  subscription_canceled_at?: string;
  subscription_plan_name?: string;
  subscription_billing_cycle?: string;
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
  sentence_preference?: string;
  bpm?: number;
  melody?: string;
  syllable_pattern?: string;
  generated_lyrics: string;
  model_used: string;
  is_favorited: boolean;
  generation_type: 'full' | 'partial';
  parent_generation_id?: number;
  optimization_request?: string;
}

export interface Category {
  id: number;
  created_at: string;
  name: string;
  slug: string;
  seo_title?: string;
  meta_description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Post {
  id: number;
  created_at: string;
  updated_at: string;
  category_id: number;
  title: string;
  content?: string;
  status: 'draft' | 'published';
  slug: string;
  seo_title?: string;
  meta_description?: string;
  featured_image?: string;
  excerpt?: string;
  view_count: number;
  published_at?: string;
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
  bpm?: number;
  useBpm: boolean;
  melody?: string;
  syllablePattern?: string;
  modelType: 'basic' | 'pro';
}

// API response types
export interface RewriteResponse {
  success: boolean;
  rewrittenLyrics?: string;
  error?: string;
  remainingRewrites?: number;
}



