import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  Download,
  Sun,
  Moon,
  Receipt,
  X,
  LogOut,
} from 'lucide-react';
import { useTransport } from '../../store/TransportContext';
import { ActiveView } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenNewTripModal: () => void;
  onOpenNewInvoiceModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenNewTripModal,
  onOpenNewInvoiceModal,
}) => {
  const {
    activeView,
    setActiveView,
    trips,
    invoices,
    parties,
    vehicles,
    drivers,
    theme,
    toggleTheme,
    exportToExcel,
    logout,
    adminCredentials,
  } = useTransport();

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    const results: Array<{
      type: 'Trip' | 'Invoice' | 'Party' | 'Vehicle' | 'Driver';
      title: string;
      subtitle: string;
      view: ActiveView;
    }> = [];

    trips.forEach((t) => {
      if (
        t.trip_no.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.vehicle_number?.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Trip',
          title: t.trip_no,
          subtitle: `${t.from} → ${t.to} (${formatCurrency(t.freight)})`,
          view: 'trips',
        });
      }
    });

    invoices.forEach((inv) => {
      if (
        inv.invoice_no.toLowerCase().includes(q) ||
        inv.party_name.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Invoice',
          title: inv.invoice_no,
          subtitle: `${inv.party_name} — ${formatCurrency(inv.total_amount)} (${inv.status.toUpperCase()})`,
          view: 'invoices',
        });
      }
    });

    parties.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.gst?.toLowerCase().includes(q)) {
        results.push({
          type: 'Party',
          title: p.name,
          subtitle: `GSTIN: ${p.gst || 'Unregistered'} — Credit: ${p.credit_days} days`,
          view: 'masters',
        });
      }
    });

    vehicles.forEach((v) => {
      if (v.number.toLowerCase().includes(q)) {
        results.push({
          type: 'Vehicle',
          title: v.number,
          subtitle: `${v.classification} (${v.type})`,
          view: 'masters',
        });
      }
    });

    drivers.forEach((d) => {
      if (d.name.toLowerCase().includes(q) || d.mobile.includes(q)) {
        results.push({
          type: 'Driver',
          title: d.name,
          subtitle: `Mobile: ${d.mobile}`,
          view: 'settlements',
        });
      }
    });

    return results.slice(0, 8);
  }, [searchTerm, trips, invoices, parties, vehicles, drivers]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block">
          <div
            onClick={() => setShowSearchModal(true)}
            className="flex h-9.5 w-64 md:w-80 cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <span>Search trips, invoices, parties...</span>
            </div>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenNewTripModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Trip</span>
        </button>
        <button
          onClick={onOpenNewInvoiceModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">New Invoice</span>
        </button>
        <button
          onClick={exportToExcel}
          title="Export current data to Excel workbook"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          title="Toggle light/dark theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm uppercase">
            {adminCredentials?.username ? adminCredentials.username.slice(0, 2) : 'AD'}
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {adminCredentials?.username || 'admin'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Fleet Super Admin
            </span>
          </div>
          <button
            onClick={logout}
            title="Log out of Anori Transport"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-red-950/40 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trip no, route, customer, vehicle, invoice..."
                className="w-full h-12 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchTerm && searchResults.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching records found for "{searchTerm}".
                </div>
              )}
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveView(item.view);
                    setShowSearchModal(false);
                    setSearchTerm('');
                  }}
                  className="flex w-full items-center justify-between rounded-lg p-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {item.type}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">Open →</span>
                </button>
              ))}
              {!searchTerm && (
                <div className="p-4 text-xs text-slate-400 space-y-2">
                  <div className="font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Quick Suggestions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['JNPT', 'Pune', 'Tata Logistics', 'Reliance', 'MH04MH6475'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchTerm(tag)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
