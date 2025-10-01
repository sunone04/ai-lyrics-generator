import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, SparklesIcon, LanguageIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-10 lg:py-24">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl" />

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
                New users get a 3-day free trial membership — no credit card required.
              </span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">30K+</div>
                <div className="text-gray-600 font-medium">Professional Singers Using</div>
              </div>
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-3xl font-bold text-purple-600 mb-2">100+ Languages</div>
                <div className="text-gray-600 font-medium">Across All Styles</div>
              </div>
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-3xl font-bold text-green-600 mb-2">Pro-Ready</div>
                <div className="text-gray-600 font-medium">Commercial Usage</div>
              </div>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <SparklesIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">1. Set Your Vision</h3>
              <p className="text-gray-600">Choose language, genre, theme, structure, and more. Add any custom details.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <LanguageIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Generate Lyrics</h3>
              <p className="text-gray-600">Get high-quality, original lyrics in seconds - tailored to your inputs.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <PencilIcon className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">3. Edit & Perfect</h3>
              <p className="text-gray-600">Polish sections with AI rewrites or manual edits. Download when ready.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Our Lyric Generator?</h3>
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-lg text-gray-700 leading-relaxed">
              Our model is the most professional AI model for lyrics and music out there. It's been trained on a massive dataset of existing lyrics from all sorts of genres and styles. It uses NLP technology to understand your creative vision and style, and then generates perfectly original and creative lyrics. It's great for both amateurs and professional musicians, and the lyrics are ready for commercial use.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.1),transparent_50%)] pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-8 border border-blue-200">
              <SparklesIcon className="w-5 h-5 mr-2" />
              Real Artists, Real Results
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Professional Artists
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Worldwide</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI lyrics generator and rap lyrics generator are helping artists create chart-topping hits
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="group relative">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl">
                <div className="flex items-center mb-6">
                  <Image src="/female_singer.webp" alt="Maya Rodriguez - Professional Singer" width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">Maya Rodriguez</h4>
                    <p className="text-blue-600 font-medium">Pop Singer & Songwriter</p>
                <div className="flex text-yellow-500 text-sm mt-1" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  </div>
                </div>
                <blockquote className="text-gray-700 leading-relaxed mb-6">
                  "I was struggling with writer's block for months. This AI lyrics generator completely changed my creative process. The song lyrics it generates are so authentic and emotionally resonant - my latest single hit #3 on the charts!"
                </blockquote>
                <div className="text-sm text-gray-500">"Perfect for overcoming creative blocks and finding fresh inspiration"</div>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl">
                <div className="flex items-center mb-6">
                  <Image src="/male_singer.webp" alt="Jordan Blake - R&B Artist" width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">Jordan Blake</h4>
                    <p className="text-purple-600 font-medium">Music Producer</p>
                <div className="flex text-yellow-500 text-sm mt-1" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  </div>
                </div>
                <blockquote className="text-gray-700 leading-relaxed mb-6">
                  "As an independent artist, I need professional-quality lyrics fast. This AI lyric generator delivers every time, with incredible results. The multi-language support helped me break into international markets. My streaming numbers doubled!"
                </blockquote>
                <div className="text-sm text-gray-500">"Essential tool for independent artists and international expansion"</div>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl">
                <div className="flex items-center mb-6">
                  <Image src="/rapper_singer.webp" alt="Marcus King - Hip-Hop Artist" width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">Marcus "MK" King</h4>
                    <p className="text-pink-600 font-medium">Hip-Hop Artist & Rapper</p>
                <div className="flex text-yellow-500 text-sm mt-1" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  </div>
                </div>
                <blockquote className="text-gray-700 leading-relaxed mb-6">
                  "This rap lyrics generator is insane! The flow, the wordplay, the authenticity - it gets hip-hop culture. I've been using it for my freestyle sessions and studio work. My fans can't tell the difference! It's a cheat code for the industry!"
                </blockquote>
                <div className="text-sm text-gray-500">"Game-changer for rap artists and hip-hop producers"</div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">30K+</div>
                <div className="text-gray-600 text-sm">Professional Artists</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">500M+</div>
                <div className="text-gray-600 text-sm">Streams Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">50+</div>
                <div className="text-gray-600 text-sm">Chart Hits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99%</div>
                <div className="text-gray-600 text-sm">Artist Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
