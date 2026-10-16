import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Truck,
  Plus,
  Trash2,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency, getTodayDate } from '../../utils/formatters';
import { DriverSettlementEntry, VendorSettlementEntry } from '../../types';

export const SettlementView: React.FC = () => {
  const {
    driverSettlements,
    addDriverSettlement,
    deleteDriverSettlement,
    vendorSettlements,
    updateVendorSettlement,
    drivers,
    vendors,
  } = useTransport();

  const [activeTab, setActiveTab] = useState<'driver' | 'vendor'>('driver');

  // Driver filters
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [driverSearch, setDriverSearch] = useState<string>('');

  // Vendor filters
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [vendorSearch, setVendorSearch] = useState<string>('');

  // Modal States
  const [isAddDriverEntryOpen, setIsAddDriverEntryOpen] = useState(false);
  const [editingVendorEntry, setEditingVendorEntry] = useState<VendorSettlementEntry | null>(null);

  // New Driver Entry Form State
  const [newDriverId, setNewDriverId] = useState('');
  const [newDate, setNewDate] = useState(getTodayDate());
  const [newType, setNewType] = useState<'debit' | 'credit'>('debit');
  const [newAmount, setNewAmount] = useState<number | ''>('');
  const [newDesc, setNewDesc] = useState('');

  // Filtered Driver Settlements
  const filteredDriverSettlements = useMemo(() => {
    return driverSettlements.filter((ds) => {
      const matchDriver = selectedDriverId === 'all' || ds.driver_id === selectedDriverId;
      const matchSearch =
        !driverSearch ||
        (ds.driver_name && ds.driver_name.toLowerCase().includes(driverSearch.toLowerCase())) ||
        ds.description.toLowerCase().includes(driverSearch.toLowerCase()) ||
        (ds.trip_no && ds.trip_no.toLowerCase().includes(driverSearch.toLowerCase()));
      return matchDriver && matchSearch;
    });
  }, [driverSettlements, selectedDriverId, driverSearch]);

  const driverGivenTotal = useMemo(
    () =>
      filteredDriverSettlements
        .filter((ds) => ds.type === 'debit')
        .reduce((sum, ds) => sum + ds.amount, 0),
    [filteredDriverSettlements]
  );
  const driverPaidTotal = useMemo(
    () =>
      filteredDriverSettlements
        .filter((ds) => ds.type === 'credit')
        .reduce((sum, ds) => sum + ds.amount, 0),
    [filteredDriverSettlements]
  );
  const driverBalance = Math.max(0, driverGivenTotal - driverPaidTotal);

  // Filtered Vendor Settlements
  const filteredVendorSettlements = useMemo(() => {
    return vendorSettlements.filter((vs) => {
      const matchVendor = selectedVendorId === 'all' || vs.vendor_id === selectedVendorId;
      const matchSearch =
        !vendorSearch ||
        vs.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        vs.vehicle_number.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        vs.trip_no?.toLowerCase().includes(vendorSearch.toLowerCase());
      return matchVendor && matchSearch;
    });
  }, [vendorSettlements, selectedVendorId, vendorSearch]);

  const vendorTotalCost = useMemo(
    () => filteredVendorSettlements.reduce((sum, vs) => sum + vs.vendor_cost, 0),
    [filteredVendorSettlements]
  );
  const vendorTotalAdvance = useMemo(
    () => filteredVendorSettlements.reduce((sum, vs) => sum + vs.vendor_advance, 0),
    [filteredVendorSettlements]
  );
  const vendorTotalBalance = useMemo(
    () => filteredVendorSettlements.reduce((sum, vs) => sum + vs.balance_payable, 0),
    [filteredVendorSettlements]
  );

  const handleSaveDriverEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverId || !newAmount || Number(newAmount) <= 0) return;
    const matched = drivers.find((d) => d.id === newDriverId);
    addDriverSettlement({
      date: newDate,
      driver_id: newDriverId,
      driver_name: matched?.name || 'Driver',
      type: newType,
      amount: Number(newAmount),
      description: newDesc.trim() || (newType === 'debit' ? 'Cash Advance' : 'Salary Payout'),
      source: 'manual',
    });
    setIsAddDriverEntryOpen(false);
    setNewAmount('');
    setNewDesc('');
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Driver &amp; Vendor Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Segregated accounting for company drivers (allowances/wages) and outside truck vendors (hire costs)
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'driver'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Driver Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vendor'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Outside Vendor Settlement</span>
          </button>
        </div>
      </div>

      {activeTab === 'driver' ? (
        /* DRIVER LEDGER TAB */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Advances &amp; Allowances Given
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(driverGivenTotal)}
              </div>
              <span className="text-[11px] text-slate-500">Trip driver amounts + cash advances</span>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Settled / Paid
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(driverPaidTotal)}
              </div>
              <span className="text-[11px] text-slate-500">Wages and voucher disbursements</span>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Net Driver Balance Due
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                {formatCurrency(driverBalance)}
              </div>
              <span className="text-[11px] text-slate-500">Pending driver wage clearance</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Driver:</span>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="all">All Drivers</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    placeholder="Search by description, trip #..."
                    className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddDriverEntryOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Driver Entry</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Driver Name</th>
                    <th className="py-2.5 px-3">Trip Reference</th>
                    <th className="py-2.5 px-3">Entry Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDriverSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        No settlement ledger entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredDriverSettlements.map((ds) => (
                      <tr key={ds.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {ds.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {ds.driver_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-blue-600">
                          {ds.trip_no || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              ds.type === 'debit'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {ds.type === 'debit' ? (
                              <ArrowDownRight className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {ds.type === 'debit' ? 'Given / Advance' : 'Settled / Paid'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[220px] truncate">
                          {ds.description}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            ds.type === 'debit' ? 'text-amber-700' : 'text-emerald-600'
                          }`}
                        >
                          {ds.type === 'debit' ? '-' : '+'}
                          {formatCurrency(ds.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {ds.source === 'manual' ? (
                            <button
                              onClick={() => deleteDriverSettlement(ds.id)}
                              className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Trip Sync</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VENDOR SETTLEMENT TAB */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Total Vehicle Hire Cost
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(vendorTotalCost)}
              </div>
              <span className="text-[11px] text-slate-500">Payable to outside truck owners</span>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Vendor Advances Paid
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(vendorTotalAdvance)}
              </div>
              <span className="text-[11px] text-slate-500">Disbursed diesel/hire advances</span>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Net Balance Payable
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                {formatCurrency(vendorTotalBalance)}
              </div>
              <span className="text-[11px] text-slate-500">Outstanding vendor liabilities</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Vendor:</span>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="all">All Vendors</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Search by vendor, vehicle, trip #..."
                    className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {filteredVendorSettlements.length} vendor trips
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Trip #</th>
                    <th className="py-2.5 px-3">Outside Vehicle</th>
                    <th className="py-2.5 px-3">Owner / Vendor</th>
                    <th className="py-2.5 px-3 text-right">Hire Cost (₹)</th>
                    <th className="py-2.5 px-3 text-right">Advance Paid (₹)</th>
                    <th className="py-2.5 px-3 text-right">Deductions (₹)</th>
                    <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredVendorSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                        No outside hired vehicle records yet. When an Outside Vehicle trip is dispatched, it automatically appears here.
                      </td>
                    </tr>
                  ) : (
                    filteredVendorSettlements.map((vs) => (
                      <tr key={vs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {vs.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                          {vs.trip_no || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                          {vs.vehicle_number}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-indigo-900 dark:text-indigo-300">
                          {vs.vendor_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(vs.vendor_cost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                          {formatCurrency(vs.vendor_advance)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-600">
                          {formatCurrency(vs.deductions)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 dark:text-amber-400">
                          {formatCurrency(vs.balance_payable)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              vs.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {vs.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setEditingVendorEntry(vs)}
                            className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Settlement
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Settlement Entry Modal */}
      {isAddDriverEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Driver Ledger Voucher
              </h2>
              <button
                onClick={() => setIsAddDriverEntryOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDriverEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Driver *
                </label>
                <select
                  required
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Select Fleet Driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entry Type *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="debit">Debit / Advance Given</option>
                    <option value="credit">Credit / Wage Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Remarks
                </label>
                <input
                  placeholder="e.g. Monthly wage settlement voucher"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDriverEntryOpen(false)}
                  className="rounded-lg border px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Settlement Modal */}
      {editingVendorEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Outside Truck Settlement
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {editingVendorEntry.trip_no} — {editingVendorEntry.vehicle_number}
                </p>
              </div>
              <button
                onClick={() => setEditingVendorEntry(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor:</span>
                  <strong className="text-indigo-900">{editingVendorEntry.vendor_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreed Hire Cost:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(editingVendorEntry.vendor_cost)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVendorEntry.vendor_advance}
                    onChange={(e) =>
                      setEditingVendorEntry({
                        ...editingVendorEntry,
                        vendor_advance: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVendorEntry.deductions}
                    onChange={(e) =>
                      setEditingVendorEntry({
                        ...editingVendorEntry,
                        deductions: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Status
                </label>
                <select
                  value={editingVendorEntry.status}
                  onChange={(e) =>
                    setEditingVendorEntry({
                      ...editingVendorEntry,
                      status: e.target.value as 'pending' | 'paid',
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="pending">Pending Settlement</option>
                  <option value="paid">Fully Settled / Paid</option>
                </select>
              </div>

              <div className="rounded-lg bg-slate-100 p-3 text-xs flex justify-between font-bold dark:bg-slate-800">
                <span>Calculated Balance Payable:</span>
                <span className="font-mono text-amber-700 dark:text-amber-400">
                  {formatCurrency(
                    Math.max(
                      0,
                      editingVendorEntry.vendor_cost -
                        editingVendorEntry.vendor_advance -
                        editingVendorEntry.deductions
                    )
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingVendorEntry(null)}
                  className="rounded-lg border px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateVendorSettlement(editingVendorEntry.id, editingVendorEntry);
                    setEditingVendorEntry(null);
                  }}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
                >
                  Save Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
