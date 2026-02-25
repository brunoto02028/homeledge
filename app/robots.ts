import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/api/', '/settings', '/onboarding'],
      },
    ],
    sitemap: 'https://homeledger.co.uk/sitemap.xml',
  };
}
