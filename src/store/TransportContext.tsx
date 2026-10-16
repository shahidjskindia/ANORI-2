import React, { createContext, useContext, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ActiveView,
  CompanyProfile,
  Driver,
  DriverSettlementEntry,
  ExpenseMasterItem,
  Invoice,
  InvoicePayment,
  InvoiceStatus,
  Party,
  Trip,
  Vehicle,
  Vendor,
  VendorSettlementEntry,
} from '../types';
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_DRIVERS,
  INITIAL_DRIVER_SETTLEMENTS,
  INITIAL_EXPENSE_MASTERS,
  INITIAL_INVOICES,
  INITIAL_PARTIES,
  INITIAL_TRIPS,
  INITIAL_VEHICLES,
  INITIAL_VENDORS,
  INITIAL_VENDOR_SETTLEMENTS,
} from './initialData';
import { calculateDueDate, generateTripNumber, generateUniqueId, getTodayDate } from '../utils/formatters';
import { exportDatabaseToSQLite, importDatabaseFromSQLite, FullERPDataset } from '../utils/sqliteDb';

interface TransportContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  adminCredentials: { username: string; password?: string; role: string };
  updateAdminCredentials: (username: string, pass: string) => { success: boolean; message: string };
  resetAdminCredentials: () => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => boolean;
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, driver: Partial<Driver>) => void;
  deleteDriver: (id: string) => boolean;
  parties: Party[];
  addParty: (party: Omit<Party, 'id'>) => void;
  updateParty: (id: string, party: Partial<Party>) => void;
  deleteParty: (id: string) => boolean;
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id' | 'trip_no' | 'invoice_status'>) => void;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  moveTripStatus: (id: string, newStatus: 'in_progress' | 'completed') => void;
  deleteTrip: (id: string) => boolean;
  duplicateTrip: (id: string) => void;
  invoices: Invoice[];
  createInvoice: (
    selectedTrips: Trip[],
    isGst: boolean,
    taxType: 'cgst_sgst' | 'igst' | 'none',
    expenseLines: { name: string; amount: number; manual?: boolean }[],
    creditDaysOverride?: number
  ) => Invoice | null;
  updateInvoiceCreditDays: (invoiceId: string, newCreditDays: number) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  recordInvoicePayment: (
    invoiceId: string,
    payment: Omit<InvoicePayment, 'id' | 'invoice_id' | 'created_at'>
  ) => void;
  cancelInvoice: (id: string, reason?: string) => void;
  deleteInvoice: (id: string) => void;
  driverSettlements: DriverSettlementEntry[];
  addDriverSettlement: (entry: Omit<DriverSettlementEntry, 'id'>) => void;
  deleteDriverSettlement: (id: string) => void;
  vendorSettlements: VendorSettlementEntry[];
  updateVendorSettlement: (id: string, update: Partial<VendorSettlementEntry>) => void;
  expenseMasters: ExpenseMasterItem[];
  addExpenseMaster: (name: string, defaultAmount: number, showOnInvoice: boolean) => void;
  toggleExpenseMaster: (id: string, showOnInvoice: boolean) => void;
  deleteExpenseMaster: (id: string) => void;

  // Data Portability & Storage Management
  exportToJSON: () => void;
  exportToExcel: () => void;
  exportToCSV: () => void;
  exportToSQLite: () => Promise<boolean>;
  importFromData: (importedData: any) => { success: boolean; message: string };
  importFromSQLiteFile: (fileBuffer: ArrayBuffer) => Promise<{ success: boolean; data?: FullERPDataset; summary?: Record<string, number>; message?: string; error?: string }>;
  applyImportedDataset: (dataset: FullERPDataset) => void;
  resetToDefaults: () => void;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'anori_';

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error loading key ${key} from storage:`, err);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

export const TransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminCreds, setAdminCreds] = useState<{ username: string; password: string }>(() => {
    return getStoredItem('admin_credentials', { username: 'admin', password: 'admin123' });
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const authLocal = localStorage.getItem('anori_auth');
      const authSession = sessionStorage.getItem('anori_auth');
      return !!(authLocal || authSession);
    } catch {
      return false;
    }
  });

  const login = (user: string, pass: string, rememberMe = true): boolean => {
    if (user === adminCreds.username && pass === adminCreds.password) {
      const sessionData = JSON.stringify({ user, time: Date.now() });
      if (rememberMe) {
        localStorage.setItem('anori_auth', sessionData);
      } else {
        sessionStorage.setItem('anori_auth', sessionData);
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('anori_auth');
      localStorage.removeItem('anori_auth');
    } catch (err) {
      console.error(err);
    }
    setIsAuthenticated(false);
  };

  const updateAdminCredentials = (newUsername: string, newPassword: string): { success: boolean; message: string } => {
    if (!newUsername.trim() || !newPassword.trim()) {
      return { success: false, message: 'Username and password cannot be empty.' };
    }
    if (newPassword.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }
    const updated = { username: newUsername.trim(), password: newPassword.trim() };
    setAdminCreds(updated);
    setStoredItem('admin_credentials', updated);
    return { success: true, message: 'Administrator credentials updated successfully!' };
  };

  const resetAdminCredentials = () => {
    const defaults = { username: 'admin', password: 'admin123' };
    setAdminCreds(defaults);
    setStoredItem('admin_credentials', defaults);
  };

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('anori_theme') as 'light' | 'dark') || 'light';
  });

  // Core Data Stores
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() =>
    getStoredItem('company_profile', INITIAL_COMPANY_PROFILE)
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    getStoredItem('vehicles', INITIAL_VEHICLES)
  );
  const [drivers, setDrivers] = useState<Driver[]>(() =>
    getStoredItem('drivers', INITIAL_DRIVERS)
  );
  const [parties, setParties] = useState<Party[]>(() =>
    getStoredItem('parties', INITIAL_PARTIES)
  );
  const [vendors, setVendors] = useState<Vendor[]>(() =>
    getStoredItem('vendors', INITIAL_VENDORS)
  );
  const [trips, setTrips] = useState<Trip[]>(() =>
    getStoredItem('trips', INITIAL_TRIPS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    getStoredItem('invoices', INITIAL_INVOICES)
  );
  const [driverSettlements, setDriverSettlements] = useState<DriverSettlementEntry[]>(() =>
    getStoredItem('driver_settlements', INITIAL_DRIVER_SETTLEMENTS)
  );
  const [vendorSettlements, setVendorSettlements] = useState<VendorSettlementEntry[]>(() =>
    getStoredItem('vendor_settlements', INITIAL_VENDOR_SETTLEMENTS)
  );
  const [expenseMasters, setExpenseMasters] = useState<ExpenseMasterItem[]>(() =>
    getStoredItem('expense_master', INITIAL_EXPENSE_MASTERS)
  );

  // Sync to localStorage
  useEffect(() => { setStoredItem('company_profile', companyProfile); }, [companyProfile]);
  useEffect(() => { setStoredItem('vehicles', vehicles); }, [vehicles]);
  useEffect(() => { setStoredItem('drivers', drivers); }, [drivers]);
  useEffect(() => { setStoredItem('parties', parties); }, [parties]);
  useEffect(() => { setStoredItem('vendors', vendors); }, [vendors]);
  useEffect(() => { setStoredItem('trips', trips); }, [trips]);
  useEffect(() => { setStoredItem('invoices', invoices); }, [invoices]);
  useEffect(() => { setStoredItem('driver_settlements', driverSettlements); }, [driverSettlements]);
  useEffect(() => { setStoredItem('vendor_settlements', vendorSettlements); }, [vendorSettlements]);
  useEffect(() => { setStoredItem('expense_master', expenseMasters); }, [expenseMasters]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('anori_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateCompanyProfile = (updated: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => ({ ...prev, ...updated }));
  };

  // Vehicles
  const addVehicle = (veh: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = { ...veh, id: generateUniqueId() };
    setVehicles((prev) => [...prev, newVeh]);
  };

  const updateVehicle = (id: string, updated: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
  };

  const deleteVehicle = (id: string): boolean => {
    const isUsedInTrips = trips.some((t) => t.vehicle_id === id);
    if (isUsedInTrips) return false;
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    return true;
  };

  // Drivers
  const addDriver = (drv: Omit<Driver, 'id'>) => {
    const newDrv: Driver = { ...drv, id: generateUniqueId() };
    setDrivers((prev) => [...prev, newDrv]);
  };

  const updateDriver = (id: string, updated: Partial<Driver>) => {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  };

  const deleteDriver = (id: string): boolean => {
    const isUsedInTrips = trips.some((t) => t.driver_id === id);
    if (isUsedInTrips) return false;
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    return true;
  };

  // Parties
  const addParty = (pty: Omit<Party, 'id'>) => {
    const newPty: Party = { ...pty, id: generateUniqueId(), credit_days: pty.credit_days ?? 0 };
    setParties((prev) => [...prev, newPty]);
  };

  const updateParty = (id: string, updated: Partial<Party>) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deleteParty = (id: string): boolean => {
    const isUsedInTrips = trips.some((t) => t.party_id === id);
    if (isUsedInTrips) return false;
    setParties((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  // Vendors
  const addVendor = (ven: Omit<Vendor, 'id'>) => {
    const newVen: Vendor = { ...ven, id: generateUniqueId() };
    setVendors((prev) => [...prev, newVen]);
  };

  const updateVendor = (id: string, updated: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
  };

  // Driver Settlement Sync
  const syncDriverSettlement = (trip: Trip) => {
    if (!trip.driver_id) return;
    setDriverSettlements((prev) => {
      const filtered = prev.filter((s) => s.trip_id !== trip.id);
      if (trip.driver_amount > 0) {
        const entry: DriverSettlementEntry = {
          id: generateUniqueId(),
          date: trip.date,
          driver_id: trip.driver_id,
          driver_name: trip.driver_name,
          type: 'debit',
          amount: trip.driver_amount,
          description: `Trip ${trip.trip_no} - Driver Allowance`,
          source: 'trip',
          trip_id: trip.id,
          trip_no: trip.trip_no,
        };
        return [...filtered, entry];
      }
      return filtered;
    });
  };

  // Vendor Settlement Sync
  const syncVendorSettlement = (trip: Trip) => {
    setVendorSettlements((prev) => {
      const filtered = prev.filter((vs) => vs.trip_id !== trip.id);
      if (trip.vehicle_classification === 'outside' && (trip.vendor_cost || 0) > 0) {
        const cost = trip.vendor_cost || 0;
        const advance = trip.vendor_advance || 0;
        const deductions = trip.vendor_deductions || 0;
        const balance = Math.max(0, cost - advance - deductions);
        const newEntry: VendorSettlementEntry = {
          id: generateUniqueId(),
          date: trip.date,
          trip_id: trip.id,
          trip_no: trip.trip_no,
          vehicle_number: trip.vehicle_number || trip.vehicle_manual || '',
          vendor_id: trip.vendor_id || '',
          vendor_name: trip.vendor_name || 'Outside Vendor',
          vendor_cost: cost,
          vendor_advance: advance,
          deductions: deductions,
          balance_payable: balance,
          status: balance === 0 ? 'paid' : 'pending',
        };
        return [...filtered, newEntry];
      }
      return filtered;
    });
  };

  // Trips CRUD
  const addTrip = (tripData: Omit<Trip, 'id' | 'trip_no' | 'invoice_status'>) => {
    const trip_no = generateTripNumber(tripData.date, trips);
    const newTrip: Trip = {
      ...tripData,
      id: generateUniqueId(),
      trip_no,
      invoice_status: 'pending',
    };
    setTrips((prev) => [newTrip, ...prev]);
    syncDriverSettlement(newTrip);
    syncVendorSettlement(newTrip);
  };

  const updateTrip = (id: string, updated: Partial<Trip>) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const merged = { ...t, ...updated };
          syncDriverSettlement(merged);
          syncVendorSettlement(merged);
          return merged;
        }
        return t;
      })
    );
  };

  const moveTripStatus = (id: string, newStatus: 'in_progress' | 'completed') => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const deleteTrip = (id: string): boolean => {
    const target = trips.find((t) => t.id === id);
    if (!target) return false;
    const linkedInvoice = invoices.find(
      (inv) => inv.trip_ids.includes(id) && inv.status !== 'cancelled'
    );
    if (linkedInvoice) {
      return false;
    }
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setDriverSettlements((prev) => prev.filter((s) => s.trip_id !== id));
    setVendorSettlements((prev) => prev.filter((vs) => vs.trip_id !== id));
    return true;
  };

  const duplicateTrip = (id: string) => {
    const source = trips.find((t) => t.id === id);
    if (!source) return;
    const today = getTodayDate();
    const trip_no = generateTripNumber(today, trips);
    const duplicated: Trip = {
      ...source,
      id: generateUniqueId(),
      trip_no,
      date: today,
      invoice_status: 'pending',
      invoice_id: undefined,
      invoice_no: undefined,
    };
    setTrips((prev) => [duplicated, ...prev]);
    syncDriverSettlement(duplicated);
    syncVendorSettlement(duplicated);
  };

  // Invoice Management with Credit Days Support (AMENDMENT #3)
  const createInvoice = (
    selectedTrips: Trip[],
    isGst: boolean,
    taxType: 'cgst_sgst' | 'igst' | 'none',
    expenseLines: { name: string; amount: number; manual?: boolean }[],
    creditDaysOverride?: number
  ): Invoice | null => {
    if (!selectedTrips.length) return null;
    const partyId = selectedTrips[0].party_id;
    const party = parties.find((p) => p.id === partyId);

    const tripFreightSubtotal = selectedTrips.reduce((acc, t) => acc + (t.freight || 0), 0);
    const expensesSubtotal = expenseLines.reduce((acc, e) => acc + (e.amount || 0), 0);
    const subtotal = tripFreightSubtotal + expensesSubtotal;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    if (isGst) {
      if (taxType === 'cgst_sgst') {
        cgst = Math.round(subtotal * 0.09 * 100) / 100;
        sgst = Math.round(subtotal * 0.09 * 100) / 100;
      } else if (taxType === 'igst') {
        igst = Math.round(subtotal * 0.18 * 100) / 100;
      }
    }

    const total_amount = Math.round((subtotal + cgst + sgst + igst) * 100) / 100;
    const advance = selectedTrips.reduce((acc, t) => acc + (t.trip_advance_amount || 0), 0);
    const balance_due = Math.max(0, Math.round((total_amount - advance) * 100) / 100);
    const invoiceDate = getTodayDate();

    // AMENDMENT #3: Credit period and due date calculation
    const creditDays = typeof creditDaysOverride === 'number' ? Math.max(0, creditDaysOverride) : (party?.credit_days ?? 0);
    const due_date = calculateDueDate(invoiceDate, creditDays);

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoice_no = `INV-${yy}${mm}${dd}-${randomSuffix}`;

    const newInvoice: Invoice = {
      id: generateUniqueId(),
      invoice_no,
      date: invoiceDate,
      due_date,
      credit_days: creditDays,
      party_id: party?.id || partyId,
      party_name: party?.name || selectedTrips[0].party_name,
      party_gst: party?.gst,
      party_addr: party?.addr,
      party_mobile: party?.mobile,
      trip_ids: selectedTrips.map((t) => t.id),
      trip_count: selectedTrips.length,
      trips_data: selectedTrips,
      subtotal,
      is_gst: isGst,
      tax_type: isGst ? taxType : 'none',
      cgst,
      sgst,
      igst,
      total_amount,
      advance,
      balance_due,
      paid_amount: advance,
      status: balance_due === 0 ? 'paid' : 'issued',
      expense_lines: expenseLines,
      payments: [],
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Mark trips as invoiced
    setTrips((prev) =>
      prev.map((t) => {
        if (newInvoice.trip_ids.includes(t.id)) {
          return {
            ...t,
            invoice_status: 'invoiced',
            invoice_id: newInvoice.id,
            invoice_no: newInvoice.invoice_no,
          };
        }
        return t;
      })
    );

    return newInvoice;
  };

  // AMENDMENT #3: Update credit days for an existing invoice
  const updateInvoiceCreditDays = (invoiceId: string, newCreditDays: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const days = Math.max(0, newCreditDays);
          const newDueDate = calculateDueDate(inv.date, days);
          return {
            ...inv,
            credit_days: days,
            due_date: newDueDate,
          };
        }
        return inv;
      })
    );
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
    );
  };

  const recordInvoicePayment = (
    invoiceId: string,
    paymentData: Omit<InvoicePayment, 'id' | 'invoice_id' | 'created_at'>
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPayment: InvoicePayment = {
            ...paymentData,
            id: generateUniqueId(),
            invoice_id: invoiceId,
            created_at: new Date().toISOString(),
          };
          const updatedPayments = [...inv.payments, newPayment];
          const totalPaid = inv.advance + updatedPayments.reduce((s, p) => s + p.amount, 0);
          const balance = Math.max(0, Math.round((inv.total_amount - totalPaid) * 100) / 100);
          const status: InvoiceStatus = balance === 0 ? 'paid' : 'part_paid';
          return {
            ...inv,
            payments: updatedPayments,
            paid_amount: totalPaid,
            balance_due: balance,
            status,
          };
        }
        return inv;
      })
    );
  };

  const cancelInvoice = (id: string, reason = 'Cancelled by administrator') => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          return {
            ...inv,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_reason: reason,
          };
        }
        return inv;
      })
    );

    const targetInv = invoices.find((inv) => inv.id === id);
    if (targetInv) {
      setTrips((prev) =>
        prev.map((t) => {
          if (targetInv.trip_ids.includes(t.id)) {
            return {
              ...t,
              invoice_status: 'pending',
              invoice_id: undefined,
              invoice_no: undefined,
            };
          }
          return t;
        })
      );
    }
  };

  const deleteInvoice = (id: string) => {
    const target = invoices.find((i) => i.id === id);
    if (!target) return;
    if (target.status !== 'draft' && target.status !== 'cancelled') {
      cancelInvoice(id);
      return;
    }
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  // Driver Settlement Entries
  const addDriverSettlement = (entry: Omit<DriverSettlementEntry, 'id'>) => {
    const newEntry: DriverSettlementEntry = {
      ...entry,
      id: generateUniqueId(),
    };
    setDriverSettlements((prev) => [newEntry, ...prev]);
  };

  const deleteDriverSettlement = (id: string) => {
    setDriverSettlements((prev) => prev.filter((ds) => ds.id !== id));
  };

  // Vendor Settlement Entries
  const updateVendorSettlement = (id: string, update: Partial<VendorSettlementEntry>) => {
    setVendorSettlements((prev) =>
      prev.map((vs) => {
        if (vs.id === id) {
          const merged = { ...vs, ...update };
          const balance = Math.max(0, merged.vendor_cost - merged.vendor_advance - merged.deductions);
          return {
            ...merged,
            balance_payable: balance,
            status: balance === 0 ? 'paid' : merged.status,
          };
        }
        return vs;
      })
    );
  };

  // Expense Categories Master
  const addExpenseMaster = (name: string, defaultAmount: number, showOnInvoice: boolean) => {
    const item: ExpenseMasterItem = {
      id: `EXP-${Date.now()}`,
      name,
      defaultAmount,
      showOnInvoice,
      active: true,
    };
    setExpenseMasters((prev) => [...prev, item]);
  };

  const toggleExpenseMaster = (id: string, showOnInvoice: boolean) => {
    setExpenseMasters((prev) =>
      prev.map((e) => (e.id === id ? { ...e, showOnInvoice } : e))
    );
  };

  const deleteExpenseMaster = (id: string) => {
    setExpenseMasters((prev) => prev.filter((e) => e.id !== id));
  };

  // Current Full Dataset Getter
  const getCurrentDataset = (): FullERPDataset => ({
    company_profile: companyProfile,
    vehicles,
    drivers,
    parties,
    vendors,
    trips,
    invoices,
    driver_settlements: driverSettlements,
    vendor_settlements: vendorSettlements,
    expense_master: expenseMasters,
  });

  // Export to JSON
  const exportToJSON = () => {
    const data = {
      version: '3.1.0',
      exported_at: new Date().toISOString(),
      ...getCurrentDataset(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `anori_transport_backup_${getTodayDate()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const tripsSheet = trips.map((t, idx) => ({
      'Sr No': idx + 1,
      'Trip No': t.trip_no,
      Date: t.date,
      Vehicle: t.vehicle_number || t.vehicle_manual || '',
      Classification: t.vehicle_classification.toUpperCase(),
      Driver: t.driver_name || t.driver_manual || '',
      Party: t.party_name || t.party_manual || '',
      Route: `${t.from} -> ${t.to}`,
      Freight: t.freight,
      'Trip Advance': t.trip_advance_amount,
      'Driver Amount': t.driver_amount,
      'Total Expenses': (t.expenses || []).reduce((acc, e) => acc + e.amount, 0),
      'Vendor Cost': t.vendor_cost || 0,
      'Trip Status': t.status.toUpperCase(),
      'Invoice Status': t.invoice_status.toUpperCase(),
      'Invoice No': t.invoice_no || '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tripsSheet), 'Trips');

    const invoicesSheet = invoices.map((inv) => ({
      'Invoice No': inv.invoice_no,
      Date: inv.date,
      'Due Date': inv.due_date,
      'Credit Days': inv.credit_days,
      Customer: inv.party_name,
      'Trip Count': inv.trip_count,
      Subtotal: inv.subtotal,
      CGST: inv.cgst,
      SGST: inv.sgst,
      IGST: inv.igst,
      Total: inv.total_amount,
      Advance: inv.advance,
      'Balance Due': inv.balance_due,
      Status: inv.status.toUpperCase(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoicesSheet), 'Invoices');

    const driverSheet = driverSettlements.map((ds) => ({
      Date: ds.date,
      Driver: ds.driver_name,
      Type: ds.type.toUpperCase(),
      Amount: ds.amount,
      Description: ds.description,
      'Trip No': ds.trip_no || '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(driverSheet), 'Driver Settlements');

    const vendorSheet = vendorSettlements.map((vs) => ({
      Date: vs.date,
      'Trip No': vs.trip_no,
      Vehicle: vs.vehicle_number,
      Vendor: vs.vendor_name,
      'Vendor Cost': vs.vendor_cost,
      Advance: vs.vendor_advance,
      Deductions: vs.deductions,
      'Balance Payable': vs.balance_payable,
      Status: vs.status.toUpperCase(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorSheet), 'Vendor Settlements');

    XLSX.writeFile(wb, `anori_transport_report_${getTodayDate()}.xlsx`);
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent =
      'Date,Trip No,Vehicle,Classification,Driver,Party,Route,Freight,Advance,Driver Amount,Status\n' +
      trips
        .map(
          (t) =>
            `"${t.date}","${t.trip_no}","${t.vehicle_number || t.vehicle_manual || ''}","${t.vehicle_classification}","${t.driver_name || t.driver_manual || ''}","${t.party_name || t.party_manual || ''}","${t.from} -> ${t.to}",${t.freight},${t.trip_advance_amount},${t.driver_amount},"${t.invoice_status}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `anori_trips_${getTodayDate()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // AMENDMENT #5: SQLite Database Export
  const exportToSQLite = async (): Promise<boolean> => {
    const filename = `anori_transport_database_${getTodayDate()}.sqlite`;
    return exportDatabaseToSQLite(getCurrentDataset(), filename);
  };

  // Apply complete dataset to state safely
  const applyImportedDataset = (dataset: FullERPDataset) => {
    if (dataset.company_profile) setCompanyProfile(dataset.company_profile);
    if (Array.isArray(dataset.vehicles)) setVehicles(dataset.vehicles);
    if (Array.isArray(dataset.drivers)) setDrivers(dataset.drivers);
    if (Array.isArray(dataset.parties)) setParties(dataset.parties);
    if (Array.isArray(dataset.vendors)) setVendors(dataset.vendors);
    if (Array.isArray(dataset.trips)) setTrips(dataset.trips);
    if (Array.isArray(dataset.invoices)) setInvoices(dataset.invoices);
    if (Array.isArray(dataset.driver_settlements)) setDriverSettlements(dataset.driver_settlements);
    if (Array.isArray(dataset.vendor_settlements)) setVendorSettlements(dataset.vendor_settlements);
    if (Array.isArray(dataset.expense_master)) setExpenseMasters(dataset.expense_master);
  };

  // Import JSON helper
  const importFromData = (data: any): { success: boolean; message: string } => {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid file format: JSON root object expected.' };
      }
      const tables = data.tables || data;
      applyImportedDataset(tables);
      return { success: true, message: 'Data imported and reconciled successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Import failed.' };
    }
  };

  // AMENDMENT #5: SQLite Database Import
  const importFromSQLiteFile = async (fileBuffer: ArrayBuffer) => {
    const result = await importDatabaseFromSQLite(fileBuffer);
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to read SQLite database.' };
    }
    return {
      success: true,
      data: result.data,
      summary: result.summary,
      message: 'SQLite database validated successfully.',
    };
  };

  const resetToDefaults = () => {
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    setVehicles(INITIAL_VEHICLES);
    setDrivers(INITIAL_DRIVERS);
    setParties(INITIAL_PARTIES);
    setVendors(INITIAL_VENDORS);
    setTrips(INITIAL_TRIPS);
    setInvoices(INITIAL_INVOICES);
    setDriverSettlements(INITIAL_DRIVER_SETTLEMENTS);
    setVendorSettlements(INITIAL_VENDOR_SETTLEMENTS);
    setExpenseMasters(INITIAL_EXPENSE_MASTERS);
  };

  return (
    <TransportContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        adminCredentials: { username: adminCreds.username, password: adminCreds.password, role: 'Administrator' },
        updateAdminCredentials,
        resetAdminCredentials,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        theme,
        toggleTheme,
        companyProfile,
        updateCompanyProfile,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        drivers,
        addDriver,
        updateDriver,
        deleteDriver,
        parties,
        addParty,
        updateParty,
        deleteParty,
        vendors,
        addVendor,
        updateVendor,
        trips,
        addTrip,
        updateTrip,
        moveTripStatus,
        deleteTrip,
        duplicateTrip,
        invoices,
        createInvoice,
        updateInvoiceCreditDays,
        updateInvoiceStatus,
        recordInvoicePayment,
        cancelInvoice,
        deleteInvoice,
        driverSettlements,
        addDriverSettlement,
        deleteDriverSettlement,
        vendorSettlements,
        updateVendorSettlement,
        expenseMasters,
        addExpenseMaster,
        toggleExpenseMaster,
        deleteExpenseMaster,
        exportToJSON,
        exportToExcel,
        exportToCSV,
        exportToSQLite,
        importFromData,
        importFromSQLiteFile,
        applyImportedDataset,
        resetToDefaults,
      }}
    >
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};
