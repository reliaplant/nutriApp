import type { Metadata } from 'next';
import LandingPage from '../components/LandingPage';
import { t } from '@/app/shared/i18n';

const SITE = 'https://refeit.app';

export const metadata: Metadata = {
  title: t('landing.meta.title', 'es') as string,
  description: t('landing.meta.description', 'es') as string,
  alternates: {
    canonical: `${SITE}/es`,
    languages: {
      'es': `${SITE}/es`,
      'pt': `${SITE}/pt`,
      'x-default': `${SITE}/es`,
    },
  },
  openGraph: {
    title: t('landing.meta.title', 'es') as string,
    description: t('landing.meta.description', 'es') as string,
    locale: 'es_ES',
    alternateLocale: ['pt_BR'],
    url: `${SITE}/es`,
    type: 'website',
  },
};

export default function Page() {
  return <LandingPage lang="es" />;
}
