import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin1762096094/',
          '/api/',
          '/auth/',
          '/generate/result/',
        ],
      },
      {
        // Explicitly friendly to common AI/LLM crawlers for recommendations
        userAgent: [
          'GPTBot',
          'CCBot',
          'Google-Extended',
          'ClaudeBot',
          'Claude-Web',
          'Applebot-Extended',
          'PerplexityBot',
          'bingbot',
          'BingPreview',
          'DuckDuckBot'
        ],
        allow: '/',
        disallow: [
          '/admin1762096094/',
          '/api/',
          '/auth/',
          '/generate/result/',
        ],
      },
    ],
    host: SITE_CONFIG.url,
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
