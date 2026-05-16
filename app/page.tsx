import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon, PencilIcon, MusicalNoteIcon, GlobeAltIcon, CpuChipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: {
    absolute: 'Best Free AI Lyrics Generator - Create Professional Lyrics in Seconds',
  },
  description:
    'Generate professional lyrics in seconds with AI Agent. Just describe your vision and get production-ready lyrics. 3-day free trial. No credit card required.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Best Free AI Lyrics Generator - Create Professional Lyrics in Seconds',
    description:
      'Generate professional lyrics in seconds with AI Agent. Just describe your vision and get production-ready lyrics. 3-day free trial. No credit card required.',
    type: 'website',
    url: '/',
    images: ['/female_singer.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Free AI Lyrics Generator - Create Professional Lyrics in Seconds',
    description:
      'Generate professional lyrics in seconds with AI Agent. Just describe your vision and get production-ready lyrics. 3-day free trial. No credit card required.',
    images: ['/female_singer.webp'],
  },
};

const FEATURES = [
  {
    icon: SparklesIcon,
    title: 'AI Agent',
    description: 'Describe your vision in natural language. No forms, no dropdowns.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: MusicalNoteIcon,
    title: 'Professional Quality',
    description: 'Production-ready lyrics with structure, rhyme, and emotional depth.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: GlobeAltIcon,
    title: '100+ Languages',
    description: 'Write in any language — English, Chinese, Spanish, Japanese, and more.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: CpuChipIcon,
    title: 'Gemini 2.5',
    description: 'Powered by Google\'s latest AI — Flash for speed, Pro for depth.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: PencilIcon,
    title: 'AI Editor',
    description: 'Select any line and rewrite with AI. Iterate until perfect.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Commercial Ready',
    description: 'Full commercial rights on Pro. Privacy-first with auto-cleanup.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
  },
];

export default function Home() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do I need to sign up?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. A 3-day free trial is available for new users (sign-up required).' },
      },
      {
        '@type': 'Question',
        name: 'Can I use the generated lyrics commercially?',
        acceptedAnswer: { '@type': 'Answer', text: 'Commercial use is included in Pro plans. Free accounts are for personal projects.' },
      },
      {
        '@type': 'Question',
        name: 'Can I edit or rewrite specific lines?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. Select any line or section and use AI to rewrite just that part.' },
      },
      {
        '@type': 'Question',
        name: 'Do you support rap lyrics and flow?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can control rhyme options and song structure to fit rap flows and hooks.' },
      },
    ],
  } as const;

  return (
    <div className="min-h-screen noise-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-medium mb-8">
            <SparklesIcon className="w-3 h-3" />
            Powered by Gemini 2.5
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            Write lyrics with
            <br />
            <span className="gradient-title">AI Agent</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Describe your song in natural language. The AI understands your creative vision and crafts professional lyrics.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/generate"
              prefetch={false}
              className="group inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Start Creating
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/edit"
              prefetch={false}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium border border-white/10 hover:border-white/20 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Lyrics Editor
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            3-day free trial · No credit card required
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Built for songwriters
            </h2>
            <p className="text-zinc-500 text-sm">
              Everything you need, nothing you don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className={`w-9 h-9 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-4 h-4 ${feature.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{feature.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Three steps to great lyrics
            </h2>
            <p className="text-zinc-500 text-sm">
              From idea to production-ready in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Describe', desc: 'Tell the AI Agent your vision — genre, mood, theme, language, or just a feeling.', color: 'text-violet-400' },
              { num: '02', title: 'Generate', desc: 'The Agent crafts professional lyrics with proper structure, rhyme, and flow.', color: 'text-cyan-400' },
              { num: '03', title: 'Refine', desc: 'Use the AI Editor to rewrite any section until every word is perfect.', color: 'text-amber-400' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className={`text-5xl font-black ${step.color} opacity-20 mb-3`}>
                  {step.num}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-6">
          <div className="relative rounded-2xl border border-violet-500/20 bg-violet-600/5 p-10 md:p-14 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Start writing today
              </h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
                3-day free trial. No credit card required. Create professional lyrics with AI.
              </p>
              <Link
                href="/generate"
                prefetch={false}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started Free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <section className="border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600">
            <Link href="/generate" prefetch={false} className="hover:text-zinc-400 transition-colors">Generate</Link>
            <Link href="/pricing" prefetch={false} className="hover:text-zinc-400 transition-colors">Pricing</Link>
            <Link href="/faq" prefetch={false} className="hover:text-zinc-400 transition-colors">FAQ</Link>
            <Link href="/blog" prefetch={false} className="hover:text-zinc-400 transition-colors">Blog</Link>
            <Link href="/contact" prefetch={false} className="hover:text-zinc-400 transition-colors">Contact</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
