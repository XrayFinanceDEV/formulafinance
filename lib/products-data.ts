import { Product } from '@/types/auth';

// Seed data for the 3 products/modules
export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'report_de_minimis',
    display_name: 'Report De Minimis',
    description: 'Report per la verifica degli aiuti de minimis ricevuti',
    is_active: true,
  },
  {
    id: 2,
    name: 'analisi_bilancio',
    display_name: 'Analisi Bilancio',
    description: 'Analisi completa del bilancio aziendale',
    is_active: true,
  },
  {
    id: 3,
    name: 'analisi_centrale_rischi',
    display_name: 'Analisi Centrale Rischi',
    description: 'Analisi dei dati dalla Centrale Rischi',
    is_active: true,
  },
];

// Helper to get product by ID
export const getProductById = (id: number): Product | undefined => {
  return PRODUCTS.find(p => p.id === id);
};

// Helper to get product by name
export const getProductByName = (name: string): Product | undefined => {
  return PRODUCTS.find(p => p.name === name);
};

export default PRODUCTS;