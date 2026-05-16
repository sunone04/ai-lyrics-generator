import { Metadata } from 'next'
import PricingCard from '@/components/pricing/pricing-card'
import Breadcrumbs from '@/components/ui/breadcrumbs'

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: { absolute: 'AI Lyrics Generator Pricing & Plans – 3-Day Free Trial' },
  description: 'Choose the right plan for your songwriting. Start free or upgrade to unlock more AI lyric generations and advanced features.',
  keywords: 'ai lyrics generator pricing, songwriting subscription, music lyrics plan',
  openGraph: {
    title: 'AI Lyrics Generator Pricing & Plans – 3-Day Free Trial',
    description: 'Choose the right plan for your songwriting. Start free or upgrade to unlock more AI lyric generations and advanced features.',
    type: 'website',
  },
  alternates: {
    canonical: '/pricing',
  },
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Start your songwriting journey with AI-powered lyrics',
    features: [
      '1 AI lyrics generation per day',
      '1 partial optimization per day',
      'Basic AI model',
      'Up to 3 favorite lyrics',
      'Generated lyrics stored up to 3 days',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
    priceId: null,
  },
  {
    name: 'Monthly Pro',
    price: '$19.90',
    period: 'per month',
    description: 'Unlock unlimited creativity for serious songwriters',
    features: [
      '30 AI lyrics generations per day',
      '30 partial optimizations per day',
      'Advanced AI model',
      'Personal Style Library (Your unique style)',
      'AI learns your unique writing style',
      'Up to 300 favorite lyrics',
      'Commercial usage rights',
      'Manual lyrics editing',
      'Audio preview feature',
      'Priority support',
      'Total of 900 generations per month',
    ],
    cta: 'Start Monthly',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID as string | null,
  },
  {
    name: 'Annual Pro',
    price: '$199',
    period: 'per year',
    description: 'The ultimate choice for professional musicians',
    features: [
      '30 AI lyrics generations per day',
      '30 partial optimizations per day',
      'Advanced AI model',
      'Personal Style Library (Your unique style)',
      'AI learns your unique writing style',
      'Up to 300 favorite lyrics',
      'Commercial usage rights',
      'Manual lyrics editing',
      'Audio preview feature',
      'Priority support',
      '18% discount compared to monthly',
      'Total of 10,800 generations per year',
    ],
    cta: 'Start Annual',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID as string | null,
  },
]

export default function PricingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "About Our Payment System",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our payment system and pages are completely provided by international payment service provider Paddle. It has excellent security and stability guarantees, and in order to comply with global tax and financial compliance requirements, its system lists all countries and regions according to international standards."
        }
      },
      {
        "@type": "Question",
        name: "Can I cancel my subscription anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your current billing period."
        }
      },
      {
        "@type": "Question",
        name: "What happens to my generated lyrics if I cancel?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your favorite lyrics will be permanently saved. Non-favorited lyrics will be automatically deleted after 3 days for privacy protection."
        }
      },
      {
        "@type": "Question",
        name: "Do you offer refunds?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days of your purchase for a full refund."
        }
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Paddle."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen noise-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="pt-28 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]">
            Simple, Transparent
            <span className="block gradient-title descender-fix mt-2">
              Pricing
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-3xl mx-auto mb-4">
            Start free and upgrade anytime.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <div className="inline-block text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-lg px-4 py-2 text-sm">
            New users get a 3-day free trial (no credit card required)
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 text-sm">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'About Our Payment System',
                a: 'Our payment system and pages are completely provided by international payment service provider Paddle. It has excellent security and stability guarantees, and in order to comply with global tax and financial compliance requirements, its system lists all countries and regions according to international standards.'
              },
              {
                q: 'Can I cancel my subscription anytime?',
                a: "Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your current billing period."
              },
              {
                q: 'What happens to my generated lyrics if I cancel?',
                a: 'Your favorite lyrics will be permanently saved. Non-favorited lyrics will be automatically deleted after 3 days for privacy protection.'
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.'
              },
              {
                q: 'Do you offer refunds?',
                a: "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days of your purchase for a full refund."
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Paddle, a trusted payment processor.'
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
