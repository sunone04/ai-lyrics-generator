'use client';

import { useTrial } from '@/lib/hooks/use-trial';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UsageLimitsProps {
  className?: string;
  showDetails?: boolean;
}

export function UsageLimits({ className, showDetails = true }: UsageLimitsProps) {
  const { usageLimits, isActiveUser, loading } = useTrial();

  if (loading || !usageLimits) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const getUsageColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUsageBarColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Usage Limits</h3>
          <Badge variant={isActiveUser ? 'default' : 'secondary'}>
            {isActiveUser ? 'Premium' : 'Free'}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Generation Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Generations</span>
              <span className={getUsageColor(usageLimits.generation.remaining, usageLimits.generation.max)}>
                {usageLimits.generation.remaining} / {usageLimits.generation.max} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getUsageBarColor(usageLimits.generation.remaining, usageLimits.generation.max)}`}
                style={{
                  width: `${(usageLimits.generation.remaining / usageLimits.generation.max) * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Rewrite Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Rewrites</span>
              <span className={getUsageColor(usageLimits.rewrite.remaining, usageLimits.rewrite.max)}>
                {usageLimits.rewrite.remaining} / {usageLimits.rewrite.max} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getUsageBarColor(usageLimits.rewrite.remaining, usageLimits.rewrite.max)}`}
                style={{
                  width: `${(usageLimits.rewrite.remaining / usageLimits.rewrite.max) * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Favorites Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Favorites</span>
              <span className={getUsageColor(usageLimits.favorites.remaining, usageLimits.favorites.max)}>
                {usageLimits.favorites.remaining} / {usageLimits.favorites.max} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getUsageBarColor(usageLimits.favorites.remaining, usageLimits.favorites.max)}`}
                style={{
                  width: `${(usageLimits.favorites.remaining / usageLimits.favorites.max) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {showDetails && !isActiveUser && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Upgrade to Premium for 30x more generations and rewrites
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface QuickUsageDisplayProps {
  className?: string;
}

export function QuickUsageDisplay({ className }: QuickUsageDisplayProps) {
  const { usageLimits, isActiveUser, loading } = useTrial();

  if (loading || !usageLimits) {
    return (
      <div className={`flex space-x-4 ${className}`}>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className={`flex space-x-4 text-sm ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-gray-600">Gen:</span>
        <span className={usageLimits.generation.remaining > 0 ? 'text-green-600' : 'text-red-600'}>
          {usageLimits.generation.remaining}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-gray-600">Rewrite:</span>
        <span className={usageLimits.rewrite.remaining > 0 ? 'text-green-600' : 'text-red-600'}>
          {usageLimits.rewrite.remaining}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-gray-600">Fav:</span>
        <span className={usageLimits.favorites.remaining > 0 ? 'text-green-600' : 'text-red-600'}>
          {usageLimits.favorites.remaining}
        </span>
      </div>
      {isActiveUser && (
        <Badge variant="default" className="text-xs">
          Premium
        </Badge>
      )}
    </div>
  );
}
