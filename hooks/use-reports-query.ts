import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Report, CreateReportInput } from '@/types/reports';

interface ReportsResponse {
  data: Report[];
  total: number;
}

/**
 * Fetch all reports with optional filters
 */
export function useReports(params?: {
  page?: number;
  perPage?: number;
  filter?: Record<string, any>;
}) {
  const { page = 1, perPage = 10, filter = {} } = params || {};

  return useQuery({
    queryKey: queryKeys.reports.list({ page, perPage, ...filter }),
    queryFn: () => apiClient.get<ReportsResponse>('/reports', {
      page,
      perPage,
      ...filter,
    }),
  });
}

/**
 * Fetch a single report by ID
 */
export function useReport(id: number | string) {
  return useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => apiClient.get<{ data: Report }>(`/reports/${id}`),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Create a new report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportInput) =>
      apiClient.post<Report>('/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
    },
  });
}

/**
 * Update an existing report
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Report> }) =>
      apiClient.put<Report>(`/reports/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.detail(variables.id)
      });
    },
  });
}

/**
 * Delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) =>
      apiClient.delete(`/reports/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.reports.detail(id) });
    },
  });
}
