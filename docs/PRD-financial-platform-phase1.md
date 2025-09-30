# PRD - Financial Analysis Platform (Phase 1)
**Product Requirements Document**

Version: 2.0
Date: September 2025
Target: Frontend Developer with Backend Integration Overview

---

## Project Overview

Development of a multi-tenant financial analysis platform inspired by Formula Finance, featuring user management, licensing system, and report generation capabilities.

**Architecture Note:** The platform operates on a **1 user = 1 customer** model. There is no separation between users and contacts/customers. Each user account represents a client entity with their own licenses and reports.

**Technology Stack:**
- **Backend:** FastAPI (Python) + PostgreSQL
- **Frontend:** Next.js (React + TypeScript)
- **Authentication:** Multi-role system (Google OAuth + Email/Password)

---

## Phase 1 Scope

This phase includes the **core foundation** of the platform:

1. **Authentication System** - Multi-role login with Google OAuth and traditional email/password
2. **User Management** - Role-based access control (Superuser, Commercial, Client)
3. **License System** - License assignment to users and consumption tracking
4. **Single Report Module** - Basic report workflow with external API integration

---

## Phase 1 - Most Urgent Tasks

### 1. Role-Based Access Control (RBAC) - **CRITICAL**
- [ ] Create `types/auth.ts` with UserRole types ('superuser', 'commercial', 'client')
- [ ] Implement `useAuth()` hook with role checking functions
- [ ] Add route guards for commercial/superuser-only pages
- [ ] Implement role-based UI component visibility

### 2. License Management Module - **CORE FEATURE**
- [ ] Create user detail page showing assigned licenses
- [ ] Build license assignment UI (superuser only)
- [ ] Display license usage tracking (quantity_total vs quantity_used)
- [ ] Add license validation before report creation
- [ ] Implement license consumption on report generation

### 3. Reports Module - **CORE FEATURE**
- [ ] Build `/reports` page with role-based filtering
  - Clients see only their own reports
  - Commercial/Superuser see all reports
- [ ] Create `/reports/new` page with module selection
- [ ] Implement report status tracking component
- [ ] Add report download functionality
- [ ] Integrate license consumption workflow

### 4. Role-Based Dashboard Enhancement - **HIGH PRIORITY**
- [ ] Client dashboard: Display personal licenses & reports
- [ ] Commercial dashboard: Quick access to users list, recent activity
- [ ] Superuser dashboard: System overview, license management access

### 5. Enhanced User Management - **MEDIUM PRIORITY**
- [ ] Add business fields to users (business_name, vat_number, tax_code, etc.)
- [ ] Implement user search/filter functionality
- [ ] Add user status management (active/inactive)

### 6. Backend Integration Testing - **CRITICAL**
- [ ] Test FastAPI auth provider with real backend
- [ ] Validate data provider against FastAPI conventions
- [ ] Test license consumption flow end-to-end
- [ ] Switch from fake data to production providers

---

# Database Schema Overview

## Core Entities

### `users` table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- nullable for Google OAuth users
    google_id VARCHAR(255) UNIQUE, -- nullable for email/password users
    role user_role_enum NOT NULL, -- 'superuser', 'commercial', 'client'
    is_active BOOLEAN DEFAULT TRUE,

    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Business information (for client users)
    business_name VARCHAR(255),
    vat_number VARCHAR(50),
    tax_code VARCHAR(50),
    subject_category subject_category_enum,

    -- Contact information
    phone VARCHAR(50),
    pec_email VARCHAR(255),

    -- Address
    address VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    province VARCHAR(10),
    country VARCHAR(10) DEFAULT 'IT',

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role_enum AS ENUM ('superuser', 'commercial', 'client');
CREATE TYPE subject_category_enum AS ENUM ('professional', 'company', 'public_administration');
```

### `modules` table
```sql
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data examples:
-- ('cr_advanced', 'CR Avanzata', 'Advanced credit risk analysis')
-- ('balance_analysis', 'Analisi di Bilancio', 'Balance sheet analysis')
-- ('competitors_balance', 'Bilancio Competitors', 'Competitor balance analysis')
```

### `licenses` table
```sql
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    quantity_total INTEGER NOT NULL DEFAULT 1,
    quantity_used INTEGER NOT NULL DEFAULT 0,
    activation_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status license_status_enum DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_quantity_used CHECK (quantity_used <= quantity_total),
    CONSTRAINT check_dates CHECK (expiration_date > activation_date)
);

CREATE TYPE license_status_enum AS ENUM ('active', 'expired', 'suspended');
```

### `reports` table
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id),

    -- Report data
    report_type VARCHAR(100) NOT NULL,
    status report_status_enum DEFAULT 'pending',
    input_data JSONB, -- Store form data/parameters
    api_response JSONB, -- Store API response
    generated_html TEXT, -- Final HTML report

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TYPE report_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
```

---

# API Endpoints Structure

## Authentication Endpoints

### POST `/auth/login`
**Body:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```
**Response:**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "client",
        "first_name": "John",
        "last_name": "Doe"
    }
}
```

### POST `/auth/google`
**Body:**
```json
{
    "google_token": "google_oauth_token_here"
}
```

### GET `/auth/me`
**Headers:** `Authorization: Bearer {token}`
**Response:** User profile data

## User Management Endpoints

### GET `/users/profile`
Get current user profile and dashboard data

**Response:**
```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "client",
        "first_name": "John",
        "last_name": "Doe"
    },
    "dashboard": {
        "active_licenses": [
            {
                "module_name": "CR Avanzata",
                "quantity_total": 100,
                "quantity_used": 25,
                "expiration_date": "2026-07-25"
            }
        ],
        "recent_reports": [],
        "notifications": []
    }
}
```

## User Management Endpoints

### GET `/users` (Commercial/Superuser only)
**Query Parameters:**
- `skip`: number (default: 0)
- `limit`: number (default: 50)
- `search`: string (search in business_name, email, vat_number)
- `role`: enum filter ('client', 'commercial', 'superuser')
- `is_active`: boolean filter

**Response:**
```json
{
    "items": [
        {
            "id": 45,
            "email": "amm_mail@baglionispa.com",
            "role": "client",
            "business_name": "Gruppo Baglioni",
            "vat_number": "01169330030",
            "is_active": true,
            "address": "VIA DANTE ALIGHIERI, 8",
            "city": "S.PIETRO MOSEZZO",
            "province": "NO"
        }
    ],
    "total": 1608
}
```

### GET `/users/{user_id}` (Commercial/Superuser only, or own profile)
**Response:**
```json
{
    "id": 45,
    "email": "amm_mail@baglionispa.com",
    "role": "client",
    "first_name": "Mario",
    "last_name": "Rossi",
    "business_name": "Gruppo Baglioni",
    "vat_number": "01169330030",
    "tax_code": "01169330030",
    "subject_category": "company",
    "is_active": true,
    "pec_email": "baglioni@pec-mail.it",
    "phone": "0321/485211",
    "address": "VIA DANTE ALIGHIERI, 8",
    "city": "S.PIETRO MOSEZZO",
    "postal_code": "28060",
    "province": "NO",
    "licenses": [
        {
            "id": 123,
            "module": {
                "name": "cr_advanced",
                "display_name": "CR Avanzata"
            },
            "quantity_total": 100,
            "quantity_used": 25,
            "activation_date": "2025-07-25",
            "expiration_date": "2026-07-25",
            "status": "active"
        }
    ]
}
```

### POST `/users` (Superuser only)
Create new user account

### PUT `/users/{user_id}` (Superuser only, or own profile for basic fields)
Update user information

## License Management Endpoints

### POST `/users/{user_id}/licenses` (Superuser only)
**Body:**
```json
{
    "module_id": 1,
    "quantity_total": 100,
    "activation_date": "2025-09-10",
    "expiration_date": "2026-09-10"
}
```

### GET `/licenses` (Superuser only)
Global license overview with pagination and filters

**Query Parameters:**
- `skip`: number (default: 0)
- `limit`: number (default: 50)
- `user_id`: filter by user
- `module_id`: filter by module
- `status`: filter by status

## Report Generation Endpoints

### POST `/reports`
**Body:**
```json
{
    "module_id": 1,
    "report_type": "balance_analysis",
    "input_data": {
        "company_name": "Test Company SRL",
        "vat_number": "12345678901",
        "analysis_year": 2024,
        "custom_parameters": {}
    }
}
```
**Note:** The user_id is automatically extracted from the JWT token. The system will validate that the user has available licenses for the specified module.

**Response:**
```json
{
    "id": 1001,
    "status": "pending",
    "message": "Report creation initiated"
}
```

### GET `/reports` (Clients see only their own, Commercial/Superuser see all)
**Query Parameters:**
- `skip`: number (default: 0)
- `limit`: number (default: 50)
- `user_id`: filter by user (Commercial/Superuser only)
- `module_id`: filter by module
- `status`: filter by status

### GET `/reports/{report_id}`
**Response:**
```json
{
    "id": 1001,
    "user": {
        "id": 45,
        "business_name": "Gruppo Baglioni",
        "email": "amm_mail@baglionispa.com"
    },
    "module": {
        "name": "balance_analysis",
        "display_name": "Analisi di Bilancio"
    },
    "status": "completed",
    "generated_html": "<html>...</html>",
    "created_at": "2025-09-10T15:00:00Z",
    "completed_at": "2025-09-10T15:30:00Z"
}
```

### GET `/reports/{report_id}/download`
Download report as PDF

---

# Frontend Implementation Guide

## Role-Based Access Control

The frontend must implement role-based routing and component visibility:

```typescript
// types/auth.ts
export type UserRole = 'superuser' | 'commercial' | 'client';

export interface User {
    id: number;
    email: string;
    role: UserRole;
    first_name: string;
    last_name: string;
}

// hooks/useAuth.ts
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    
    const hasRole = (roles: UserRole[]): boolean => {
        return user ? roles.includes(user.role) : false;
    };

    const canManageUsers = (): boolean => {
        return hasRole(['superuser', 'commercial']);
    };

    const canManageLicenses = (): boolean => {
        return hasRole(['superuser']);
    };

    return { user, hasRole, canManageUsers, canManageLicenses };
}
```

## Key Pages Structure

### 1. Login Page (`/login`)
- Email/password form
- Google OAuth button
- Role-based redirect after successful login

### 2. Dashboard (`/dashboard`)
**All roles access this page with different content:**

- **Client role:** Personal licenses overview, own reports
- **Commercial role:** Quick access to users list, recent activity
- **Superuser role:** System overview, license management access

### 3. Users Management (`/users`)
**Access: Commercial + Superuser only**

- User list with search/filters (role-based filtering)
- User detail pages (`/users/{id}`)
- License management within user details (Superuser only)

### 4. Reports (`/reports`)
**Different access levels per role:**

- **Client:** Only own reports
- **Commercial/Superuser:** All reports with filtering by user

### 5. New Report (`/reports/new`)
- Module selection (based on user's available licenses)
- Form for report parameters
- Progress tracking after submission
- License consumption notification

## Key Components

### User Detail Component
```typescript
// components/UserDetail.tsx
interface UserDetailProps {
    userId: number;
}

export function UserDetail({ userId }: UserDetailProps) {
    const { data: user } = useGetOne('users', { id: userId });
    const { canManageLicenses } = useAuth();

    return (
        <div className="user-detail">
            {/* Basic user information */}
            <UserInfo user={user} />

            {/* License overview - visible to all */}
            <LicenseOverview licenses={user.licenses} />

            {/* License management section - only for superuser */}
            {canManageLicenses() && (
                <LicenseManagement
                    userId={userId}
                    licenses={user.licenses}
                />
            )}
        </div>
    );
}
```

### Report Status Component
```typescript
// components/ReportStatus.tsx
interface ReportStatusProps {
    reportId: number;
}

export function ReportStatus({ reportId }: ReportStatusProps) {
    const { data: report } = useReportStatus(reportId);
    
    return (
        <div className="report-status">
            <StatusBadge status={report.status} />
            {report.status === 'processing' && (
                <ProgressBar progress={report.progress} />
            )}
            {report.status === 'completed' && (
                <DownloadButton reportId={reportId} />
            )}
        </div>
    );
}
```

## State Management Structure

```typescript
// store/slices/authSlice.ts
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
}

// store/slices/usersSlice.ts
interface UsersState {
    users: User[];
    currentUser: User | null;
    filters: UserFilters;
    pagination: PaginationInfo;
}

// store/slices/reportsSlice.ts
interface ReportsState {
    reports: Report[];
    currentReport: Report | null;
    newReportForm: NewReportFormData;
}
```

## External API Integration

The platform integrates with external APIs for report generation. The frontend should handle:

1. **Report Creation**: Send form data to backend, receive report_id
2. **Status Polling**: Regularly check report status during processing
3. **Progress Updates**: Display real-time progress to user
4. **Error Handling**: Handle API timeouts and failures gracefully
5. **Download Management**: Provide secure download links for completed reports

---

# Technical Requirements

## Authentication Flow
1. User submits login credentials
2. Backend validates and returns JWT token
3. Frontend stores token (secure httpOnly cookie recommended)
4. All subsequent API calls include Authorization header
5. Token refresh handled automatically

## License Consumption Logic
- Each report creation must check available licenses
- Consume 1 license unit upon report creation
- Display remaining license count in real-time
- Prevent report creation if no licenses available

## Error Handling
- Network errors with retry logic
- Validation errors with field-specific messages  
- Authorization errors with redirect to login
- Rate limiting with user-friendly messages

## Performance Considerations
- Implement pagination for all list views
- Use React Query for server state management
- Debounce search inputs
- Lazy load report content
- Cache static data (modules, user profile)

---

**This PRD covers Phase 1 foundation. Subsequent phases will add advanced report modules, async workflows, and AI integration.**