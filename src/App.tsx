import React, { useState } from 'react';
import { TransportProvider, useTransport } from './store/TransportContext';
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TripManagementView } from './components/trips/TripManagementView';
import { TripModal } from './components/trips/TripModal';
import { InvoiceBillingView } from './components/invoices/InvoiceBillingView';
import { InvoiceGeneratorModal } from './components/invoices/InvoiceGeneratorModal';
import { DocumentCenterView } from './components/documents/DocumentCenterView';
import { SettlementView } from './components/settlements/SettlementView';
import { ExpenseLedgerView } from './components/expenses/ExpenseLedgerView';
import { ReportsView } from './components/reports/ReportsView';
import { MasterDataView } from './components/masters/MasterDataView';
import { SettingsView } from './components/settings/SettingsView';

const AppContent: React.FC = () => {
  const { activeView, isAuthenticated, login } = useTransport();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenNewTripModal={() => setIsNewTripModalOpen(true)}
          onOpenNewInvoiceModal={() => setIsNewInvoiceModalOpen(true)}
        />

        {/* Dynamic View Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenNewTripModal={() => setIsNewTripModalOpen(true)}
              onOpenNewInvoiceModal={() => setIsNewInvoiceModalOpen(true)}
            />
          )}
          {activeView === 'trips' && <TripManagementView />}
          {activeView === 'invoices' && <InvoiceBillingView />}
          {activeView === 'documents' && <DocumentCenterView />}
          {activeView === 'settlements' && <SettlementView />}
          {activeView === 'expenses' && <ExpenseLedgerView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'masters' && <MasterDataView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <TripModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
      />
      <InvoiceGeneratorModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        onInvoiceCreated={() => {
          setIsNewInvoiceModalOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <TransportProvider>
      <AppContent />
    </TransportProvider>
  );
}
