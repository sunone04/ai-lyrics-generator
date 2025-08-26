import Link from 'next/link';
import { SITE_CONFIG, BLOG_CATEGORIES } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <span className="text-2xl font-bold text-blue-400">AI Lyrics Generator</span>
            </Link>
            <p className="text-gray-300 mb-4 max-w-md">
              Professional AI lyrics generator and song lyrics generator for musicians, rappers, and songwriters. 
              Create high-quality rap lyrics, song lyrics, and hip-hop verses in 100+ languages with our advanced AI lyric generator.
            </p>
            <p className="text-sm text-gray-400">
              Based on privacy protection, your lyrics will be stored for a maximum of 24 hours. 
              Please download or favorite them in time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/generate" className="text-gray-300 hover:text-blue-400 transition-colors">
                  AI Lyrics Generator Tool
                </Link>
              </li>
              <li>
                <Link href="/edit" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Polish Lyrics
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Blog Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Blog</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-blue-400 transition-colors">
                  All Articles
                </Link>
              </li>
              {BLOG_CATEGORIES.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link 
                    href={`/blog/category/${category.slug}`} 
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href="/privacy" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/refund" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
                Refund Policy
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
                Contact
              </Link>
            </div>
            <div className="text-gray-400 text-sm">
              © {currentYear} {SITE_CONFIG.name}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}