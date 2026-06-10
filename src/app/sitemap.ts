import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.presentenopix.com.br';

/**
 * Sitemap — APENAS páginas públicas de marketing.
 * Páginas de evento (/e/[slug]), convites (/convite/[id]) e área logada (/app)
 * NÃO entram aqui de propósito: são privadas/por-link e não devem ser indexadas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/criar`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/exemplo`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 }
  ];
}
