/**
 * Anori Transport ERP - Core Type Definitions
 */

export type VehicleClassification = 'company' | 'outside';
export type FuelType = 'DESIEL' | 'PETRO' | 'CNG';
export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'part_paid' | 'paid' | 'cancelled';
export type TaxType = 'cgst_sgst' | 'igst' | 'none';

export interface TripExpense {
  type: string;
  amount: number;
  note?: string;
}

export interface Trip {
  id: string;
  trip_no: string;
  date: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_manual?: string;
  vehicle_classification: VehicleClassification;
  driver_id: string;
  driver_name: string;
  driver_manual?: string;
  driver_amount: number; // Driver advance or trip allowance
  party_id: string;
  party_name: string;
  party_manual?: string;
  from: string;
  to: string;
  freight: number;
  trip_advance_amount: number; // Customer advance or trip advance
  expenses: TripExpense[];
  trip_advice?: string;
  notes?: string;
  status: 'completed' | 'in_progress' | 'cancelled';
  invoice_status: 'pending' | 'invoiced';
  invoice_id?: string;
  invoice_no?: string;

  // Outside Vehicle Vendor Fields
  vendor_id?: string;
  vendor_name?: string;
  vendor_manual?: string;
  vendor_contact?: string;
  vendor_cost?: number; // Hire charges payable to vendor
  vendor_advance?: number;
  vendor_deductions?: number;
}

export interface InvoiceExpenseLine {
  masterId?: string;
  name: string;
  amount: number;
  manual?: boolean;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  date: string;
  amount: number;
  mode: 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Other';
  reference?: string;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  date: string;
  due_date: string;
  credit_days: number;
  party_id: string;
  party_name: string;
  party_gst?: string;
  party_addr?: string;
  party_mobile?: string;
  trip_ids: string[];
  trip_count: number;
  trips_data: Trip[];
  subtotal: number;
  is_gst: boolean;
  tax_type: TaxType;
  cgst: number;
  sgst: number;
  igst: number;
  total_amount: number;
  advance: number; // Auto-imported from selected trips
  balance_due: number;
  paid_amount: number;
  status: InvoiceStatus;
  expense_lines: InvoiceExpenseLine[];
  payments: InvoicePayment[];
  cancelled_at?: string;
  cancel_reason?: string;
}

export interface Vehicle {
  id: string;
  number: string;
  type: FuelType | string;
  classification: 'COMPANY VEHICLE' | 'OUTSIDE ORGANIZATION VEHICLE';
  driver_amount: number;
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  license_no?: string;
}

export interface Party {
  id: string;
  name: string;
  gst?: string;
  addr?: string;
  credit_days: number; // Default 0 days
  credit_limit?: number;
  mobile?: string;
  email?: string;
}

export interface Vendor {
  id: string;
  name: string;
  mobile?: string;
  pan?: string;
  addr?: string;
}

export interface DriverSettlementEntry {
  id: string;
  date: string;
  driver_id: string;
  driver_name?: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  source?: 'trip' | 'manual';
  trip_id?: string;
  trip_no?: string;
}

export interface VendorSettlementEntry {
  id: string;
  date: string;
  trip_id: string;
  trip_no?: string;
  vehicle_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_cost: number;
  vendor_advance: number;
  deductions: number;
  balance_payable: number;
  status: 'pending' | 'paid';
}

export interface CompanyProfile {
  name: string;
  addr: string;
  addr_lines: string[];
  gst: string;
  pan: string;
  phone: string;
  email: string;
  bank_name: string;
  acc: string;
  bank: string; // IFSC Code
  stamp_signature_image?: string; // 1 combined image for Stamp & Signature
}

export interface ExpenseMasterItem {
  id: string;
  name: string;
  defaultAmount: number;
  showOnInvoice: boolean;
  active: boolean;
}

export type ActiveView = 
  | 'dashboard'
  | 'trips'
  | 'invoices'
  | 'documents'
  | 'settlements'
  | 'expenses'
  | 'reports'
  | 'masters'
  | 'settings';
