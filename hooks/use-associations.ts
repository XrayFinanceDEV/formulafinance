/**
 * React Query hooks for association management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  AssociationStats,
  AssociationWithDetails,
  ParentAssociationInfo,
} from '@/types/associations'
import { UserRole } from '@/types/rbac'
import { queryKeys } from '@/lib/query-keys'

/**
 * Search for potential parent customers
 */
export function useSearchParents(
  childId: number,
  childType: UserRole,
  searchQuery: string
) {
  return useQuery({
    queryKey: queryKeys.associations.search(childId, searchQuery),
    queryFn: () =>
      apiClient.get<any[]>(
        `/associations/search?childId=${childId}&childType=${childType}&q=${searchQuery}`
      ),
    enabled: searchQuery.length >= 2, // Only search if query is at least 2 chars
  })
}

/**
 * Get associations for a customer (parent and children)
 */
export function useCustomerAssociations(customerId: number) {
  return useQuery({
    queryKey: queryKeys.associations.customer(customerId),
    queryFn: () =>
      apiClient.get<{
        parent: AssociationWithDetails | null
        children: AssociationWithDetails[]
      }>(`/associations?customerId=${customerId}`),
    enabled: !!customerId,
  })
}

/**
 * Create a new association
 */
export function useCreateAssociation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      parentId: number
      childId: number
      notes?: string
    }) => apiClient.post('/associations', data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.associations.customer(variables.childId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.associations.customer(variables.parentId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.associations.stats(variables.parentId),
      })
    },
  })
}

/**
 * Delete an association
 */
export function useDeleteAssociation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (associationId: number) =>
      apiClient.delete(`/associations?id=${associationId}`),
    onSuccess: () => {
      // Invalidate all association queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.associations.all,
      })
    },
  })
}

/**
 * Get association stats for Rivenditore/Intermediario
 */
export function useAssociationStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.associations.stats(userId),
    queryFn: () =>
      apiClient.get<AssociationStats>(`/associations/stats?userId=${userId}`),
    enabled: !!userId,
  })
}

/**
 * Get parent association info (for profile page)
 */
export function useParentAssociation(customerId: number) {
  return useQuery({
    queryKey: queryKeys.associations.parent(customerId),
    queryFn: async () => {
      const data = await apiClient.get<{
        parent: AssociationWithDetails | null
        children: AssociationWithDetails[]
      }>(`/associations?customerId=${customerId}`)
      return data.parent
    },
    enabled: !!customerId,
  })
}
