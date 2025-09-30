// User role types for role-based access control
export type UserRole = 'superuser' | 'commercial' | 'client';

// Subject category for client users
export type SubjectCategory = 'professional' | 'company' | 'public_administration';

// User interface matching the database schema
export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;

  // Personal information
  first_name?: string;
  last_name?: string;

  // Business information (for client users)
  business_name?: string;
  vat_number?: string;
  tax_code?: string;
  subject_category?: SubjectCategory;

  // Contact information
  phone?: string;
  pec_email?: string;

  // Address
  address?: string;
  city?: string;
  postal_code?: string;
  province?: string;
  country?: string;

  // Metadata
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  licenses?: License[];
}

// License status
export type LicenseStatus = 'active' | 'expired' | 'suspended';

// Product/Module information
export interface Product {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

// License interface matching the database schema
export interface License {
  id: number;
  user_id: number;
  module_id: number;
  quantity_total: number;
  quantity_used: number;
  activation_date: string;
  expiration_date: string;
  status: LicenseStatus;
  created_at?: string;
  updated_at?: string;

  // Nested relations
  module?: Product;
  user?: User;
}

// License assignment form data
export interface LicenseAssignmentData {
  user_id: number;
  module_id: number;
  quantity_total: number;
  activation_date: string;
  expiration_date: string;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  canManageUsers: () => boolean;
  canManageLicenses: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}