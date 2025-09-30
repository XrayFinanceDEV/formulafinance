import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { canEditCustomers, canDeleteCustomers, UserRole } from '@/lib/auth-provider';
import { dataProvider } from '@/lib/data-provider';
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
      return result;
    },
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', 'getOne', { id }],
    queryFn: async () => {
      const result = await dataProvider.getOne('customers', { id });
      return result;
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