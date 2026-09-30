'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode, ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'text';

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`ui-button ui-button--${variant} ${className}`} {...props} />;
}

export function TextLink({ href, children, className = '', ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} className={`text-link ${className}`} {...props}>{children}</Link>;
}

export function PageTitle({ eyebrow, children, description }: { eyebrow?: string; children: ReactNode; description?: ReactNode }) {
  return <header className="screen-header">
    {eyebrow && <p className="screen-eyebrow">{eyebrow}</p>}
    <h1 className="page-title">{children}</h1>
    {description && <p className="screen-description">{description}</p>}
  </header>;
}

export function Section({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`content-section ${className}`}>{title && <h2 className="section-title">{title}</h2>}{children}</section>;
}

export function Divider() { return <div className="divider" role="separator" />; }

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'supported' | 'partial' | 'danger' }) {
  return <span className={`status-badge status-badge--${tone}`}><span aria-hidden="true" className="status-badge__dot" />{label}</span>;
}

export function MetadataRow({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return <div className="metadata-row">{items.map((item) => <div className="metadata-item" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>;
}

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return <div className="state-panel" role="status"><span className="state-panel__marker" aria-hidden="true" /><h2>Loading</h2><p>{message}</p></div>;
}

export function ErrorState({ title = 'Something went wrong', message, action }: { title?: string; message: string; action?: ReactNode }) {
  return <div className="state-panel state-panel--error" role="alert"><span className="state-panel__marker" aria-hidden="true">!</span><h2>{title}</h2><p>{message}</p>{action && <div className="state-panel__action">{action}</div>}</div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="state-panel"><span className="state-panel__marker" aria-hidden="true">—</span><h2>{title}</h2><p>{message}</p>{action && <div className="state-panel__action">{action}</div>}</div>;
}

export function ScreenActions({ children }: { children: ReactNode }) {
  return <div className="screen-actions">{children}</div>;
}
