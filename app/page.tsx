import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, SparklesIcon, LanguageIcon, PencilIcon, ShareIcon } from '@heroicons/react/24/outline';
import { SITE_CONFIG } from '@/lib/constants';

// 强制静态生成 - 首页内容变化缓慢
export const dynamic = 'force-static';

// Metadata moved to layout.tsx for client component

export default function Home() {
  // 首页完全静态，无需状态管理

  return (
    <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-16 lg:py-24">
          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Main SEO-Optimized Heading */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="gradient-title">
                  AI Lyrics Generator
                </span>
                <span className="block text-gray-900">
                  Create Professional Song Lyrics & Rap Lyrics
                </span>
                <span className="block text-gray-700 text-3xl md:text-4xl lg:text-5xl mt-2">
                  with Advanced AI Technology
                </span>
              </h1>
              
              {/* SEO-Rich Subtitle */}
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                The most advanced AI lyrics generator and rap lyrics generator for musicians, rappers, and songwriters. 
                Create professional song lyrics, rap verses, and hip-hop lyrics in 100+ languages with our cutting-edge AI lyric generator technology.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Link
                  href="/generate"
                  prefetch={false}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-xl text-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:scale-110 min-w-[280px]"
                >
                  Generate AI Lyrics Now
                  <ArrowRightIcon className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>

              </div>
              <p className="text-sm text-gray-600 mt-[-8px] mb-12">
                New users get a 3-day free trial membership — no credit card required.
              </p>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-3xl font-bold text-blue-600 mb-2">30K+</div>
                  <div className="text-gray-600 font-medium">Professional Singers Using</div>
                </div>
                <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-3xl font-bold text-purple-600 mb-2">100K+</div>
                  <div className="text-gray-600 font-medium">Songs Created</div>
                </div>
                <div className="text-center p-6 bg-white/64 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-3xl font-bold text-pink-600 mb-2">99%</div>
                  <div className="text-gray-600 font-medium">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>


      {/* How Our AI Lyric Generator Works & Professional Artist Testimonials */}
      <section className="relative py-24 bg-gradient-to-br from-white via-blue-50 to-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Simple & Powerful Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How Our AI Lyrics Generator 
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Creates Professional Music
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From rap lyrics to song lyrics, our AI lyric generator transforms your ideas into professional-quality content in three simple steps
            </p>
          </div>

          <div className="relative">
            {/* Connection lines */}
            <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="relative group">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                      1
                    </div>
                  </div>
                  <div className="pt-6">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <SparklesIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Choose Your Style</h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      We provide over a dozen customizable parameters for you to choose from. Whatever your needs and ideas, we can satisfy them all. From genre and theme to language and style - every detail is under your control.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="pt-6">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <PencilIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">AI Generates Lyrics</h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      Our AI model receives your parameters and understands your creative intent, then creates original, high-quality lyrics within seconds. Perfect for rappers, songwriters, music producers, and artists of all levels.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="pt-6">
                    <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <LanguageIcon className="h-8 w-8 text-pink-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Edit & Perfect</h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      Edit the generated lyrics or use AI to rewrite specific parts according to your requirements. Adjust until you're completely satisfied, then download them ready for recording.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Description */}
          <div className="mt-20 bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Our Lyric Generator?</h3>
            <div className="max-w-6xl mx-auto text-center">
              <p className="text-lg text-gray-700 leading-relaxed">
                Our model is the most professional AI model for lyrics and music out there. It's been trained on a massive dataset of existing lyrics from all sorts of genres and styles. It uses NLP technology to understand your creative vision and style, and then generates perfectly original and creative lyrics. It's great for both amateurs and professional musicians, and the lyrics are ready for commercial use.
              </p>
            </div>
          </div>
        </div>

        {/* Professional Artist Testimonials - Same Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 relative">
          {/* Background elements - positioned relative to this container */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.1),transparent_50%)] pointer-events-none"></div>
        
          <div className="relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-8 border border-blue-200">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Real Artists, Real Results
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Trusted by Professional Artists
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Worldwide
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how our AI lyrics generator and rap lyrics generator are helping artists create chart-topping hits
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 - Female Singer */}
              <div className="group relative">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl">
                  <div className="flex items-center mb-6">
                    <Image 
                      src="/female_singer.webp" 
                      alt="Maya Rodriguez - Professional Singer" 
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="ml-4">
                      <h4 className="text-xl font-bold text-gray-900">Maya Rodriguez</h4>
                      <p className="text-blue-600 font-medium">Pop Singer & Songwriter</p>
                      <div className="flex text-yellow-500 text-sm mt-1">
                        ★★★★★
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 leading-relaxed mb-6">
                    "I was struggling with writer's block for months. This AI lyrics generator completely changed my creative process. The song lyrics it generates are so authentic and emotionally resonant - my latest single hit #3 on the charts!"
                  </blockquote>
                  <div className="text-sm text-gray-500">
                    "Perfect for overcoming creative blocks and finding fresh inspiration"
                  </div>
                </div>
              </div>

              {/* Testimonial 2 - Male Singer */}
              <div className="group relative">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl">
                  <div className="flex items-center mb-6">
                    <Image 
                      src="/male_singer.webp" 
                      alt="Jordan Blake - R&B Artist" 
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="ml-4">
                                          <h4 className="text-xl font-bold text-gray-900">Jordan Blake</h4>
                    <p className="text-purple-600 font-medium">Music Producer</p>
                      <div className="flex text-yellow-500 text-sm mt-1">
                        ★★★★★
                      </div>
                    </div>
                  </div>
                                  <blockquote className="text-gray-700 leading-relaxed mb-6">
                  "As an independent artist, I need professional-quality lyrics fast. This AI lyric generator delivers every time, with incredible results. The multi-language support helped me break into international markets. My streaming numbers doubled!"
                </blockquote>
                  <div className="text-sm text-gray-500">
                    "Essential tool for independent artists and international expansion"
                  </div>
                </div>
              </div>

              {/* Testimonial 3 - Rapper */}
              <div className="group relative">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl">
                  <div className="flex items-center mb-6">
                    <Image 
                      src="/rapper_singer.webp" 
                      alt="Marcus King - Hip-Hop Artist" 
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="ml-4">
                      <h4 className="text-xl font-bold text-gray-900">Marcus "MK" King</h4>
                      <p className="text-pink-600 font-medium">Hip-Hop Artist & Rapper</p>
                      <div className="flex text-yellow-500 text-sm mt-1">
                        ★★★★★
                      </div>
                    </div>
                  </div>
                                  <blockquote className="text-gray-700 leading-relaxed mb-6">
                  "This rap lyrics generator is insane! The flow, the wordplay, the authenticity - it gets hip-hop culture. I've been using it for my freestyle sessions and studio work. My fans can't tell the difference! It's a cheat code for the industry!"
                </blockquote>
                  <div className="text-sm text-gray-500">
                    "Game-changer for rap artists and hip-hop producers"
                  </div>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
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
        </div>

      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100"></div>
        <div className="absolute inset-0 bg-white/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your 
            <span className="block bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Musical Ideas?
            </span>
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of musicians and songwriters who trust our AI to help them create 
            professional-quality lyrics. Start your creative journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/generate"
              prefetch={false}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center shadow-2xl transform hover:scale-105"
            >
              Start Creating Now
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>

          <div className="mt-12 text-gray-600 text-sm">
            ✨ No credit card required • Start with 3 free generations daily
          </div>
        </div>
      </section>
    </div>
  );
}
