'use client';

import type { ReactNode } from 'react';
import { MarginRail, type RailStep } from '../navigation/margin-rail';

export function AppShell({ step, children, wide = false }: { step: RailStep; children: ReactNode; wide?: boolean }) {
  return <div className="app-shell"><MarginRail currentStep={step} /><main className={`page-container ${wide ? 'page-container--wide' : ''}`}>{children}</main></div>;
}
