'use client';

import Breadcrumbs from '@/components/ui/breadcrumbs';

export default function FeaturedPage() {
  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs customBreadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Press & Badges', href: '/featured' }]} />

        <div className="mt-8">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Press & Badges</h1>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              We appreciate being featured by industry directories and communities. Below are official badges with direct links to their listings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
              <p className="text-sm text-zinc-300 mb-4">Featured on AgentHunter</p>
              <a
                href="https://www.agenthunter.io?utm_source=badge&utm_medium=embed&utm_campaign=AI-Lyrics-Generator"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AgentHunter Featured AI Agent badge"
                className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg no-underline transition hover:bg-amber-500/15"
              >
                <img
                  src="https://www.agenthunter.io/logo-light.svg"
                  alt="AgentHunter Badge"
                  className="h-10 w-10"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col leading-tight">
                  <p className="m-0 text-xs text-amber-400">AgentHunter</p>
                  <p className="m-0 text-sm text-amber-300 font-semibold">Featured AI Agent</p>
                </div>
              </a>

              <p className="mt-4 text-xs text-zinc-600">
                Link opens in a new tab. Tracking parameters are included per directory requirements.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
              <p className="text-sm text-zinc-300 mb-4">Featured on Dang.ai</p>
              <a
                href="https://dang.ai/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Dang.ai Featured badge"
                className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-2 rounded-lg no-underline transition hover:bg-indigo-500/15"
              >
                <img
                  src="https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png"
                  alt="Dang.ai"
                  width={150}
                  height={54}
                  loading="lazy"
                  decoding="async"
                />
              </a>

              <p className="mt-4 text-xs text-zinc-600">Link opens in a new tab.</p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4">Reciprocal Links</h2>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
              <a href="https://viesearch.com/" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">Viesearch - The Human-curated Search Engine</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
