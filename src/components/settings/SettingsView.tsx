import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Info,
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  Server,
  Layers,
  X,
  Loader2,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { FullERPDataset } from '../../utils/sqliteDb';

export const SettingsView: React.FC = () => {
  const {
    trips,
    invoices,
    vehicles,
    drivers,
    parties,
    vendors,
    driverSettlements,
    vendorSettlements,
    exportToJSON,
    exportToExcel,
    exportToCSV,
    exportToSQLite,
    importFromData,
    importFromSQLiteFile,
    applyImportedDataset,
    resetToDefaults,
    adminCredentials,
    updateAdminCredentials,
    resetAdminCredentials,
    companyProfile,
    updateCompanyProfile,
  } = useTransport();

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    msg: string;
  }>({ type: null, msg: '' });

  const [isExportingSqlite, setIsExportingSqlite] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Confirmation Modal State before applying imported data (AMENDMENT #5)
  const [pendingImportData, setPendingImportData] = useState<{
    source: 'JSON' | 'SQLite';
    dataset: FullERPDataset;
    summary: Record<string, number>;
  } | null>(null);

  // Security & Credentials State
  const currentUsername = adminCredentials?.username || 'admin';
  const currentPassword = adminCredentials?.password || 'admin123';
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [credStatus, setCredStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  useEffect(() => {
    if (adminCredentials?.username) {
      setNewUsername(adminCredentials.username);
    }
  }, [adminCredentials?.username]);

  const copyToClipboard = (text: string, field: 'username' | 'password') => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setCredStatus({ type: 'error', msg: 'Username cannot be empty.' });
      return;
    }
    if (!newPassword) {
      setCredStatus({ type: 'error', msg: 'Please enter a new password.' });
      return;
    }
    if (newPassword.length < 4) {
      setCredStatus({ type: 'error', msg: 'Password must be at least 4 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }
    const result = updateAdminCredentials(newUsername, newPassword);
    if (result.success) {
      setCredStatus({ type: 'success', msg: result.message });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setCredStatus({ type: null, msg: '' }), 4000);
    } else {
      setCredStatus({ type: 'error', msg: result.message });
    }
  };

  const handleResetCredentialsToDefault = () => {
    if (confirm('Reset administrator login credentials to default (admin / admin123)?')) {
      resetAdminCredentials();
      setNewUsername('admin');
      setNewPassword('');
      setConfirmPassword('');
      setCredStatus({ type: 'success', msg: 'Credentials reset to default (admin / admin123).' });
      setTimeout(() => setCredStatus({ type: null, msg: '' }), 4000);
    }
  };

  // AMENDMENT #5: SQLite Export
  const handleExportSQLite = async () => {
    try {
      setIsExportingSqlite(true);
      await exportToSQLite();
      setImportStatus({ type: 'success', msg: 'SQLite Database (.sqlite) exported successfully.' });
      setTimeout(() => setImportStatus({ type: null, msg: '' }), 4000);
    } catch (err: any) {
      setImportStatus({ type: 'error', msg: `SQLite export failed: ${err?.message || 'Unknown error'}` });
    } finally {
      setIsExportingSqlite(false);
    }
  };

  // Handle JSON File Selection
  const handleJSONFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const tables = parsed.tables || parsed;

        if (!tables || typeof tables !== 'object') {
          throw new Error('Invalid JSON structure: Root object missing.');
        }

        const summary = {
          trips: Array.isArray(tables.trips) ? tables.trips.length : 0,
          invoices: Array.isArray(tables.invoices) ? tables.invoices.length : 0,
          vehicles: Array.isArray(tables.vehicles) ? tables.vehicles.length : 0,
          drivers: Array.isArray(tables.drivers) ? tables.drivers.length : 0,
          parties: Array.isArray(tables.parties) ? tables.parties.length : 0,
          vendors: Array.isArray(tables.vendors) ? tables.vendors.length : 0,
        };

        setPendingImportData({
          source: 'JSON',
          dataset: tables as FullERPDataset,
          summary,
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          msg: `Failed to read JSON backup: ${err?.message || 'Invalid JSON format'}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // AMENDMENT #5: Handle SQLite File Selection
  const handleSQLiteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const result = await importFromSQLiteFile(buffer);

      if (!result.success || !result.data) {
        setImportStatus({
          type: 'error',
          msg: result.error || 'Failed to read SQLite file. File may be corrupted or not a valid database.',
        });
        return;
      }

      setPendingImportData({
        source: 'SQLite',
        dataset: result.data,
        summary: result.summary || {},
      });
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        msg: `Failed to process SQLite database: ${err?.message || 'Corrupted file'}`,
      });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // AMENDMENT #5: Apply confirmed import safely
  const handleConfirmImport = (mode: 'replace' | 'merge') => {
    if (!pendingImportData) return;

    try {
      if (mode === 'replace') {
        applyImportedDataset(pendingImportData.dataset);
        setImportStatus({
          type: 'success',
          msg: `Data restored successfully from ${pendingImportData.source} database. All records reconciled.`,
        });
      } else {
        // Safe Merge mode: prevent duplicate IDs while adding new records
        const d = pendingImportData.dataset;
        const currentTripsMap = new Map(trips.map((t) => [t.id, t]));
        const mergedTrips = [...trips];
        (d.trips || []).forEach((t) => {
          if (!currentTripsMap.has(t.id)) mergedTrips.push(t);
        });

        const currentInvoicesMap = new Map(invoices.map((i) => [i.id, i]));
        const mergedInvoices = [...invoices];
        (d.invoices || []).forEach((inv) => {
          if (!currentInvoicesMap.has(inv.id)) mergedInvoices.push(inv);
        });

        const currentVehiclesMap = new Map(vehicles.map((v) => [v.number.toUpperCase(), v]));
        const mergedVehicles = [...vehicles];
        (d.vehicles || []).forEach((v) => {
          if (!currentVehiclesMap.has(v.number.toUpperCase())) mergedVehicles.push(v);
        });

        const currentPartiesMap = new Map(parties.map((p) => [p.name.toLowerCase(), p]));
        const mergedParties = [...parties];
        (d.parties || []).forEach((p) => {
          if (!currentPartiesMap.has(p.name.toLowerCase())) mergedParties.push(p);
        });

        applyImportedDataset({
          ...d,
          trips: mergedTrips,
          invoices: mergedInvoices,
          vehicles: mergedVehicles,
          parties: mergedParties,
        });

        setImportStatus({
          type: 'success',
          msg: `Data merged successfully without duplicates from ${pendingImportData.source}.`,
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        msg: `Import failed: ${err?.message || 'Error reconciling data'}`,
      });
    } finally {
      setPendingImportData(null);
    }
  };

  const handleResetConfirmation = () => {
    if (
      confirm(
        'Are you sure you want to restore initial default sample data?\nAll current operational records will be reset to default fleet data.'
      )
    ) {
      resetToDefaults();
      setImportStatus({ type: 'success', msg: 'System reset to default fleet data.' });
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            System Settings &amp; Data Protection
          </h1>
          <p className="text-xs text-slate-500">
            Export full fleet snapshots, backup to SQLite Database, or restore saved operational records
          </p>
        </div>
      </div>

      {importStatus.type && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
            importStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{importStatus.msg}</span>
        </div>
      )}

      {/* AMENDMENT #5: Arranged exactly as specified:
          1. Full JSON Backup — Download JSON
          2. Multi-Sheet Excel — Download XLSX
          3. Trips Raw CSV — Download CSV
          4. SQLite Database — Download SQLite
          5. Import Data — Import button (placed directly below the download options)
      */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-blue-200" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              EXPORT FLEET &amp; ACCOUNTS DATA
            </h2>
          </div>
          <p className="text-xs text-blue-100 mt-0.5">
            Complete database backups with JSON, Excel, CSV, and full SQLite WebAssembly support
          </p>
        </div>

        <div className="p-5 space-y-6">
          {/* 4 Download Options Arranged as Required */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Full JSON Backup */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Full JSON Backup</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Export complete database snapshot (Trips, Invoices, Ledgers, Masters) for secure offline storage.
                </p>
              </div>
              <button
                type="button"
                onClick={exportToJSON}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .JSON</span>
              </button>
            </div>

            {/* 2. Multi-Sheet Excel */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Multi-Sheet Excel</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Export formatted workbook with separate sheets for Trips, Invoices, Driver Ledgers &amp; Vendor payouts.
                </p>
              </div>
              <button
                type="button"
                onClick={exportToExcel}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .XLSX</span>
              </button>
            </div>

            {/* 3. Trips Raw CSV */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Download className="h-4 w-4 text-purple-600" />
                  <span>Trips Raw CSV</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Comma-separated flat file for fast ingestion into external ERP, Tally, or accounting tools.
                </p>
              </div>
              <button
                type="button"
                onClick={exportToCSV}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>

            {/* 4. SQLite Database (.sqlite/.db) */}
            <div className="rounded-xl border border-indigo-200 p-4 space-y-2 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <Server className="h-4 w-4 text-indigo-600" />
                  <span>SQLite Database</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Standard relational SQLite 3 database file with complete tables, keys, and relational constraints.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportSQLite}
                disabled={isExportingSqlite}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isExportingSqlite ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>{isExportingSqlite ? 'Building...' : 'Download SQLite'}</span>
              </button>
            </div>
          </div>

          {/* 5. Import Data — Placed directly below the existing download options */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Import Data
                </span>
                <span className="text-[11px] text-slate-500">
                  Restore or merge data from previously exported JSON backups or SQLite database files (.sqlite / .db)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Import JSON */}
              <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-2 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Import JSON Backup (.json)
                </span>
                <p className="text-[11px] text-slate-500">
                  Select an Anori Transport JSON export file to validate and restore records.
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJSONFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Import SQLite Database */}
              <div className="rounded-xl border border-dashed border-indigo-300 p-4 space-y-2 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/30">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                  Import SQLite Database (.sqlite / .db)
                </span>
                <p className="text-[11px] text-slate-500">
                  Upload an existing SQLite file. Tables and schemas will be inspected before restoring.
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors">
                  {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  <span>{isImporting ? 'Validating...' : 'Import SQLite'}</span>
                  <input
                    type="file"
                    accept=".sqlite,.db"
                    onChange={handleSQLiteFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Reset to Default Starter Data */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleResetConfirmation}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Default Starter Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* AMENDMENT #5: Import Confirmation Dialog & Validation Modal */}
      {pendingImportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Data Import ({pendingImportData.source})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingImportData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              The uploaded file was validated successfully. Please review the records detected before proceeding:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 text-[10px] block">TRIPS</span>
                <strong className="text-sm text-slate-900 dark:text-white">{pendingImportData.summary.trips ?? 0}</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 text-[10px] block">INVOICES</span>
                <strong className="text-sm text-slate-900 dark:text-white">{pendingImportData.summary.invoices ?? 0}</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 text-[10px] block">VEHICLES</span>
                <strong className="text-sm text-slate-900 dark:text-white">{pendingImportData.summary.vehicles ?? 0}</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 text-[10px] block">CUSTOMERS</span>
                <strong className="text-sm text-slate-900 dark:text-white">{pendingImportData.summary.parties ?? 0}</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 text-[10px] block">DRIVERS</span>
                <strong className="text-sm text-slate-900 dark:text-white">{pendingImportData.summary.drivers ?? 0}</strong>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 text-[10px] block">VENDORS</span>
                <strong className="text-sm text-slate-900 dark:text-white">{pendingImportData.summary.vendors ?? 0}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              Choose how you want to restore this data:
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingImportData(null)}
                className="w-full sm:w-auto rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmImport('merge')}
                className="w-full sm:w-auto rounded-lg border border-blue-600 bg-white px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400"
                title="Merge records without overwriting duplicates"
              >
                Safe Merge (Keep Existing)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmImport('replace')}
                className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
                title="Replace all existing data with file data"
              >
                Replace &amp; Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Stamp & Signature Image (1 Combined Image) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Invoice Stamp &amp; Authorized Signature (1 Single Image)
        </span>
        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
          <p className="text-xs text-slate-500">
            Upload 1 combined image for your company rubber stamp and signature. This exact image reflects directly on the Tax Invoice and PDF printouts.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-20 w-52 rounded-lg border border-slate-300 bg-white flex items-center justify-center p-2 dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
              {companyProfile.stamp_signature_image ? (
                <img
                  src={companyProfile.stamp_signature_image}
                  alt="Stamp &amp; Signature"
                  className="h-full object-contain mx-auto"
                />
              ) : (
                <span className="text-[11px] text-slate-400 italic">No image uploaded</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Image (1 File)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        updateCompanyProfile({ stamp_signature_image: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {companyProfile.stamp_signature_image && (
                <button
                  type="button"
                  onClick={() => updateCompanyProfile({ stamp_signature_image: undefined })}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Administrator Login Credentials */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Security &amp; Login ID Details
              </h2>
              <p className="text-[11px] text-blue-200">
                View current administrator credentials or update password
              </p>
            </div>
          </div>
          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-mono text-blue-300 border border-blue-400/30">
            Active User: {currentUsername}
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Active Credentials Display Cards */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 block mb-3">
              Current Active Login Credentials
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Login ID */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Login ID (Username)
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {currentUsername}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentUsername, 'username')}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Copy Username"
                >
                  {copiedField === 'username' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Password
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {showCurrentPassword ? currentPassword : '••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentPassword, 'password')}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {credStatus.type && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
                credStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
              }`}
            >
              {credStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{credStatus.msg}</span>
            </div>
          )}

          {/* Change Credentials Form */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Update Administrator Login ID &amp; Password
            </span>
            <form onSubmit={handleSaveCredentials} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Login ID (Username)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                  >
                    Save New Credentials
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCredentialsToDefault}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Reset to Default (admin / admin123)
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  Default credentials: admin / admin123
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Storage & System Metadata */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <HardDrive className="h-4 w-4 text-blue-600" />
          <span>Local Storage Footprint</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-mono">
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <span className="text-slate-500 block text-[10px]">TRIPS LOGGED</span>
            <strong className="text-sm text-slate-900 dark:text-white">{trips.length}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <span className="text-slate-500 block text-[10px]">INVOICES GENERATED</span>
            <strong className="text-sm text-slate-900 dark:text-white">{invoices.length}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <span className="text-slate-500 block text-[10px]">FLEET VEHICLES</span>
            <strong className="text-sm text-slate-900 dark:text-white">{vehicles.length}</strong>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <span className="text-slate-500 block text-[10px]">CUSTOMER PARTIES</span>
            <strong className="text-sm text-slate-900 dark:text-white">{parties.length}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5" />
          <span>Anori Transport ERP v3.1 — Reactive SQLite WebAssembly Architecture — Zero Data Loss Guarantee</span>
        </div>
      </div>
    </div>
  );
};
