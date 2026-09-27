import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Curiosity — Science & Technology Learning Platform',
  description: 'Research, present, and get evidence-grounded feedback on what you have learned.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
