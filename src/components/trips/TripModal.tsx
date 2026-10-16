import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Truck, Calendar, MapPin, User, IndianRupee, FileText, Building2, AlertCircle } from 'lucide-react';
import { Trip, TripExpense, VehicleClassification } from '../../types';
import { useTransport } from '../../store/TransportContext';
import { getTodayDate } from '../../utils/formatters';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTrip?: Trip | null;
}

export const TripModal: React.FC<TripModalProps> = ({ isOpen, onClose, editTrip }) => {
  const { vehicles, drivers, parties, vendors, expenseMasters, addTrip, updateTrip } = useTransport();

  const [date, setDate] = useState(getTodayDate());
  const [vehicleText, setVehicleText] = useState('');
  const [driverText, setDriverText] = useState('');
  const [partyText, setPartyText] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [freight, setFreight] = useState<number | ''>('');
  const [tripAdvance, setTripAdvance] = useState<number | ''>(0);
  const [driverAmount, setDriverAmount] = useState<number | ''>(0);
  const [vehicleClassification, setVehicleClassification] = useState<VehicleClassification>('company');

  // Outside Vehicle fields
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorCost, setVendorCost] = useState<number | ''>('');
  const [vendorAdvance, setVendorAdvance] = useState<number | ''>(0);

  const [tripAdvice, setTripAdvice] = useState('');
  const [notes, setNotes] = useState('');
  const [expenses, setExpenses] = useState<TripExpense[]>([
    { type: 'Diesel', amount: 0, note: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoClassifiedNotification, setAutoClassifiedNotification] = useState<string | null>(null);

  // Ref to Section 3 for smooth automatic navigation
  const section3Ref = useRef<HTMLDivElement>(null);
  const lastClassifiedVehicleRef = useRef<string>('');

  // Populate data when editing
  useEffect(() => {
    if (editTrip) {
      setDate(editTrip.date);
      setVehicleText(editTrip.vehicle_number || editTrip.vehicle_manual || '');
      setDriverText(editTrip.driver_name || editTrip.driver_manual || '');
      setPartyText(editTrip.party_name || editTrip.party_manual || '');
      setFrom(editTrip.from);
      setTo(editTrip.to);
      setFreight(editTrip.freight);
      setTripAdvance(editTrip.trip_advance_amount || 0);
      setDriverAmount(editTrip.driver_amount || 0);
      setVehicleClassification(editTrip.vehicle_classification || 'company');
      setVendorName(editTrip.vendor_name || editTrip.vendor_manual || '');
      setVendorContact(editTrip.vendor_contact || '');
      setVendorCost(editTrip.vendor_cost || '');
      setVendorAdvance(editTrip.vendor_advance || 0);
      setTripAdvice(editTrip.trip_advice || '');
      setNotes(editTrip.notes || '');
      setExpenses(editTrip.expenses?.length ? editTrip.expenses : [{ type: 'Diesel', amount: 0, note: '' }]);
      lastClassifiedVehicleRef.current = (editTrip.vehicle_number || editTrip.vehicle_manual || '').trim().toUpperCase();
    } else {
      setDate(getTodayDate());
      setVehicleText('');
      setDriverText('');
      setPartyText('');
      setFrom('');
      setTo('');
      setFreight('');
      setTripAdvance(0);
      setDriverAmount(0);
      setVehicleClassification('company');
      setVendorName('');
      setVendorContact('');
      setVendorCost('');
      setVendorAdvance(0);
      setTripAdvice('');
      setNotes('');
      setExpenses([{ type: 'Diesel', amount: 0, note: '' }]);
      lastClassifiedVehicleRef.current = '';
    }
    setErrorMsg('');
    setAutoClassifiedNotification(null);
  }, [editTrip, isOpen]);

  // AMENDMENT #4: Automatic Outside-Organization Vehicle Detection & Navigation
  const handleVehicleChange = (val: string) => {
    setVehicleText(val);
    const normalized = val.trim().toUpperCase();
    if (!normalized) {
      setAutoClassifiedNotification(null);
      return;
    }

    const matched = vehicles.find(
      (v) => v.number.trim().toUpperCase() === normalized
    );

    if (matched) {
      if (matched.classification === 'OUTSIDE ORGANIZATION VEHICLE') {
        // Detect outside organization vehicle
        setVehicleClassification('outside');

        // Prevent repeated navigation loop for the same vehicle
        if (lastClassifiedVehicleRef.current !== normalized) {
          lastClassifiedVehicleRef.current = normalized;
          setAutoClassifiedNotification(`Outside Vehicle detected (${normalized}). Navigated to Section 3: Vendor Hire Details.`);

          // Smoothly scroll to Section 3 without submitting form
          setTimeout(() => {
            section3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        }
      } else {
        // Company vehicle: do NOT trigger navigation
        setVehicleClassification('company');
        lastClassifiedVehicleRef.current = normalized;
        setAutoClassifiedNotification(null);
        if (matched.driver_amount && !driverAmount) {
          setDriverAmount(matched.driver_amount);
        }
      }
    }
  };

  const handleAddExpenseRow = () => {
    setExpenses((prev) => [...prev, { type: 'Toll', amount: 0, note: '' }]);
  };

  const handleRemoveExpenseRow = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExpenseChange = (index: number, field: keyof TripExpense, val: any) => {
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: val } : e))
    );
  };

  const freightNum = Number(freight) || 0;
  const totalExpenseNum = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const vendorCostNum = vehicleClassification === 'outside' ? Number(vendorCost) || 0 : 0;
  const estimatedProfit = freightNum - totalExpenseNum - vendorCostNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleText.trim() || !driverText.trim() || !partyText.trim() || !from.trim() || !to.trim()) {
      setErrorMsg('Please fill in Vehicle, Driver, Customer, and From/To locations.');
      return;
    }
    if (!freight || Number(freight) <= 0) {
      setErrorMsg('Freight amount must be greater than zero.');
      return;
    }
    if (vehicleClassification === 'outside' && (!vendorName.trim() || !vendorCost || Number(vendorCost) <= 0)) {
      setErrorMsg('Please specify Vendor Name and Vehicle Hire Cost for Outside Vehicles.');
      return;
    }

    const matchedVehicle = vehicles.find(
      (v) => v.number.trim().toUpperCase() === vehicleText.trim().toUpperCase()
    );
    const matchedDriver = drivers.find(
      (d) => d.name.trim().toLowerCase() === driverText.trim().toLowerCase()
    );
    const matchedParty = parties.find(
      (p) => p.name.trim().toLowerCase() === partyText.trim().toLowerCase()
    );
    const matchedVendor = vendors.find(
      (v) => v.name.trim().toLowerCase() === vendorName.trim().toLowerCase()
    );

    const filteredExpenses = expenses.filter((e) => e.type && Number(e.amount) > 0);

    const payload = {
      date,
      vehicle_id: matchedVehicle?.id || 'v-custom',
      vehicle_number: vehicleText.trim().toUpperCase(),
      vehicle_manual: matchedVehicle ? undefined : vehicleText.trim().toUpperCase(),
      vehicle_classification: vehicleClassification,
      driver_id: matchedDriver?.id || 'd-custom',
      driver_name: driverText.trim(),
      driver_manual: matchedDriver ? undefined : driverText.trim(),
      driver_amount: Number(driverAmount) || 0,
      party_id: matchedParty?.id || 'p-custom',
      party_name: partyText.trim(),
      party_manual: matchedParty ? undefined : partyText.trim(),
      from: from.trim(),
      to: to.trim(),
      freight: Number(freight),
      trip_advance_amount: Number(tripAdvance) || 0,
      expenses: filteredExpenses,
      trip_advice: tripAdvice.trim(),
      notes: notes.trim(),
      status: 'completed' as const,
      vendor_id: matchedVendor?.id,
      vendor_name: vendorName.trim(),
      vendor_manual: matchedVendor ? undefined : vendorName.trim(),
      vendor_contact: vendorContact.trim(),
      vendor_cost: vehicleClassification === 'outside' ? Number(vendorCost) || 0 : undefined,
      vendor_advance: vehicleClassification === 'outside' ? Number(vendorAdvance) || 0 : undefined,
    };

    if (editTrip) {
      updateTrip(editTrip.id, payload);
    } else {
      addTrip(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editTrip ? 'Edit Trip Record' : 'Create New Trip Dispatch'}
              </h2>
              <p className="text-xs text-slate-500">
                Log road freight, vehicle allocation, advance amounts &amp; direct trip expenses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {autoClassifiedNotification && (
            <div className="rounded-lg bg-indigo-50 p-3 text-xs font-semibold text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{autoClassifiedNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoClassifiedNotification(null)}
                className="text-indigo-500 hover:text-indigo-800 text-[11px] font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Section 1: Trip Core Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/20 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              1. Date, Fleet &amp; Customer Assignment
            </span>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trip Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Number *
                </label>
                <input
                  list="vehicleOptionsList"
                  required
                  placeholder="e.g. MH12AB1234"
                  value={vehicleText}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <datalist id="vehicleOptionsList">
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.number}>
                      {v.classification} ({v.type})
                    </option>
                  ))}
                </datalist>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Outside vehicles automatically switch &amp; navigate to Vendor Hire section
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Name *
                </label>
                <input
                  list="driverOptionsList"
                  required
                  placeholder="e.g. Mukesh Singh"
                  value={driverText}
                  onChange={(e) => setDriverText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <datalist id="driverOptionsList">
                  {drivers.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.mobile}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Party / Customer *
                </label>
                <input
                  list="partyOptionsList"
                  required
                  placeholder="e.g. Tata Logistics"
                  value={partyText}
                  onChange={(e) => setPartyText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <datalist id="partyOptionsList">
                  {parties.map((p) => (
                    <option key={p.id} value={p.name}>
                      GST: {p.gst || 'None'} | Credit: {p.credit_days} days
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  From (POL / Origin) *
                </label>
                <input
                  required
                  placeholder="e.g. JNPT Port, Nhava Sheva"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  To (POD / Destination) *
                </label>
                <input
                  required
                  placeholder="e.g. Chakan MIDC, Pune"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Advances */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/20 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              2. Freight &amp; Advances
            </span>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Freight Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={freight}
                    onChange={(e) => setFreight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trip Advance Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={tripAdvance}
                    onChange={(e) => setTripAdvance(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Auto-deducted on invoice</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Allowance / Advance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="1500"
                    value={driverAmount}
                    onChange={(e) => setDriverAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Auto-synced to Driver Ledger</span>
              </div>
            </div>
          </div>

          {/* Section 3: Vehicle Classification & Vendor Hire (AMENDMENT #4) */}
          <div
            ref={section3Ref}
            className={`rounded-xl border p-4 space-y-4 transition-all duration-300 ${
              vehicleClassification === 'outside'
                ? 'border-indigo-300 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20 ring-1 ring-indigo-400/30'
                : 'border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                3. Vehicle Classification &amp; Vendor Hire
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleClassification('company')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    vehicleClassification === 'company'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Company Fleet
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleClassification('outside')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    vehicleClassification === 'outside'
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Outside Organization Vehicle
                </button>
              </div>
            </div>

            {/* Outside Vehicle Vendor Fields */}
            {vehicleClassification === 'outside' && (
              <div className="rounded-lg border border-indigo-200 bg-white p-3.5 dark:border-indigo-900/60 dark:bg-slate-850 space-y-3 animate-in fade-in">
                <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                  Outside Vehicle: <span className="font-mono text-indigo-700 dark:text-indigo-400">{vehicleText || 'Not specified'}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      Owner / Vendor Name *
                    </label>
                    <input
                      list="vendorOptionsList"
                      required={vehicleClassification === 'outside'}
                      placeholder="e.g. Bhavani Roadlines"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <datalist id="vendorOptionsList">
                      {vendors.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.mobile}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      Vendor Hire Cost (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required={vehicleClassification === 'outside'}
                      placeholder="e.g. 21000"
                      value={vendorCost}
                      onChange={(e) => setVendorCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      Vendor Advance Paid (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="5000"
                      value={vendorAdvance}
                      onChange={(e) => setVendorAdvance(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      Vendor Contact
                    </label>
                    <input
                      placeholder="+91 98..."
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Balance payable to vendor:{' '}
                  <strong className="font-mono">
                    ₹ {Math.max(0, (Number(vendorCost) || 0) - (Number(vendorAdvance) || 0))}
                  </strong>{' '}
                  (automatically tracked in Vendor Settlements).
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Operating Expenses */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                4. Direct Trip Expenses (Diesel, Toll, Loading)
              </span>
              <button
                type="button"
                onClick={handleAddExpenseRow}
                className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Expense
              </button>
            </div>

            <div className="space-y-2">
              {expenses.map((exp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-1/3">
                    <input
                      list="expenseMastersList"
                      placeholder="Expense Type"
                      value={exp.type}
                      onChange={(e) => handleExpenseChange(idx, 'type', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <datalist id="expenseMastersList">
                      {expenseMasters.map((em) => (
                        <option key={em.id} value={em.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="w-1/4 relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount"
                      value={exp.amount || ''}
                      onChange={(e) => handleExpenseChange(idx, 'amount', Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      placeholder="Notes / Pump / Toll Plaza"
                      value={exp.note || ''}
                      onChange={(e) => handleExpenseChange(idx, 'note', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  {expenses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-100 p-2.5 text-xs font-semibold dark:bg-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                Total Expenses: <span className="font-mono text-red-600">₹ {totalExpenseNum}</span>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Net Estimated Margin:{' '}
                <span
                  className={`font-mono font-bold ${
                    estimatedProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  ₹ {estimatedProfit}
                </span>
              </span>
            </div>
          </div>

          {/* Section 5: Trip Advice & Instructions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Trip Advice &amp; Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Driver instructions, gate loading pass, consignee contacts..."
                value={tripAdvice}
                onChange={(e) => setTripAdvice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                General Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Cargo weight, container no, customer special terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Modal Actions */}
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
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
            >
              {editTrip ? 'Update Trip Record' : 'Save Trip Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
