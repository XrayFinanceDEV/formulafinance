import { useState, useEffect } from 'react';
import { Product } from '@/types/auth';
import { PRODUCTS } from '@/lib/products-data';

/**
 * Hook to fetch all products/modules
 * For now, uses static data. Can be updated to use ra-core when backend is ready.
 */
export function useProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Simulate async loading
      setTimeout(() => {
        setData(PRODUCTS.filter(p => p.is_active));
        setIsLoading(false);
      }, 100);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: number) {
  const [data, setData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setTimeout(() => {
        const product = PRODUCTS.find(p => p.id === id);
        setData(product || null);
        setIsLoading(false);
      }, 100);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [id]);

  return {
    data,
    isLoading,
    error,
  };
}

/**
 * Get product by name
 */
export function getProductByName(name: string): Product | undefined {
  return PRODUCTS.find(p => p.name === name);
}

/**
 * Get product display name by ID
 */
export function getProductDisplayName(id: number): string {
  const product = PRODUCTS.find(p => p.id === id);
  return product?.display_name || 'Unknown Product';
}