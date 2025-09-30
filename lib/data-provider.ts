import fakeDataProvider from 'ra-data-fakerest';
import customersData from '@/app/customers/customers-data.json';

// Fake modules data
const modulesData = [
  {
    id: 1,
    name: 'de_minimis',
    display_name: 'Report De Minimis',
    description: 'Verifica degli aiuti de minimis ricevuti',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'balance_analysis',
    display_name: 'Analisi Bilancio',
    description: 'Analisi dettagliata del bilancio aziendale',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'cr_analysis',
    display_name: 'Analisi Centrale Rischi',
    description: 'Report sull\'esposizione verso il sistema bancario',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
];

// Fake reports data
const reportsData = [
  {
    id: 1,
    user_id: 45,
    module_id: 1,
    report_type: 'de_minimis',
    status: 'completed',
    input_data: { codice_fiscale: '01169330030' },
    created_at: '2025-09-29T10:00:00Z',
    updated_at: '2025-09-29T10:02:00Z',
    completed_at: '2025-09-29T10:02:00Z',
  },
  {
    id: 2,
    user_id: 45,
    module_id: 2,
    report_type: 'balance_analysis',
    status: 'processing',
    input_data: { codice_fiscale: '01169330030' },
    created_at: '2025-09-30T09:00:00Z',
    updated_at: '2025-09-30T09:05:00Z',
  },
  {
    id: 3,
    user_id: 45,
    module_id: 3,
    report_type: 'cr_analysis',
    status: 'pending',
    input_data: { codice_fiscale: '01169330030' },
    created_at: '2025-09-30T11:00:00Z',
    updated_at: '2025-09-30T11:00:00Z',
  },
];

// Fake data for development - add more resources as needed
const fakeData = {
  customers: customersData,
  modules: modulesData,
  reports: reportsData,
};

// Create the fake data provider
// Second parameter (true) enables logging for debugging
// Third parameter (300) adds a 300ms network delay simulation
export const dataProvider = fakeDataProvider(fakeData, true, 300);