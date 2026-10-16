import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Truck,
  IndianRupee,
  FileCheck2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency, calculateRemainingDays } from '../../utils/formatters';

interface DashboardViewProps {
  onOpenNewTripModal: () => void;
  onOpenNewInvoiceModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTripModal,
  onOpenNewInvoiceModal,
}) => {
  const { trips, invoices, setActiveView } = useTransport();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Financial Metrics
  const activeInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== 'cancelled'),
    [invoices]
  );
  const totalBilled = useMemo(
    () => activeInvoices.reduce((acc, inv) => acc + inv.total_amount, 0),
    [activeInvoices]
  );
  const totalCollected = useMemo(
    () => activeInvoices.reduce((acc, inv) => acc + inv.paid_amount, 0),
    [activeInvoices]
  );
  const totalOutstanding = useMemo(
    () => activeInvoices.reduce((acc, inv) => acc + inv.balance_due, 0),
    [activeInvoices]
  );
  const totalTripFreight = useMemo(
    () => trips.reduce((acc, t) => acc + t.freight, 0),
    [trips]
  );
  const totalExpenses = useMemo(
    () =>
      trips.reduce(
        (acc, t) =>
          acc + (t.expenses || []).reduce((sum, e) => sum + e.amount, 0),
        0
      ),
    [trips]
  );
  const totalVendorCost = useMemo(
    () => trips.reduce((acc, t) => acc + (t.vendor_cost || 0), 0),
    [trips]
  );
  const netFleetMargin = totalTripFreight - totalExpenses - totalVendorCost;

  // Attention Counts
  const pendingToInvoiceCount = trips.filter(
    (t) => t.status === 'completed' && t.invoice_status === 'pending'
  ).length;
  const pendingPaymentCount = activeInvoices.filter((i) => i.balance_due > 0).length;
  const overdueInvoicesCount = activeInvoices.filter(
    (i) => i.balance_due > 0 && calculateRemainingDays(i.due_date) < 0
  ).length;
  const outsideVehiclesCount = trips.filter(
    (t) => t.vehicle_classification === 'outside'
  ).length;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    trips.forEach((t) => {
      (t.expenses || []).forEach((e) => {
        map[e.type] = (map[e.type] || 0) + e.amount;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [trips]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyStats = useMemo(() => {
    return months.map((m, idx) => {
      const monthPrefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const monthTrips = trips.filter((t) => t.date.startsWith(monthPrefix));
      const revenue = monthTrips.reduce((acc, t) => acc + t.freight, 0);
      const expense = monthTrips.reduce(
        (acc, t) => acc + (t.expenses || []).reduce((s, e) => s + e.amount, 0),
        0
      );
      const profit = revenue - expense;
      return { month: m, revenue, expense, profit };
    });
  }, [trips, selectedYear]);

  const maxRevenue = Math.max(...monthlyStats.map((s) => s.revenue), 50000);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operations Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time fleet performance, billing reconciliation, and expense tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value={2026}>Fiscal Year 2026</option>
            <option value={2025}>Fiscal Year 2025</option>
          </select>
          <button
            onClick={() => setActiveView('reports')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
          >
            Detailed Reports →
          </button>
        </div>
      </div>

      {/* Attention / Urgent Action Banners */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Pending Invoices */}
        <div
          onClick={() => setActiveView('trips')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending Invoice
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50">
              <FileCheck2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {pendingToInvoiceCount}
            </span>
            <span className="text-xs text-slate-500">trips ready</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Completed trips awaiting billing creation
          </p>
        </div>

        {/* Card 2: Pending Receivables */}
        <div
          onClick={() => setActiveView('invoices')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-blue-900/40 dark:from-blue-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Pending Receivables
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {pendingPaymentCount}
            </span>
            <span className="text-xs text-slate-500">invoices</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Balance due: <strong className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(totalOutstanding)}</strong>
          </p>
        </div>

        {/* Card 3: Overdue Invoices */}
        <div
          onClick={() => setActiveView('invoices')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm transition-all hover:border-red-300 hover:shadow-md dark:border-red-900/40 dark:from-red-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              Overdue Follow-up
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {overdueInvoicesCount}
            </span>
            <span className="text-xs text-slate-500">past credit terms</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Requires client payment follow-up
          </p>
        </div>

        {/* Card 4: Outside Hired Trucks */}
        <div
          onClick={() => setActiveView('settlements')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Outside Hired Fleet
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {outsideVehiclesCount}
            </span>
            <span className="text-xs text-slate-500">vendor trips</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Vendor cost: <strong className="font-semibold text-indigo-700 dark:text-indigo-400">{formatCurrency(totalVendorCost)}</strong>
          </p>
        </div>
      </div>

      {/* Main KPI Financial Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Freight Billed
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalBilled)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {activeInvoices.length} Invoices Issued
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Cash Received
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Advances &amp; Bank NEFT
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Balance Due
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(totalOutstanding)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Customer Receivables
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Trip Diesel &amp; Toll
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Direct operating cost
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Net Fleet Margin
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatCurrency(netFleetMargin)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {totalTripFreight > 0 ? `${Math.round((netFleetMargin / totalTripFreight) * 100)}% operating margin` : '0%'}
          </span>
        </div>
      </div>

      {/* Analytics Charts & Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue & Margin Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Freight Revenue vs Margin ({selectedYear})
              </h2>
              <span className="text-xs text-slate-500">
                Gross freight volume compared to net operating margin
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                Freight Revenue
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Net Margin
              </span>
            </div>
          </div>

          <div className="mt-6 h-56 w-full flex items-end gap-2 pt-4 px-2">
            {monthlyStats.map((item) => {
              const revHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 160 : 4;
              const profitHeight = maxRevenue > 0 ? (Math.max(0, item.profit) / maxRevenue) * 160 : 2;
              return (
                <div key={item.month} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  <div className="pointer-events-none absolute -top-12 z-20 hidden rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block dark:bg-slate-800">
                    <div>{item.month} Freight: {formatCurrency(item.revenue)}</div>
                    <div>Margin: {formatCurrency(item.profit)}</div>
                  </div>
                  <div className="flex items-end gap-1 w-full justify-center">
                    <div
                      style={{ height: `${Math.max(4, revHeight)}px` }}
                      className="w-full max-w-[14px] rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                    />
                    <div
                      style={{ height: `${Math.max(2, profitHeight)}px` }}
                      className="w-full max-w-[14px] rounded-t bg-emerald-500 transition-all hover:bg-emerald-600"
                    />
                  </div>
                  <span className="mt-2 text-[10px] font-medium text-slate-500">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Fleet Expense Distribution
            </h2>
            <span className="text-xs text-slate-500">
              Categorized direct trip expenditure
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {expenseByCategory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recorded trip expenses yet.
              </div>
            ) : (
              expenseByCategory.slice(0, 6).map(([cat, amount]) => {
                const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {formatCurrency(amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-indigo-600"
                      />
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Total Direct Expenses:
              </span>
              <span className="font-bold font-mono text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Active Records Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Trips Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Completed Trips
            </h2>
            <button
              onClick={() => setActiveView('trips')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All Trips →
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2.5 font-bold">Trip No</th>
                  <th className="py-2.5 font-bold">Date</th>
                  <th className="py-2.5 font-bold">Vehicle</th>
                  <th className="py-2.5 font-bold">Customer</th>
                  <th className="py-2.5 font-bold text-right">Freight</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 font-bold font-mono text-blue-700 dark:text-blue-400">
                      {t.trip_no}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">{t.date}</td>
                    <td className="py-2.5 font-medium">{t.vehicle_number || t.vehicle_manual}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                      {t.party_name || t.party_manual}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-right text-slate-900 dark:text-white">
                      {formatCurrency(t.freight)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.invoice_status === 'invoiced'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {t.invoice_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Operations Shortcuts
            </h2>
            <span className="text-xs text-slate-500">
              One-click access to critical fleet routines
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5">
            <button
              onClick={onOpenNewTripModal}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Create New Trip</div>
                  <div className="text-[11px] text-slate-500">Dispatch truck with freight &amp; advance</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={onOpenNewInvoiceModal}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <Receipt className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Generate Tax Invoice</div>
                  <div className="text-[11px] text-slate-500">Bill completed trips with GST &amp; billables</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveView('settlements')}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Wallet className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Driver &amp; Vendor Ledger</div>
                  <div className="text-[11px] text-slate-500">Reconcile trip advances &amp; vendor hire pay</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
