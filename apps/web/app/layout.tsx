import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth/auth-context';

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
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
