import type { Metadata } from 'next';
import { buildDescription, clampTitle } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Personal Style Library: Teach AI Your Writing Style',
  description: buildDescription(
    'Save short lyric samples in groups to teach our AI your unique writing style. Use your personal style when generating professional song or rap lyrics.'
  ),
  keywords: [
    'personal style library',
    'ai learns your style',
    'custom writing style',
    'lyric style training',
    'ai songwriting style',
    'lyric samples library',
  ],
  openGraph: {
    title: clampTitle('Personal Style Library: Teach AI Your Writing Style'),
    description: buildDescription(
      'Create style groups with short lyric samples so the AI writes in your voice and structure.'
    ),
    type: 'website',
    url: '/personal-style',
  },
  twitter: {
    card: 'summary',
    title: clampTitle('Personal Style Library: Teach AI Your Writing Style'),
    description: buildDescription('Make AI write in your voice using your private style samples.'),
  },
  alternates: {
    canonical: '/personal-style',
  },
  robots: { index: true, follow: true },
};

export default function PersonalStyleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

