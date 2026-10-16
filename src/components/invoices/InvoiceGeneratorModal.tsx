import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Calendar,
  Upload,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react';
import { Trip, InvoiceExpenseLine, TaxType, Invoice } from '../../types';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency, getTodayDate, calculateDueDate } from '../../utils/formatters';
import { InvoiceDocument } from './InvoiceDocument';

interface InvoiceGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoice: Invoice) => void;
}

export const InvoiceGeneratorModal: React.FC<InvoiceGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
}) => {
  const { trips, parties, expenseMasters, companyProfile, updateCompanyProfile, createInvoice } = useTransport();

  const [step, setStep] = useState<1 | 2>(1);

  // Available trips for invoicing: completed and pending
  const availableTrips = useMemo(
    () => trips.filter((t) => t.status === 'completed' && t.invoice_status === 'pending'),
    [trips]
  );

  // Ordered list of trip IDs chosen for the invoice
  const [orderedTripIds, setOrderedTripIds] = useState<string[]>([]);
  const [leftCheckedIds, setLeftCheckedIds] = useState<Set<string>>(new Set());
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');

  // AMENDMENT #3: Editable Credit Days during invoice preparation (default 0 or loaded from Party)
  const [creditDays, setCreditDays] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState<string>(getTodayDate());

  const [isGst, setIsGst] = useState<boolean>(true);
  const [taxType, setTaxType] = useState<TaxType>('cgst_sgst');

  // Drag and drop hover states
  const [isDragOverRight, setIsDragOverRight] = useState(false);
  const [isDragOverLeft, setIsDragOverLeft] = useState(false);

  // Billable expenses & manual charges
  const [selectedMasterExpenses, setSelectedMasterExpenses] = useState<Record<string, number>>({});
  const [manualCharges, setManualCharges] = useState<{ name: string; amount: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // When party changes, synchronize credit days (defaulting to 0)
  useEffect(() => {
    if (selectedPartyId) {
      const p = parties.find((party) => party.id === selectedPartyId);
      setCreditDays(p?.credit_days ?? 0);
    } else {
      setCreditDays(0);
    }
  }, [selectedPartyId, parties]);

  // Calculated Due Date dynamically derived from invoiceDate + creditDays
  const calculatedDueDate = useMemo(() => {
    return calculateDueDate(invoiceDate, creditDays);
  }, [invoiceDate, creditDays]);

  // Trips in the Left Pool
  const leftPoolTrips = useMemo(() => {
    const selectedSet = new Set(orderedTripIds);
    return availableTrips.filter((t) => {
      if (selectedSet.has(t.id)) return false;
      if (selectedPartyId && t.party_id !== selectedPartyId) return false;
      return true;
    });
  }, [availableTrips, orderedTripIds, selectedPartyId]);

  // Trips in the Right Pool
  const rightPoolTrips = useMemo(() => {
    const map = new Map(trips.map((t) => [t.id, t]));
    return orderedTripIds.map((id) => map.get(id)).filter(Boolean) as Trip[];
  }, [trips, orderedTripIds]);

  const moveTripToRight = (trip: Trip) => {
    if (selectedPartyId && trip.party_id !== selectedPartyId) {
      setErrorMessage('All trips on an invoice must belong to the same customer.');
      return;
    }
    setSelectedPartyId(trip.party_id);
    setOrderedTripIds((prev) => (prev.includes(trip.id) ? prev : [...prev, trip.id]));
    setLeftCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(trip.id);
      return next;
    });
    setErrorMessage('');
  };

  const moveSelectedToRight = () => {
    if (leftCheckedIds.size === 0) return;
    const toMove = leftPoolTrips.filter((t) => leftCheckedIds.has(t.id));
    if (toMove.length === 0) return;
    const targetParty = selectedPartyId || toMove[0].party_id;
    const sameParty = toMove.filter((t) => t.party_id === targetParty);
    if (sameParty.length < toMove.length) {
      setErrorMessage('Selected trips belong to different customers. Only trips for primary customer were moved.');
    } else {
      setErrorMessage('');
    }
    setSelectedPartyId(targetParty);
    const newIds = sameParty.map((t) => t.id).filter((id) => !orderedTripIds.includes(id));
    setOrderedTripIds((prev) => [...prev, ...newIds]);
    setLeftCheckedIds(new Set());
  };

  const moveTripToLeft = (trip: Trip) => {
    setOrderedTripIds((prev) => {
      const next = prev.filter((id) => id !== trip.id);
      if (next.length === 0) {
        setSelectedPartyId('');
      }
      return next;
    });
  };

  const moveAllToRight = () => {
    if (leftPoolTrips.length === 0) return;
    const targetParty = selectedPartyId || leftPoolTrips[0].party_id;
    const eligible = leftPoolTrips.filter((t) => t.party_id === targetParty);
    setSelectedPartyId(targetParty);
    const newIds = eligible.map((t) => t.id).filter((id) => !orderedTripIds.includes(id));
    setOrderedTripIds((prev) => [...prev, ...newIds]);
    setLeftCheckedIds(new Set());
    setErrorMessage('');
  };

  const clearAllFromRight = () => {
    setOrderedTripIds([]);
    setSelectedPartyId('');
    setLeftCheckedIds(new Set());
  };

  const moveRowUp = (index: number) => {
    if (index <= 0) return;
    setOrderedTripIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveRowDown = (index: number) => {
    if (index >= orderedTripIds.length - 1) return;
    setOrderedTripIds((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const toggleLeftChecked = (id: string) => {
    setLeftCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllLeft = () => {
    if (leftCheckedIds.size === leftPoolTrips.length && leftPoolTrips.length > 0) {
      setLeftCheckedIds(new Set());
    } else {
      setLeftCheckedIds(new Set(leftPoolTrips.map((t) => t.id)));
    }
  };

  const handleDragStart = (e: React.DragEvent, tripId: string, origin: 'left' | 'right') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ tripId, origin }));
  };

  const handleDropOnRight = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverRight(false);
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.origin === 'left' && data.tripId) {
        const trip = availableTrips.find((t) => t.id === data.tripId);
        if (trip) moveTripToRight(trip);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropOnLeft = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverLeft(false);
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.origin === 'right' && data.tripId) {
        const trip = trips.find((t) => t.id === data.tripId);
        if (trip) moveTripToLeft(trip);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStampSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateCompanyProfile({ stamp_signature_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const autoAdvanceAmount = useMemo(
    () => rightPoolTrips.reduce((acc, t) => acc + (t.trip_advance_amount || 0), 0),
    [rightPoolTrips]
  );
  const tripFreightSubtotal = useMemo(
    () => rightPoolTrips.reduce((acc, t) => acc + t.freight, 0),
    [rightPoolTrips]
  );

  const compiledExpenseLines: InvoiceExpenseLine[] = useMemo(() => {
    const list: InvoiceExpenseLine[] = [];
    Object.entries(selectedMasterExpenses).forEach(([masterId, amount]) => {
      if (amount > 0) {
        const item = expenseMasters.find((em) => em.id === masterId);
        if (item) list.push({ masterId, name: item.name, amount });
      }
    });
    manualCharges.forEach((mc) => {
      if (mc.name.trim() && mc.amount > 0) {
        list.push({ name: mc.name.trim(), amount: mc.amount, manual: true });
      }
    });
    return list;
  }, [selectedMasterExpenses, manualCharges, expenseMasters]);

  const expensesSubtotal = useMemo(
    () => compiledExpenseLines.reduce((acc, e) => acc + e.amount, 0),
    [compiledExpenseLines]
  );
  const subtotal = tripFreightSubtotal + expensesSubtotal;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (isGst) {
    if (taxType === 'cgst_sgst') {
      cgst = Math.round(subtotal * 0.09 * 100) / 100;
      sgst = Math.round(subtotal * 0.09 * 100) / 100;
    } else if (taxType === 'igst') {
      igst = Math.round(subtotal * 0.18 * 100) / 100;
    }
  }

  const totalAmount = Math.round((subtotal + cgst + sgst + igst) * 100) / 100;
  const balanceDue = Math.max(0, Math.round((totalAmount - autoAdvanceAmount) * 100) / 100);

  // AMENDMENT #3: Build draft invoice with editable Credit Days & Due Date
  const draftInvoice: Invoice | null = useMemo(() => {
    if (!rightPoolTrips.length) return null;
    const party = parties.find((p) => p.id === selectedPartyId);
    const effectiveCreditDays = Math.max(0, creditDays || 0);

    return {
      id: 'draft-preview',
      invoice_no: 'DRAFT / PREVIEW',
      date: invoiceDate,
      due_date: calculatedDueDate,
      credit_days: effectiveCreditDays,
      party_id: party?.id || selectedPartyId,
      party_name: party?.name || rightPoolTrips[0].party_name,
      party_gst: party?.gst,
      party_addr: party?.addr,
      party_mobile: party?.mobile,
      trip_ids: rightPoolTrips.map((t) => t.id),
      trip_count: rightPoolTrips.length,
      trips_data: rightPoolTrips,
      subtotal,
      is_gst: isGst,
      tax_type: isGst ? taxType : 'none',
      cgst,
      sgst,
      igst,
      total_amount: totalAmount,
      advance: autoAdvanceAmount,
      balance_due: balanceDue,
      paid_amount: autoAdvanceAmount,
      status: 'draft',
      expense_lines: compiledExpenseLines,
      payments: [],
    };
  }, [
    rightPoolTrips,
    selectedPartyId,
    parties,
    invoiceDate,
    creditDays,
    calculatedDueDate,
    subtotal,
    isGst,
    taxType,
    cgst,
    sgst,
    igst,
    totalAmount,
    autoAdvanceAmount,
    balanceDue,
    compiledExpenseLines,
  ]);

  const handleProceedToPreview = () => {
    if (rightPoolTrips.length === 0) {
      setErrorMessage('Please move at least one trip from the Left panel to the Right panel.');
      return;
    }
    setStep(2);
  };

  const handleFinalizeInvoice = () => {
    const created = createInvoice(
      rightPoolTrips,
      isGst,
      isGst ? taxType : 'none',
      compiledExpenseLines,
      creditDays
    );
    if (created) {
      onInvoiceCreated(created);
      onClose();
    }
  };

  const handleAddManualCharge = () => {
    setManualCharges((prev) => [...prev, { name: '', amount: 0 }]);
  };

  const handleRemoveManualCharge = (idx: number) => {
    setManualCharges((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleManualChargeChange = (idx: number, field: 'name' | 'amount', val: any) => {
    setManualCharges((prev) =>
      prev.map((mc, i) => (i === idx ? { ...mc, [field]: val } : mc))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Step {step} of 2
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {step === 1 ? 'Generate New Tax Invoice' : 'Review & Verify Invoice Preview'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {step === 1
                ? 'Select trip rows, configure editable Credit Days (calculates Due Date), and review stamp & signature'
                : 'Inspect the compact, professional A4 printable invoice layout before final generation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Trip Selection: Dual-Panel Transfer List */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      1. Trip Selection: Move Rows From Left (Available) to Right (Invoiced)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Drag &amp; drop or click Move)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {leftCheckedIds.size > 0 && (
                      <button
                        type="button"
                        onClick={moveSelectedToRight}
                        className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
                      >
                        Move Selected to Right ({leftCheckedIds.size}) →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={moveAllToRight}
                      disabled={leftPoolTrips.length === 0}
                      className="text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-40 cursor-pointer"
                    >
                      Move All to Right →
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllFromRight}
                      disabled={rightPoolTrips.length === 0}
                      className="text-[11px] font-bold text-slate-500 hover:underline disabled:opacity-40 cursor-pointer"
                    >
                      ← Clear Right
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left Column: Available Completed Trips */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverLeft(true);
                    }}
                    onDragLeave={() => setIsDragOverLeft(false)}
                    onDrop={handleDropOnLeft}
                    className={`rounded-xl border p-3 flex flex-col transition-all ${
                      isDragOverLeft
                        ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400'
                        : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleSelectAllLeft}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Select all on left"
                        >
                          {leftCheckedIds.size === leftPoolTrips.length && leftPoolTrips.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <span>Available Trips (Left)</span>
                      </div>
                      <span className="font-mono text-slate-500">{leftPoolTrips.length} available</span>
                    </div>

                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto flex-1 pr-1">
                      {leftPoolTrips.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-400">
                          No pending trips available on Left.
                        </div>
                      ) : (
                        leftPoolTrips.map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id, 'left')}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800 cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={leftCheckedIds.has(t.id)}
                                onChange={() => toggleLeftChecked(t.id)}
                                className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                                    {t.trip_no}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">{t.date}</span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                                  {t.party_name || t.party_manual}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {t.from} → {t.to} ({t.vehicle_number || t.vehicle_manual})
                                </div>
                                <div className="text-[11px] font-mono mt-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(t.freight)}
                                  </span>
                                  {t.trip_advance_amount > 0 && (
                                    <span className="text-amber-700 dark:text-amber-400 ml-2">
                                      (Adv: {formatCurrency(t.trip_advance_amount)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => moveTripToRight(t)}
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
                              title="Move this trip to Right (Include in Invoice)"
                            >
                              <span>Move</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Selected Trips For Invoice */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverRight(true);
                    }}
                    onDragLeave={() => setIsDragOverRight(false)}
                    onDrop={handleDropOnRight}
                    className={`rounded-xl border p-3 flex flex-col transition-all ${
                      isDragOverRight
                        ? 'border-emerald-500 bg-emerald-50/40 dark:border-emerald-400'
                        : 'border-blue-200 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/10'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-900 dark:text-blue-300">
                      <span>Selected for Invoice (Right)</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                        {rightPoolTrips.length} trips ({formatCurrency(tripFreightSubtotal)})
                      </span>
                    </div>

                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto flex-1 pr-1">
                      {rightPoolTrips.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-400 italic">
                          Click "Move →", check boxes, or drag trips across from Left to Right here.
                        </div>
                      ) : (
                        rightPoolTrips.map((t, idx) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id, 'right')}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-blue-300 bg-white shadow-sm dark:border-blue-800 dark:bg-slate-800 cursor-grab active:cursor-grabbing"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                                  #{idx + 1} {t.trip_no}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">{t.date}</span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                                {t.party_name || t.party_manual}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {t.from} → {t.to} ({t.vehicle_number || t.vehicle_manual})
                              </div>
                              <div className="text-[11px] font-mono mt-0.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(t.freight)}
                                </span>
                                {t.trip_advance_amount > 0 && (
                                  <span className="text-amber-700 dark:text-amber-400 ml-2">
                                    (Adv: -{formatCurrency(t.trip_advance_amount)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              <div className="flex flex-col mr-1">
                                <button
                                  type="button"
                                  onClick={() => moveRowUp(idx)}
                                  disabled={idx === 0}
                                  className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                                  title="Move row up"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveRowDown(idx)}
                                  disabled={idx === rightPoolTrips.length - 1}
                                  className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                                  title="Move row down"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => moveTripToLeft(t)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                                title="Move back to Left (Remove from Invoice)"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AMENDMENT #3: Editable Credit Days & Due Date Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Credit Period & Due Date Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      2. Credit Days &amp; Due Date (Editable)
                    </span>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {creditDays === 0 ? 'Default: 0 Days (Immediate)' : `${creditDays} Days Credit`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enter credit days granted for this invoice. Due date is calculated automatically from Invoice Date ({invoiceDate}) plus credit days.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Credit Days *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={creditDays}
                        onChange={(e) => setCreditDays(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Calculated Due Date
                      </label>
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-mono font-bold text-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span>{calculatedDueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stamp & Signature Image (1 Combined Image) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      3. Invoice Stamp &amp; Signature
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      (1 Combined Image)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Company rubber stamp and authorized signature printed on invoices and PDFs.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-12 w-28 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden dark:border-slate-700 dark:bg-slate-800 shrink-0">
                      {companyProfile.stamp_signature_image ? (
                        <img
                          src={companyProfile.stamp_signature_image}
                          alt="Stamp &amp; Signature"
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-400 text-center px-1">
                          No image
                        </span>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{companyProfile.stamp_signature_image ? 'Change Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStampSignatureUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Billable Expenses */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  4. Billable Transportation Charges
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expenseMasters
                    .filter((em) => em.showOnInvoice && em.active)
                    .map((em) => {
                      const currentAmt = selectedMasterExpenses[em.id] || 0;
                      const isSelected = currentAmt > 0;
                      return (
                        <div
                          key={em.id}
                          className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                            isSelected
                              ? 'border-blue-400 bg-blue-50/40 dark:border-blue-700 dark:bg-blue-950/20'
                              : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedMasterExpenses((prev) => ({
                                  ...prev,
                                  [em.id]: e.target.checked ? em.defaultAmount || 500 : 0,
                                }));
                              }}
                              className="h-3.5 w-3.5 rounded text-blue-600"
                            />
                            <span>{em.name}</span>
                          </label>
                          <div className="w-28 relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              disabled={!isSelected}
                              value={currentAmt || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSelectedMasterExpenses((prev) => ({
                                  ...prev,
                                  [em.id]: val,
                                }));
                              }}
                              className="w-full rounded border border-slate-200 bg-white pl-6 pr-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Additional Manual Charges */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Ad-hoc Manual Charges
                    </span>
                    <button
                      type="button"
                      onClick={handleAddManualCharge}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Charge
                    </button>
                  </div>
                  <div className="space-y-2">
                    {manualCharges.map((mc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          placeholder="Charge description (e.g. Detention at Kalamboli)"
                          value={mc.name}
                          onChange={(e) => handleManualChargeChange(idx, 'name', e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                        />
                        <div className="w-32 relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount"
                            value={mc.amount || ''}
                            onChange={(e) =>
                              handleManualChargeChange(idx, 'amount', Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-slate-200 pl-6 pr-3 py-1.5 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveManualCharge(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Taxes & Advances */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  5. Taxes &amp; Advance Reconciliation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Invoice Type
                    </label>
                    <select
                      value={isGst ? 'gst' : 'nongst'}
                      onChange={(e) => setIsGst(e.target.value === 'gst')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="gst">GST Tax Invoice (18%)</option>
                      <option value="nongst">Non-GST Commercial Invoice</option>
                    </select>
                  </div>
                  {isGst && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tax Mechanism
                      </label>
                      <select
                        value={taxType}
                        onChange={(e) => setTaxType(e.target.value as TaxType)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="cgst_sgst">CGST 9% + SGST 9% (Intra-state)</option>
                        <option value="igst">IGST 18% (Inter-state)</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Trip Advance Received (₹)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(autoAdvanceAmount)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono font-bold text-amber-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
                    />
                    <span className="text-[10px] text-slate-400">
                      Auto-summed from selected trips
                    </span>
                  </div>
                </div>

                {/* Real-time Summary Box */}
                <div className="flex flex-wrap items-center justify-between rounded-lg bg-white p-3 border border-slate-200 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
                  <div>
                    Subtotal: <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  {isGst && (
                    <div>
                      Tax (18%):{' '}
                      <span className="font-mono">{formatCurrency(cgst + sgst + igst)}</span>
                    </div>
                  )}
                  <div>
                    Total Amount: <span className="font-mono">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="text-blue-700 dark:text-blue-400">
                    Net Balance Due:{' '}
                    <span className="font-mono text-sm">{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Step 2: Live A4 Tax Invoice Preview
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block">
                    Compliant A4 Tax Invoice Format Preview
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Credit Terms: <strong>{creditDays} Days (Due: {calculatedDueDate})</strong> | NET BALANCE PAYABLE displayed in white
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300 cursor-pointer"
                >
                  ← Edit Selections
                </button>
              </div>

              {draftInvoice && (
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-100 dark:bg-slate-950 overflow-x-auto shadow-inner">
                  <InvoiceDocument
                    invoice={draftInvoice}
                    companyProfile={companyProfile}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleProceedToPreview}
                disabled={rightPoolTrips.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 cursor-pointer"
              >
                <span>Proceed to A4 Preview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalizeInvoice}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Confirm &amp; Issue Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
