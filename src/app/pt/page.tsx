import type { Metadata } from 'next';
import LandingPage from '../components/LandingPage';
import { t } from '@/app/shared/i18n';

const SITE = 'https://refeit.app';

export const metadata: Metadata = {
  title: t('landing.meta.title', 'pt') as string,
  description: t('landing.meta.description', 'pt') as string,
  alternates: {
    canonical: `${SITE}/pt`,
    languages: {
      'es': `${SITE}/es`,
      'pt': `${SITE}/pt`,
      'x-default': `${SITE}/es`,
    },
  },
  openGraph: {
    title: t('landing.meta.title', 'pt') as string,
    description: t('landing.meta.description', 'pt') as string,
    locale: 'pt_BR',
    alternateLocale: ['es_ES'],
    url: `${SITE}/pt`,
    type: 'website',
  },
};

export default function Page() {
  return <LandingPage lang="pt" />;
}
