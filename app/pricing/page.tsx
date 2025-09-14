import { Metadata } from 'next'
import PricingCard from '@/components/pricing/pricing-card'
import { CheckIcon } from '@heroicons/react/24/outline'

// 强制静态生成 - 定价信息变化缓慢
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Pricing - AI Lyrics Generator | Choose Your Plan',
  description: 'Choose the perfect plan for your songwriting needs. Start free or upgrade to unlock unlimited AI lyrics generation and advanced features.',
  keywords: 'ai lyrics generator pricing, songwriting subscription, music lyrics plan',
  openGraph: {
    title: 'Pricing - AI Lyrics Generator',
    description: 'Choose the perfect plan for your songwriting needs. Start free or upgrade to unlock unlimited AI lyrics generation.',
    type: 'website',
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
      'Basic AI model ',
      'Up to 3 favorite lyrics',
      '24-hour storage for generated lyrics',
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
      'Advanced AI model ',
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
      'Advanced AI model ',
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
  // FAQPage JSON-LD for rich results (does not affect UI)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "About Our Payment System",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Our payment system and pages are completely provided by international payment service provider Paddle. It has excellent security and stability guarantees, and in order to comply with global tax and financial compliance requirements, its system lists all countries and regions according to international standards, which aims to comply with payment and tax regulations in different regions."
        }
      },
      {
        "@type": "Question",
        name: "Can I cancel my subscription anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your current billing period."
        }
      },
      {
        "@type": "Question",
        name: "What happens to my generated lyrics if I cancel?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Your favorite lyrics will be permanently saved. Non-favorited lyrics will be automatically deleted after 24 hours for privacy protection."
        }
      },
      {
        "@type": "Question",
        name: "Can I upgrade or downgrade my plan?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle."
        }
      },
      {
        "@type": "Question",
        name: "Do you offer refunds?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days of your purchase for a full refund."
        }
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Paddle, a trusted payment processor."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <div className="pt-32 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1]">
            Simple, Transparent
            <span className="block gradient-title descender-fix mt-2">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            AI Lyrics Generator pricing: start free and upgrade anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <div className="inline-block bg-green-50 text-green-700 border border-green-200 rounded-md px-4 py-2 text-sm">
            New users get a 3-day free trial (no credit card required)
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                About Our Payment System
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our payment system and pages are completely provided by international payment service provider Paddle.
                It has excellent security and stability guarantees, and in order to comply with global tax and financial
                compliance requirements, its system lists all countries and regions according to international standards,
                which aims to comply with payment and tax regulations in different regions.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features
                until the end of your current billing period.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What happens to my generated lyrics if I cancel?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your favorite lyrics will be permanently saved. Non-favorited lyrics will be automatically deleted after
                24 hours for privacy protection.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your
                next billing cycle.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within
                30 days of your purchase for a full refund.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through
                Paddle, a trusted payment processor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
