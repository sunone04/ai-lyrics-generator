import { Metadata } from 'next';
// Static breadcrumb to avoid client-side JS

// 强制静态生成 - 退款政策内容变化缓慢
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Our refund policy and terms for AI Lyrics Generator services.',
  alternates: {
    canonical: '/refund',
  },
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <a href="/" className="hover:text-gray-700">Home</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Refund</span>
        </nav>
        
        <div className="mt-8 bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-black mb-8">Refund Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-black mb-6">
              At AI Lyrics Generator, we want you to be completely satisfied with your purchase. 
              We offer a simple and fair refund policy to ensure your peace of mind.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-black mb-3">
                🕐 24-Hour Refund Guarantee
              </h2>
              <p className="text-black">
                <strong>Full refunds are available within 24 hours of your initial purchase.</strong> 
                No questions asked, no complicated procedures.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-black mb-4">Refund Eligibility</h2>
            
            
            <h3 className="text-xl font-semibold text-black mb-3">Eligible for Full Refund:</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Requests made within 24 hours of purchase</li>
              <li>Technical issues preventing service access</li>
              <li>Service not meeting described functionality</li>
              <li>Accidental duplicate purchases</li>
              <li>Billing errors or unauthorized charges</li>
            </ul>
            

            <h3 className="text-xl font-semibold text-black mb-3">Not Eligible for Refund:</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Requests made after 24 hours from purchase</li>
              <li>Change of mind after using the service extensively</li>
              <li>Violation of our Terms of Service</li>
              <li>Requests for partial refunds on monthly subscriptions</li>
            </ul>

            <h2 className="text-2xl font-semibold text-black mb-4">How to Request a Refund</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-black mb-3">📧 Contact Us</h3>
              <p className="text-black mb-3">
                To request a refund, please email us at:
              </p>
              <p className="text-lg font-semibold text-blue-600">
                <a href="mailto:sun@ai-lyrics-generator.net" className="hover:text-blue-500">
                  sun@ai-lyrics-generator.net
                </a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-black mb-3">Required Information:</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Your email address used for the purchase</li>
              <li>Order/Transaction ID (if available)</li>
              <li>Date of purchase</li>
              <li>Reason for refund request</li>
              <li>Any relevant screenshots or error messages</li>
            </ul>

            <h2 className="text-2xl font-semibold text-black mb-4">Refund Processing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-black mb-2">⏱️ Processing Time</h3>
                <p className="text-black">
                  Refunds are typically processed within 1-2 business days after approval.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-black mb-2">💳 Refund Method</h3>
                <p className="text-black">
                  Refunds will be issued to the original payment method used for the purchase.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-black mb-4">Subscription Cancellations</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-black mb-3">🔄 Monthly Subscriptions</h3>
              <p className="text-black mb-3">
                Our premium subscriptions automatically renew monthly. You can:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Cancel anytime from your account dashboard</li>
                <li>Continue using the service until the end of your billing period</li>
                <li>Request a refund within 24 hours of renewal</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-black mb-4">Special Circumstances</h2>
            
            <p className="text-black mb-4">
              We understand that exceptional circumstances may arise. If you have a unique situation 
              that falls outside our standard policy, please contact us. We review each case individually 
              and may offer solutions on a case-by-case basis.
            </p>

            <h2 className="text-2xl font-semibold text-black mb-4">Contact Information</h2>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-black mb-2">
                <strong>Email:</strong> 
                <a href="mailto:sun@ai-lyrics-generator.net" className="text-blue-600 hover:text-blue-500 ml-2">
                  sun@ai-lyrics-generator.net
                </a>
              </p>
              <p className="text-black mb-2">
                <strong>Response Time:</strong> Within 24 hours
              </p>
              <p className="text-black">
                <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM (UTC)
              </p>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-black">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-black mt-2">
                This refund policy may be updated from time to time. We will notify users of any 
                significant changes via email or website notification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
