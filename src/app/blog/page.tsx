import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNav from '@/app/components/PublicNav';
import { getAllArticles } from '@/app/shared/blog';
import './blog-prose.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refeit.com';

export const metadata: Metadata = {
  title: 'Blog · Nutrición, software y práctica clínica',
  description:
    'Artículos para nutricionistas: bases de datos de alimentos, planes alimenticios, recetas saludables y cómo sacar más partido a tu consulta con refeit.',
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: 'Blog de refeit',
    description:
      'Artículos para nutricionistas: bases de datos de alimentos, planes alimenticios, recetas saludables y práctica clínica.',
    url: `${SITE}/blog`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogIndexPage() {
  const articles = getAllArticles();
  const [featured, ...rest] = articles;

  return (
    <div className="bg-cream-pattern min-h-screen">
      <PublicNav lang="es" />

      <main className="max-w-6xl mx-auto px-5 py-12 md:py-16">
        <header className="mb-12 max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">Blog</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Nutrición, datos y práctica clínica
          </h1>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            Ideas prácticas para nutricionistas: bases de datos de alimentos, planes, recetas y cómo
            llevar mejor tu consulta.
          </p>
        </header>

        {/* Destacado */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-12 rounded-2xl overflow-hidden bg-white transition-shadow hover:shadow-lg"
            style={{ border: '1px solid #E8E5DE' }}
          >
            <div className="md:flex">
              <div className="md:w-1/2 aspect-[1200/630] overflow-hidden bg-emerald-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.cover} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" />
              </div>
              <div className="md:w-1/2 p-7 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{featured.category}</span>
                  <span>·</span>
                  <span>{featured.readingMinutes} min de lectura</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors" style={{ letterSpacing: '-0.02em' }}>
                  {featured.title}
                </h2>
                <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-5 text-[13px] text-gray-400">{formatDate(featured.date)}</div>
              </div>
            </div>
          </Link>
        )}

        {/* Resto */}
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden bg-white transition-shadow hover:shadow-lg"
              style={{ border: '1px solid #E8E5DE' }}
            >
              <div className="aspect-[1200/630] overflow-hidden bg-emerald-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.cover} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{a.category}</span>
                  <span>·</span>
                  <span>{a.readingMinutes} min</span>
                </div>
                <h2 className="text-[17px] font-semibold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
                  {a.title}
                </h2>
                <p className="mt-2 text-[13px] text-gray-600 leading-relaxed flex-1">{a.excerpt}</p>
                <div className="mt-4 text-[12px] text-gray-400">{formatDate(a.date)}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t mt-8" style={{ borderColor: '#E8E5DE' }}>
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-gray-500">
          <span>© {new Date().getFullYear()} refeit</span>
          <div className="flex items-center gap-5">
            <Link href="/es" className="hover:text-gray-900 transition-colors">Inicio</Link>
            <Link href="/terminos" className="hover:text-gray-900 transition-colors">Términos</Link>
            <Link href="/politica-privacidad" className="hover:text-gray-900 transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
