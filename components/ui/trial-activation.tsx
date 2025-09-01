'use client';

import { useState } from 'react';
import { useTrial } from '@/lib/hooks/use-trial';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TrialActivationProps {
  onActivated?: () => void;
  className?: string;
}

export function TrialActivation({ onActivated, className }: TrialActivationProps) {
  const { canUseTrial, activateTrial, loading, error } = useTrial();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateTrial = async () => {
    if (!canUseTrial) return;

    try {
      setIsActivating(true);
      await activateTrial();
      onActivated?.();
    } catch (err) {
      console.error('Failed to activate trial:', err);
    } finally {
      setIsActivating(false);
    }
  };

  if (!canUseTrial) {
    return null;
  }

  return (
    <Card className={`p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <div className="text-center">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            🎉 Start Your Free Trial
          </h3>
          <p className="text-gray-600 mb-4">
            Get 3 days of full access to all premium features including:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>• 30 daily generations (vs 1 for free users)</li>
            <li>• 30 daily rewrites (vs 1 for free users)</li>
            <li>• Access to Pro AI model</li>
            <li>• Personal style training</li>
            <li>• 100 favorites (vs 3 for free users)</li>
          </ul>
        </div>
        
        <Button
          onClick={handleActivateTrial}
          disabled={loading || isActivating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
        >
          {loading || isActivating ? 'Activating...' : 'Start Free Trial'}
        </Button>
        
        {error && (
          <p className="text-red-600 text-sm mt-3">
            {error}
          </p>
        )}
        
        <p className="text-xs text-gray-500 mt-4">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </Card>
  );
}

interface TrialStatusProps {
  className?: string;
}

export function TrialStatus({ className }: TrialStatusProps) {
  const { isInTrial, trialEndDate, getTrialTimeRemaining } = useTrial();

  if (!isInTrial || !trialEndDate) {
    return null;
  }

  const timeRemaining = getTrialTimeRemaining();

  if (!timeRemaining) {
    return (
      <Card className={`p-4 bg-yellow-50 border-yellow-200 ${className}`}>
        <div className="text-center">
          <p className="text-yellow-800 font-medium">
            ⏰ Your free trial has expired
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            Upgrade to continue using premium features
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 bg-green-50 border-green-200 ${className}`}>
      <div className="text-center">
        <p className="text-green-800 font-medium">
          🎉 Free Trial Active
        </p>
        <p className="text-green-600 text-sm mt-1">
          {timeRemaining.days > 0 && `${timeRemaining.days} days, `}
          {timeRemaining.hours} hours, {timeRemaining.minutes} minutes remaining
        </p>
      </div>
    </Card>
  );
}
