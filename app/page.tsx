import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon, PencilIcon, MusicalNoteIcon, GlobeAltIcon, CpuChipIcon, ShieldCheckIcon, CommandLineIcon, LanguageIcon, HeartIcon, BoltIcon } from '@heroicons/react/24/outline';
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
    description: 'Describe your vision in natural language. No forms, no dropdowns — just talk to the AI.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    glow: 'group-hover:shadow-violet-500/10',
  },
  {
    icon: MusicalNoteIcon,
    title: 'Professional Quality',
    description: 'Production-ready lyrics with proper structure, rhyme schemes, and emotional depth.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    glow: 'group-hover:shadow-cyan-500/10',
  },
  {
    icon: GlobeAltIcon,
    title: '100+ Languages',
    description: 'Write in any language — English, Chinese, Spanish, Japanese, Korean, and more.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  {
    icon: PencilIcon,
    title: 'AI Editor',
    description: 'Select any line and rewrite with AI. Iterate on sections until every word is perfect.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    glow: 'group-hover:shadow-rose-500/10',
  },
  {
    icon: BoltIcon,
    title: 'Lightning Fast',
    description: 'Streaming output delivers results in real time. See your lyrics appear as the AI writes.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    glow: 'group-hover:shadow-amber-500/10',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Commercial Ready',
    description: 'Full commercial rights on Pro plans. Privacy-first with automatic data cleanup.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    glow: 'group-hover:shadow-indigo-500/10',
  },
];

const GENRES = [
  { name: 'Pop', emoji: '🎵', desc: 'Catchy hooks & melodies' },
  { name: 'Hip-Hop', emoji: '🎤', desc: 'Bars, flow & punchlines' },
  { name: 'R&B', emoji: '💜', desc: 'Smooth & soulful vibes' },
  { name: 'Rock', emoji: '🎸', desc: 'Raw energy & anthems' },
  { name: 'Country', emoji: '🤠', desc: 'Storytelling & heartland' },
  { name: 'Folk', emoji: '🎻', desc: 'Intimate & acoustic' },
  { name: 'Electronic', emoji: '🎹', desc: 'Beats & drops' },
  { name: 'Jazz', emoji: '🎷', desc: 'Improvisation & swing' },
];

const STATS = [
  { value: '100K+', label: 'Lyrics Generated' },
  { value: '100+', label: 'Languages' },
  { value: '30+', label: 'Genres & Styles' },
  { value: '<5s', label: 'First Output' },
];

const TESTIMONIALS = [
  {
    quote: 'The AI Agent understood exactly what I wanted. I described a moody R&B track about late-night thoughts and got perfect lyrics in seconds.',
    author: 'Marcus J.',
    role: 'Indie Artist',
    color: 'border-violet-500/20',
  },
  {
    quote: 'As a producer, I need lyrics fast. This tool delivers professional-quality results every time. The Editor feature is a game-changer.',
    author: 'Sarah K.',
    role: 'Music Producer',
    color: 'border-cyan-500/20',
  },
  {
    quote: 'I write in both English and Mandarin. Having an AI that handles multiple languages seamlessly is incredible.',
    author: 'Wei L.',
    role: 'Singer-Songwriter',
    color: 'border-emerald-500/20',
  },
];

const DEMO_CONVERSATION = [
  { role: 'user', text: 'Write a dreamy indie-pop song about getting lost in Tokyo at night' },
  { role: 'agent', text: 'Verse 1\nNeon rivers running through the maze\nLost my map but found a brighter place\nVending machine light, my only guide\nShibuya crossing, nowhere to hide\n\nPre-Chorus\nAnd I don\'t wanna find my way back home\nThese midnight streets are where I roam\n\nChorus\nI\'m lost in Tokyo, lost in you\nEvery neon sign spells something true...' },
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
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-600/8 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-rose-600/4 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            Write lyrics with
            <br />
            <span className="gradient-title descender-fix">AI Agent</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your song in natural language. The AI understands your creative vision
            and crafts professional lyrics with structure, rhyme, and emotion.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/generate"
              prefetch={false}
              className="group inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:-translate-y-0.5"
            >
              Start Creating — Free
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/edit"
              prefetch={false}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white px-8 py-4 rounded-xl text-sm font-medium border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5"
            >
              <PencilIcon className="w-4 h-4" />
              Try the Editor
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            3-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 text-[11px] text-zinc-600 font-mono">AI Agent</span>
            </div>
            <div className="p-5 space-y-4">
              {DEMO_CONVERSATION.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? '' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-violet-600/20 text-violet-400'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className={`text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user' ? 'text-zinc-300' : 'text-zinc-400'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 text-zinc-600">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs">AI is writing...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-title descender-fix mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for songwriters
            </h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              Everything you need to go from idea to production-ready lyrics — nothing you don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`group p-6 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:shadow-lg ${feature.glow}`}
              >
                <div className={`w-10 h-10 ${feature.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-cyan-400 tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Three steps to great lyrics
            </h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              From idea to production-ready in minutes, not hours.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  num: '01',
                  title: 'Describe',
                  desc: 'Tell the AI Agent your vision — genre, mood, theme, language, or just a feeling. Be as specific or open-ended as you like.',
                  color: 'text-violet-400',
                  border: 'border-violet-500/20',
                  bg: 'bg-violet-500/5',
                },
                {
                  num: '02',
                  title: 'Generate',
                  desc: 'The Agent crafts professional lyrics with proper structure, rhyme, and flow. Streaming output so you see results in real time.',
                  color: 'text-cyan-400',
                  border: 'border-cyan-500/20',
                  bg: 'bg-cyan-500/5',
                },
                {
                  num: '03',
                  title: 'Refine',
                  desc: 'Use the AI Editor to select any section and rewrite it. Iterate until every word captures your vision perfectly.',
                  color: 'text-amber-400',
                  border: 'border-amber-500/20',
                  bg: 'bg-amber-500/5',
                },
              ].map((step) => (
                <div key={step.num} className={`relative p-8 rounded-xl border ${step.border} ${step.bg}`}>
                  <div className={`text-6xl font-black ${step.color} opacity-15 mb-4`}>
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-emerald-400 tracking-widest uppercase mb-3">Genres</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Every genre, every style
            </h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              From pop hooks to rap bars — the AI adapts to your sound.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GENRES.map((genre) => (
              <div
                key={genre.name}
                className="group p-5 rounded-xl border border-white/5 hover:border-violet-500/20 bg-white/[0.02] hover:bg-violet-500/5 transition-all duration-300 text-center hover:-translate-y-0.5"
              >
                <div className="text-2xl mb-2">{genre.emoji}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{genre.name}</h3>
                <p className="text-[11px] text-zinc-600">{genre.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-rose-400 tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Loved by songwriters
            </h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              Hear from artists and producers who use Lyrica every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className={`p-7 rounded-xl border ${t.color} bg-white/[0.02] hover:bg-white/[0.04] transition-colors`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-xs font-bold text-white">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.author}</p>
                    <p className="text-[11px] text-zinc-600">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative rounded-2xl border border-violet-500/20 bg-violet-600/5 p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[150px] bg-cyan-600/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start writing today
              </h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
                Join thousands of songwriters using AI to create professional lyrics.
                3-day free trial. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/generate"
                  prefetch={false}
                  className="group inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/pricing"
                  prefetch={false}
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white px-8 py-4 rounded-xl text-sm font-medium border border-white/10 hover:border-white/20 transition-all"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <section className="border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-zinc-600">
            <Link href="/generate" prefetch={false} className="hover:text-zinc-400 transition-colors">Generate</Link>
            <Link href="/edit" prefetch={false} className="hover:text-zinc-400 transition-colors">Editor</Link>
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
