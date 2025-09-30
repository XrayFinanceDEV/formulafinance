import { getDatabase } from './sqlite';
import customersData from '@/app/customers/customers-data.json';

/**
 * Seed the database with initial data
 */
export function seedDatabase() {
  const db = getDatabase();

  console.log('🌱 Seeding database...');

  try {
    // Start transaction
    db.prepare('BEGIN').run();

    // 1. Seed Modules
    console.log('  → Seeding modules...');
    const modulesData = [
      {
        name: 'cr_advanced',
        display_name: 'CR Avanzata',
        description: 'Analisi avanzata del rischio di credito',
        is_active: 1,
      },
      {
        name: 'balance_analysis',
        display_name: 'Analisi di Bilancio',
        description: 'Analisi del bilancio aziendale',
        is_active: 1,
      },
      {
        name: 'competitors_balance',
        display_name: 'Bilancio Competitors',
        description: 'Analisi bilancio della concorrenza',
        is_active: 1,
      },
      {
        name: 'report_de_minimis',
        display_name: 'Report De Minimis',
        description: 'Verifica degli aiuti de minimis ricevuti',
        is_active: 1,
      },
      {
        name: 'analisi_centrale_rischi',
        display_name: 'Analisi Centrale Rischi',
        description: 'Report sull\'esposizione verso il sistema bancario',
        is_active: 1,
      },
    ];

    const insertModule = db.prepare(`
      INSERT INTO modules (name, display_name, description, is_active)
      VALUES (?, ?, ?, ?)
    `);

    for (const module of modulesData) {
      insertModule.run(
        module.name,
        module.display_name,
        module.description,
        module.is_active
      );
    }

    // 2. Seed Customers (convert from existing JSON format)
    console.log('  → Seeding customers...');
    const insertCustomer = db.prepare(`
      INSERT INTO customers (
        ragione_sociale, partita_iva, codice_fiscale, tipo_utente, soggetto, stato,
        email, pec_email, telefono, telefono_alt,
        via, citta, cap, provincia, paese,
        parent_id, note_aggiuntive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Map existing customer data to new schema
    const tipoUtenteMap: Record<string, string> = {
      'Cliente': 'cliente',
      'Rivenditore': 'rivenditore',
      'Intermediario': 'intermediario',
      'Potenziale': 'potenziale',
    };

    for (const customer of customersData) {
      insertCustomer.run(
        customer.name, // ragione_sociale
        `IT${Math.random().toString().slice(2, 13)}`, // partita_iva (generate fake)
        `${Math.random().toString().slice(2, 18)}`, // codice_fiscale (generate fake)
        tipoUtenteMap[customer.type] || 'cliente', // tipo_utente
        'societa', // soggetto (default)
        'attivo', // stato
        customer.email, // email
        null, // pec_email
        '+39 ' + Math.floor(Math.random() * 9000000000 + 1000000000), // telefono (generate fake)
        null, // telefono_alt
        `Via ${customer.name.split(' ')[0]} ${Math.floor(Math.random() * 100) + 1}`, // via (generate fake)
        ['Milano', 'Roma', 'Torino', 'Napoli', 'Bologna'][Math.floor(Math.random() * 5)], // citta
        `${Math.floor(Math.random() * 90000) + 10000}`, // cap (generate fake)
        ['MI', 'RM', 'TO', 'NA', 'BO'][Math.floor(Math.random() * 5)], // provincia
        'IT', // paese
        null, // parent_id
        null // note_aggiuntive
      );
    }

    // 3. Seed Licenses (based on existing customer data)
    console.log('  → Seeding licenses...');
    const insertLicense = db.prepare(`
      INSERT INTO licenses (
        customer_id, module_id, quantity_total, quantity_used,
        activation_date, expiration_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Get customer IDs
    const customers = db
      .prepare('SELECT id FROM customers')
      .all() as { id: number }[];

    // Assign random licenses to customers
    for (const customer of customers) {
      // Each customer gets 1-3 random modules
      const numLicenses = Math.floor(Math.random() * 3) + 1;
      const assignedModules = new Set<number>();

      for (let i = 0; i < numLicenses; i++) {
        const moduleId = Math.floor(Math.random() * modulesData.length) + 1;

        // Avoid duplicate modules for same customer
        if (assignedModules.has(moduleId)) continue;
        assignedModules.add(moduleId);

        const quantityTotal = [10, 25, 50, 100, 200][Math.floor(Math.random() * 5)];
        const quantityUsed = Math.floor(Math.random() * quantityTotal * 0.8); // 0-80% usage

        const activationDate = new Date();
        activationDate.setMonth(activationDate.getMonth() - Math.floor(Math.random() * 12));

        const expirationDate = new Date(activationDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        insertLicense.run(
          customer.id,
          moduleId,
          quantityTotal,
          quantityUsed,
          activationDate.toISOString().split('T')[0],
          expirationDate.toISOString().split('T')[0],
          'active'
        );
      }
    }

    // 4. Seed Reports
    console.log('  → Seeding reports...');
    const insertReport = db.prepare(`
      INSERT INTO reports (
        customer_id, module_id, report_type, status,
        input_data, api_response, generated_html,
        created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Create a few sample reports
    const statuses: ('pending' | 'processing' | 'completed' | 'failed')[] = [
      'pending',
      'processing',
      'completed',
      'failed',
    ];

    for (let i = 0; i < 20; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const moduleId = Math.floor(Math.random() * modulesData.length) + 1;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

      const completedAt = status === 'completed' ? new Date(createdAt.getTime() + 2 * 60 * 1000) : null;

      insertReport.run(
        customer.id,
        moduleId,
        modulesData[moduleId - 1].name,
        status,
        JSON.stringify({ codice_fiscale: `CF${Math.random().toString().slice(2, 18)}` }),
        status === 'completed' ? JSON.stringify({ success: true, data: {} }) : null,
        status === 'completed' ? '<html><body>Report generated</body></html>' : null,
        createdAt.toISOString(),
        completedAt ? completedAt.toISOString() : null
      );
    }

    // 5. Seed Users (admin user)
    console.log('  → Seeding users...');
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, role, is_active, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Note: In production, use proper password hashing (bcrypt, argon2, etc.)
    insertUser.run(
      'admin@formulafinance.com',
      'hashed_password_demo', // Replace with actual hash
      'superuser',
      1,
      'Admin',
      'User'
    );

    insertUser.run(
      'commercial@formulafinance.com',
      'hashed_password_demo',
      'commercial',
      1,
      'Commercial',
      'User'
    );

    // Commit transaction
    db.prepare('COMMIT').run();

    console.log('✅ Database seeded successfully');
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Check if database needs seeding
 */
export function shouldSeed(): boolean {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM customers').get() as {
    count: number;
  };
  return result.count === 0;
}

/**
 * Initialize database with schema and seed data
 */
export function initializeDatabase() {
  try {
    // Database connection will auto-initialize schema
    const db = getDatabase();

    // Seed if empty
    if (shouldSeed()) {
      seedDatabase();
    } else {
      console.log('ℹ️  Database already seeded, skipping...');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Export for CLI usage
if (require.main === module) {
  initializeDatabase();
}