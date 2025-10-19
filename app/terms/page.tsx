import { Metadata } from 'next';
// Static breadcrumb to avoid client-side JS
import { SITE_CONFIG } from '@/lib/constants';

// 强制静态生成 - 服务条款内容变化缓慢
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: { absolute: 'Terms of Service - AI Lyrics Generator' },
  description: 'Read the terms and conditions for using AI Lyrics Generator.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <a href="/" className="hover:text-gray-700">Home</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Terms</span>
        </nav>
        
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using AI Lyrics Generator, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                AI Lyrics Generator is an online service that uses artificial intelligence to generate 
                original song lyrics based on user-provided parameters. We offer both free and premium 
                subscription tiers with different features and usage limits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To use our service, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Be at least 13 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Usage Limits and Restrictions</h2>
              <p className="text-gray-700 mb-4">
                Your use of the service is subject to the following restrictions:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Free accounts: 2 generations per day, up to 3 favorites</li>
                <li>Premium accounts: 30 generations and 30 lyrics optimizations per day, up to 1000 favorites</li>
                <li>You may not use automated systems to access the service</li>
                <li>You may not attempt to reverse engineer or copy our AI models</li>
                <li>You may not use the service for illegal or harmful purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-4">
                <strong>Your Content:</strong> You retain ownership of lyrics generated using our service. 
                However, commercial usage rights are only granted to premium subscribers.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Our Service:</strong> The AI Lyrics Generator platform, including our AI models, 
                algorithms, and software, are protected by intellectual property laws and remain our property.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Subscriptions</h2>
              <p className="text-gray-700 mb-4">
                Premium subscriptions are billed in advance on a monthly or yearly basis. You may cancel 
                your subscription at any time, and cancellation will take effect at the end of your current 
                billing period.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>All payments are processed securely through our payment provider</li>
                <li>Refunds are available within 30 days of initial subscription</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed 
                by our Privacy Policy. Key points include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Unfavorited lyrics are automatically deleted after 3 days</li>
                <li>We do not share your personal information with third parties</li>
                <li>All data is encrypted and securely stored</li>
                <li>You can delete your account and data at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">
                You may not use our service to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Generate content that is illegal, harmful, or offensive</li>
                <li>Infringe on the rights of others</li>
                <li>Spam or harass other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for competitive analysis or to build competing products</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                While we strive to maintain high availability, we do not guarantee uninterrupted service. 
                We may temporarily suspend the service for maintenance, updates, or other operational reasons.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, AI Lyrics Generator shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages, or any loss of profits 
                or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for conduct 
                that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material 
                changes via email or through our service. Continued use of the service after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Service Provider Information</h2>
              <p className="text-gray-700 mb-4">
                AI Lyrics Generator is operated by an individual sole proprietor:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700">
                  <strong>Business Name:</strong> AI Lyrics Generator<br />
                  <strong>Operator:</strong> Individual Sole Proprietor<br />
                  <strong>Email:</strong> sun@ai-lyrics-generator.net<br />
                  <strong>Website:</strong> {SITE_CONFIG.url}
                </p>
              </div>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us using the information above.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

