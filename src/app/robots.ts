import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/case-studies', '/privacy-policy', '/thank-you'],
      disallow: ['/(dashboard)/', '/api/', '/user-management/'],
    },
    sitemap: 'https://pzoneinternational.com/sitemap.xml',
  };
}
