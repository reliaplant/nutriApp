import type { Metadata } from 'next';
import LandingPage from './components/LandingPage';
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
};

// '/' actúa como landing por defecto en español. El middleware redirige a /es o /pt
// según Accept-Language, pero si llega aquí mostramos español.
export default function Home() {
  return <LandingPage lang="es" />;
}
