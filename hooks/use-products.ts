import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types/auth';
import { PRODUCTS } from '@/lib/products-data';

/**
 * Hook to fetch all products/modules from the database
 */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch('/api/modules');
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
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