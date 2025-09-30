import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { canEditCustomers, canDeleteCustomers, UserRole } from '@/lib/auth-provider';
import { sqliteDataProvider as dataProvider } from '@/lib/sqlite-data-provider';
import { authProvider } from '@/lib/auth-provider';

export interface Customer {
  id: number;
  name: string;
  email: string;
  type: 'Cliente' | 'Rivenditore' | 'Intermediario' | 'Potenziale';
  licenseUsage: number;
  maxLicenses: number;
  status: 'Attivo' | 'Attenzione' | 'Oltre il limite';
  joinDate: string;
}

// Transform database record to Customer interface
function transformDbToCustomer(dbRecord: any): Customer {
  return {
    id: dbRecord.id,
    name: dbRecord.ragione_sociale || dbRecord.name || 'Unknown',
    email: dbRecord.email || '',
    type: capitalizeFirstLetter(dbRecord.tipo_utente || dbRecord.type || 'cliente') as Customer['type'],
    licenseUsage: dbRecord.licenseUsage || 0,
    maxLicenses: dbRecord.maxLicenses || 0,
    status: capitalizeFirstLetter(dbRecord.stato || dbRecord.status || 'attivo') as Customer['status'],
    joinDate: dbRecord.created_at || dbRecord.joinDate || new Date().toISOString(),
  };
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export interface CustomerFilters {
  q?: string;
  type?: string;
  status?: string;
}

export interface CustomerPagination {
  page: number;
  perPage: number;
}

export interface CustomerSort {
  field: string;
  order: 'ASC' | 'DESC';
}

export function useCustomers(
  pagination: CustomerPagination = { page: 1, perPage: 10 },
  sort: CustomerSort = { field: 'id', order: 'ASC' },
  filter: CustomerFilters = {}
) {
  return useQuery({
    queryKey: ['customers', 'getList', { pagination, sort, filter }],
    queryFn: async () => {
      const result = await dataProvider.getList('customers', {
        pagination,
        sort,
        filter,
      });

      // Transform database records to Customer interface
      return {
        data: result.data.map(transformDbToCustomer),
        total: result.total,
      };
    },
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', 'getOne', { id }],
    queryFn: async () => {
      const result = await dataProvider.getOne('customers', { id });
      return {
        data: transformDbToCustomer(result.data),
      };
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'joinDate'>) => {
      const result = await dataProvider.create('customers', { data });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'getList'] });
    },
  });

  return {
    createCustomer: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Customer> }) => {
      const result = await dataProvider.update('customers', { id, data, previousData: {} as Customer });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'getList'] });
    },
  });

  return {
    updateCustomer: (id: number, data: Partial<Customer>) => mutation.mutateAsync({ id, data }),
    isLoading: mutation.isPending,
    error: mutation.error
  };
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await dataProvider.delete('customers', { id, previousData: {} as Customer });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'getList'] });
    },
  });

  return {
    deleteCustomer: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}

export function useCustomerPermissions() {
  const [userRole, setUserRole] = React.useState<UserRole>('user');

  React.useEffect(() => {
    authProvider.getPermissions({})
      .then((role) => setUserRole(role as UserRole))
      .catch(() => setUserRole('user'));
  }, []);

  return {
    canEdit: canEditCustomers(userRole),
    canDelete: canDeleteCustomers(userRole),
    userRole,
  };
}