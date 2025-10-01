'use client';

import Breadcrumbs from '@/components/ui/breadcrumbs';

export default function FeaturedPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs customBreadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Press & Badges', href: '/featured' }]} />

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900">Press & Badges</h1>
          <p className="mt-3 text-gray-600">
            We appreciate being featured by industry directories and communities. Below are official badges with direct links to their listings.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AgentHunter badge */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700 mb-3">Featured on AgentHunter</p>
              <a
                href="https://www.agenthunter.io?utm_source=badge&utm_medium=embed&utm_campaign=AI-Lyrics-Generator"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AgentHunter Featured AI Agent badge"
                className="inline-flex items-center gap-2 bg-amber-50 border border-amber-400 px-3 py-2 rounded-lg no-underline transition hover:shadow-sm"
              >
                <img
                  src="https://www.agenthunter.io/logo-light.svg"
                  alt="AgentHunter Badge"
                  className="h-10 w-10"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col leading-tight">
                  <p className="m-0 text-xs text-amber-800">AgentHunter</p>
                  <p className="m-0 text-sm text-amber-950 font-semibold">Featured AI Agent</p>
                </div>
              </a>

              <p className="mt-3 text-xs text-gray-500">
                Link opens in a new tab. Tracking parameters are included per directory requirements.
              </p>
            </div>

            {/* Dang.ai badge */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700 mb-3">Featured on Dang.ai</p>
              <a
                href="https://dang.ai/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Dang.ai Featured badge"
                className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-400 px-3 py-2 rounded-lg no-underline transition hover:shadow-sm"
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

              <p className="mt-3 text-xs text-gray-500">Link opens in a new tab.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
