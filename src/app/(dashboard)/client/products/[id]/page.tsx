/**
 * Client - Product Detail Page
 * Display product options and allow purchase requests
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProductDetail } from '@/components/client/ProductDetail';

interface ProductOption {
  id: string;
  duration: string;
  withdrawalFrequency: string;
  roi: number;
  annualReturn: number;
  displayOrder: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number | null;
  currency: string;
  displayOrder: number;
  options: ProductOption[];
}

interface ClientRM {
  hasRM: boolean;
  rm?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    product: Product;
  };
  error?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientRM, setClientRM] = useState<ClientRM | null>(null);
  const [rmLoading, setRmLoading] = useState(true);

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch product details
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT' && productId) {
      fetchProduct();
      checkClientRM();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/products/${productId}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setProduct(data.data.product);
      } else {
        toast.error(data.error || 'Failed to fetch product');
        router.push('/client/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product');
      router.push('/client/products');
    } finally {
      setLoading(false);
    }
  };

  const checkClientRM = async () => {
    try {
      setRmLoading(true);
      const response = await fetch('/api/client/my-rm');
      const data = await response.json();

      if (data.success && data.data) {
        setClientRM({
          hasRM: !!data.data.rm,
          rm: data.data.rm,
        });
      } else {
        setClientRM({ hasRM: false });
      }
    } catch (error) {
      console.error('Error checking RM:', error);
      setClientRM({ hasRM: false });
    } finally {
      setRmLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'CLIENT' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading product...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'CLIENT')) {
    return null;
  }

  if (!product) {
    return null;
  }

  return (
    <ProductDetail
      product={product}
      clientRM={clientRM}
      rmLoading={rmLoading}
    />
  );
}
