'use client';

import React from 'react';
import Link from 'next/link';

export type RailStep = 'DISCOVER' | 'OVERVIEW' | 'GUIDE' | 'RESEARCH' | 'PRESENT' | 'EVALUATE';

interface MarginRailProps {
  currentStep: RailStep;
}

const STEPS: { key: RailStep; label: string; number: number }[] = [
  { key: 'DISCOVER', label: 'Discover', number: 1 },
  { key: 'OVERVIEW', label: 'Overview', number: 2 },
  { key: 'GUIDE', label: 'Guide', number: 3 },
  { key: 'RESEARCH', label: 'Research', number: 4 },
  { key: 'PRESENT', label: 'Present', number: 5 },
  { key: 'EVALUATE', label: 'Evaluate', number: 6 },
];

export function MarginRail({ currentStep }: MarginRailProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <aside className="w-full md:w-24 md:min-h-screen bg-ink flex flex-row md:flex-col items-center justify-between md:justify-start py-4 md:py-8 px-4 md:px-0 text-paper z-20 shrink-0">
      <div className="mb-0 md:mb-12">
        <Link href="/" className="font-serif font-bold text-lg text-accent tracking-tight">
          C.
        </Link>
      </div>

      <nav className="flex flex-row md:flex-col items-center gap-4 md:gap-8 w-full justify-center">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center group relative cursor-default"
              title={step.label}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-ink font-bold'
                    : isComplete
                    ? 'bg-supported text-white font-bold'
                    : 'border border-rule text-paper opacity-60'
                }`}
              >
                {isComplete ? '✓' : step.number}
              </div>
              <span
                className={`text-[10px] mt-1 hidden md:block transition-opacity ${
                  isActive || isComplete ? 'opacity-100 font-medium' : 'opacity-60'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
