import { Metadata } from 'next';
import FAQClient from './faq-client';

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

export default function FAQPage() {
  return <FAQClient />;
}