import { Metadata } from 'next'
import PricingCard from '@/components/pricing/pricing-card'
import { CheckIcon } from '@heroicons/react/24/outline'

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
      '2 AI lyrics generations per day',
      '1 partial optimization per day',
      'Basic AI model',
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
      'Advanced AI model',
      'Up to 1000 favorite lyrics',
      'Commercial usage rights',
      'Manual lyrics editing',
      'Audio preview feature',
      'Priority support',
      'Total of 1,800 generations per month',
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
      'Up to 1000 favorite lyrics',
      'Commercial usage rights',
      'Manual lyrics editing',
      'Audio preview feature',
      'Priority support',
      '18% discount compared to monthly',
      'Total of 21,600 generations per year',
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
            "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
        }
      },
      {
        "@type": "Question",
        name: "Is there a money-back guarantee?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days for a full refund."
        }
      }
    ]
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* SEO: FAQPage structured data (no UI impact) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Start creating amazing lyrics today. Choose the plan that fits your songwriting needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-10">
            <div>
              <dt className="text-lg font-semibold text-gray-900">
                About Our Payment System
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Our payment system and pages are completely provided by international payment service provider Paddle. It has excellent security and stability guarantees, and in order to comply with global tax and financial compliance requirements, its system lists all countries and regions according to international standards, which aims to comply with payment and tax regulations in different regions.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-gray-900">
                Can I cancel my subscription anytime?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your current billing period.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-gray-900">
                What happens to my generated lyrics if I cancel?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Your favorite lyrics will be permanently saved. Non-favorited lyrics will be automatically deleted after 24 hours for privacy protection.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-gray-900">
                Can I upgrade or downgrade my plan?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-gray-900">
                Is there a money-back guarantee?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days for a full refund.
              </dd>
            </div>
          </dl>
        </div>

        {/* Trust Indicators */}
        <div className="mx-auto mt-24 max-w-4xl text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <CheckIcon className="h-5 w-5 text-green-500" />
              <span>Secure payment processing by Paddle</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <CheckIcon className="h-5 w-5 text-green-500" />
              <span>Money-back guarantee</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <CheckIcon className="h-5 w-5 text-green-500" />
              <span>Cancel anytime, no questions asked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
