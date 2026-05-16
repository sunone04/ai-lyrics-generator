import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: { absolute: 'Refund Policy - AI Lyrics Generator' },
  description: 'Our refund policy and terms for AI Lyrics Generator services.',
  alternates: {
    canonical: '/refund',
  },
};

export default function RefundPage() {
  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">Home</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">Refund</span>
        </nav>
        
        <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Refund Policy</h1>
          
          <div className="space-y-8">
            <p className="text-sm text-zinc-400 mb-6">
              At AI Lyrics Generator, we want you to be completely satisfied with your purchase. 
              We offer a simple and fair refund policy to ensure your peace of mind.
            </p>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6 mb-8">
              <h2 className="text-base font-semibold text-white mb-2">
                24-Hour Refund Guarantee
              </h2>
              <p className="text-sm text-zinc-400">
                <strong className="text-zinc-300">Full refunds are available within 24 hours of your initial purchase.</strong> 
                No questions asked, no complicated procedures.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Refund Eligibility</h2>
              
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Eligible for Full Refund:</h3>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5 mb-4">
                <li>Requests made within 24 hours of purchase</li>
                <li>Technical issues preventing service access</li>
                <li>Service not meeting described functionality</li>
                <li>Accidental duplicate purchases</li>
                <li>Billing errors or unauthorized charges</li>
              </ul>
              
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Not Eligible for Refund:</h3>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>Requests made after 24 hours from purchase</li>
                <li>Change of mind after using the service extensively</li>
                <li>Violation of our Terms of Service</li>
                <li>Requests for partial refunds on monthly subscriptions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">How to Request a Refund</h2>
              
              <div className="rounded-lg border border-violet-500/20 bg-violet-600/5 p-6 mb-4">
                <h3 className="text-sm font-semibold text-white mb-2">Contact Us</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  To request a refund, please email us at:
                </p>
                <a href="mailto:sun@ai-lyrics-generator.net" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  sun@ai-lyrics-generator.net
                </a>
              </div>

              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Required Information:</h3>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>Your email address used for the purchase</li>
                <li>Order/Transaction ID (if available)</li>
                <li>Date of purchase</li>
                <li>Reason for refund request</li>
                <li>Any relevant screenshots or error messages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Refund Processing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-white mb-1">Processing Time</h3>
                  <p className="text-xs text-zinc-500">
                    Refunds are typically processed within 1-2 business days after approval.
                  </p>
                </div>
                
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-white mb-1">Refund Method</h3>
                  <p className="text-xs text-zinc-500">
                    Refunds will be issued to the original payment method used for the purchase.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Subscription Cancellations</h2>
              
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 mb-4">
                <h3 className="text-sm font-semibold text-white mb-2">Monthly Subscriptions</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Our premium subscriptions automatically renew monthly. You can:
                </p>
                <ul className="list-disc pl-6 text-xs text-zinc-500 space-y-1">
                  <li>Cancel anytime from your account dashboard</li>
                  <li>Continue using the service until the end of your billing period</li>
                  <li>Request a refund within 24 hours of renewal</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Special Circumstances</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We understand that exceptional circumstances may arise. If you have a unique situation 
                that falls outside our standard policy, please contact us. We review each case individually 
                and may offer solutions on a case-by-case basis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Contact Information</h2>
              
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="text-sm text-zinc-400 mb-1">
                  <strong className="text-zinc-300">Email:</strong> 
                  <a href="mailto:sun@ai-lyrics-generator.net" className="text-violet-400 hover:text-violet-300 ml-2 transition-colors">
                    sun@ai-lyrics-generator.net
                  </a>
                </p>
                <p className="text-sm text-zinc-400 mb-1">
                  <strong className="text-zinc-300">Response Time:</strong> Within 24 hours
                </p>
                <p className="text-sm text-zinc-400">
                  <strong className="text-zinc-300">Business Hours:</strong> Monday - Friday, 9 AM - 6 PM (UTC)
                </p>
              </div>

              <div className="mt-6 text-xs text-zinc-600">
                <p>
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="mt-1">
                  This refund policy may be updated from time to time. We will notify users of any 
                  significant changes via email or website notification.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
