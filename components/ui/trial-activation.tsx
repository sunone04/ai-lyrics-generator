"use client";

import { Card } from '@/components/ui/card';
import { useTrial } from '@/lib/hooks/use-trial';

interface TrialStatusProps {
  className?: string;
}

export function TrialStatus({ className }: TrialStatusProps) {
  const { isInTrial, trialEndDate, getTrialTimeRemaining } = useTrial();

  if (!isInTrial || !trialEndDate) return null;

  const timeRemaining = getTrialTimeRemaining();
  if (!timeRemaining) {
    return (
      <Card className={`p-4 bg-yellow-50 border-yellow-200 ${className}`}>
        <div className="text-center">
          <p className="text-yellow-800 font-medium">Your free trial has expired</p>
          <p className="text-yellow-600 text-sm mt-1">Upgrade to continue using premium features</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 bg-green-50 border-green-200 ${className}`}>
      <div className="text-center">
        <p className="text-green-800 font-medium">🎉 Free Trial Active</p>
        <p className="text-green-600 text-sm mt-1">
          {timeRemaining.days > 0 ? `${timeRemaining.days} days remaining` : `Less than 1 day remaining`}
        </p>
      </div>
    </Card>
  );
}

