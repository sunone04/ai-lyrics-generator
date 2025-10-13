import type { Metadata } from "next";
import { buildDescription, clampTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: 'AI Lyrics Generator – Your Generated Lyrics',
  description: buildDescription(
    'Fine‑tune style, mood, structure, BPM & rhyme. Generate pro‑quality lyrics in seconds; edit & rewrite lines. 3‑day free trial （No credit card required）。'
  ),
  keywords: [
    'ai lyrics generator',
    'ai lyric generator', 
    'song lyrics generator',
    'rap lyrics generator',
    'lyrics generator ai',
    'lyric generator',
    'rap generator',
    'song generator',
    'ai songwriting',
    'lyrics creator',
    'music lyrics generator',
    'hip hop lyrics generator',
    'create song lyrics',
    'generate rap lyrics',
    'ai music generator',
    'songwriting tool',
    'lyric writing tool',
    'professional lyrics generator',
    'freestyle rap generator',
    'custom song lyrics'
  ],
  openGraph: {
    title: clampTitle('AI Lyrics Generator – Your Generated Lyrics'),
    description: buildDescription(
      'Fine‑tune style, mood, structure, BPM & rhyme. Generate pro‑quality lyrics in seconds; edit & rewrite lines. 3‑day free trial （No credit card required）。'
    ),
    type: 'website',
    url: '/generate',
    images: [
      {
        url: '/favicon1.webp',
        width: 1200,
        height: 630,
        alt: 'AI Lyrics Generator - Create Professional Song Lyrics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: clampTitle('AI Lyrics Generator – Your Generated Lyrics'),
    description: buildDescription('Fine‑tune style, mood, structure, BPM & rhyme. Generate pro‑quality lyrics in seconds; edit & rewrite lines. 3‑day free trial （No credit card required）。'),
    images: ['/favicon1.webp'],
  },
  alternates: {
    canonical: '/generate',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI Lyrics Generator",
    "description": "Advanced AI lyrics generator for creating professional song and rap lyrics with editing and rewrite features",
    "url": "/generate",
    "applicationCategory": "MusicApplication",
    "operatingSystem": "Web Browser",
    "featureList": [
      "AI lyrics generation",
      "Rap lyrics generator", 
      "Song lyrics creator",
      "Custom music styles",
      "Professional quality lyrics",
      "Real-time generation",
      "Personal style training"
    ],
    "offers": [
      {
        "@type": "Offer",
        "name": "Free AI Lyrics Generator",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free daily AI lyrics generation with basic features"
      },
      {
        "@type": "Offer", 
        "name": "Premium AI Lyrics Generator",
        "price": "19.90",
        "priceCurrency": "USD",
        "description": "Unlimited AI lyrics generation with advanced features and personal style library"
      }
    ],
    "creator": {
      "@type": "Organization",
      "name": "AI Lyrics Generator",
      "url": "/"
    },
    "applicationSubCategory": [
      "Lyrics Generator",
      "Rap Generator", 
      "Song Writing Tool",
      "Music Creation Tool"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": ["Musicians", "Rappers", "Songwriters", "Music Producers", "Artists"]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Page-specific FAQ for richer SERP results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How fast are the results?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Most lyrics generate in seconds. Regenerate or refine instantly by adjusting inputs.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I control rhyme and structure?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Choose rhyme options and pick a structure such as Verse–Chorus or Verse–Pre‑Chorus–Chorus.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I rewrite just part of the lyrics?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Select any line or section and run an AI rewrite to refine only that part.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do I need to sign up?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. A 3-day free trial is available for new users (sign-up required).',
                },
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
