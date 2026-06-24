import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import PublicNav from '@/app/components/PublicNav';
import { getAllArticles, getArticle, getArticleMeta, getRelatedArticles } from '@/app/shared/blog';
import '../blog-prose.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refeit.com';

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = getArticleMeta(slug);
  if (!meta) return { title: 'Artículo no encontrado' };

  const url = `${SITE}/blog/${meta.slug}`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.tags,
    authors: [{ name: meta.author }],
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      type: 'article',
      publishedTime: meta.date,
      modifiedTime: meta.updated || meta.date,
      authors: [meta.author],
      tags: meta.tags,
      images: meta.cover ? [{ url: meta.cover, width: 1200, height: 630, alt: meta.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: meta.cover ? [meta.cover] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const { meta, html } = article;
  const related = getRelatedArticles(slug);
  const url = `${SITE}/blog/${meta.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    image: meta.cover ? `${SITE}${meta.cover}` : undefined,
    datePublished: meta.date,
    dateModified: meta.updated || meta.date,
    author: {
      '@type': 'Person',
      name: meta.author,
      jobTitle: meta.authorRole,
      image: meta.authorImage ? `${SITE}${meta.authorImage}` : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'refeit',
      logo: { '@type': 'ImageObject', url: `${SITE}/icons/refeit-logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: meta.tags.join(', '),
    inLanguage: meta.lang,
  };

  return (
    <div className="bg-cream-pattern min-h-screen">
      <PublicNav lang="es" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-3xl mx-auto px-5 py-10 md:py-14">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-emerald-700 transition-colors mb-7">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al blog
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-500 mb-4">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{meta.category}</span>
              <span>·</span>
              <time dateTime={meta.date}>{formatDate(meta.date)}</time>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{meta.readingMinutes} min</span>
              {meta.updated && meta.updated !== meta.date && (
                <>
                  <span>·</span>
                  <span>Actualizado el {formatDate(meta.updated)}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl md:text-[2.5rem] font-semibold tracking-tight text-gray-900 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {meta.title}
            </h1>
            <p className="mt-4 text-[16px] text-gray-600 leading-relaxed">{meta.excerpt}</p>
            <p className="mt-4 text-[13px] text-gray-400">Por {meta.author}</p>
          </header>

          {meta.cover && (
            <div className="rounded-2xl overflow-hidden mb-9 aspect-[1200/630]" style={{ border: '1px solid #E8E5DE' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.cover} alt={meta.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose-blog" dangerouslySetInnerHTML={{ __html: html }} />

          {/* Tags */}
          <div className="mt-10 flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[12px] bg-white text-gray-600" style={{ border: '1px solid #E8E5DE' }}>
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {/* Autor */}
        {meta.authorBio && (
          <aside className="mt-10 flex gap-4 p-5 rounded-2xl bg-white" style={{ border: '1px solid #E8E5DE' }}>
            {meta.authorImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.authorImage} alt={meta.author} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
                {meta.author.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-[14px] font-semibold text-gray-900">{meta.author}</p>
              {meta.authorRole && <p className="text-[12px] text-emerald-700 mb-1.5">{meta.authorRole}</p>}
              <p className="text-[13px] text-gray-600 leading-relaxed">{meta.authorBio}</p>
            </div>
          </aside>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl p-7 text-white" style={{ background: 'linear-gradient(135deg, #047857 0%, #059669 60%, #10B981 100%)' }}>
          <h2 className="text-xl font-semibold tracking-tight">Lleva esto a tu consulta con refeit</h2>
          <p className="mt-2 text-[14px] text-emerald-50/90 leading-relaxed">
            Pacientes, planes y recetario en una sola herramienta, con una base nutricional que integra TACO, USDA y BAM.
          </p>
          <Link href="/login" className="mt-4 inline-flex items-center gap-1.5 bg-white text-emerald-700 text-[13px] font-semibold px-4 py-2 rounded-md hover:bg-emerald-50 transition-colors">
            Empieza gratis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-5">Sigue leyendo</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex gap-4 p-4 rounded-xl bg-white transition-shadow hover:shadow-md"
                  style={{ border: '1px solid #E8E5DE' }}
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-emerald-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.cover} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-emerald-700">{r.category}</span>
                    <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-3">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t mt-8" style={{ borderColor: '#E8E5DE' }}>
        <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-gray-500">
          <span>© {new Date().getFullYear()} refeit</span>
          <div className="flex items-center gap-5">
            <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
            <Link href="/es" className="hover:text-gray-900 transition-colors">Inicio</Link>
            <Link href="/terminos" className="hover:text-gray-900 transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
