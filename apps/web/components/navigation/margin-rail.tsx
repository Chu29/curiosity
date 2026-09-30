'use client';

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
    <aside className="margin-rail">
      <div className="margin-rail__brand">
        <Link href="/" className="margin-rail__logo" aria-label="Curiosity home">
          C.
        </Link>
      </div>

      <nav className="margin-rail__steps" aria-label="Learning journey">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.key} className={`rail-step ${isActive ? 'rail-step--active' : ''} ${isComplete ? 'rail-step--complete' : ''}`} title={step.label} aria-current={isActive ? 'step' : undefined}>
              <div
                className="rail-step__marker"
              >
                {isComplete ? '✓' : step.number}
              </div>
              <span
                className="rail-step__label"
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
