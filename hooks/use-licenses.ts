import { useGetList, useGetOne, useCreate, useUpdate, useDelete } from 'ra-core';
import { License, LicenseAssignmentData } from '@/types/auth';

/**
 * Hook to fetch all licenses with optional filters
 */
export function useLicenses(params?: {
  page?: number;
  perPage?: number;
  userId?: number;
  moduleId?: number;
  status?: string;
}) {
  const { page = 1, perPage = 50, userId, moduleId, status } = params || {};

  const filter: Record<string, any> = {};
  if (userId) filter.user_id = userId;
  if (moduleId) filter.module_id = moduleId;
  if (status) filter.status = status;

  return useGetList<License>('licenses', {
    pagination: { page, perPage },
    sort: { field: 'created_at', order: 'DESC' },
    filter,
  });
}

/**
 * Hook to fetch licenses for a specific user
 */
export function useUserLicenses(userId: number) {
  return useLicenses({ userId, perPage: 100 });
}

/**
 * Hook to fetch a single license by ID
 */
export function useLicense(id: number) {
  return useGetOne<License>('licenses', { id });
}

/**
 * Hook to create a new license
 */
export function useCreateLicense() {
  return useCreate<License>();
}

/**
 * Hook to update an existing license
 */
export function useUpdateLicense() {
  return useUpdate<License>();
}

/**
 * Hook to delete a license
 */
export function useDeleteLicense() {
  return useDelete<License>();
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