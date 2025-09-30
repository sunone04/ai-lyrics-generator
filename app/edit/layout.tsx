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
  return <>{children}</>;
}

