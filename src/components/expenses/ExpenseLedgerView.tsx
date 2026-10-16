import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Download,
  Printer,
  Search,
  RotateCcw,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency, getTodayDate } from '../../utils/formatters';
import * as XLSX from 'xlsx';

export const ExpenseLedgerView: React.FC = () => {
  const { trips, vehicles, drivers, expenseMasters } = useTransport();

  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayDate());
  const [searchQuery, setSearchQuery] = useState('');

  const allExpenseRows = useMemo(() => {
    const rows: Array<{
      id: string;
      date: string;
      tripId: string;
      tripNo: string;
      vehicleNumber: string;
      driverName: string;
      type: string;
      amount: number;
      note?: string;
    }> = [];

    trips.forEach((t) => {
      (t.expenses || []).forEach((e, idx) => {
        if (!e.type || Number(e.amount) <= 0) return;
        rows.push({
          id: `${t.id}-exp-${idx}`,
          date: t.date,
          tripId: t.id,
          tripNo: t.trip_no,
          vehicleNumber: t.vehicle_number || t.vehicle_manual || '-',
          driverName: t.driver_name || t.driver_manual || '-',
          type: e.type,
          amount: e.amount,
          note: e.note,
        });
      });
    });
    return rows;
  }, [trips]);

  const filteredRows = useMemo(() => {
    return allExpenseRows.filter((r) => {
      if (selectedVehicle !== 'all' && r.vehicleNumber !== selectedVehicle) return false;
      if (selectedDriver !== 'all' && r.driverName !== selectedDriver) return false;
      if (selectedType !== 'all' && r.type.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${r.tripNo} ${r.vehicleNumber} ${r.driverName} ${r.type} ${r.note || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [allExpenseRows, selectedVehicle, selectedDriver, selectedType, fromDate, toDate, searchQuery]);

  const totalExpenseAmount = useMemo(
    () => filteredRows.reduce((acc, r) => acc + r.amount, 0),
    [filteredRows]
  );
  const distinctTripsCount = useMemo(
    () => new Set(filteredRows.map((r) => r.tripId)).size,
    [filteredRows]
  );

  const handleExportExcel = () => {
    const data = filteredRows.map((r, i) => ({
      'Sr No': i + 1,
      Date: r.date,
      'Trip No': r.tripNo,
      'Vehicle No': r.vehicleNumber,
      'Driver Name': r.driverName,
      'Expense Type': r.type,
      'Amount (INR)': r.amount,
      Remarks: r.note || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Operating Expenses');
    XLSX.writeFile(wb, `anori_operating_expenses_${getTodayDate()}.xlsx`);
  };

  const handleClearFilters = () => {
    setSelectedVehicle('all');
    setSelectedDriver('all');
    setSelectedType('all');
    setFromDate('');
    setToDate(getTodayDate());
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Trip Operating Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Consolidated operational costs (Diesel, Toll, Repairs, Loading) strictly isolated from driver salary advances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Total Operational Expenditure
          </span>
          <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalExpenseAmount)}
          </div>
          <span className="text-[11px] text-slate-500">Direct road expenses filtered</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Recorded Expense Items
          </span>
          <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
            {filteredRows.length}
          </div>
          <span className="text-[11px] text-slate-500">Voucher line entries</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Trips with Expenses
          </span>
          <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
            {distinctTripsCount}
          </div>
          <span className="text-[11px] text-slate-500">Out of {trips.length} total logged trips</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Vehicle
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.number}>
                    {v.number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Driver
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Drivers</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Expense Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Types</option>
                {expenseMasters.map((em) => (
                  <option key={em.id} value={em.name}>
                    {em.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trip no, vehicle, pump notes..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Trip No</th>
                <th className="py-2.5 px-3 font-bold">Vehicle</th>
                <th className="py-2.5 px-3 font-bold">Driver</th>
                <th className="py-2.5 px-3 font-bold">Expense Type</th>
                <th className="py-2.5 px-3">Remarks / Pump</th>
                <th className="py-2.5 px-3 font-bold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No operating expenses match current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                      {r.date}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-400">
                      {r.tripNo}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-white">
                      {r.vehicleNumber}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {r.driverName}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950/40 dark:text-red-300">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate">
                      {r.note || '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-red-600 whitespace-nowrap">
                      {formatCurrency(r.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
