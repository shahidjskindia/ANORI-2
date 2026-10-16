import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let sqlPromise: Promise<SqlJsStatic> | null = null;

function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file) => `/${file}`,
    });
  }
  return sqlPromise;
}

export interface FullERPDataset {
  company_profile: any;
  vehicles: any[];
  drivers: any[];
  parties: any[];
  vendors: any[];
  trips: any[];
  invoices: any[];
  driver_settlements: any[];
  vendor_settlements: any[];
  expense_master: any[];
}

/**
 * Exports complete ERP operational records into a genuine SQLite 3 database file (.sqlite).
 */
export async function exportDatabaseToSQLite(data: FullERPDataset, filename: string): Promise<boolean> {
  try {
    const SQL = await getSqlJs();
    const db: Database = new SQL.Database();

    // 1. Create Tables
    db.run(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        addr TEXT,
        addr_lines TEXT,
        gst TEXT,
        pan TEXT,
        phone TEXT,
        email TEXT,
        bank_name TEXT,
        acc TEXT,
        bank TEXT,
        stamp_signature_image TEXT
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        type TEXT,
        classification TEXT,
        driver_amount REAL
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT,
        license_no TEXT
      );

      CREATE TABLE IF NOT EXISTS parties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gst TEXT,
        addr TEXT,
        credit_days INTEGER DEFAULT 0,
        credit_limit REAL,
        mobile TEXT,
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT,
        pan TEXT,
        addr TEXT
      );

      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        trip_no TEXT NOT NULL UNIQUE,
        date TEXT,
        vehicle_id TEXT,
        vehicle_number TEXT,
        vehicle_classification TEXT,
        driver_id TEXT,
        driver_name TEXT,
        driver_amount REAL,
        party_id TEXT,
        party_name TEXT,
        from_loc TEXT,
        to_loc TEXT,
        freight REAL,
        trip_advance_amount REAL,
        expenses TEXT,
        trip_advice TEXT,
        notes TEXT,
        status TEXT,
        invoice_status TEXT,
        invoice_id TEXT,
        invoice_no TEXT,
        vendor_id TEXT,
        vendor_name TEXT,
        vendor_contact TEXT,
        vendor_cost REAL,
        vendor_advance REAL,
        vendor_deductions REAL
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_no TEXT NOT NULL UNIQUE,
        date TEXT,
        due_date TEXT,
        credit_days INTEGER DEFAULT 0,
        party_id TEXT,
        party_name TEXT,
        party_gst TEXT,
        party_addr TEXT,
        party_mobile TEXT,
        trip_ids TEXT,
        trip_count INTEGER,
        trips_data TEXT,
        subtotal REAL,
        is_gst INTEGER,
        tax_type TEXT,
        cgst REAL,
        sgst REAL,
        igst REAL,
        total_amount REAL,
        advance REAL,
        balance_due REAL,
        paid_amount REAL,
        status TEXT,
        expense_lines TEXT,
        payments TEXT
      );

      CREATE TABLE IF NOT EXISTS driver_settlements (
        id TEXT PRIMARY KEY,
        date TEXT,
        driver_id TEXT,
        driver_name TEXT,
        type TEXT,
        amount REAL,
        description TEXT,
        source TEXT,
        trip_id TEXT,
        trip_no TEXT
      );

      CREATE TABLE IF NOT EXISTS vendor_settlements (
        id TEXT PRIMARY KEY,
        date TEXT,
        trip_id TEXT,
        trip_no TEXT,
        vehicle_number TEXT,
        vendor_id TEXT,
        vendor_name TEXT,
        vendor_cost REAL,
        vendor_advance REAL,
        deductions REAL,
        balance_payable REAL,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS expense_master (
        id TEXT PRIMARY KEY,
        name TEXT,
        defaultAmount REAL,
        showOnInvoice INTEGER,
        active INTEGER
      );
    `);

    // 2. Insert Company Profile
    if (data.company_profile) {
      const cp = data.company_profile;
      db.run(
        `INSERT INTO company_profile (name, addr, addr_lines, gst, pan, phone, email, bank_name, acc, bank, stamp_signature_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cp.name || '',
          cp.addr || '',
          JSON.stringify(cp.addr_lines || []),
          cp.gst || '',
          cp.pan || '',
          cp.phone || '',
          cp.email || '',
          cp.bank_name || '',
          cp.acc || '',
          cp.bank || '',
          cp.stamp_signature_image || '',
        ]
      );
    }

    // 3. Insert Vehicles
    (data.vehicles || []).forEach((v) => {
      db.run(
        `INSERT OR REPLACE INTO vehicles (id, number, type, classification, driver_amount) VALUES (?, ?, ?, ?, ?)`,
        [v.id, v.number, v.type || '', v.classification || 'COMPANY VEHICLE', v.driver_amount || 0]
      );
    });

    // 4. Insert Drivers
    (data.drivers || []).forEach((d) => {
      db.run(
        `INSERT OR REPLACE INTO drivers (id, name, mobile, license_no) VALUES (?, ?, ?, ?)`,
        [d.id, d.name, d.mobile || '', d.license_no || '']
      );
    });

    // 5. Insert Parties
    (data.parties || []).forEach((p) => {
      db.run(
        `INSERT OR REPLACE INTO parties (id, name, gst, addr, credit_days, credit_limit, mobile, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.name, p.gst || '', p.addr || '', p.credit_days ?? 0, p.credit_limit || 0, p.mobile || '', p.email || '']
      );
    });

    // 6. Insert Vendors
    (data.vendors || []).forEach((vn) => {
      db.run(
        `INSERT OR REPLACE INTO vendors (id, name, mobile, pan, addr) VALUES (?, ?, ?, ?, ?)`,
        [vn.id, vn.name, vn.mobile || '', vn.pan || '', vn.addr || '']
      );
    });

    // 7. Insert Trips
    (data.trips || []).forEach((t) => {
      db.run(
        `INSERT OR REPLACE INTO trips (
          id, trip_no, date, vehicle_id, vehicle_number, vehicle_classification,
          driver_id, driver_name, driver_amount, party_id, party_name,
          from_loc, to_loc, freight, trip_advance_amount, expenses,
          trip_advice, notes, status, invoice_status, invoice_id, invoice_no,
          vendor_id, vendor_name, vendor_contact, vendor_cost, vendor_advance, vendor_deductions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.trip_no,
          t.date,
          t.vehicle_id || '',
          t.vehicle_number || t.vehicle_manual || '',
          t.vehicle_classification || 'company',
          t.driver_id || '',
          t.driver_name || t.driver_manual || '',
          t.driver_amount || 0,
          t.party_id || '',
          t.party_name || t.party_manual || '',
          t.from || '',
          t.to || '',
          t.freight || 0,
          t.trip_advance_amount || 0,
          JSON.stringify(t.expenses || []),
          t.trip_advice || '',
          t.notes || '',
          t.status || 'completed',
          t.invoice_status || 'pending',
          t.invoice_id || '',
          t.invoice_no || '',
          t.vendor_id || '',
          t.vendor_name || '',
          t.vendor_contact || '',
          t.vendor_cost || 0,
          t.vendor_advance || 0,
          t.vendor_deductions || 0,
        ]
      );
    });

    // 8. Insert Invoices
    (data.invoices || []).forEach((inv) => {
      db.run(
        `INSERT OR REPLACE INTO invoices (
          id, invoice_no, date, due_date, credit_days, party_id, party_name,
          party_gst, party_addr, party_mobile, trip_ids, trip_count,
          trips_data, subtotal, is_gst, tax_type, cgst, sgst, igst,
          total_amount, advance, balance_due, paid_amount, status,
          expense_lines, payments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inv.id,
          inv.invoice_no,
          inv.date,
          inv.due_date,
          inv.credit_days ?? 0,
          inv.party_id,
          inv.party_name,
          inv.party_gst || '',
          inv.party_addr || '',
          inv.party_mobile || '',
          JSON.stringify(inv.trip_ids || []),
          inv.trip_count || (inv.trip_ids || []).length,
          JSON.stringify(inv.trips_data || []),
          inv.subtotal || 0,
          inv.is_gst ? 1 : 0,
          inv.tax_type || 'none',
          inv.cgst || 0,
          inv.sgst || 0,
          inv.igst || 0,
          inv.total_amount || 0,
          inv.advance || 0,
          inv.balance_due || 0,
          inv.paid_amount || 0,
          inv.status || 'issued',
          JSON.stringify(inv.expense_lines || []),
          JSON.stringify(inv.payments || []),
        ]
      );
    });

    // 9. Driver Settlements
    (data.driver_settlements || []).forEach((ds) => {
      db.run(
        `INSERT OR REPLACE INTO driver_settlements (id, date, driver_id, driver_name, type, amount, description, source, trip_id, trip_no)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ds.id,
          ds.date,
          ds.driver_id,
          ds.driver_name || '',
          ds.type,
          ds.amount || 0,
          ds.description || '',
          ds.source || 'manual',
          ds.trip_id || '',
          ds.trip_no || '',
        ]
      );
    });

    // 10. Vendor Settlements
    (data.vendor_settlements || []).forEach((vs) => {
      db.run(
        `INSERT OR REPLACE INTO vendor_settlements (id, date, trip_id, trip_no, vehicle_number, vendor_id, vendor_name, vendor_cost, vendor_advance, deductions, balance_payable, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vs.id,
          vs.date,
          vs.trip_id,
          vs.trip_no || '',
          vs.vehicle_number || '',
          vs.vendor_id || '',
          vs.vendor_name || '',
          vs.vendor_cost || 0,
          vs.vendor_advance || 0,
          vs.deductions || 0,
          vs.balance_payable || 0,
          vs.status || 'pending',
        ]
      );
    });

    // 11. Expense Master
    (data.expense_master || []).forEach((em) => {
      db.run(
        `INSERT OR REPLACE INTO expense_master (id, name, defaultAmount, showOnInvoice, active)
         VALUES (?, ?, ?, ?, ?)`,
        [em.id, em.name, em.defaultAmount || 0, em.showOnInvoice ? 1 : 0, em.active ? 1 : 0]
      );
    });

    // Export database binary Uint8Array
    const binaryArray = db.export();
    db.close();

    const blob = new Blob([binaryArray.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.sqlite') || filename.endsWith('.db') ? filename : `${filename}.sqlite`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 500);

    return true;
  } catch (err) {
    console.error('Error exporting SQLite database:', err);
    throw err;
  }
}

/**
 * Imports and validates an uploaded SQLite database file (.sqlite / .db).
 * Returns extracted records ready for confirmation dialog before saving to state.
 */
export async function importDatabaseFromSQLite(
  fileBuffer: ArrayBuffer
): Promise<{ success: boolean; data?: FullERPDataset; summary?: Record<string, number>; error?: string }> {
  try {
    const SQL = await getSqlJs();
    const u8 = new Uint8Array(fileBuffer);
    const db: Database = new SQL.Database(u8);

    // Verify if it's a valid SQLite DB with tables
    const tableListResult = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    if (!tableListResult || tableListResult.length === 0) {
      db.close();
      return { success: false, error: 'Uploaded file is not a valid SQLite database or contains no tables.' };
    }

    const tableNames = new Set(tableListResult[0].values.map((v) => String(v[0])));

    // Helper to extract table rows as objects
    const readTable = (tableName: string): any[] => {
      if (!tableNames.has(tableName)) return [];
      const res = db.exec(`SELECT * FROM ${tableName}`);
      if (!res || res.length === 0) return [];
      const cols = res[0].columns;
      return res[0].values.map((row) => {
        const obj: any = {};
        cols.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    };

    // Extract records
    const rawProfile = readTable('company_profile');
    let companyProfile: any = null;
    if (rawProfile.length > 0) {
      const p = rawProfile[0];
      let lines = [];
      try {
        lines = JSON.parse(p.addr_lines || '[]');
      } catch {
        lines = [p.addr];
      }
      companyProfile = {
        name: p.name,
        addr: p.addr,
        addr_lines: lines,
        gst: p.gst,
        pan: p.pan,
        phone: p.phone,
        email: p.email,
        bank_name: p.bank_name,
        acc: p.acc,
        bank: p.bank,
        stamp_signature_image: p.stamp_signature_image,
      };
    }

    const vehicles = readTable('vehicles').map((v) => ({
      id: v.id,
      number: v.number,
      type: v.type,
      classification: v.classification,
      driver_amount: Number(v.driver_amount) || 0,
    }));

    const drivers = readTable('drivers').map((d) => ({
      id: d.id,
      name: d.name,
      mobile: d.mobile,
      license_no: d.license_no,
    }));

    const parties = readTable('parties').map((p) => ({
      id: p.id,
      name: p.name,
      gst: p.gst,
      addr: p.addr,
      credit_days: Number(p.credit_days) || 0,
      credit_limit: Number(p.credit_limit) || 0,
      mobile: p.mobile,
      email: p.email,
    }));

    const vendors = readTable('vendors').map((vn) => ({
      id: vn.id,
      name: vn.name,
      mobile: vn.mobile,
      pan: vn.pan,
      addr: vn.addr,
    }));

    const trips = readTable('trips').map((t) => {
      let expenses = [];
      try {
        expenses = JSON.parse(t.expenses || '[]');
      } catch {
        expenses = [];
      }
      return {
        id: t.id,
        trip_no: t.trip_no,
        date: t.date,
        vehicle_id: t.vehicle_id,
        vehicle_number: t.vehicle_number,
        vehicle_classification: t.vehicle_classification || 'company',
        driver_id: t.driver_id,
        driver_name: t.driver_name,
        driver_amount: Number(t.driver_amount) || 0,
        party_id: t.party_id,
        party_name: t.party_name,
        from: t.from_loc,
        to: t.to_loc,
        freight: Number(t.freight) || 0,
        trip_advance_amount: Number(t.trip_advance_amount) || 0,
        expenses,
        trip_advice: t.trip_advice,
        notes: t.notes,
        status: t.status || 'completed',
        invoice_status: t.invoice_status || 'pending',
        invoice_id: t.invoice_id || undefined,
        invoice_no: t.invoice_no || undefined,
        vendor_id: t.vendor_id || undefined,
        vendor_name: t.vendor_name || undefined,
        vendor_contact: t.vendor_contact || undefined,
        vendor_cost: t.vendor_cost !== undefined ? Number(t.vendor_cost) : undefined,
        vendor_advance: t.vendor_advance !== undefined ? Number(t.vendor_advance) : undefined,
        vendor_deductions: t.vendor_deductions !== undefined ? Number(t.vendor_deductions) : undefined,
      };
    });

    const invoices = readTable('invoices').map((inv) => {
      let trip_ids = [];
      let trips_data = [];
      let expense_lines = [];
      let payments = [];
      try {
        trip_ids = JSON.parse(inv.trip_ids || '[]');
      } catch {
        trip_ids = [];
      }
      try {
        trips_data = JSON.parse(inv.trips_data || '[]');
      } catch {
        trips_data = [];
      }
      try {
        expense_lines = JSON.parse(inv.expense_lines || '[]');
      } catch {
        expense_lines = [];
      }
      try {
        payments = JSON.parse(inv.payments || '[]');
      } catch {
        payments = [];
      }

      return {
        id: inv.id,
        invoice_no: inv.invoice_no,
        date: inv.date,
        due_date: inv.due_date,
        credit_days: Number(inv.credit_days) || 0,
        party_id: inv.party_id,
        party_name: inv.party_name,
        party_gst: inv.party_gst,
        party_addr: inv.party_addr,
        party_mobile: inv.party_mobile,
        trip_ids,
        trip_count: Number(inv.trip_count) || trip_ids.length,
        trips_data,
        subtotal: Number(inv.subtotal) || 0,
        is_gst: Boolean(inv.is_gst),
        tax_type: inv.tax_type,
        cgst: Number(inv.cgst) || 0,
        sgst: Number(inv.sgst) || 0,
        igst: Number(inv.igst) || 0,
        total_amount: Number(inv.total_amount) || 0,
        advance: Number(inv.advance) || 0,
        balance_due: Number(inv.balance_due) || 0,
        paid_amount: Number(inv.paid_amount) || 0,
        status: inv.status || 'issued',
        expense_lines,
        payments,
      };
    });

    const driver_settlements = readTable('driver_settlements').map((ds) => ({
      id: ds.id,
      date: ds.date,
      driver_id: ds.driver_id,
      driver_name: ds.driver_name,
      type: ds.type,
      amount: Number(ds.amount) || 0,
      description: ds.description,
      source: ds.source,
      trip_id: ds.trip_id,
      trip_no: ds.trip_no,
    }));

    const vendor_settlements = readTable('vendor_settlements').map((vs) => ({
      id: vs.id,
      date: vs.date,
      trip_id: vs.trip_id,
      trip_no: vs.trip_no,
      vehicle_number: vs.vehicle_number,
      vendor_id: vs.vendor_id,
      vendor_name: vs.vendor_name,
      vendor_cost: Number(vs.vendor_cost) || 0,
      vendor_advance: Number(vs.vendor_advance) || 0,
      deductions: Number(vs.deductions) || 0,
      balance_payable: Number(vs.balance_payable) || 0,
      status: vs.status || 'pending',
    }));

    const expense_master = readTable('expense_master').map((em) => ({
      id: em.id,
      name: em.name,
      defaultAmount: Number(em.defaultAmount) || 0,
      showOnInvoice: Boolean(em.showOnInvoice),
      active: Boolean(em.active),
    }));

    db.close();

    const summary = {
      trips: trips.length,
      invoices: invoices.length,
      vehicles: vehicles.length,
      drivers: drivers.length,
      parties: parties.length,
      vendors: vendors.length,
      driver_settlements: driver_settlements.length,
      vendor_settlements: vendor_settlements.length,
    };

    return {
      success: true,
      data: {
        company_profile: companyProfile,
        vehicles,
        drivers,
        parties,
        vendors,
        trips,
        invoices,
        driver_settlements,
        vendor_settlements,
        expense_master,
      },
      summary,
    };
  } catch (err: any) {
    console.error('importDatabaseFromSQLite error:', err);
    return {
      success: false,
      error: `SQLite Import Error: ${err?.message || 'Corrupted or unsupported SQLite database format.'}`,
    };
  }
}
