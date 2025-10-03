import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { License } from '@/types/auth';

interface LicensesResponse {
  data: License[];
  total: number;
}

/**
 * Fetch all licenses with optional filters
 */
export function useLicenses(params?: {
  page?: number;
  perPage?: number;
  userId?: number;
  moduleId?: number;
  status?: string;
}) {
  const { page = 1, perPage = 50, userId, moduleId, status } = params || {};

  const filters: Record<string, any> = { page, perPage };
  if (userId) filters.user_id = userId;
  if (moduleId) filters.module_id = moduleId;
  if (status) filters.status = status;

  return useQuery({
    queryKey: queryKeys.licenses.list(filters),
    queryFn: () => apiClient.get<LicensesResponse>('/licenses', filters),
  });
}

/**
 * Fetch licenses for a specific user
 */
export function useUserLicenses(userId: number) {
  return useLicenses({ userId, perPage: 100 });
}

/**
 * Fetch single license by ID
 */
export function useLicense(id: number) {
  return useQuery({
    queryKey: queryKeys.licenses.detail(id),
    queryFn: () => apiClient.get<{ data: License }>(`/licenses/${id}`),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Create new license
 */
export function useCreateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<License>) =>
      apiClient.post('/licenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
    },
  });
}

/**
 * Update existing license
 */
export function useUpdateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<License> }) =>
      apiClient.put(`/licenses/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.licenses.detail(variables.id)
      });
    },
  });
}

/**
 * Delete license
 */
export function useDeleteLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/licenses/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.licenses.detail(id) });
    },
  });
}

/**
 * Helper to calculate license usage percentage
 */
export function getLicenseUsagePercentage(license: License): number {
  if (license.quantity_total === 0) return 0;
  return Math.round((license.quantity_used / license.quantity_total) * 100);
}

/**
 * Helper to get remaining licenses
 */
export function getRemainingLicenses(license: License): number {
  return license.quantity_total - license.quantity_used;
}

/**
 * Helper to check if license is expiring soon (within 30 days)
 */
export function isLicenseExpiringSoon(license: License): boolean {
  const expirationDate = new Date(license.expiration_date);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return expirationDate <= thirtyDaysFromNow && expirationDate > new Date();
}

/**
 * Helper to check if license is expired
 */
export function isLicenseExpired(license: License): boolean {
  const expirationDate = new Date(license.expiration_date);
  return expirationDate < new Date() || license.status === 'expired';
}

/**
 * Helper to check if license has available units
 */
export function hasAvailableLicenses(license: License): boolean {
  return getRemainingLicenses(license) > 0 && !isLicenseExpired(license) && license.status === 'active';
}

/**
 * Get color class for license status
 */
export function getLicenseStatusColor(license: License): 'success' | 'warning' | 'error' | 'default' {
  if (isLicenseExpired(license)) return 'error';
  if (isLicenseExpiringSoon(license)) return 'warning';

  const remaining = getRemainingLicenses(license);
  const percentage = (remaining / license.quantity_total) * 100;

  if (percentage <= 10) return 'error';
  if (percentage <= 20) return 'warning';
  return 'success';
}
