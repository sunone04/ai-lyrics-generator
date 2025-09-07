import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Lyrics Generator - Create Professional Song Lyrics & Rap Lyrics Online",
  description: "Generate professional song lyrics and rap lyrics with our advanced AI lyrics generator. Create custom lyrics in 100+ languages for any music style, theme, and structure. Free AI lyric generator with premium features.",
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
    title: "AI Lyrics Generator - Create Professional Song Lyrics & Rap Lyrics",
    description: "Generate professional song lyrics and rap lyrics with our advanced AI lyrics generator. Create custom lyrics in 100+ languages for any music style and theme.",
    type: 'website',
    url: '/generate',
    images: [
      {
        url: '/generate-og.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Lyrics Generator - Create Professional Song Lyrics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Lyrics Generator - Create Professional Song Lyrics & Rap Lyrics',
    description: 'Generate professional song lyrics and rap lyrics with our advanced AI lyrics generator. Create custom lyrics in 100+ languages.',
    images: ['/generate-og.jpg'],
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
    "description": "Advanced AI lyrics generator for creating professional song lyrics and rap lyrics in multiple languages and styles",
    "url": "/generate",
    "applicationCategory": "MusicApplication",
    "operatingSystem": "Web Browser",
    "featureList": [
      "AI lyrics generation",
      "Rap lyrics generator", 
      "Song lyrics creator",
      "Multi-language support",
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
      {children}
    </>
  );
}