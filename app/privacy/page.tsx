import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: { absolute: 'Privacy Policy - AI Lyrics Generator' },
  description: 'Learn how AI Lyrics Generator collects, uses, and protects your personal information.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">Home</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">Privacy</span>
        </nav>
        
        <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-8">
            <p className="text-xs text-zinc-500 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
              <p className="text-sm text-zinc-400 mb-3">
                We collect information you provide directly to us, such as when you create an account, 
                generate lyrics, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>Account information (email address, password)</li>
                <li>Generated lyrics and associated parameters</li>
                <li>Usage data and preferences</li>
                <li>Payment information (processed securely by our payment provider)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p className="text-sm text-zinc-400 mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>Provide and improve our AI lyrics generation service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important updates about your account</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to improve our service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">3. Data Storage and Security</h2>
              <p className="text-sm text-zinc-400 mb-3">
                We take data security seriously and implement industry-standard measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>All data is encrypted in transit and at rest</li>
                <li>Unfavorited lyrics are automatically deleted after 3 days</li>
                <li>We use secure cloud infrastructure with regular backups</li>
                <li>Access to your data is strictly limited to authorized personnel</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing</h2>
              <p className="text-sm text-zinc-400 mb-3">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except:
              </p>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our service (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">5. Your Rights</h2>
              <p className="text-sm text-zinc-400 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-sm text-zinc-500 space-y-1.5">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">6. Cookies and Tracking</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We use cookies and similar technologies to enhance your experience and analyze usage patterns. 
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">7. Children&apos;s Privacy</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our service is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13. If you believe we have collected such information, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">8. Changes to This Policy</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">9. Contact Us</h2>
              <p className="text-sm text-zinc-400 mb-3">
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <p className="text-sm text-zinc-400">
                Email: sun@ai-lyrics-generator.net<br />
                Website: {SITE_CONFIG.url}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
