import Link from 'next/link';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Product</h4>
            <div className="space-y-2.5">
              <Link href="/generate" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Generate</Link>
              <Link href="/edit" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Editor</Link>
              <Link href="/pricing" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Pricing</Link>
              <Link href="/dashboard" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Resources</h4>
            <div className="space-y-2.5">
              <Link href="/blog" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Blog</Link>
              <Link href="/faq" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">FAQ</Link>
              <Link href="/contact" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Legal</h4>
            <div className="space-y-2.5">
              <Link href="/privacy" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Privacy</Link>
              <Link href="/terms" prefetch={false} className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Terms</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Connect</h4>
            <div className="space-y-2.5">
              <a href="https://x.com/sunone04" target="_blank" rel="noopener noreferrer" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">X / Twitter</a>
              <a href="https://github.com/sunone04" target="_blank" rel="noopener noreferrer" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
              <SparklesIcon className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-medium text-zinc-500">Lyrica</span>
          </div>
          <p className="text-[11px] text-zinc-700">
            &copy; {new Date().getFullYear()} Lyrica. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
