import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'strava-elevation',
  description: 'Update activity elevation from description comments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
