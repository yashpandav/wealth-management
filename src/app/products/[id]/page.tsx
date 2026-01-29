/**
 * Public Product Detail Page
 * Detailed view of a single investment product
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/products/${params.id}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return {
        title: 'Product Not Found | EMDEE VENTURES',
      };
    }

    const data = await response.json();
    const product = data.data;

    return {
      title: `${product.name} | EMDEE VENTURES`,
      description: product.description || `Invest in ${product.name}`,
      keywords: [
        product.name,
        'investment plan',
        'wealth management',
      ],
    };
  } catch {
    return {
      title: 'Product Details | EMDEE VENTURES',
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  // If authenticated and is a client, redirect to client product detail page
  if (session?.user && session.user.role === 'CLIENT') {
    redirect(`/client/products/${params.id}`);
  }

  // For public/non-client users, redirect to products list with a message to sign up
  redirect('/products?action=signup');
}
