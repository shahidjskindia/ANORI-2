import React, { useState } from 'react';
import {
  Truck,
  Users,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Check,
  FileCheck,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { FuelType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const MasterDataView: React.FC = () => {
  const {
    companyProfile,
    updateCompanyProfile,
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
    parties,
    addParty,
    updateParty,
    deleteParty,
    expenseMasters,
    addExpenseMaster,
    toggleExpenseMaster,
    deleteExpenseMaster,
  } = useTransport();

  const [activeTab, setActiveTab] = useState<'company' | 'vehicles' | 'drivers' | 'parties' | 'expenses'>('company');

  // Company Profile State
  const [compName, setCompName] = useState(companyProfile.name);
  const [compGst, setCompGst] = useState(companyProfile.gst);
  const [compPan, setCompPan] = useState(companyProfile.pan);
  const [compPhone, setCompPhone] = useState(companyProfile.phone);
  const [compEmail, setCompEmail] = useState(companyProfile.email);
  const [compBankName, setCompBankName] = useState(companyProfile.bank_name);
  const [compAcc, setCompAcc] = useState(companyProfile.acc);
  const [compIfsc, setCompIfsc] = useState(companyProfile.bank);
  const [compAddr1, setCompAddr1] = useState(companyProfile.addr_lines?.[0] || '');
  const [compAddr2, setCompAddr2] = useState(companyProfile.addr_lines?.[1] || '');
  const [compAddr3, setCompAddr3] = useState(companyProfile.addr_lines?.[2] || '');
  const [compSavedSuccess, setCompSavedSuccess] = useState(false);

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehNumber, setVehNumber] = useState('');
  const [vehType, setVehType] = useState<FuelType>('DESIEL');
  const [vehClass, setVehClass] = useState<'COMPANY VEHICLE' | 'OUTSIDE ORGANIZATION VEHICLE'>('COMPANY VEHICLE');
  const [vehDriverAmount, setVehDriverAmount] = useState<number | ''>(1500);

  // Driver Modal State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [drvName, setDrvName] = useState('');
  const [drvMobile, setDrvMobile] = useState('');
  const [drvLicense, setDrvLicense] = useState('');

  // Party Modal State
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [ptyName, setPtyName] = useState('');
  const [ptyGst, setPtyGst] = useState('');
  const [ptyAddr, setPtyAddr] = useState('');
  const [ptyCreditDays, setPtyCreditDays] = useState<number | ''>(0);
  const [ptyCreditLimit, setPtyCreditLimit] = useState<number | ''>(500000);
  const [ptyMobile, setPtyMobile] = useState('');
  const [ptyEmail, setPtyEmail] = useState('');

  // Expense Master Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expName, setExpName] = useState('');
  const [expDefaultAmount, setExpDefaultAmount] = useState<number | ''>(500);
  const [expShowOnInvoice, setExpShowOnInvoice] = useState(true);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const addrLines = [compAddr1, compAddr2, compAddr3].filter(Boolean);
    updateCompanyProfile({
      name: compName,
      gst: compGst,
      pan: compPan,
      phone: compPhone,
      email: compEmail,
      bank_name: compBankName,
      acc: compAcc,
      bank: compIfsc,
      addr: addrLines.join(', '),
      addr_lines: addrLines,
    });
    setCompSavedSuccess(true);
    setTimeout(() => setCompSavedSuccess(false), 2500);
  };

  const handleSingleStampSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateCompanyProfile({ stamp_signature_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Master Data &amp; Profiles
          </h1>
          <p className="text-xs text-slate-500">
            Maintain authoritative records for your company profile, fleet vehicles, drivers, customers, and invoice charges
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('company')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'company'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Company Profile
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Fleet Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('parties')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'parties'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Customers ({parties.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Billable Expenses
          </button>
        </div>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="space-y-4">
          {compSavedSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4" /> Company profile details updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                1. Legal &amp; Communication Details
              </span>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Legal Name *
                  </label>
                  <input
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN Registration No *
                  </label>
                  <input
                    required
                    value={compGst}
                    onChange={(e) => setCompGst(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PAN Card Number *
                  </label>
                  <input
                    required
                    value={compPan}
                    onChange={(e) => setCompPan(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Telephone
                  </label>
                  <input
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Registered Business Address (Printable Lines)
                </label>
                <input
                  placeholder="Address Line 1"
                  value={compAddr1}
                  onChange={(e) => setCompAddr1(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  placeholder="Address Line 2"
                  value={compAddr2}
                  onChange={(e) => setCompAddr2(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  placeholder="Address Line 3"
                  value={compAddr3}
                  onChange={(e) => setCompAddr3(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  2. Remittance Bank Account (Printed on Invoices)
                </span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      value={compBankName}
                      onChange={(e) => setCompBankName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Number
                    </label>
                    <input
                      value={compAcc}
                      onChange={(e) => setCompAcc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      value={compIfsc}
                      onChange={(e) => setCompIfsc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                >
                  Save Company Profile
                </button>
              </div>
            </div>

            {/* Stamp & Signature */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                  3. Invoice Stamp &amp; Signature
                </span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  (Single Combined Image)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload <strong>1 combined image</strong> containing both your company rubber stamp and authorized signatory signature. This exact image will be reflected on generated invoices and PDFs.
              </p>

              <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 space-y-3 bg-slate-50/70 dark:bg-slate-800/40 dark:border-slate-700 text-center">
                <div className="h-28 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                  {companyProfile.stamp_signature_image ? (
                    <img
                      src={companyProfile.stamp_signature_image}
                      alt="Company Stamp &amp; Signature"
                      className="h-full max-h-24 w-auto object-contain mx-auto"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <FileCheck className="h-8 w-8 text-slate-300 mx-auto mb-1" />
                      <span className="text-xs text-slate-400 font-medium block">
                        No stamp &amp; signature image uploaded yet
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Stamp &amp; Signature (1 Image)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSingleStampSignatureUpload}
                      className="hidden"
                    />
                  </label>
                  {companyProfile.stamp_signature_image && (
                    <button
                      type="button"
                      onClick={() => updateCompanyProfile({ stamp_signature_image: undefined })}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Supports PNG, JPG, or WEBP (Max 2 MB). Transparent background PNG recommended.
                </span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Fleet Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Fleet &amp; Hired Vehicles
              </h2>
              <span className="text-xs text-slate-500">
                Registered transport trucks, fuel classification &amp; driver allowance baselines
              </span>
            </div>
            <button
              onClick={() => {
                setEditingVehicleId(null);
                setVehNumber('');
                setVehType('DESIEL');
                setVehClass('COMPANY VEHICLE');
                setVehDriverAmount(1500);
                setIsVehicleModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Number</th>
                  <th className="py-2.5 px-3">Fuel Type</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3 text-right">Default Driver Allowance (₹)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {v.number}
                    </td>
                    <td className="py-2.5 px-3">{v.type}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.classification === 'COMPANY VEHICLE'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        }`}
                      >
                        {v.classification}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {formatCurrency(v.driver_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingVehicleId(v.id);
                          setVehNumber(v.number);
                          setVehType(v.type as FuelType);
                          setVehClass(v.classification);
                          setVehDriverAmount(v.driver_amount);
                          setIsVehicleModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 mr-2 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!deleteVehicle(v.id)) {
                            alert('Cannot delete vehicle because it is referenced in existing trips.');
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Drivers Master */}
      {activeTab === 'drivers' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Fleet Drivers</h2>
              <span className="text-xs text-slate-500">
                Driver roster and mobile contacts for dispatch assignment
              </span>
            </div>
            <button
              onClick={() => {
                setEditingDriverId(null);
                setDrvName('');
                setDrvMobile('');
                setDrvLicense('');
                setIsDriverModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Driver</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">Mobile Phone</th>
                  <th className="py-2.5 px-3">License Number</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {d.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{d.mobile}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{d.license_no || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingDriverId(d.id);
                          setDrvName(d.name);
                          setDrvMobile(d.mobile);
                          setDrvLicense(d.license_no || '');
                          setIsDriverModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 mr-2 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!deleteDriver(d.id)) {
                            alert('Cannot delete driver because trips are assigned to this driver.');
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Parties / Customers Master */}
      {activeTab === 'parties' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer Parties (Consignees)
              </h2>
              <span className="text-xs text-slate-500">
                Client directory, GSTIN numbers, billing addresses and agreed credit terms (Default 0 Days)
              </span>
            </div>
            <button
              onClick={() => {
                setEditingPartyId(null);
                setPtyName('');
                setPtyGst('');
                setPtyAddr('');
                setPtyCreditDays(0);
                setPtyCreditLimit(500000);
                setPtyMobile('');
                setPtyEmail('');
                setIsPartyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">Credit Period</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{p.gst || '-'}</td>
                    <td className="py-2.5 px-3 font-semibold font-mono">
                      {p.credit_days === 0 ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
                          0 Days (Immediate)
                        </span>
                      ) : (
                        `${p.credit_days} Days`
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.mobile || p.email || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate">{p.addr || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingPartyId(p.id);
                          setPtyName(p.name);
                          setPtyGst(p.gst || '');
                          setPtyAddr(p.addr || '');
                          setPtyCreditDays(p.credit_days ?? 0);
                          setPtyCreditLimit(p.credit_limit || '');
                          setPtyMobile(p.mobile || '');
                          setPtyEmail(p.email || '');
                          setIsPartyModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 mr-2 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!deleteParty(p.id)) {
                            alert('Cannot delete customer party because trips or invoices are linked to it.');
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Billable Expense Categories */}
      {activeTab === 'expenses' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Billable Expense Categories
              </h2>
              <span className="text-xs text-slate-500">
                Configure which transportation charges can be added to customer tax invoices
              </span>
            </div>
            <button
              onClick={() => {
                setExpName('');
                setExpDefaultAmount(500);
                setExpShowOnInvoice(true);
                setIsExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense Category</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Expense Name</th>
                  <th className="py-2.5 px-3 text-right">Default Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Show on Invoice</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenseMasters.map((em) => (
                  <tr key={em.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {em.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {formatCurrency(em.defaultAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={em.showOnInvoice}
                        onChange={(e) => toggleExpenseMaster(em.id, e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => deleteExpenseMaster(em.id)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!vehNumber.trim()) return;
                if (editingVehicleId) {
                  updateVehicle(editingVehicleId, {
                    number: vehNumber.trim().toUpperCase(),
                    type: vehType,
                    classification: vehClass,
                    driver_amount: Number(vehDriverAmount) || 0,
                  });
                } else {
                  addVehicle({
                    number: vehNumber.trim().toUpperCase(),
                    type: vehType,
                    classification: vehClass,
                    driver_amount: Number(vehDriverAmount) || 0,
                  });
                }
                setIsVehicleModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Number *
                </label>
                <input
                  required
                  placeholder="e.g. MH04MH6475"
                  value={vehNumber}
                  onChange={(e) => setVehNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono uppercase font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fuel Type
                </label>
                <select
                  value={vehType}
                  onChange={(e) => setVehType(e.target.value as FuelType)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="DESIEL">DESIEL</option>
                  <option value="PETRO">PETRO</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Classification
                </label>
                <select
                  value={vehClass}
                  onChange={(e) => setVehClass(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="COMPANY VEHICLE">COMPANY VEHICLE</option>
                  <option value="OUTSIDE ORGANIZATION VEHICLE">OUTSIDE ORGANIZATION VEHICLE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Driver Allowance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={vehDriverAmount}
                  onChange={(e) => setVehDriverAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {editingDriverId ? 'Edit Driver' : 'Add New Driver'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!drvName.trim() || !drvMobile.trim()) return;
                if (editingDriverId) {
                  updateDriver(editingDriverId, {
                    name: drvName.trim(),
                    mobile: drvMobile.trim(),
                    license_no: drvLicense.trim(),
                  });
                } else {
                  addDriver({
                    name: drvName.trim(),
                    mobile: drvMobile.trim(),
                    license_no: drvLicense.trim(),
                  });
                }
                setIsDriverModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  placeholder="e.g. Mukesh Singh"
                  value={drvName}
                  onChange={(e) => setDrvName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  required
                  placeholder="+91 98..."
                  value={drvMobile}
                  onChange={(e) => setDrvMobile(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  License Number
                </label>
                <input
                  placeholder="MH04-..."
                  value={drvLicense}
                  onChange={(e) => setDrvLicense(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Party Modal */}
      {isPartyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {editingPartyId ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ptyName.trim()) return;
                if (editingPartyId) {
                  updateParty(editingPartyId, {
                    name: ptyName.trim(),
                    gst: ptyGst.trim().toUpperCase(),
                    addr: ptyAddr.trim(),
                    credit_days: Number(ptyCreditDays) || 0,
                    credit_limit: Number(ptyCreditLimit) || 0,
                    mobile: ptyMobile.trim(),
                    email: ptyEmail.trim(),
                  });
                } else {
                  addParty({
                    name: ptyName.trim(),
                    gst: ptyGst.trim().toUpperCase(),
                    addr: ptyAddr.trim(),
                    credit_days: Number(ptyCreditDays) || 0,
                    credit_limit: Number(ptyCreditLimit) || 0,
                    mobile: ptyMobile.trim(),
                    email: ptyEmail.trim(),
                  });
                }
                setIsPartyModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Party Name *
                </label>
                <input
                  required
                  placeholder="e.g. Tata Logistics"
                  value={ptyName}
                  onChange={(e) => setPtyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    placeholder="27AABC..."
                    value={ptyGst}
                    onChange={(e) => setPtyGst(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono uppercase focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Period (Days) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ptyCreditDays}
                    onChange={(e) => setPtyCreditDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Default: 0 Days (Immediate)
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Office / Delivery Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, City, PIN..."
                  value={ptyAddr}
                  onChange={(e) => setPtyAddr(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    placeholder="+91..."
                    value={ptyMobile}
                    onChange={(e) => setPtyMobile(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    placeholder="billing@..."
                    value={ptyEmail}
                    onChange={(e) => setPtyEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartyModalOpen(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Master Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Add Expense Category
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!expName.trim()) return;
                addExpenseMaster(expName.trim(), Number(expDefaultAmount) || 0, expShowOnInvoice);
                setIsExpenseModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category Name *
                </label>
                <input
                  required
                  placeholder="e.g. Weighbridge Charges"
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={expDefaultAmount}
                  onChange={(e) => setExpDefaultAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showInvCheck"
                  checked={expShowOnInvoice}
                  onChange={(e) => setExpShowOnInvoice(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="showInvCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Show as selectable on Invoices
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
