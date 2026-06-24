import type { Metadata } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import './globals.css';
import Menu from '@/app/menu/page';
import { Providers } from '@/app/providers';
import type { Lang } from '@/app/shared/i18n';
import { SUPPORTED_LANGS, DEFAULT_LANG } from '@/app/shared/i18n';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refeit.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'refeit — gestión nutricional', template: '%s · refeit' },
  description: 'Pacientes, planes y recetario en una sola herramienta · Pacientes, planos e receituário em uma só ferramenta',
  applicationName: 'refeit',
  keywords: [
    'software para nutricionistas', 'gestión nutricional', 'planes alimenticios',
    'software nutricional', 'recetario nutricional', 'historia clínica nutricional',
    'software para nutricionistas portugal', 'software nutrición brasil',
    'plano alimentar', 'nutricionista software', 'dieta personalizada',
  ],
  openGraph: {
    siteName: 'refeit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'refeit — gestión nutricional',
    description: 'Pacientes, planes y recetario en una sola herramienta.',
  },
  robots: { index: true, follow: true },
};

const SUPPORTED = SUPPORTED_LANGS.map((l) => l.code);
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-T8H2VBXR';

async function resolveLang(): Promise<Lang> {
  const c = await cookies();
  const cookieLang = c.get('refeit_lang')?.value as Lang | undefined;
  if (cookieLang && SUPPORTED.includes(cookieLang)) return cookieLang;

  const h = await headers();
  const path = h.get('x-invoke-path') ?? h.get('next-url') ?? '';
  const m = path.match(/^\/(es|pt)(?:\/|$)/);
  if (m) return m[1] as Lang;

  return DEFAULT_LANG;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await resolveLang();
  return (
    <html lang={lang}>
      <GoogleTagManager gtmId={GTM_ID} />
      <head>
        {/* Fuentes de firma (digital) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&family=Dancing+Script&family=Sora:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Menu />
          {children}
        </Providers>
      </body>
    </html>
  );
}
