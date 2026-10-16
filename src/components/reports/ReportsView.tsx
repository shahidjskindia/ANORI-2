import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  FileText,
  Search,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency, getTodayDate } from '../../utils/formatters';
import { downloadReportPDF } from '../../utils/pdfGenerator';
import * as XLSX from 'xlsx';

export const ReportsView: React.FC = () => {
  const { trips, invoices } = useTransport();

  const [activeReportTab, setActiveReportTab] = useState<'customer' | 'route' | 'vehicle' | 'closing'>('customer');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>(getTodayDate());
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Filtered trips by date range
  const dateFilteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      return true;
    });
  }, [trips, fromDate, toDate]);

  // 1. Customer-Wise Volume Breakdown
  const customerSummary = useMemo(() => {
    const map: Record<
      string,
      { partyName: string; tripCount: number; totalFreight: number; totalAdvance: number; invoicedCount: number }
    > = {};
    dateFilteredTrips.forEach((t) => {
      const pName = t.party_name || t.party_manual || 'Unknown';
      if (!map[pName]) {
        map[pName] = {
          partyName: pName,
          tripCount: 0,
          totalFreight: 0,
          totalAdvance: 0,
          invoicedCount: 0,
        };
      }
      map[pName].tripCount += 1;
      map[pName].totalFreight += t.freight;
      map[pName].totalAdvance += t.trip_advance_amount || 0;
      if (t.invoice_status === 'invoiced') map[pName].invoicedCount += 1;
    });
    let list = Object.values(map).sort((a, b) => b.totalFreight - a.totalFreight);
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter((c) => c.partyName.toLowerCase().includes(q));
    }
    return list;
  }, [dateFilteredTrips, searchFilter]);

  // 2. Route Profitability Breakdown
  const routeSummary = useMemo(() => {
    const map: Record<
      string,
      { route: string; tripCount: number; totalFreight: number; totalExpenses: number; profit: number }
    > = {};
    dateFilteredTrips.forEach((t) => {
      const rKey = `${t.from} → ${t.to}`;
      if (!map[rKey]) {
        map[rKey] = {
          route: rKey,
          tripCount: 0,
          totalFreight: 0,
          totalExpenses: 0,
          profit: 0,
        };
      }
      const exp = (t.expenses || []).reduce((sum, e) => sum + e.amount, 0) + (t.vendor_cost || 0);
      map[rKey].tripCount += 1;
      map[rKey].totalFreight += t.freight;
      map[rKey].totalExpenses += exp;
      map[rKey].profit += t.freight - exp;
    });
    let list = Object.values(map).sort((a, b) => b.totalFreight - a.totalFreight);
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter((r) => r.route.toLowerCase().includes(q));
    }
    return list;
  }, [dateFilteredTrips, searchFilter]);

  // 3. Vehicle Utilization Breakdown
  const vehicleSummary = useMemo(() => {
    const map: Record<
      string,
      { vehicleNumber: string; classification: string; tripCount: number; totalFreight: number; totalExpenses: number; profit: number }
    > = {};
    dateFilteredTrips.forEach((t) => {
      const vNum = t.vehicle_number || t.vehicle_manual || 'Unknown';
      if (!map[vNum]) {
        map[vNum] = {
          vehicleNumber: vNum,
          classification: t.vehicle_classification,
          tripCount: 0,
          totalFreight: 0,
          totalExpenses: 0,
          profit: 0,
        };
      }
      const exp = (t.expenses || []).reduce((sum, e) => sum + e.amount, 0) + (t.vendor_cost || 0);
      map[vNum].tripCount += 1;
      map[vNum].totalFreight += t.freight;
      map[vNum].totalExpenses += exp;
      map[vNum].profit += t.freight - exp;
    });
    let list = Object.values(map).sort((a, b) => b.totalFreight - a.totalFreight);
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.vehicleNumber.toLowerCase().includes(q) ||
          v.classification.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dateFilteredTrips, searchFilter]);

  // 4. Daily Closing Breakdown
  const closingTrips = useMemo(() => {
    const targetDate = toDate || getTodayDate();
    let list = trips.filter((t) => t.date === targetDate);
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.trip_no.toLowerCase().includes(q) ||
          (t.party_name && t.party_name.toLowerCase().includes(q)) ||
          (t.vehicle_number && t.vehicle_number.toLowerCase().includes(q))
      );
    }
    return list;
  }, [trips, toDate, searchFilter]);

  // AMENDMENT #2: Individual Excel Export for each report tab
  const handleExportExcel = () => {
    const today = getTodayDate();
    const wb = XLSX.utils.book_new();

    if (activeReportTab === 'customer') {
      const rows = customerSummary.map((c, i) => ({
        'Sr No': i + 1,
        'Customer Name': c.partyName,
        'Trips Completed': c.tripCount,
        'Total Freight (INR)': c.totalFreight,
        'Total Advances Adjusted (INR)': c.totalAdvance,
        'Invoiced Trips': c.invoicedCount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Customer Volume');
      XLSX.writeFile(wb, `anori_customer_volume_report_${today}.xlsx`);
    } else if (activeReportTab === 'route') {
      const rows = routeSummary.map((r, i) => ({
        'Sr No': i + 1,
        Route: r.route,
        'Trips Completed': r.tripCount,
        'Gross Freight (INR)': r.totalFreight,
        'Total Operating Cost (INR)': r.totalExpenses,
        'Net Operating Margin (INR)': r.profit,
        'Margin Percentage': `${r.totalFreight > 0 ? Math.round((r.profit / r.totalFreight) * 100) : 0}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Route Margins');
      XLSX.writeFile(wb, `anori_route_margins_report_${today}.xlsx`);
    } else if (activeReportTab === 'vehicle') {
      const rows = vehicleSummary.map((v, i) => ({
        'Sr No': i + 1,
        'Vehicle Number': v.vehicleNumber,
        Classification: v.classification.toUpperCase(),
        'Trips Completed': v.tripCount,
        'Freight Generated (INR)': v.totalFreight,
        'Direct Cost & Hire (INR)': v.totalExpenses,
        'Net Vehicle Profit (INR)': v.profit,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Vehicle Utilization');
      XLSX.writeFile(wb, `anori_vehicle_utilization_report_${today}.xlsx`);
    } else if (activeReportTab === 'closing') {
      const rows = closingTrips.map((t, i) => ({
        'Sr No': i + 1,
        'Trip No': t.trip_no,
        Date: t.date,
        Vehicle: t.vehicle_number || t.vehicle_manual || '-',
        Driver: t.driver_name || t.driver_manual || '-',
        Customer: t.party_name || t.party_manual || '-',
        'Freight (INR)': t.freight,
        'Advance (INR)': t.trip_advance_amount,
        'Invoice Status': t.invoice_status.toUpperCase(),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Daily Closing');
      XLSX.writeFile(wb, `anori_daily_closing_report_${today}.xlsx`);
    }
  };

  // AMENDMENT #2: Individual PDF Export for each report tab
  const handleExportPDF = () => {
    const today = getTodayDate();
    const dateRangeSubtitle = `Date Range: ${fromDate || 'All Time'} to ${toDate || today} | Records: `;

    if (activeReportTab === 'customer') {
      const columns = [
        { header: '#', dataKey: 'sr', width: 12, align: 'center' as const },
        { header: 'Customer / Party Name', dataKey: 'partyName', width: 90, align: 'left' as const },
        { header: 'Trips', dataKey: 'tripCount', width: 25, align: 'center' as const },
        { header: 'Freight (Rs.)', dataKey: 'freightFormatted', width: 45, align: 'right' as const },
        { header: 'Advance (Rs.)', dataKey: 'advanceFormatted', width: 45, align: 'right' as const },
        { header: 'Invoiced', dataKey: 'invoiced', width: 35, align: 'center' as const },
      ];
      const data = customerSummary.map((c, i) => ({
        sr: i + 1,
        partyName: c.partyName,
        tripCount: c.tripCount,
        freightFormatted: formatCurrency(c.totalFreight),
        advanceFormatted: formatCurrency(c.totalAdvance),
        invoiced: `${c.invoicedCount} / ${c.tripCount}`,
      }));
      downloadReportPDF(
        'Customer Volume Report',
        columns,
        data,
        `anori_customer_volume_report_${today}.pdf`,
        `${dateRangeSubtitle}${data.length}`
      );
    } else if (activeReportTab === 'route') {
      const columns = [
        { header: '#', dataKey: 'sr', width: 12, align: 'center' as const },
        { header: 'Transport Route (POL → POD)', dataKey: 'route', width: 95, align: 'left' as const },
        { header: 'Trips', dataKey: 'tripCount', width: 22, align: 'center' as const },
        { header: 'Freight (Rs.)', dataKey: 'freightFormatted', width: 40, align: 'right' as const },
        { header: 'Costs (Rs.)', dataKey: 'costFormatted', width: 40, align: 'right' as const },
        { header: 'Margin (Rs.)', dataKey: 'marginFormatted', width: 40, align: 'right' as const },
        { header: 'Margin %', dataKey: 'marginPct', width: 25, align: 'center' as const },
      ];
      const data = routeSummary.map((r, i) => ({
        sr: i + 1,
        route: r.route,
        tripCount: r.tripCount,
        freightFormatted: formatCurrency(r.totalFreight),
        costFormatted: formatCurrency(r.totalExpenses),
        marginFormatted: formatCurrency(r.profit),
        marginPct: `${r.totalFreight > 0 ? Math.round((r.profit / r.totalFreight) * 100) : 0}%`,
      }));
      downloadReportPDF(
        'Route Profitability Report',
        columns,
        data,
        `anori_route_margins_report_${today}.pdf`,
        `${dateRangeSubtitle}${data.length}`
      );
    } else if (activeReportTab === 'vehicle') {
      const columns = [
        { header: '#', dataKey: 'sr', width: 12, align: 'center' as const },
        { header: 'Vehicle Number', dataKey: 'vehicleNumber', width: 50, align: 'left' as const },
        { header: 'Classification', dataKey: 'classification', width: 55, align: 'center' as const },
        { header: 'Trips', dataKey: 'tripCount', width: 25, align: 'center' as const },
        { header: 'Freight (Rs.)', dataKey: 'freightFormatted', width: 45, align: 'right' as const },
        { header: 'Operating Cost', dataKey: 'costFormatted', width: 45, align: 'right' as const },
        { header: 'Profit (Rs.)', dataKey: 'profitFormatted', width: 42, align: 'right' as const },
      ];
      const data = vehicleSummary.map((v, i) => ({
        sr: i + 1,
        vehicleNumber: v.vehicleNumber,
        classification: v.classification.toUpperCase(),
        tripCount: v.tripCount,
        freightFormatted: formatCurrency(v.totalFreight),
        costFormatted: formatCurrency(v.totalExpenses),
        profitFormatted: formatCurrency(v.profit),
      }));
      downloadReportPDF(
        'Vehicle Utilization & Profit Report',
        columns,
        data,
        `anori_vehicle_utilization_report_${today}.pdf`,
        `${dateRangeSubtitle}${data.length}`
      );
    } else if (activeReportTab === 'closing') {
      const columns = [
        { header: '#', dataKey: 'sr', width: 12, align: 'center' as const },
        { header: 'Trip No.', dataKey: 'tripNo', width: 40, align: 'left' as const },
        { header: 'Vehicle', dataKey: 'vehicle', width: 35, align: 'left' as const },
        { header: 'Customer', dataKey: 'customer', width: 65, align: 'left' as const },
        { header: 'Freight (Rs.)', dataKey: 'freightFormatted', width: 40, align: 'right' as const },
        { header: 'Advance (Rs.)', dataKey: 'advanceFormatted', width: 40, align: 'right' as const },
        { header: 'Status', dataKey: 'status', width: 35, align: 'center' as const },
      ];
      const data = closingTrips.map((t, i) => ({
        sr: i + 1,
        tripNo: t.trip_no,
        vehicle: t.vehicle_number || t.vehicle_manual || '-',
        customer: t.party_name || t.party_manual || '-',
        freightFormatted: formatCurrency(t.freight),
        advanceFormatted: formatCurrency(t.trip_advance_amount),
        status: t.invoice_status.toUpperCase(),
      }));
      downloadReportPDF(
        `Daily Closing Report (${toDate || today})`,
        columns,
        data,
        `anori_daily_closing_report_${today}.pdf`,
        `Date: ${toDate || today} | Total Dispatched: ${data.length}`
      );
    }
  };

  const getReportName = () => {
    switch (activeReportTab) {
      case 'customer':
        return 'Customer Volume & Billing Report';
      case 'route':
        return 'Route Margins & Profitability Report';
      case 'vehicle':
        return 'Fleet & Hired Vehicle Utilization Report';
      case 'closing':
        return 'Daily Operational Closing Report';
    }
  };

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Operational Analytics &amp; Reports
          </h1>
          <p className="text-xs text-slate-500">
            Multi-dimensional business intelligence with individual Excel and PDF downloads for every report
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveReportTab('customer')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'customer'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Customer Volume
          </button>
          <button
            onClick={() => setActiveReportTab('route')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'route'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Route Margins
          </button>
          <button
            onClick={() => setActiveReportTab('vehicle')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'vehicle'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Vehicle Utilization
          </button>
          <button
            onClick={() => setActiveReportTab('closing')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'closing'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Daily Closing
          </button>
        </div>
      </div>

      {/* Date Range & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          {(fromDate || toDate !== getTodayDate()) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate(getTodayDate());
              }}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Reset Date Range
            </button>
          )}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search within report..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Main Report Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* AMENDMENT #2: Actions Section for Every Report Tab with Excel and PDF Downloads */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {getReportName()}
            </span>
          </div>

          {/* Actions Download Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Actions:
            </span>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 cursor-pointer transition-colors"
              title="Download Excel (.xlsx) for this report"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 cursor-pointer transition-colors"
              title="Download PDF (.pdf) for this report"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Download PDF (.pdf)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              title="Print report"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Customer Volume Table */}
        {activeReportTab === 'customer' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-bold">Customer / Party Name</th>
                  <th className="py-2.5 px-3 font-bold text-center">Trips Dispatched</th>
                  <th className="py-2.5 px-3 font-bold text-right">Total Freight (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Advances Received (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Invoiced Trips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customerSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No customer records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  customerSummary.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {c.partyName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">
                        {c.tripCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(c.totalFreight)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                        {formatCurrency(c.totalAdvance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold dark:bg-slate-800">
                          {c.invoicedCount} / {c.tripCount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Route Margins Table */}
        {activeReportTab === 'route' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-bold">Transport Route (POL → POD)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Trips Completed</th>
                  <th className="py-2.5 px-3 font-bold text-right">Gross Freight (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Direct Costs &amp; Hire (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Net Margin (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {routeSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No routes found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  routeSummary.map((r, i) => {
                    const marginPct = r.totalFreight > 0 ? Math.round((r.profit / r.totalFreight) * 100) : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {r.route}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">
                          {r.tripCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(r.totalFreight)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-600">
                          {formatCurrency(r.totalExpenses)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-black ${
                            r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(r.profit)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                              marginPct >= 20
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : marginPct > 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {marginPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Vehicle Utilization Table */}
        {activeReportTab === 'vehicle' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-bold">Vehicle Number</th>
                  <th className="py-2.5 px-3 font-bold text-center">Classification</th>
                  <th className="py-2.5 px-3 font-bold text-center">Trips Logged</th>
                  <th className="py-2.5 px-3 font-bold text-right">Gross Freight (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Operating / Hire Cost (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Net Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicleSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No vehicle records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  vehicleSummary.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {v.vehicleNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-800">
                          {v.classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">
                        {v.tripCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(v.totalFreight)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-red-600">
                        {formatCurrency(v.totalExpenses)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-black ${
                          v.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(v.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Daily Closing Table */}
        {activeReportTab === 'closing' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Trips Dispatched
                </span>
                <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {closingTrips.length}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Invoices Dated Today
                </span>
                <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {invoices.filter((i) => i.date === (toDate || getTodayDate())).length}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Freight Value
                </span>
                <div className="mt-1 text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
                  {formatCurrency(closingTrips.reduce((s, t) => s + t.freight, 0))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Advances Collected
                </span>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-600">
                  {formatCurrency(closingTrips.reduce((s, t) => s + (t.trip_advance_amount || 0), 0))}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3 font-bold">Trip No</th>
                    <th className="py-2 px-3 font-bold">Vehicle</th>
                    <th className="py-2 px-3 font-bold">Customer</th>
                    <th className="py-2 px-3 font-bold text-right">Freight (₹)</th>
                    <th className="py-2 px-3 font-bold text-right">Advance (₹)</th>
                    <th className="py-2 px-3 font-bold text-center">Invoice Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {closingTrips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        No trips found for {toDate || getTodayDate()}.
                      </td>
                    </tr>
                  ) : (
                    closingTrips.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                          {t.trip_no}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {t.vehicle_number || t.vehicle_manual || '-'}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {t.party_name || t.party_manual || '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(t.freight)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                          {formatCurrency(t.trip_advance_amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              t.invoice_status === 'invoiced'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            {t.invoice_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
