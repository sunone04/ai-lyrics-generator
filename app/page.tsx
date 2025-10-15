import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon, LanguageIcon, PencilIcon } from '@heroicons/react/24/outline';
import LyricShowcase from '@/components/lyric-showcase';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: {
    absolute: 'Free AI Lyrics Generator – Create professional lyrics in seconds',
  },
  description:
    'Generate professional lyrics in seconds. Full control over style, mood, structure & rhyme. 3-day free trial. No credit card required.',
  alternates: { canonical: '/' },
};

export default function Home() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do I need to sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. A 3-day free trial is available for new users (sign-up required).',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use the generated lyrics commercially?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Commercial use is included in Pro plans. Free accounts are for personal projects.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I edit or rewrite specific lines?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Select any line or section and use AI to rewrite just that part.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you support rap lyrics and flow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can control rhyme options and song structure to fit rap flows and hooks.',
        },
      },
    ],
  } as const;
  return (
    <div className="min-h-screen">
      {/* Home page FAQ JSON-LD for richer SERP results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="relative bg-gradient-to-b from-white via-slate-50 to-white pt-10 pb-6 lg:pt-16 lg:pb-10">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              <span className="gradient-title">AI Lyrics Generator</span>
              <span className="block text-gray-900">Create Professional Song Lyrics & Rap Lyrics</span>
              <span className="block text-gray-700 text-xl md:text-4xl lg:text-5xl mt-2">with Advanced AI Technology</span>
            </h1>

            <div className="sm:hidden flex justify-center items-center mt-4 mb-6">
              <Link href="/generate" prefetch={false} className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.03] min-w-[220px]">
                Generate AI Lyrics Now
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>

            <p className="hidden sm:block text-xl md:text-2xl text-gray-600 mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed">
              The most advanced AI lyrics generator for musicians and songwriters. Create professional, commercially usable lyrics in any style.
              {' '}Explore our <Link href="/blog" prefetch={false} className="underline hover:text-blue-700">Blog</Link>, <Link href="/faq" prefetch={false} className="underline hover:text-blue-700">FAQ</Link>, or try the <Link href="/edit" prefetch={false} className="underline hover:text-blue-700">AI Lyrics Editor</Link>.
            </p>
            <p className="block sm:hidden text-base text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              Create professional lyrics in seconds. 100+ languages, all styles.
            </p>

            <div className="hidden sm:flex sm:flex-row gap-4 justify-center items-center mb-12 md:mb-16">
              <Link href="/generate" prefetch={false} className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-xl text-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:scale-110 min-w-[280px]">
                Generate AI Lyrics Now
                <ArrowRightIcon className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <p className="text-sm mt-[-4px] md:mt-[-8px] mb-8 md:mb-12">
              <span className="inline-block bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full px-4 py-1.5">
                New users get a 3-day free trial membership - no credit card required.
              </span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">30K+</div>
                <div className="text-gray-600 font-medium">Professional Singers Using</div>
              </div>
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2 whitespace-nowrap tracking-tight">Across All Styles</div>
                <div className="text-gray-600 font-medium">100+ Languages</div>
              </div>
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-3xl font-bold text-green-600 mb-2">Pro-Ready</div>
                <div className="text-gray-600 font-medium">Commercial Usage</div>
              </div>
            </div>
          </div>

          {/* Why Choose moved below lyric showcase */}
        </div>

        {/* Removed duplicate "Why Choose" block to avoid redundancy */}
      </section>

      

            {/* Minimalist dynamic lyrics showcase (new) and Why Choose moved below */}
      <LyricShowcase />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why Choose Our AI Lyrics Generator</h2>
          <p className="mt-3 text-gray-600 max-w-4xl mx-auto">
            Unlike most similar products, we use creatively advanced AI models and avoid clichés in the architecture to ensure it can generate high-quality professional lyrics. The lyrics are unique yet cohesive in rhythm, melody, and style.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div className="rounded-2xl p-6 bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Parameters, Easy to Use</h3>
            <p className="mt-2 text-gray-600">We have extremely detailed parameters that allow you to precisely control the lyrics generation results, but don't worry, it's very easy to get started.</p>
          </div>
          <div className="rounded-2xl p-6 bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-gray-900">Rewrite, Polish</h3>
            <p className="mt-2 text-gray-600">If you are generally satisfied with the lyrics but not with the details, you can refine certain parts of the lyrics through rewriting until you are satisfied.</p>
          </div>
          <div className="rounded-2xl p-6 bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-gray-900">Fresh, Specific Images</h3>
            <p className="mt-2 text-gray-600">Move past tired phrases and lean into concrete, sense‑driven details that fit your song.</p>
          </div>
          <div className="rounded-2xl p-6 bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-gray-900">Style Imitation</h3>
            <p className="mt-2 text-gray-600">If you already have your own style and works, you can use the 'personal style' feature to make the generator produce lyrics that perfectly match your unique style.</p>
          </div>
        </div>
      </section>

      {/* How-to section split from Why Choose */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">How To Use Our AI Lyrics Generator Like A Pro</h2>
          <p className="mt-3 text-gray-600 max-w-3xl mx-auto">Follow these three steps for consistent, production‑ready results.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-200">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
              <SparklesIcon className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">1. Set Your Vision</h3>
            <p className="text-gray-600">Pick language, genre, theme, structure, rhyme style, and any custom constraints.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-200">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
              <LanguageIcon className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">2. Generate Lyrics</h3>
            <p className="text-gray-600">Create high‑quality, original lyrics in seconds — then iterate if you want alternatives.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-200">
            <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
              <PencilIcon className="h-7 w-7 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">3. Edit & Perfect</h3>
            <p className="text-gray-600">Select any line or section and run an AI rewrite on just that part to get it exactly right.</p>
          </div>
        </div>
      </section>

      {/* Subtle pre-footer bridge to avoid abrupt ending */}
      <section className="mt-12 border-t border-slate-100 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
            <span className="px-3 py-1 rounded-full bg-white shadow-sm ring-1 ring-slate-200">Commercial usage ready</span>
            <span className="px-3 py-1 rounded-full bg-white shadow-sm ring-1 ring-slate-200">Privacy‑first storage</span>
            <span className="px-3 py-1 rounded-full bg-white shadow-sm ring-1 ring-slate-200">100+ languages</span>
          </div>
          <nav aria-label="secondary-actions" className="mt-5 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-sm text-gray-600">
            <span className="text-gray-500">Explore:</span>
            <Link href="/generate" prefetch={false} className="hover:text-gray-900 transition-colors">Generate Lyrics</Link>
            <span className="hidden md:inline text-slate-300">|</span>
            <Link href="/pricing" prefetch={false} className="hover:text-gray-900 transition-colors">Pricing</Link>
            <span className="hidden md:inline text-slate-300">|</span>
            <Link href="/faq" prefetch={false} className="hover:text-gray-900 transition-colors">FAQ</Link>
            <span className="hidden md:inline text-slate-300">|</span>
            <Link href="/contact" prefetch={false} className="hover:text-gray-900 transition-colors">Contact</Link>
          </nav>
        </div>
      </section>
    </div>
  );
}





