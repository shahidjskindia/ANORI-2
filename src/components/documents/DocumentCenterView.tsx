import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  FileText,
  Printer,
  Download,
  Receipt,
  Truck,
  Wallet,
  Search,
  Eye,
  Loader2,
  X,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency } from '../../utils/formatters';
import { Invoice } from '../../types';
import { downloadInvoicePDF, downloadElementAsPDF } from '../../utils/pdfGenerator';
import { InvoiceDocument } from '../invoices/InvoiceDocument';

export const DocumentCenterView: React.FC = () => {
  const { invoices, trips, driverSettlements, companyProfile, setActiveView } = useTransport();
  const [searchDoc, setSearchDoc] = useState('');
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const docPdfRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // AMENDMENT #6: Single PDF download per click (no duplicate downloads)
  const handleDownloadPdf = async (inv: Invoice) => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await downloadInvoicePDF(inv, companyProfile, `${inv.invoice_no}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      if (docPdfRef.current) {
        await downloadElementAsPDF(docPdfRef.current, `${inv.invoice_no}.pdf`);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const filteredInvoices = invoices.filter((i) => {
    if (!searchDoc.trim()) return true;
    const q = searchDoc.toLowerCase();
    return i.invoice_no.toLowerCase().includes(q) || i.party_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Document Repository &amp; Archive
          </h1>
          <p className="text-xs text-slate-500">
            One central archive to review, reprint, and export all generated billing and dispatch documents
          </p>
        </div>
      </div>

      {/* 3 Main Archive Category Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          onClick={() => setActiveView('invoices')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Tax Invoices</div>
              <div className="text-[11px] text-slate-500 font-mono">{invoices.length} archived</div>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600">Open →</span>
        </div>

        <div
          onClick={() => setActiveView('trips')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Trip LR Dispatches</div>
              <div className="text-[11px] text-slate-500 font-mono">{trips.length} recorded</div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600">Open →</span>
        </div>

        <div
          onClick={() => setActiveView('settlements')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Settlement Slips</div>
              <div className="text-[11px] text-slate-500 font-mono">{driverSettlements.length} vouchers</div>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600">Open →</span>
        </div>
      </div>

      {/* Recent Printable Documents Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Generated Invoices Archive
            </h2>
            <span className="text-xs text-slate-500">
              Click Preview to inspect or Print/Save PDF
            </span>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              placeholder="Search by invoice # or party..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3">Document Type</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Credit Days</th>
                <th className="py-2.5 px-3">Customer / Consignee</th>
                <th className="py-2.5 px-3 text-right">Invoice Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    Tax Invoice
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                    {inv.invoice_no}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    {inv.date}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {inv.credit_days ?? 0} Days
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {inv.party_name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(inv.total_amount)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'cancelled'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPreviewingInvoice(inv)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        title="Preview Invoice"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(inv)}
                        disabled={isExportingPdf && previewingInvoice?.id === inv.id}
                        className="inline-flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
                        title="Download PDF File"
                      >
                        {isExportingPdf && previewingInvoice?.id === inv.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Printable Preview Modal */}
      {previewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800">
              <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                {previewingInvoice.invoice_no}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(previewingInvoice)}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewingInvoice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto bg-slate-100/80 dark:bg-slate-950">
              <div ref={docPdfRef} className="bg-white p-2 sm:p-4 rounded shadow-sm text-slate-900">
                <InvoiceDocument invoice={previewingInvoice} companyProfile={companyProfile} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
