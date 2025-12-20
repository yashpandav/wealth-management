/**
 * Sitemap Generation
 * Next.js automatically serves this at /sitemap.xml
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://wealthcrm.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/instruments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic instrument pages
  try {
    const instruments = await prisma.instrument.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    });

    const instrumentPages: MetadataRoute.Sitemap = instruments.map((instrument) => ({
      url: `${baseUrl}/instruments/${instrument.id}`,
      lastModified: instrument.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...instrumentPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
