# PRD - Financial Analysis Platform (Phase 1)
**Product Requirements Document**

Version: 1.0  
Date: September 2025  
Target: Frontend Developer with Backend Integration Overview

---

## Project Overview

Development of a multi-tenant financial analysis platform inspired by Formula Finance, featuring user management, licensing system, and report generation capabilities.

**Technology Stack:**
- **Backend:** FastAPI (Python) + PostgreSQL
- **Frontend:** Next.js (React + TypeScript)
- **Authentication:** Multi-role system (Google OAuth + Email/Password)

---

## Phase 1 Scope

This phase includes the **core foundation** of the platform:

1. **Authentication System** - Multi-role login with Google OAuth and traditional email/password
2. **User Management** - Role-based access control (Superuser, Commercial, Client)
3. **Contact Management** - CRUD operations for client contacts/companies
4. **License System** - License assignment and consumption tracking
5. **Single Report Module** - Basic report workflow with external API integration

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
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role_enum AS ENUM ('superuser', 'commercial', 'client');
```

### `contacts` table
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    tax_code VARCHAR(50),
    contact_type contact_type_enum DEFAULT 'client',
    subject_category subject_category_enum,
    status contact_status_enum DEFAULT 'active',
    
    -- Contact information
    email VARCHAR(255) NOT NULL,
    pec_email VARCHAR(255),
    phone VARCHAR(50),
    phone_alt VARCHAR(50),
    
    -- Address
    address VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    province VARCHAR(10),
    country VARCHAR(10) DEFAULT 'IT',
    
    -- Relationships
    parent_contact_id INTEGER REFERENCES contacts(id),
    
    -- Metadata
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE contact_type_enum AS ENUM ('client', 'reseller', 'intermediary', 'potential');
CREATE TYPE subject_category_enum AS ENUM ('professional', 'company', 'public_administration');
CREATE TYPE contact_status_enum AS ENUM ('active', 'inactive', 'suspended');
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
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
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
    contact_id INTEGER REFERENCES contacts(id),
    module_id INTEGER REFERENCES modules(id),
    requested_by INTEGER REFERENCES users(id),
    
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

## Contact Management Endpoints

### GET `/contacts` (Commercial/Superuser only)
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 50)  
- `search`: string (search in business_name, email, vat_number)
- `contact_type`: enum filter
- `status`: enum filter

**Response:**
```json
{
    "contacts": [
        {
            "id": 45,
            "business_name": "Gruppo Baglioni",
            "vat_number": "01169330030",
            "email": "amm_mail@baglionispa.com",
            "contact_type": "reseller",
            "status": "active",
            "address": "VIA DANTE ALIGHIERI, 8",
            "city": "S.PIETRO MOSEZZO",
            "province": "NO"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 50,
        "total": 1608,
        "pages": 33
    }
}
```

### GET `/contacts/{contact_id}` (Commercial/Superuser only)
**Response:**
```json
{
    "id": 45,
    "business_name": "Gruppo Baglioni",
    "vat_number": "01169330030",
    "tax_code": "01169330030",
    "contact_type": "reseller",
    "subject_category": "company",
    "status": "active",
    "email": "amm_mail@baglionispa.com",
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

### POST `/contacts` (Commercial/Superuser only)
Create new contact

### PUT `/contacts/{contact_id}` (Commercial/Superuser only)  
Update contact

## License Management Endpoints

### POST `/contacts/{contact_id}/licenses` (Superuser only)
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

## Report Generation Endpoints

### POST `/reports/new`
**Body:**
```json
{
    "contact_id": 45,
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

**Response:**
```json
{
    "report_id": 1001,
    "status": "pending",
    "message": "Report creation initiated"
}
```

### GET `/reports/{report_id}/status`
**Response:**
```json
{
    "id": 1001,
    "status": "processing",
    "progress": 45,
    "estimated_completion": "2025-09-10T16:30:00Z"
}
```

### GET `/reports/{report_id}`
**Response:**
```json
{
    "id": 1001,
    "contact": {
        "id": 45,
        "business_name": "Gruppo Baglioni"
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
    
    const canAccessContacts = (): boolean => {
        return hasRole(['superuser', 'commercial']);
    };
    
    return { user, hasRole, canAccessContacts };
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
- **Commercial role:** Quick access to contacts, recent activity
- **Superuser role:** System overview, all modules access

### 3. Contacts Management (`/contacts`) 
**Access: Commercial + Superuser only**

- Contact list with search/filters
- Contact detail pages (`/contacts/[id]`)
- License management within contact details

### 4. Reports (`/reports`)
**Different access levels per role:**

- **Client:** Only own reports
- **Commercial/Superuser:** All reports with filtering

### 5. New Report (`/reports/new`)
- Module selection (based on available licenses)
- Form for report parameters
- Progress tracking after submission

## Key Components

### Contact Detail Component
```typescript
// components/ContactDetail.tsx
interface ContactDetailProps {
    contactId: number;
}

export function ContactDetail({ contactId }: ContactDetailProps) {
    const { data: contact } = useContact(contactId);
    const { hasRole } = useAuth();
    
    return (
        <div className="contact-detail">
            {/* Basic contact information */}
            <ContactInfo contact={contact} />
            
            {/* License management section - only for commercial/superuser */}
            {hasRole(['commercial', 'superuser']) && (
                <LicenseManagement 
                    contactId={contactId} 
                    licenses={contact.licenses} 
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

// store/slices/contactsSlice.ts  
interface ContactsState {
    contacts: Contact[];
    currentContact: Contact | null;
    filters: ContactFilters;
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