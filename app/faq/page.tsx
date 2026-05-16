import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about our AI lyrics generator and how to create professional lyrics with AI.',
  keywords: 'ai lyrics generator faq, song lyrics generator help, rap lyrics generator questions, lyric generator guide, ai songwriting help, lyrics generator tutorial',
  alternates: {
    canonical: '/faq',
  },
};

const faqs = [
  { category: 'Getting Started', question: 'How does the AI lyrics generator work?', answer: 'Our AI lyrics generator uses advanced machine learning models to create original lyrics based on your input parameters. You specify details like music style, theme, language, and other preferences, and our AI creates professional-quality lyrics tailored to your specifications.' },
  { category: 'Getting Started', question: 'Do I need to sign up to use the service?', answer: 'You can start generating lyrics immediately after signing up. Free accounts get 1 generation per day, while premium subscribers get 30 generations daily.' },
  { category: 'Features', question: 'What music types are supported?', answer: 'We support various music genres and styles. Choose the genre and style that best fits your creative direction when generating lyrics.' },
  { category: 'Features', question: 'What music styles can I choose from?', answer: 'We support a wide range of music styles including Pop, Rock, Hip-Hop/Rap, R&B, Country, Folk, Electronic, Jazz, Blues, Classical, Alternative, Indie, and more. You can also specify "Other" and provide custom style requirements.' },
  { category: 'Features', question: 'Can I edit the generated lyrics?', answer: 'Yes! Premium subscribers can edit lyrics directly and use our AI-assisted rewriting feature to refine specific sections. You can also regenerate lyrics with different parameters if you want a completely new version.' },
  { category: 'Subscription', question: "What's the difference between free and premium plans?", answer: 'Free users get 1 generation per day with our basic AI model and can favorite up to 3 lyrics. Premium subscribers get 30 generations and 30 lyrics optimizations daily, access to our pro AI model, editing tools, commercial usage rights, and can favorite up to 300 lyrics.' },
  { category: 'Subscription', question: 'Can I cancel my subscription anytime?', answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access to premium features until the end of your current billing period." },
  { category: 'Subscription', question: 'Do you offer refunds?', answer: "We offer a 30-day money-back guarantee for new subscribers. If you're not satisfied with our service within the first 30 days, contact our support team for a full refund." },
  { category: 'Usage Rights', question: 'Can I use the generated lyrics commercially?', answer: 'Premium subscribers can use generated lyrics for commercial purposes including recording, performing, and selling songs. Free users can use lyrics for personal projects only.' },
  { category: 'Usage Rights', question: 'Who owns the rights to the generated lyrics?', answer: "You own the rights to the lyrics generated using our service. We don't claim any ownership over your creative output. However, commercial usage rights are only available to premium subscribers." },
  { category: 'Privacy & Security', question: 'How long do you store my lyrics?', answer: 'For privacy protection, unfavorited lyrics are automatically deleted after 3 days. Lyrics you favorite are stored permanently in your account. We recommend downloading or favoriting important lyrics promptly.' },
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } as const;

  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">Home</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">FAQ</span>
        </nav>

        <div className="mt-8">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
            <p className="text-zinc-500 max-w-2xl mx-auto">Find answers to common questions about our AI lyrics generator.</p>
          </div>

          <div className="space-y-10">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category} id={category.replace(/\s+/g, '-').toLowerCase()}>
                <h2 className="text-lg font-semibold text-white mb-4">{category}</h2>
                <div className="space-y-2">
                  {items.map((faq, idx) => (
                    <details key={idx} className="group rounded-xl border border-white/5 bg-white/[0.02]">
                      <summary className="cursor-pointer select-none px-6 py-4 text-sm font-medium text-zinc-300 flex items-center justify-between hover:text-white transition-colors">
                        <span>{faq.question}</span>
                        <span aria-hidden="true" className="ml-4 text-zinc-600 group-open:rotate-180 transition-transform">&#9662;</span>
                      </summary>
                      <div className="px-6 pb-4 text-xs text-zinc-500 leading-relaxed">{faq.answer}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 text-center rounded-xl border border-violet-500/20 bg-violet-600/5 p-8">
            <h2 className="text-lg font-bold text-white mb-3">Still have questions?</h2>
            <p className="text-sm text-zinc-500 mb-6">Can&apos;t find the answer you&apos;re looking for? Please contact our support team.</p>
            <a href="mailto:sun@ai-lyrics-generator.net" className="inline-flex items-center bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
