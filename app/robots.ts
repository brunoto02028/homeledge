import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/terms', '/privacy', '/intelligence', '/verify-purchase'],
        disallow: [
          '/dashboard',
          '/admin',
          '/api/',
          '/settings',
          '/onboarding',
          '/statements',
          '/invoices',
          '/bills',
          '/vault',
          '/email',
          '/files',
          '/projections',
          '/reports',
          '/categories',
          '/documents',
          '/transfers',
          '/tax-timeline',
          '/household',
          '/academy',
          '/relocation',
          '/services',
          '/verify-identity',
          '/shared/',
          '/verify/',
          '/upload/',
        ],
      },
    ],
    sitemap: 'https://homeledger.co.uk/sitemap.xml',
  };
}
