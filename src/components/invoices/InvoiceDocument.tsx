import React from 'react';
import { Invoice, CompanyProfile } from '../../types';
import { formatCurrency, formatCurrencyDec, numberToWords } from '../../utils/formatters';

interface InvoiceDocumentProps {
  invoice: Invoice;
  companyProfile: CompanyProfile;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  companyProfile,
}) => {
  const isGst = invoice.is_gst && invoice.tax_type !== 'none';

  return (
    <div className="invoice-a4-page mx-auto bg-white text-slate-900 font-sans shadow-lg p-6 sm:p-10 text-xs leading-relaxed uppercase border border-slate-200">
      {/* Header Banner: Company Brand & Tax Invoice Meta */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div className="space-y-1 max-w-[65%]">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            {companyProfile.name || 'ANORI TRANSPORT SERVICES'}
          </h1>
          <div className="text-[10px] sm:text-[11px] text-slate-700 leading-tight">
            {companyProfile.addr_lines && companyProfile.addr_lines.length > 0 ? (
              companyProfile.addr_lines.map((line, idx) => <div key={idx}>{line}</div>)
            ) : (
              <div>{companyProfile.addr}</div>
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-800 pt-0.5">
            <span>GSTIN: {companyProfile.gst || 'N/A'}</span> &nbsp;|&nbsp;
            <span>PAN: {companyProfile.pan || 'N/A'}</span> &nbsp;|&nbsp;
            <span>Phone: {companyProfile.phone || 'N/A'}</span>
          </div>
        </div>
        <div className="sm:text-right flex flex-col justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-wider">
              {isGst ? 'TAX INVOICE' : 'COMMERCIAL INVOICE'}
            </h2>
            <div className="mt-1.5 inline-block border border-slate-300 rounded px-2.5 py-0.5 text-center bg-slate-50">
              <div className="text-[9px] text-slate-500 font-bold">INVOICE NUMBER</div>
              <div className="font-mono text-xs sm:text-sm font-black text-slate-950">
                {invoice.invoice_no}
              </div>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] space-y-0.5 mt-1.5">
            <div>
              <span className="text-slate-500">Date:</span>{' '}
              <strong className="font-mono">{invoice.date}</strong>
            </div>
            <div>
              <span className="text-slate-500">Due Date:</span>{' '}
              <strong className="font-mono">{invoice.due_date}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Bill To & Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        {/* Bill To Customer */}
        <div className="rounded border border-slate-300 bg-slate-50/50 p-3 space-y-0.5">
          <div className="text-[9px] font-bold tracking-wider text-slate-500 border-b border-slate-200 pb-0.5">
            BILL TO (CONSIGNEE / CUSTOMER)
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-950 pt-0.5">
            {invoice.party_name}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-700 leading-tight">
            {invoice.party_addr || 'Address not provided'}
          </div>
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-800 pt-0.5">
            GSTIN: {invoice.party_gst || 'UNREGISTERED'}
          </div>
        </div>

        {/* Payment Terms & Tax info */}
        <div className="rounded border border-slate-300 bg-slate-50/50 p-3 space-y-0.5">
          <div className="text-[9px] font-bold tracking-wider text-slate-500 border-b border-slate-200 pb-0.5">
            PAYMENT TERMS &amp; BILLING DETAILS
          </div>
          <div className="text-[10px] sm:text-[11px] pt-0.5">
            <span className="text-slate-600">Credit Period:</span>{' '}
            <strong>{invoice.credit_days} DAYS {invoice.credit_days === 0 ? '(IMMEDIATE DUE)' : ''}</strong>
          </div>
          <div className="text-[10px] sm:text-[11px]">
            <span className="text-slate-600">Invoice Type:</span>{' '}
            <strong>{isGst ? 'GST INVOICE' : 'NON-GST INVOICE'}</strong>
          </div>
          <div className="text-[10px] sm:text-[11px]">
            <span className="text-slate-600">Tax Mode:</span>{' '}
            <strong>
              {invoice.tax_type === 'igst'
                ? 'IGST @ 18%'
                : isGst
                ? 'CGST 9% + SGST 9%'
                : 'NO TAX APPLICABLE'}
            </strong>
          </div>
          <div className="text-[10px] sm:text-[11px]">
            <span className="text-slate-600">Total Trips Billed:</span>{' '}
            <strong>{invoice.trip_count} TRIPS</strong>
          </div>
        </div>
      </div>

      {/* Charges Table */}
      <div className="border border-slate-300 rounded overflow-hidden mt-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[11px]">
              <th className="py-1.5 px-2.5 w-8 text-center border-r border-slate-300">#</th>
              <th className="py-1.5 px-2.5 border-r border-slate-300">Trip No &amp; Date</th>
              <th className="py-1.5 px-2.5 border-r border-slate-300">Route (POL → POD)</th>
              <th className="py-1.5 px-2.5 border-r border-slate-300">Vehicle No</th>
              <th className="py-1.5 px-2.5 text-right">Freight (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {invoice.trips_data && invoice.trips_data.length > 0 ? (
              invoice.trips_data.map((t, idx) => (
                <tr key={t.id || idx}>
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200">
                    <strong className="font-mono text-blue-700">{t.trip_no}</strong>
                    <div className="text-[9px] text-slate-500 font-mono">{t.date}</div>
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200">
                    <div>{t.from}</div>
                    <div className="text-[9px] text-slate-500">→ {t.to}</div>
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono font-semibold">
                    {t.vehicle_number || t.vehicle_manual || '-'}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                    {formatCurrency(t.freight)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-3 text-center text-slate-400">
                  No trips attached
                </td>
              </tr>
            )}

            {/* Billable Expense Lines */}
            {invoice.expense_lines &&
              invoice.expense_lines.map((exp, idx) => (
                <tr key={`exp-${idx}`} className="bg-slate-50/70 text-[11px]">
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">
                    {(invoice.trips_data?.length || 0) + idx + 1}
                  </td>
                  <td colSpan={3} className="py-1.5 px-2.5 border-r border-slate-200">
                    <strong>{exp.name}</strong>
                    <span className="text-[9px] text-slate-500 lowercase ml-2">
                      (billable transportation expense)
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                    {formatCurrency(exp.amount)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* AMENDMENT #1 & #7: Reduced Subtotal Section Size & White Net Balance Payable Amount */}
      <div className="flex justify-end mt-3">
        <div className="w-64 sm:w-72 border border-slate-300 rounded overflow-hidden text-[11px] shadow-xs">
          {/* Subtotal */}
          <div className="flex justify-between py-1 px-2.5 border-b border-slate-200 bg-white">
            <span className="text-slate-600 font-medium">Subtotal (Trips + Charges)</span>
            <span className="font-mono font-bold text-slate-900">
              Rs. {Number(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* CGST / SGST */}
          {isGst && invoice.tax_type === 'cgst_sgst' && (
            <>
              <div className="flex justify-between py-1 px-2.5 border-b border-slate-200 bg-white">
                <span className="text-slate-600">CGST @ 9%</span>
                <span className="font-mono text-slate-900">
                  Rs. {Number(invoice.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 px-2.5 border-b border-slate-200 bg-white">
                <span className="text-slate-600">SGST @ 9%</span>
                <span className="font-mono text-slate-900">
                  Rs. {Number(invoice.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}

          {/* IGST */}
          {isGst && invoice.tax_type === 'igst' && (
            <div className="flex justify-between py-1 px-2.5 border-b border-slate-200 bg-white">
              <span className="text-slate-600">IGST @ 18%</span>
              <span className="font-mono text-slate-900">
                Rs. {Number(invoice.igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Less: Advance Received */}
          {(invoice.advance || 0) > 0 && (
            <div className="flex justify-between py-1 px-2.5 border-b border-slate-200 bg-white text-slate-700">
              <span className="text-slate-600">Less: Advance Received</span>
              <span className="font-mono font-medium text-slate-900">
                Rs. -{Number(invoice.advance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* AMENDMENT #7: NET BALANCE PAYABLE amount in pure WHITE (#FFFFFF) on dark navy background */}
          <div className="flex justify-between items-center py-2 px-2.5 bg-slate-900 text-white font-black tracking-tight">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white">
              NET BALANCE PAYABLE
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-white">
              Rs. {Number(invoice.balance_due || invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Amount in words */}
      <div className="my-3 rounded border border-slate-300 bg-slate-50 p-2.5 text-[11px]">
        <span className="text-[9px] text-slate-500 font-bold block mb-0.5">
          AMOUNT IN WORDS
        </span>
        <span className="font-bold text-slate-900">
          {numberToWords(Math.round(invoice.balance_due || invoice.total_amount))}
        </span>
      </div>

      {/* Bank & Signature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="rounded border border-slate-300 p-2.5 space-y-0.5 text-[10px] sm:text-[11px]">
          <div className="text-[9px] font-bold text-slate-500 border-b border-slate-200 pb-0.5">
            BANK DETAILS FOR RTGS / NEFT REMITTANCE
          </div>
          <div className="pt-0.5">
            Bank Name: <strong>{companyProfile.bank_name || 'HDFC Bank Ltd'}</strong>
          </div>
          <div>
            Account Number: <strong>{companyProfile.acc || '50200012345678'}</strong>
          </div>
          <div>
            IFSC Code: <strong>{companyProfile.bank || 'HDFC0001234'}</strong>
          </div>
        </div>

        {/* Combined 1 Single Image for Stamp & Signature */}
        <div className="rounded border border-slate-300 p-2.5 flex flex-col justify-between text-right text-[10px] sm:text-[11px]">
          <div className="text-[9px] font-bold text-slate-500 border-b border-slate-200 pb-0.5">
            FOR {(companyProfile.name || 'ANORI TRANSPORT SERVICES').toUpperCase()}
          </div>
          <div className="h-14 flex items-center justify-end my-1">
            {companyProfile.stamp_signature_image ? (
              <img
                src={companyProfile.stamp_signature_image}
                alt="Company Stamp &amp; Authorized Signature"
                className="max-h-14 max-w-[200px] object-contain"
              />
            ) : (
              <div className="text-[9px] text-slate-400 italic">
                (Company Stamp &amp; Signature)
              </div>
            )}
          </div>
          <div className="text-[9px] font-bold text-slate-700 border-t border-slate-300 pt-0.5">
            Authorized Signatory
          </div>
        </div>
      </div>

      {/* Terms & Footer */}
      <div className="mt-4 pt-2.5 border-t border-slate-300 text-[8.5px] text-slate-500 space-y-0.5">
        <div>1. Payment must be made within agreed credit terms ({invoice.credit_days} days).</div>
        <div>2. Interest @ 18% p.a. will be charged on overdue payments after due date.</div>
        <div>3. Subject to Mumbai Jurisdiction only. This is a computer-generated tax invoice.</div>
      </div>
    </div>
  );
};
