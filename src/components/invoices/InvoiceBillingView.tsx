import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Eye,
  Download,
  Printer,
  DollarSign,
  Trash2,
  Ban,
  Search,
  MessageCircle,
  Mail,
  X,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Invoice } from '../../types';
import { useTransport } from '../../store/TransportContext';
import {
  formatCurrency,
  calculateRemainingDays,
  calculateDueDate,
} from '../../utils/formatters';
import { downloadInvoicePDF, downloadElementAsPDF } from '../../utils/pdfGenerator';
import { InvoiceDocument } from './InvoiceDocument';
import { InvoicePaymentModal } from './InvoicePaymentModal';
import { InvoiceGeneratorModal } from './InvoiceGeneratorModal';

export const InvoiceBillingView: React.FC = () => {
  const {
    invoices,
    companyProfile,
    cancelInvoice,
    deleteInvoice,
    updateInvoiceCreditDays,
  } = useTransport();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [editingCreditDaysInvoice, setEditingCreditDaysInvoice] = useState<Invoice | null>(null);
  const [editCreditDaysInput, setEditCreditDaysInput] = useState<number>(0);

  const invoiceDocRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // AMENDMENT #6: Single PDF download per click (no duplicate downloads)
  const handleDownloadPdf = async (inv?: Invoice) => {
    const target = inv || previewInvoice || getSingleSelected();
    if (!target) {
      alert('Please select an invoice to download PDF.');
      return;
    }
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      await downloadInvoicePDF(target, companyProfile, `${target.invoice_no}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      if (invoiceDocRef.current) {
        await downloadElementAsPDF(invoiceDocRef.current, `${target.invoice_no}.pdf`);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeInvoices = useMemo(
    () => invoices.filter((i) => i.status !== 'cancelled'),
    [invoices]
  );

  const kpis = useMemo(() => {
    let totalBilled = 0;
    let totalReceived = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partPaidCount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    activeInvoices.forEach((inv) => {
      totalBilled += inv.total_amount;
      totalReceived += inv.paid_amount;
      const remainingDays = calculateRemainingDays(inv.due_date);
      if (inv.status === 'paid' || inv.balance_due === 0) {
        paidCount++;
      } else if (inv.status === 'part_paid') {
        partPaidCount++;
      } else {
        unpaidCount++;
      }
      if (inv.balance_due > 0 && remainingDays < 0) {
        overdueCount++;
        overdueAmount += inv.balance_due;
      }
    });

    return {
      totalCount: activeInvoices.length,
      totalBilled,
      totalReceived,
      paidCount,
      unpaidCount,
      partPaidCount,
      overdueCount,
      overdueAmount,
    };
  }, [activeInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.invoice_no.toLowerCase().includes(q) ||
        inv.party_name.toLowerCase().includes(q) ||
        (inv.party_gst && inv.party_gst.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'overdue'
          ? inv.balance_due > 0 && calculateRemainingDays(inv.due_date) < 0
          : inv.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredInvoices.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const isAllSelected =
    filteredInvoices.length > 0 && filteredInvoices.every((i) => selectedIds.has(i.id));

  const getSingleSelected = (): Invoice | null => {
    if (selectedIds.size !== 1) {
      alert('Please select exactly one invoice for this action.');
      return null;
    }
    const id = Array.from(selectedIds)[0];
    return invoices.find((i) => i.id === id) || null;
  };

  const handlePreview = () => {
    const inv = getSingleSelected();
    if (inv) setPreviewInvoice(inv);
  };

  const handleRecordPayment = () => {
    const inv = getSingleSelected();
    if (inv) {
      if (inv.status === 'cancelled') {
        alert('Cancelled invoices cannot receive payment.');
        return;
      }
      if (inv.balance_due <= 0) {
        alert('This invoice is already fully paid.');
        return;
      }
      setPaymentInvoice(inv);
    }
  };

  const handleCancel = () => {
    const inv = getSingleSelected();
    if (inv) {
      if (inv.status === 'cancelled') {
        alert('Invoice is already cancelled.');
        return;
      }
      const reason = prompt(`Enter cancellation reason for invoice ${inv.invoice_no}:`);
      if (reason !== null) {
        cancelInvoice(inv.id, reason || 'Cancelled by administrator');
        setSelectedIds(new Set());
      }
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) {
      alert('Please select an invoice.');
      return;
    }
    const ids = Array.from(selectedIds);
    if (confirm(`Are you sure you want to delete/cancel ${ids.length} selected invoice(s)?`)) {
      ids.forEach((id) => deleteInvoice(id));
      setSelectedIds(new Set());
    }
  };

  const handleEditCreditDays = () => {
    const inv = getSingleSelected();
    if (!inv) return;
    if (inv.status === 'cancelled') {
      alert('Cancelled invoices cannot be edited.');
      return;
    }
    setEditingCreditDaysInvoice(inv);
    setEditCreditDaysInput(inv.credit_days ?? 0);
  };

  const handleSaveCreditDays = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreditDaysInvoice) return;
    updateInvoiceCreditDays(editingCreditDaysInvoice.id, editCreditDaysInput);
    setEditingCreditDaysInvoice(null);
  };

  const handleWhatsAppShare = () => {
    const inv = getSingleSelected();
    if (!inv) return;
    const message = encodeURIComponent(
      `*ANORI TRANSPORT SERVICES — TAX INVOICE*\n` +
      `Invoice No: *${inv.invoice_no}*\n` +
      `Date: ${inv.date} (Credit Days: ${inv.credit_days} | Due: ${inv.due_date})\n` +
      `Customer: ${inv.party_name}\n` +
      `Trips Billed: ${inv.trip_count}\n` +
      `Total Amount: *${formatCurrency(inv.total_amount)}*\n` +
      `Advance Paid: ${formatCurrency(inv.advance)}\n` +
      `*Balance Due: ${formatCurrency(inv.balance_due)}*\n\n` +
      `Bank: ${companyProfile.bank_name} | A/C: ${companyProfile.acc} | IFSC: ${companyProfile.bank}\n` +
      `Kindly arrange remittance at the earliest. Thank you!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleEmailShare = () => {
    const inv = getSingleSelected();
    if (!inv) return;
    const subject = encodeURIComponent(`Tax Invoice ${inv.invoice_no} — ${companyProfile.name}`);
    const body = encodeURIComponent(
      `Dear ${inv.party_name},\n\n` +
      `Please find billing details for Tax Invoice ${inv.invoice_no} dated ${inv.date}.\n\n` +
      `Invoice Total: ${formatCurrency(inv.total_amount)}\n` +
      `Advance Adjusted: ${formatCurrency(inv.advance)}\n` +
      `Balance Due: ${formatCurrency(inv.balance_due)}\n` +
      `Credit Days: ${inv.credit_days} days\n` +
      `Due Date: ${inv.due_date}\n\n` +
      `Remittance Details:\n` +
      `Bank: ${companyProfile.bank_name}\n` +
      `Account: ${companyProfile.acc}\n` +
      `IFSC: ${companyProfile.bank}\n\n` +
      `Regards,\n${companyProfile.name}`
    );
    window.location.href = `mailto:${inv.party_mobile ? '' : ''}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Invoices &amp; Freight Billing
          </h1>
          <p className="text-xs text-slate-500">
            GST and commercial tax invoicing, credit days monitoring &amp; customer payment ledger
          </p>
        </div>
        <button
          onClick={() => setIsGeneratorModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Tax Invoice</span>
        </button>
      </div>

      {/* 5 KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            statusFilter === 'all'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Invoices
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {kpis.totalCount}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {formatCurrency(kpis.totalBilled)} billed
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('paid')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            statusFilter === 'paid'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Fully Paid
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-600">
            {kpis.paidCount}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {formatCurrency(kpis.totalReceived)} received
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('issued')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            statusFilter === 'issued'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Unpaid Issued
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-amber-600">
            {kpis.unpaidCount}
          </div>
          <span className="text-[11px] text-slate-500">Awaiting client payment</span>
        </div>

        <div
          onClick={() => setStatusFilter('part_paid')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            statusFilter === 'part_paid'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Partially Paid
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-indigo-600">
            {kpis.partPaidCount}
          </div>
          <span className="text-[11px] text-slate-500">Partial collections received</span>
        </div>

        <div
          onClick={() => setStatusFilter('overdue')}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
            statusFilter === 'overdue'
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-sm'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Overdue Follow-up
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-red-600">
            {kpis.overdueCount}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {formatCurrency(kpis.overdueAmount)} overdue
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Actions:
            </span>
            <button
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>{isGeneratingPdf ? 'Downloading...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handleEditCreditDays}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
              title="Edit Credit Days & recalculate Due Date"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Credit Days</span>
            </button>
            <button
              onClick={handleRecordPayment}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Payment</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleEmailShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-500 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email</span>
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
          <div className="text-xs font-bold text-slate-500">
            {selectedIds.size} SELECTED
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, customer name, GSTIN..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Reset Filter: <span className="uppercase font-bold text-blue-600">{statusFilter}</span>
                <X className="h-3 w-3 ml-1" />
              </button>
            )}
            <span className="text-xs text-slate-500 font-mono">
              {filteredInvoices.length} invoices
            </span>
          </div>
        </div>

        {/* High-Density Invoice Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 font-bold">Invoice #</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Credit Days</th>
                <th className="py-2.5 px-3 font-bold">Due Date</th>
                <th className="py-2.5 px-3 font-bold text-center">Days Left</th>
                <th className="py-2.5 px-3 font-bold">Customer Name</th>
                <th className="py-2.5 px-3 font-bold text-center">Trips</th>
                <th className="py-2.5 px-3 font-bold text-right">Total (₹)</th>
                <th className="py-2.5 px-3 font-bold text-right">Received (₹)</th>
                <th className="py-2.5 px-3 font-bold text-right">Balance Due (₹)</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-xs text-slate-400">
                    No invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.has(inv.id);
                  const remainingDays = calculateRemainingDays(inv.due_date);
                  const isOverdue = inv.balance_due > 0 && remainingDays < 0;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleToggleRow(inv.id)}
                      onDoubleClick={() => setPreviewInvoice(inv)}
                      className={`cursor-pointer transition-colors ${
                        inv.status === 'cancelled'
                          ? 'opacity-60 bg-slate-100/50 dark:bg-slate-900/40 line-through'
                          : isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40'
                          : 'bg-white dark:bg-slate-900'
                      } hover:bg-slate-100/80 dark:hover:bg-slate-800`}
                    >
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-2.5 px-3 text-center"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(inv.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {inv.invoice_no}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                        {inv.date}
                      </td>
                      {/* AMENDMENT #3: Display Credit Days clearly */}
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {inv.credit_days ?? 0} Days
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono font-medium">
                        {inv.due_date}
                      </td>
                      {/* Days indicator */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          title={
                            isOverdue
                              ? `${Math.abs(remainingDays)} days overdue`
                              : `${remainingDays} days remaining`
                          }
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black font-mono border ${
                            isOverdue
                              ? 'border-red-400 bg-red-100 text-red-700'
                              : 'border-emerald-400 bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {Math.abs(remainingDays)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                        {inv.party_name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {inv.trip_count}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-900 dark:text-white">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-semibold">
                        {formatCurrency(inv.paid_amount)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-right text-blue-900 dark:text-blue-300">
                        {formatCurrency(inv.balance_due)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : inv.status === 'part_paid'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                              : inv.status === 'cancelled'
                              ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : isOverdue
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {inv.status === 'issued' && isOverdue ? 'OVERDUE' : inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AMENDMENT #3: Quick Edit Credit Days Modal */}
      {editingCreditDaysInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Update Credit Days
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice #{editingCreditDaysInvoice.invoice_no} ({editingCreditDaysInvoice.party_name})
            </p>
            <form onSubmit={handleSaveCreditDays} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Days Granted
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editCreditDaysInput}
                  onChange={(e) => setEditCreditDaysInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800">
                <span className="text-slate-500 block text-[10px]">NEW RECALCULATED DUE DATE:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                  {calculateDueDate(editingCreditDaysInvoice.date, editCreditDaysInput)}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCreditDaysInvoice(null)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
                >
                  Save Credit Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      <InvoiceGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        onInvoiceCreated={(newInv) => {
          setPreviewInvoice(newInv);
        }}
      />

      {/* Invoice Payment Recording Modal */}
      <InvoicePaymentModal
        invoice={paymentInvoice}
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
      />

      {/* Full A4 Printable Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                  {previewInvoice.invoice_no}
                </span>
                <span className="text-xs text-slate-500">
                  Tax Invoice Preview (Credit: {previewInvoice.credit_days} Days)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(previewInvoice)}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto bg-slate-100/80 dark:bg-slate-950">
              <div ref={invoiceDocRef} className="bg-white p-2 sm:p-4 rounded shadow-sm text-slate-900">
                <InvoiceDocument invoice={previewInvoice} companyProfile={companyProfile} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
