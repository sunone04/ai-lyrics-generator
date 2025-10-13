import type { Metadata } from 'next';
import { buildDescription, clampTitle } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'AI Lyrics Editor: Polish & Rewrite Lyrics',
  description: buildDescription(
    'Upload or paste lyrics, select text to rewrite with AI, and download polished song or rap lyrics. Premium editing tools for precise line-by-line improvements.'
  ),
  keywords: [
    'ai lyrics editor',
    'lyrics editor',
    'rewrite lyrics',
    'polish lyrics',
    'edit song lyrics',
    'rap lyrics editor',
    'upload lyrics txt',
    'ai lyric rewrite',
    'lyric improvement tool'
  ],
  openGraph: {
    title: clampTitle('AI Lyrics Editor: Polish & Rewrite Lyrics'),
    description: buildDescription(
      'Edit and rewrite your lyrics with AI. Upload .txt files, select passages to improve, and export professional-quality results.'
    ),
    type: 'website',
    url: '/edit',
    images: ['/female_singer.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: clampTitle('AI Lyrics Editor: Polish & Rewrite Lyrics'),
    description: buildDescription('Line-by-line AI rewriting and polishing for song and rap lyrics.'),
    images: ['/female_singer.webp'],
  },
  alternates: {
    canonical: '/edit',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I rewrite specific lines only?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Select any line or section and use AI to rewrite just that part without changing the rest.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I upload .txt lyrics files?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Upload or paste your lyrics, then edit and polish with AI and export the results.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to sign up to use the editor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. A 3-day free trial is available for new users (no credit card required).',
        },
      },
    ],
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
