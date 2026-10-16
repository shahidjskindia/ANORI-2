import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Invoice } from '../../types';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency, getTodayDate } from '../../utils/formatters';

interface InvoicePaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { recordInvoicePayment } = useTransport();
  const [amount, setAmount] = useState<number | ''>(invoice?.balance_due || '');
  const [date, setDate] = useState<string>(getTodayDate());
  const [mode, setMode] = useState<'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Other'>('Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.balance_due);
      setDate(getTodayDate());
      setMode('Bank Transfer');
      setReference('');
      setErrorMsg('');
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (paymentAmount > invoice.balance_due) {
      setErrorMsg(`Payment amount cannot exceed remaining balance due of ${formatCurrency(invoice.balance_due)}.`);
      return;
    }

    recordInvoicePayment(invoice.id, {
      amount: paymentAmount,
      date,
      mode,
      reference: reference.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Record Customer Payment
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Invoice #{invoice.invoice_no} ({invoice.party_name})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-xs space-y-1 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Invoiced:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Received So Far:</span>
              <span className="font-mono text-emerald-600 font-semibold">{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-blue-200 dark:border-blue-900 font-bold">
              <span className="text-blue-900 dark:text-blue-300">Remaining Balance:</span>
              <span className="font-mono text-blue-900 dark:text-blue-300">{formatCurrency(invoice.balance_due)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                required
                min="1"
                max={invoice.balance_due}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode *
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / QR Payment</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Other">Other Adjustment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Reference / UTR / Remarks
            </label>
            <input
              placeholder="e.g. UTR / NEFT / Cheque #554421"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 cursor-pointer"
            >
              Confirm &amp; Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
