import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/account/', '/dashboard', '/onboarding', '/engagements/'] }, sitemap: 'https://creation-mart.vercel.app/sitemap.xml' };
}
