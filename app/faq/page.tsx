import { Metadata } from 'next';

// 强制静态生成 - FAQ内容基本不变
export const dynamic = 'force-static';

// 元数据配置
export const metadata: Metadata = {
  title: 'FAQ - AI Lyrics Generator Questions & Answers | Song Lyrics Help',
  description: 'Get answers to frequently asked questions about our AI lyrics generator, song lyrics generator, and rap lyrics generator. Learn how to create professional lyrics with AI technology.',
  keywords: 'ai lyrics generator faq, song lyrics generator help, rap lyrics generator questions, lyric generator guide, ai songwriting help, lyrics generator tutorial',
  alternates: {
    canonical: '/faq',
  },
};

const faqs = [
  { category: 'Getting Started', question: 'How does the AI lyrics generator work?', answer: 'Our AI lyrics generator uses advanced machine learning models to create original lyrics based on your input parameters. You specify details like music style, theme, language, and other preferences, and our AI creates professional-quality lyrics tailored to your specifications.' },
  { category: 'Getting Started', question: 'Do I need to sign up to use the service?', answer: 'You can start generating lyrics immediately after signing up. Free accounts get 1 generation per day, while premium subscribers get 30 generations daily.' },
  { category: 'Features', question: 'What languages are supported?', answer: 'We support over 100 languages including English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, and many more. You can select your preferred language from the dropdown menu when generating lyrics.' },
  { category: 'Features', question: 'What music styles can I choose from?', answer: 'We support a wide range of music styles including Pop, Rock, Hip-Hop/Rap, R&B, Country, Folk, Electronic, Jazz, Blues, Classical, Alternative, Indie, and more. You can also specify "Other" and provide custom style requirements.' },
  { category: 'Features', question: 'Can I edit the generated lyrics?', answer: 'Yes! Premium subscribers can edit lyrics directly and use our AI-assisted rewriting feature to refine specific sections. You can also regenerate lyrics with different parameters if you want a completely new version.' },
  { category: 'Subscription', question: "What's the difference between free and premium plans?", answer: 'Free users get 1 generation per day with our basic AI model and can favorite up to 3 lyrics. Premium subscribers get 30 generations and 30 lyrics optimizations daily, access to our pro AI model, editing tools, commercial usage rights, and can favorite up to 300 lyrics.' },
  { category: 'Subscription', question: 'Can I cancel my subscription anytime?', answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access to premium features until the end of your current billing period." },
  { category: 'Subscription', question: 'Do you offer refunds?', answer: "We offer a 30-day money-back guarantee for new subscribers. If you're not satisfied with our service within the first 30 days, contact our support team for a full refund." },
  { category: 'Usage Rights', question: 'Can I use the generated lyrics commercially?', answer: 'Premium subscribers can use generated lyrics for commercial purposes including recording, performing, and selling songs. Free users can use lyrics for personal projects only.' },
  { category: 'Usage Rights', question: 'Who owns the rights to the generated lyrics?', answer: "You own the rights to the lyrics generated using our service. We don't claim any ownership over your creative output. However, commercial usage rights are only available to premium subscribers." },
  { category: 'Privacy & Security', question: 'How long do you store my lyrics?', answer: 'For privacy protection, unfavorited lyrics are automatically deleted after 24 hours. Lyrics you favorite are stored permanently in your account. We recommend downloading or favoriting important lyrics promptly.' },
  { category: 'Privacy & Security', question: 'Is my data secure?', answer: "Yes, we take data security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and never share your personal information or lyrics with third parties." },
  { category: 'Technical', question: 'What if the AI generates inappropriate content?', answer: 'Our AI is trained to avoid generating inappropriate content, but if you encounter any issues, please report it to our support team. We continuously improve our content filters and moderation systems.' },
  { category: 'Technical', question: 'Why are my lyrics not generating?', answer: 'Common issues include: reaching your daily limit, network connectivity problems, or server maintenance. Check your account status and try again. If problems persist, contact our support team.' },
  { category: 'Technical', question: 'Can I use the service on mobile devices?', answer: "Yes! Our website is fully responsive and works great on mobile devices, tablets, and desktops. We don't have a dedicated mobile app yet, but the web version provides an excellent mobile experience." },
];

export default function FAQPage() {
  const grouped = faqs.reduce((acc: Record<string, typeof faqs>, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simple breadcrumb without JS */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <a href="/" className="hover:text-gray-700">Home</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">FAQ</span>
        </nav>

        <div className="mt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Find answers to common questions about our AI lyrics generator and how it can help you create amazing songs.</p>
          </div>

          {/* Category sections with details/summary (no JS) */}
          <div className="space-y-10">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category} id={category.replace(/\s+/g, '-').toLowerCase()}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
                <div className="space-y-4">
                  {items.map((faq, idx) => (
                    <details key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 group">
                      <summary className="cursor-pointer select-none px-6 py-4 font-medium text-gray-900 flex items-center justify-between">
                        <span>{faq.question}</span>
                        <span aria-hidden className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                      </summary>
                      <div className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.answer}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-12 text-center bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-6">Can't find the answer you're looking for? Please contact our support team and we'll get back to you as soon as possible.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:sun@ai-lyrics-generator.net" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
