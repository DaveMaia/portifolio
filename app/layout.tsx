import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-in Admin',
  description: 'Attendance management via QR codes'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <header>
            <h1 className="text-3xl font-semibold">Presence Control</h1>
            <p className="text-sm text-slate-300">
              Sistema de check-in baseado em QR Codes powered by Supabase.
            </p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
