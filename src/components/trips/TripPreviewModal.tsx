import React from 'react';
import {
  X,
  Truck,
  MapPin,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Trip } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TripPreviewModalProps {
  trip: Trip | null;
  onClose: () => void;
  onOpenInvoice?: (invoiceNo: string) => void;
}

export const TripPreviewModal: React.FC<TripPreviewModalProps> = ({
  trip,
  onClose,
  onOpenInvoice,
}) => {
  if (!trip) return null;

  const totalExpenses = (trip.expenses || []).reduce((acc, e) => acc + e.amount, 0);
  const vendorCost = trip.vendor_cost || 0;
  const netProfit = trip.freight - totalExpenses - vendorCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">
                Trip Details &amp; Dispatch Summary
              </div>
              <div className="text-xl font-black font-mono tracking-tight">{trip.trip_no}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                trip.invoice_status === 'invoiced'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {trip.invoice_status === 'invoiced' ? 'INVOICED' : 'PENDING INVOICE'}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Route Strip */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Origin (POL)</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {trip.from}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 mx-2 shrink-0" />
            <div className="flex items-center gap-2 min-w-0 text-right">
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Destination (POD)</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {trip.to}
                </span>
              </div>
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Vehicle</span>
              <div className="mt-1 text-xs font-bold font-mono text-slate-900 dark:text-white">
                {trip.vehicle_number || trip.vehicle_manual}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold uppercase">
                {trip.vehicle_classification}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Driver</span>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                {trip.driver_name || trip.driver_manual}
              </div>
              <span className="text-[10px] text-slate-400">Allowance: ₹{trip.driver_amount}</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Customer</span>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                {trip.party_name || trip.party_manual}
              </div>
              <span className="text-[10px] text-slate-400">Party Account</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Trip Date</span>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                {trip.date}
              </div>
              <span className="text-[10px] text-slate-400">Dispatched</span>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                Customer Freight
              </span>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(trip.freight)}
              </div>
              <span className="text-[11px] text-slate-500">Agreed transportation charges</span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                Trip Advance Received
              </span>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(trip.trip_advance_amount)}
              </div>
              <span className="text-[11px] text-slate-500">Will deduct on final invoice</span>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                netProfit >= 0
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase ${
                  netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                Net Operating Margin
              </span>
              <div
                className={`mt-1 text-lg font-bold font-mono ${
                  netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                }`}
              >
                {formatCurrency(netProfit)}
              </div>
              <span className="text-[11px] text-slate-500">Freight − Expenses − Hire</span>
            </div>
          </div>

          {/* Outside Vendor Info if applicable */}
          {trip.vehicle_classification === 'outside' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Outside Vehicle / Vendor Agreement
                </span>
                <span className="rounded bg-indigo-200/60 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Vendor Hire
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-slate-500 text-[10px] block">Vendor Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {trip.vendor_name || 'Vendor'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Hire Cost</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(trip.vendor_cost || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Vendor Advance</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {formatCurrency(trip.vendor_advance || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Vendor Contact</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {trip.vendor_contact || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Expense Details */}
          <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Direct Trip Expenses
              </span>
              <span className="text-xs font-bold font-mono text-red-600">
                Total: {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="p-3">
              {trip.expenses && trip.expenses.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {trip.expenses.map((exp, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {exp.type}
                        </span>
                        {exp.note && (
                          <span className="text-[11px] text-slate-400 ml-2">({exp.note})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-red-600">
                        -{formatCurrency(exp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-center text-xs text-slate-400">No recorded expenses for this trip.</p>
              )}
            </div>
          </div>

          {/* Trip Advice & Notes */}
          {trip.trip_advice && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Trip Advice &amp; Instructions:
              </span>
              <p className="text-slate-600 dark:text-slate-400">{trip.trip_advice}</p>
            </div>
          )}

          {trip.invoice_no && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
              <div className="flex items-center gap-2 text-xs">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900 dark:text-blue-300 font-semibold">
                  Linked to Invoice: <strong className="font-mono">{trip.invoice_no}</strong>
                </span>
              </div>
              {onOpenInvoice && (
                <button
                  onClick={() => onOpenInvoice(trip.invoice_no!)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  View Invoice →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
