import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { EnvelopeIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// 强制静态生成 - 联系页面内容变化缓慢
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the AI Lyrics Generator team. We\'re here to help with any questions or support needs.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions or need support? We&apos;re here to help you create amazing lyrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Support */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">General Support</h3>
              <p className="text-gray-600 mb-4">
                Need help with your account, subscriptions, or using our features?
              </p>
              <a
                href="mailto:sun@ai-lyrics-generator.net"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                sun@ai-lyrics-generator.net
              </a>
            </div>

            {/* Business */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Inquiries</h3>
              <p className="text-gray-600 mb-4">
                Partnerships, enterprise solutions, or media inquiries.
              </p>
              <a
                href="mailto:sun@ai-lyrics-generator.net"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                sun@ai-lyrics-generator.net
              </a>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <QuestionMarkCircleIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback & Ideas</h3>
              <p className="text-gray-600 mb-4">
                Share your thoughts on how we can improve our service.
              </p>
              <a
                href="mailto:sun@ai-lyrics-generator.net"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                sun@ai-lyrics-generator.net
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Before You Contact Us
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Answers</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">How do I cancel my subscription?</h4>
                    <p className="text-gray-600 text-sm">
                      You can cancel anytime from your account dashboard. Your access continues until the end of your billing period.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Why are my lyrics deleted after 24 hours?</h4>
                    <p className="text-gray-600 text-sm">
                      For privacy protection, unfavorited lyrics are automatically deleted. Use the favorite feature to keep lyrics permanently.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Can I use generated lyrics commercially?</h4>
                    <p className="text-gray-600 text-sm">
                      Premium subscribers have full commercial usage rights. Free users can use lyrics for personal projects only.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Helpful Resources</h3>
                <div className="space-y-3">
                  <a
                    href="/faq"
                    className="block text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    → Comprehensive FAQ
                  </a>

                  <a
                    href="/terms"
                    className="block text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    → Terms of Service
                  </a>
                  <a
                    href="/privacy"
                    className="block text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    → Privacy Policy
                  </a>
                  <Link
                    href="/blog"
                    className="block text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    → Songwriting Tips & Guides
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Times</h3>
            <p className="text-gray-600">
              We typically respond to all inquiries within 24 hours during business days. 
              Premium subscribers receive priority support with faster response times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}