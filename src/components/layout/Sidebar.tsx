import React, { useState } from 'react';
import {
  LayoutDashboard,
  Route,
  Receipt,
  FolderOpen,
  BarChart3,
  Wallet,
  Settings,
  Database,
  Truck,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Fuel,
} from 'lucide-react';
import { ActiveView } from '../../types';
import { useTransport } from '../../store/TransportContext';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeView, setActiveView, trips, invoices, companyProfile, logout } = useTransport();

  const [openGroups, setOpenGroups] = useState({
    operations: true,
    reporting: true,
    admin: true,
  });

  const toggleGroup = (group: 'operations' | 'reporting' | 'admin') => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    onCloseMobile();
  };

  const pendingInvoices = trips.filter((t) => t.status === 'completed' && t.invoice_status === 'pending').length;
  const overdueCount = invoices.filter((i) => i.status !== 'cancelled' && i.status !== 'paid' && i.balance_due > 0).length;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-base font-bold tracking-tight text-white">
              {companyProfile.name.split(' ')[0]} TRANSPORT
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Operations Control
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Operations Section */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup('operations')}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span>Operations</span>
              {openGroups.operations ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {openGroups.operations && (
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('trips')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'trips'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Route className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">Trip Management</span>
                  </div>
                  {pendingInvoices > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      {pendingInvoices}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('invoices')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'invoices'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Receipt className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">Invoices &amp; Billing</span>
                  </div>
                  {overdueCount > 0 && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-300">
                      {overdueCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('documents')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'documents'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Document Center</span>
                </button>
              </div>
            )}
          </div>

          {/* Reporting & Settlements Section */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup('reporting')}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span>Settlement &amp; Analytics</span>
              {openGroups.reporting ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {openGroups.reporting && (
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => handleNavClick('reports')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'reports'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Reports &amp; Analytics</span>
                </button>

                <button
                  onClick={() => handleNavClick('settlements')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'settlements'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Wallet className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Driver &amp; Vendor Ledger</span>
                </button>

                <button
                  onClick={() => handleNavClick('expenses')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'expenses'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Fuel className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Expenses Ledger</span>
                </button>
              </div>
            )}
          </div>

          {/* Admin & Configuration Section */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup('admin')}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span>Administration</span>
              {openGroups.admin ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {openGroups.admin && (
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => handleNavClick('masters')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'masters'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Database className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Master Data</span>
                </button>

                <button
                  onClick={() => handleNavClick('settings')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    activeView === 'settings'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Settings className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Settings &amp; Backup</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-slate-200">
                  Data Protected
                </span>
                <span className="text-[10px] text-slate-400">SQLite &amp; Local Storage</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-xs font-semibold text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
