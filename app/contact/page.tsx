import { Metadata } from 'next';
import Link from 'next/link';
import { EnvelopeIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the AI Lyrics Generator team. We\'re here to help with any questions or support needs.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">Home</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">Contact</span>
        </nav>
        
        <div className="mt-8">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Contact Us
            </h1>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Have questions or need support? We&apos;re here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-violet-400/10 flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">General Support</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Need help with your account, subscriptions, or using our features?
              </p>
              <a
                href="mailto:sun@ai-lyrics-generator.net"
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                sun@ai-lyrics-generator.net
              </a>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Business Inquiries</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Partnerships, enterprise solutions, or media inquiries.
              </p>
              <a
                href="mailto:sun@ai-lyrics-generator.net"
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                sun@ai-lyrics-generator.net
              </a>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                <QuestionMarkCircleIcon className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Feedback & Ideas</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Share your thoughts on how we can improve our service.
              </p>
              <a
                href="mailto:sun@ai-lyrics-generator.net"
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                sun@ai-lyrics-generator.net
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 mb-6">
            <h2 className="text-lg font-bold text-white mb-6 text-center">
              Before You Contact Us
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Quick Answers</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-zinc-300">How do I cancel my subscription?</h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      You can cancel anytime from your account dashboard. Your access continues until the end of your billing period.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-zinc-300">Why are my lyrics deleted after 3 days?</h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      For privacy protection, unfavorited lyrics are automatically deleted. Use the favorite feature to keep lyrics permanently.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-zinc-300">Can I use generated lyrics commercially?</h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      Premium subscribers have full commercial usage rights. Free users can use lyrics for personal projects only.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Helpful Resources</h3>
                <div className="space-y-2">
                  <a href="/faq" className="block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Comprehensive FAQ
                  </a>
                  <a href="/terms" className="block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Terms of Service
                  </a>
                  <a href="/privacy" className="block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Privacy Policy
                  </a>
                  <Link href="/blog" prefetch={false} className="block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Songwriting Tips & Guides
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-6 text-center">
            <h3 className="text-sm font-semibold text-white mb-2">Response Times</h3>
            <p className="text-xs text-zinc-500">
              We typically respond to all inquiries within 24 hours during business days. 
              Premium subscribers receive priority support with faster response times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
