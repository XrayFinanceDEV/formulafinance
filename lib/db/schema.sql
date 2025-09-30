-- FormulaFinance SQLite Database Schema
-- Based on customer creation form, licenses, and reports structures

-- Customers table (based on customer-form.tsx multi-step form)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Anagrafica (Step 1)
  ragione_sociale TEXT NOT NULL,
  partita_iva TEXT NOT NULL,
  codice_fiscale TEXT,
  tipo_utente TEXT CHECK(tipo_utente IN ('cliente', 'intermediario', 'rivenditore', 'potenziale')) NOT NULL,
  soggetto TEXT CHECK(soggetto IN ('professionista', 'societa', 'pa')) NOT NULL,
  stato TEXT CHECK(stato IN ('attivo', 'disabilitato')) DEFAULT 'attivo',

  -- Riferimenti (Step 2)
  email TEXT NOT NULL,
  pec_email TEXT,
  telefono TEXT,
  telefono_alt TEXT,

  -- Indirizzo (Step 3)
  via TEXT,
  citta TEXT,
  cap TEXT,
  provincia TEXT,
  paese TEXT DEFAULT 'IT',

  -- Relazioni (Step 4)
  parent_id INTEGER,
  note_aggiuntive TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Products/Modules table
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Licenses table (based on License interface and customer-form.tsx Step 5)
CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,

  -- License quantities
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_used INTEGER NOT NULL DEFAULT 0,

  -- Dates
  activation_date DATE NOT NULL,
  expiration_date DATE NOT NULL,

  -- Status
  status TEXT CHECK(status IN ('active', 'expired', 'suspended')) DEFAULT 'active',

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Reports table (based on Report interface in types/reports.ts)
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  report_type TEXT NOT NULL,

  -- Status tracking
  status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',

  -- Data (stored as JSON text)
  input_data TEXT, -- JSON
  api_response TEXT, -- JSON
  generated_html TEXT,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Role-based access control
  role TEXT CHECK(role IN ('superuser', 'commercial', 'client')) DEFAULT 'client',
  is_active BOOLEAN DEFAULT 1,

  -- Personal info
  first_name TEXT,
  last_name TEXT,

  -- Link to customer (for client users)
  customer_id INTEGER,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_tipo ON customers(tipo_utente);
CREATE INDEX IF NOT EXISTS idx_customers_parent ON customers(parent_id);
CREATE INDEX IF NOT EXISTS idx_licenses_customer ON licenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_module ON licenses(module_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_reports_customer ON reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_customer ON users(customer_id);

-- Trigger to update updated_at timestamp on customers
CREATE TRIGGER IF NOT EXISTS update_customers_timestamp
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on licenses
CREATE TRIGGER IF NOT EXISTS update_licenses_timestamp
AFTER UPDATE ON licenses
FOR EACH ROW
BEGIN
  UPDATE licenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on reports
CREATE TRIGGER IF NOT EXISTS update_reports_timestamp
AFTER UPDATE ON reports
FOR EACH ROW
BEGIN
  UPDATE reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;