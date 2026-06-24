import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import indexData from '@/content/blog/index.json';

/**
 * Capa de acceso al blog.
 *
 * Los artículos viven en `src/content/blog/`:
 *   - `index.json` → índice con la metadata de cada artículo (este archivo se importa).
 *   - `<slug>.md`  → cuerpo del artículo en Markdown.
 *
 * Para añadir un artículo nuevo basta con (1) agregar una entrada al index.json
 * y (2) crear el `<slug>.md`. No hace falta editor ni base de datos.
 */

export type BlogLang = 'es' | 'pt';

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  updated?: string;
  lang: BlogLang;
  author: string;
  authorRole?: string;
  authorBio?: string;
  authorImage?: string;
  reviewedBy?: string;
  category: string;
  tags: string[];
  readingMinutes: number;
  cover?: string;
  featured?: boolean;
  /** Slugs de artículos relacionados (referencias cruzadas). */
  related?: string[];
}

interface BlogIndex {
  articles: ArticleMeta[];
}

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

marked.setOptions({ gfm: true, breaks: false });

/** Todos los artículos, ordenados del más reciente al más antiguo. */
export function getAllArticles(): ArticleMeta[] {
  const { articles } = indexData as BlogIndex;
  return [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Metadata de un artículo por slug. */
export function getArticleMeta(slug: string): ArticleMeta | undefined {
  return (indexData as BlogIndex).articles.find((a) => a.slug === slug);
}

/** Artículo completo: metadata + cuerpo Markdown ya convertido a HTML. */
export function getArticle(slug: string): { meta: ArticleMeta; html: string } | null {
  const meta = getArticleMeta(slug);
  if (!meta) return null;
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const md = fs.readFileSync(filePath, 'utf-8');
  const html = marked.parse(md) as string;
  return { meta, html };
}

/** Artículos relacionados de un slug (resuelve los `related` del índice). */
export function getRelatedArticles(slug: string): ArticleMeta[] {
  const meta = getArticleMeta(slug);
  if (!meta?.related?.length) return [];
  return meta.related
    .map((s) => getArticleMeta(s))
    .filter((a): a is ArticleMeta => Boolean(a));
}
