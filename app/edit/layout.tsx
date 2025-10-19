import type { Metadata } from 'next';
import { buildDescription, clampTitle } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: 'Edit & Polish Your Lyrics with AI - Improve Any Part Instantly' },
  description: buildDescription(
    "Upload your lyrics, select any part you’d like to improve, and polish it with AI - free and full control."
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
    title: clampTitle('Edit & Polish Your Lyrics with AI - Improve Any Part Instantly'),
    description: buildDescription(
      "Upload your lyrics, select any part you’d like to improve, and polish it with AI - free and full control."
    ),
    type: 'website',
    url: '/edit',
    images: ['/female_singer.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: clampTitle('Edit & Polish Your Lyrics with AI - Improve Any Part Instantly'),
    description: buildDescription("Upload your lyrics, select any part you’d like to improve, and polish it with AI - free and full control."),
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
