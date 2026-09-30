import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrialMatch — Precision Oncology Clinical Trials Duel',
  description:
    'Structured Sanity Context Agent vs Naive Keyword Search over 100 Normalized Oncology Clinical Trials. DEV Community x Sanity Challenge Path One.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
