import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.presentenopix.com.br';

/**
 * robots.txt — libera o crawl das páginas de marketing e BLOQUEIA tudo que
 * é privado/por-link: páginas de evento, convites (que mostram nome do convidado),
 * área logada e endpoints de API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/e/', '/convite/', '/api/', '/auth/']
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
