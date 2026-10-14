import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/project-overview', '/about', '/creators', '/briefs', '/privacy', '/terms'].map(path => ({ url: `https://creation-mart.vercel.app${path}`, changeFrequency: 'weekly', priority: path === '/project-overview' ? 1 : 0.7 }));
}
