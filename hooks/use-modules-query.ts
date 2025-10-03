import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Module } from '@/types/modules';

interface ModulesResponse {
  data: Module[];
  total: number;
}

export function useModules() {
  return useQuery({
    queryKey: queryKeys.modules.lists(),
    queryFn: () => apiClient.get<ModulesResponse>('/modules', {
      page: 1,
      perPage: 100,
      is_active: true,
      sortField: 'display_name',
      sortOrder: 'ASC',
    }),
  });
}

export function useModule(id: number | string) {
  return useQuery({
    queryKey: [...queryKeys.modules.all, 'detail', id],
    queryFn: () => apiClient.get<{ data: Module }>(`/modules/${id}`),
    select: (response) => response.data,
    enabled: !!id,
  });
}
