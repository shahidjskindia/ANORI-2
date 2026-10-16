import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Eye,
  Copy,
  Edit,
  Trash2,
  Columns,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  Table as TableIcon,
  GripVertical,
} from 'lucide-react';
import { Trip } from '../../types';
import { useTransport } from '../../store/TransportContext';
import { formatCurrency } from '../../utils/formatters';
import { TripModal } from './TripModal';
import { TripPreviewModal } from './TripPreviewModal';

const DEFAULT_VISIBLE_COLUMNS = [
  'date',
  'trip_no',
  'vehicle',
  'driver',
  'party',
  'route',
  'freight',
  'advance',
  'profit',
  'invoice',
];

const AVAILABLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'trip_no', label: 'Trip #' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'driver', label: 'Driver' },
  { key: 'party', label: 'Party / Customer' },
  { key: 'route', label: 'Route (POL → POD)' },
  { key: 'freight', label: 'Freight' },
  { key: 'advance', label: 'Trip Advance' },
  { key: 'profit', label: 'Net Profit' },
  { key: 'invoice', label: 'Invoice Status' },
];

export const TripManagementView: React.FC = () => {
  const { trips, deleteTrip, duplicateTrip, moveTripStatus, invoices, setActiveView } = useTransport();

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const scrollTable = (dir: 'left' | 'right') => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({
        left: dir === 'left' ? -350 : 350,
        behavior: 'smooth',
      });
    }
  };

  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedTripId, setDraggedTripId] = useState<string | null>(null);
  const [isDraggingOverRightBoard, setIsDraggingOverRightBoard] = useState(false);
  const [isDraggingOverLeftBoard, setIsDraggingOverLeftBoard] = useState(false);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [previewingTrip, setPreviewingTrip] = useState<Trip | null>(null);

  const [searchField, setSearchField] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('anori_trip_visible_cols');
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    } catch {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem('anori_trip_visible_cols', JSON.stringify(next));
      return next;
    });
  };

  const moveColumnLeft = (index: number) => {
    if (index <= 0) return;
    setVisibleColumns((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      localStorage.setItem('anori_trip_visible_cols', JSON.stringify(next));
      return next;
    });
  };

  const moveColumnRight = (index: number) => {
    if (index >= visibleColumns.length - 1) return;
    setVisibleColumns((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      localStorage.setItem('anori_trip_visible_cols', JSON.stringify(next));
      return next;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTrips = useMemo(() => {
    let result = [...trips];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const vehicle = (t.vehicle_number || t.vehicle_manual || '').toLowerCase();
        const driver = (t.driver_name || t.driver_manual || '').toLowerCase();
        const party = (t.party_name || t.party_manual || '').toLowerCase();
        const pol = t.from.toLowerCase();
        const pod = t.to.toLowerCase();
        const tripNo = t.trip_no.toLowerCase();
        const invoiceNo = (t.invoice_no || '').toLowerCase();

        switch (searchField) {
          case 'party':
            return party.includes(q);
          case 'driver':
            return driver.includes(q);
          case 'pol':
            return pol.includes(q);
          case 'pod':
            return pod.includes(q);
          case 'invoice':
            return invoiceNo.includes(q);
          case 'trip':
            return tripNo.includes(q);
          case 'vehicle':
            return vehicle.includes(q);
          case 'all':
          default:
            return (
              tripNo.includes(q) ||
              vehicle.includes(q) ||
              driver.includes(q) ||
              party.includes(q) ||
              pol.includes(q) ||
              pod.includes(q) ||
              invoiceNo.includes(q)
            );
        }
      });
    }

    result.sort((a, b) => {
      let valA: any = a[sortField as keyof Trip] || '';
      let valB: any = b[sortField as keyof Trip] || '';
      if (sortField === 'freight' || sortField === 'trip_advance_amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trips, searchQuery, searchField, sortField, sortDirection]);

  const totalEntries = filteredTrips.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrips.slice(start, start + pageSize);
  }, [filteredTrips, currentPage]);

  const leftBoardTrips = useMemo(
    () => filteredTrips.filter((t) => t.status === 'in_progress'),
    [filteredTrips]
  );
  const rightBoardTrips = useMemo(
    () => filteredTrips.filter((t) => t.status !== 'in_progress'),
    [filteredTrips]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allCurrentPageIds = paginatedTrips.map((t) => t.id);
      setSelectedIds(new Set([...selectedIds, ...allCurrentPageIds]));
    } else {
      const newSet = new Set(selectedIds);
      paginatedTrips.forEach((t) => newSet.delete(t.id));
      setSelectedIds(newSet);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllCurrentPageSelected =
    paginatedTrips.length > 0 && paginatedTrips.every((t) => selectedIds.has(t.id));

  const handleActionPreview = () => {
    if (selectedIds.size !== 1) {
      alert('Please select exactly one trip to preview.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    const target = trips.find((t) => t.id === id);
    if (target) setPreviewingTrip(target);
  };

  const handleActionDuplicate = () => {
    if (selectedIds.size !== 1) {
      alert('Please select exactly one trip to duplicate.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    duplicateTrip(id);
    setSelectedIds(new Set());
  };

  const handleActionEdit = () => {
    if (selectedIds.size !== 1) {
      alert('Please select exactly one trip to edit.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    const target = trips.find((t) => t.id === id);
    if (!target) return;

    const activeInv = invoices.find(
      (inv) => inv.trip_ids.includes(id) && inv.status !== 'cancelled'
    );
    if (activeInv) {
      alert(
        `This trip is already locked to active invoice "${activeInv.invoice_no}".\nPlease cancel the invoice first if you need to edit this trip.`
      );
      return;
    }
    setEditingTrip(target);
    setIsNewTripModalOpen(true);
  };

  const handleActionDelete = () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one trip to delete.');
      return;
    }
    const ids = Array.from(selectedIds);
    const lockedIds = ids.filter((id) =>
      invoices.some((inv) => inv.trip_ids.includes(id) && inv.status !== 'cancelled')
    );
    if (lockedIds.length > 0) {
      alert(
        `${lockedIds.length} of the selected trips are already linked to active issued invoices.\nFinancial history is protected. Cancel the invoices first.`
      );
      return;
    }
    if (confirm(`Are you sure you want to delete ${ids.length} selected trip(s)?`)) {
      ids.forEach((id) => deleteTrip(id));
      setSelectedIds(new Set());
    }
  };

  const handleBatchMoveRight = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => moveTripStatus(id, 'completed'));
    setSelectedIds(new Set());
  };

  const handleBatchMoveLeft = () => {
    if (selectedIds.size === 0) return;
    const invoicedSelected = trips.filter(
      (t) => selectedIds.has(t.id) && t.invoice_status === 'invoiced'
    );
    if (invoicedSelected.length > 0) {
      alert(
        `${invoicedSelected.length} of the selected trips are already linked to an invoice and cannot be reverted.`
      );
    }
    trips
      .filter((t) => selectedIds.has(t.id) && t.invoice_status !== 'invoiced')
      .forEach((t) => moveTripStatus(t.id, 'in_progress'));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Trip Management
          </h1>
          <p className="text-xs text-slate-500">
            Compact high-density operational log with multi-select actions &amp; Left-to-Right row movement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Move Left-to-Right</span>
            </button>
          </div>
          <button
            onClick={() => {
              setEditingTrip(null);
              setIsNewTripModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Trip Dispatch</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Universal Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Actions:
            </span>
            <button
              onClick={() => {
                setEditingTrip(null);
                setIsNewTripModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Trip</span>
            </button>
            <button
              onClick={handleActionPreview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleActionDuplicate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleActionEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-500 cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleActionDelete}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            {/* Custom Column Visibility Button */}
            <div className="relative">
              <button
                onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Columns</span>
              </button>
              {isColumnPickerOpen && (
                <div className="absolute left-0 mt-2 z-30 w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 animate-in fade-in">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase">
                    Toggle &amp; Move Columns
                  </div>
                  <div className="space-y-1">
                    {visibleColumns.map((colKey, idx) => {
                      const def = AVAILABLE_COLUMNS.find((c) => c.key === colKey);
                      return (
                        <div
                          key={colKey}
                          className="flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {def?.label || colKey}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveColumnLeft(idx)}
                              disabled={idx === 0}
                              className="px-1 text-[10px] text-slate-500 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                              title="Move Column Left"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => moveColumnRight(idx)}
                              disabled={idx === visibleColumns.length - 1}
                              className="px-1 text-[10px] text-slate-500 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                              title="Move Column Right"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleColumn(colKey)}
                              className="ml-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Hide Column"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Slide / Move Selected to Left or Right */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleBatchMoveRight}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 cursor-pointer animate-in fade-in"
                  title="Slide/Move selected trips to Right (Completed)"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Slide to Right ({selectedIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={handleBatchMoveLeft}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer animate-in fade-in"
                  title="Slide/Move selected trips to Left (In Progress)"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Slide to Left</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Slide Table View:</span>
              <button
                type="button"
                onClick={() => scrollTable('left')}
                className="p-1 px-2 rounded border border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-[11px] font-bold cursor-pointer"
                title="Pan Table Columns Left"
              >
                ← Left
              </button>
              <button
                type="button"
                onClick={() => scrollTable('right')}
                className="p-1 px-2 rounded border border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-[11px] font-bold cursor-pointer"
                title="Pan Table Columns Right"
              >
                Right →
              </button>
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono">
              {selectedIds.size} SELECTED
            </div>
          </div>
        </div>

        {/* Multi-field Search Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Search By:</span>
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">ALL FIELDS</option>
              <option value="party">PARTY NAME</option>
              <option value="driver">DRIVER NAME</option>
              <option value="pol">POL (ORIGIN)</option>
              <option value="pod">POD (DESTINATION)</option>
              <option value="invoice">INVOICE NO.</option>
              <option value="trip">TRIP NO.</option>
              <option value="vehicle">VEHICLE NO.</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Type to filter trips instantly..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchField('all');
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </button>
          )}

          <div className="text-xs text-slate-500 font-mono">
            {filteredTrips.length} results
          </div>
        </div>

        {/* View Mode 1: High-Density Table with Row Action to Move Left or Right */}
        {viewMode === 'table' ? (
          <div>
            <div className={`p-3 border-b border-slate-200 dark:border-slate-800 transition-all ${
              selectedIds.size > 0 || draggedTripId
                ? 'bg-gradient-to-r from-amber-500/10 via-slate-100 to-emerald-500/10 dark:from-amber-950/30 dark:via-slate-850 dark:to-emerald-950/30 shadow-inner'
                : 'bg-slate-50/60 dark:bg-slate-900/40'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverLeftBoard(true);
                  }}
                  onDragLeave={() => setIsDraggingOverLeftBoard(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOverLeftBoard(false);
                    const id = e.dataTransfer.getData('text/plain') || draggedTripId;
                    if (id) {
                      moveTripStatus(id, 'in_progress');
                    }
                    if (selectedIds.size > 0) {
                      handleBatchMoveLeft();
                    }
                    setDraggedTripId(null);
                  }}
                  onClick={handleBatchMoveLeft}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    isDraggingOverLeftBoard
                      ? 'border-amber-500 bg-amber-100 scale-102 shadow-md dark:bg-amber-950/60'
                      : selectedIds.size > 0
                      ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30'
                      : 'border-dashed border-slate-300 bg-white/70 hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                  title="Drop dragged row here or click to slide selected trips to Left"
                >
                  <ArrowLeft className="h-4 w-4 text-amber-600 animate-pulse shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                      ← SLIDE / DROP LEFT (In Progress)
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      {selectedIds.size > 0 ? `Slide ${selectedIds.size} selected trip(s) Left` : 'Drag row here or click to slide Left'}
                    </span>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold">
                    ℹ
                  </span>
                  <span>Select row(s) &amp; click or drag grip handle ⋮⋮ to slide Left/Right</span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverRightBoard(true);
                  }}
                  onDragLeave={() => setIsDraggingOverRightBoard(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOverRightBoard(false);
                    const id = e.dataTransfer.getData('text/plain') || draggedTripId;
                    if (id) {
                      moveTripStatus(id, 'completed');
                    }
                    if (selectedIds.size > 0) {
                      handleBatchMoveRight();
                    }
                    setDraggedTripId(null);
                  }}
                  onClick={handleBatchMoveRight}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    isDraggingOverRightBoard
                      ? 'border-emerald-500 bg-emerald-100 scale-102 shadow-md dark:bg-emerald-950/60'
                      : selectedIds.size > 0
                      ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/30'
                      : 'border-dashed border-slate-300 bg-white/70 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                  title="Drop dragged row here or click to slide selected trips to Right"
                >
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                      SLIDE / DROP RIGHT (Completed) →
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {selectedIds.size > 0 ? `Slide ${selectedIds.size} selected trip(s) Right` : 'Drag row here or click to slide Right'}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-600 animate-pulse shrink-0" />
                </div>
              </div>
            </div>

            <div ref={tableContainerRef} className="overflow-x-auto scroll-smooth">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800">
                    <th className="py-2.5 px-2 w-7 text-center text-slate-400" title="Drag to slide row">
                      <GripVertical className="h-3.5 w-3.5 mx-auto" />
                    </th>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={isAllCurrentPageSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    {visibleColumns.includes('date') && (
                      <th
                        onClick={() => handleSort('date')}
                        className="cursor-pointer py-2.5 px-3 font-bold hover:text-blue-600"
                      >
                        Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {visibleColumns.includes('trip_no') && (
                      <th
                        onClick={() => handleSort('trip_no')}
                        className="cursor-pointer py-2.5 px-3 font-bold hover:text-blue-600"
                      >
                        Trip # {sortField === 'trip_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {visibleColumns.includes('vehicle') && (
                      <th
                        onClick={() => handleSort('vehicle_number')}
                        className="cursor-pointer py-2.5 px-3 font-bold hover:text-blue-600"
                      >
                        Vehicle {sortField === 'vehicle_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {visibleColumns.includes('driver') && (
                      <th
                        onClick={() => handleSort('driver_name')}
                        className="cursor-pointer py-2.5 px-3 font-bold hover:text-blue-600"
                      >
                        Driver {sortField === 'driver_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {visibleColumns.includes('party') && (
                      <th
                        onClick={() => handleSort('party_name')}
                        className="cursor-pointer py-2.5 px-3 font-bold hover:text-blue-600"
                      >
                        Customer {sortField === 'party_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {visibleColumns.includes('route') && (
                      <th className="py-2.5 px-3 font-bold">Route</th>
                    )}
                    {visibleColumns.includes('freight') && (
                      <th
                        onClick={() => handleSort('freight')}
                        className="cursor-pointer py-2.5 px-3 font-bold text-right hover:text-blue-600"
                      >
                        Freight (₹) {sortField === 'freight' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {visibleColumns.includes('advance') && (
                      <th
                        onClick={() => handleSort('trip_advance_amount')}
                        className="cursor-pointer py-2.5 px-3 font-bold text-right hover:text-blue-600"
                      >
                        Advance (₹)
                      </th>
                    )}
                    {visibleColumns.includes('profit') && (
                      <th className="py-2.5 px-3 font-bold text-right">Margin</th>
                    )}
                    {visibleColumns.includes('invoice') && (
                      <th className="py-2.5 px-3 font-bold text-center">Invoice</th>
                    )}
                    <th className="py-2.5 px-3 font-bold text-center">Move Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTrips.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-xs text-slate-400">
                        No trips match the current search filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTrips.map((t, idx) => {
                      const isSelected = selectedIds.has(t.id);
                      const totalExp = (t.expenses || []).reduce((s, e) => s + e.amount, 0);
                      const vCost = t.vendor_cost || 0;
                      const profit = t.freight - totalExp - vCost;

                      return (
                        <tr
                          key={t.id}
                          draggable={t.invoice_status !== 'invoiced'}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', t.id);
                            setDraggedTripId(t.id);
                          }}
                          onDragEnd={() => setDraggedTripId(null)}
                          onClick={() => handleToggleRow(t.id)}
                          onDoubleClick={() => setPreviewingTrip(t)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40'
                              : idx % 2 === 1
                              ? 'bg-emerald-50/20 dark:bg-slate-850'
                              : 'bg-white dark:bg-slate-900'
                          } hover:bg-slate-100/80 dark:hover:bg-slate-800 ${
                            draggedTripId === t.id ? 'opacity-40 border-dashed border-2 border-blue-400' : ''
                          }`}
                        >
                          <td
                            onClick={(e) => e.stopPropagation()}
                            className="py-2.5 px-2 text-center text-slate-400 cursor-grab active:cursor-grabbing hover:text-blue-600"
                            title="Drag or slide this row"
                          >
                            <GripVertical className="h-3.5 w-3.5 mx-auto" />
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            className="py-2.5 px-3 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(t.id)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          {visibleColumns.includes('date') && (
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                              {t.date}
                            </td>
                          )}
                          {visibleColumns.includes('trip_no') && (
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-400">
                              {t.trip_no}
                            </td>
                          )}
                          {visibleColumns.includes('vehicle') && (
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-white">
                              <span>{t.vehicle_number || t.vehicle_manual}</span>
                              {t.vehicle_classification === 'outside' && (
                                <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                  HIRED
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.includes('driver') && (
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                              {t.driver_name || t.driver_manual}
                            </td>
                          )}
                          {visibleColumns.includes('party') && (
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium max-w-[160px] truncate">
                              {t.party_name || t.party_manual}
                            </td>
                          )}
                          {visibleColumns.includes('route') && (
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                              {t.from} → {t.to}
                            </td>
                          )}
                          {visibleColumns.includes('freight') && (
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-right text-slate-900 dark:text-white">
                              {formatCurrency(t.freight)}
                            </td>
                          )}
                          {visibleColumns.includes('advance') && (
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-right text-amber-700 dark:text-amber-400 font-semibold">
                              {t.trip_advance_amount > 0 ? formatCurrency(t.trip_advance_amount) : '—'}
                            </td>
                          )}
                          {visibleColumns.includes('profit') && (
                            <td
                              className={`py-2.5 px-3 whitespace-nowrap font-mono font-bold text-right ${
                                profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(profit)}
                            </td>
                          )}
                          {visibleColumns.includes('invoice') && (
                            <td className="py-2.5 px-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  t.invoice_status === 'invoiced'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}
                              >
                                {t.invoice_status}
                              </span>
                            </td>
                          )}
                          <td
                            onClick={(e) => e.stopPropagation()}
                            className="py-2.5 px-3 text-center whitespace-nowrap"
                          >
                            {t.status === 'in_progress' ? (
                              <button
                                type="button"
                                onClick={() => moveTripStatus(t.id, 'completed')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
                                title="Slide / Move this row to Right (Completed)"
                              >
                                <span>Slide Right</span>
                                <ArrowRight className="h-3 w-3 text-emerald-600" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => moveTripStatus(t.id, 'in_progress')}
                                disabled={t.invoice_status === 'invoiced'}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                                title="Slide / Move this row back to Left (In Progress)"
                              >
                                <ArrowLeft className="h-3 w-3 text-slate-500" />
                                <span>Slide Left</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOverLeftBoard(true);
                }}
                onDragLeave={() => setIsDraggingOverLeftBoard(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOverLeftBoard(false);
                  const tripId = e.dataTransfer.getData('text/plain') || draggedTripId;
                  if (tripId) {
                    moveTripStatus(tripId, 'in_progress');
                  }
                  setDraggedTripId(null);
                }}
                className={`rounded-xl border-2 transition-all p-3.5 bg-white dark:bg-slate-900 ${
                  isDraggingOverLeftBoard
                    ? 'border-amber-500 bg-amber-50/40 shadow-lg scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      In Transit / Dispatched (Left Column)
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full dark:bg-amber-950 dark:text-amber-300">
                    {leftBoardTrips.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto min-h-[140px]">
                  {leftBoardTrips.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg p-6 dark:border-slate-800">
                      No active in-transit trips.
                    </div>
                  ) : (
                    leftBoardTrips.map((t) => (
                      <div
                        key={t.id}
                        draggable={t.invoice_status !== 'invoiced'}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', t.id);
                          setDraggedTripId(t.id);
                        }}
                        onDragEnd={() => setDraggedTripId(null)}
                        className={`rounded-lg border border-slate-200 bg-slate-50/80 p-3 shadow-sm hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 cursor-grab active:cursor-grabbing transition-transform ${
                          draggedTripId === t.id ? 'opacity-40 scale-95 border-dashed border-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="h-3 w-3 text-slate-400" />
                            <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                              {t.trip_no}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                            {formatCurrency(t.freight)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                          {t.party_name || t.party_manual}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.from} → {t.to} ({t.vehicle_number || t.vehicle_manual})
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-500">{t.date}</span>
                          <button
                            type="button"
                            onClick={() => moveTripStatus(t.id, 'completed')}
                            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-xs"
                          >
                            <span>Slide to Right</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOverRightBoard(true);
                }}
                onDragLeave={() => setIsDraggingOverRightBoard(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOverRightBoard(false);
                  const tripId = e.dataTransfer.getData('text/plain') || draggedTripId;
                  if (tripId) {
                    moveTripStatus(tripId, 'completed');
                  }
                  setDraggedTripId(null);
                }}
                className={`rounded-xl border-2 transition-all p-3.5 bg-white dark:bg-slate-900 ${
                  isDraggingOverRightBoard
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-lg scale-[1.01]'
                    : 'border-blue-200 dark:border-blue-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Completed / Ready for Billing (Right Column)
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                    {rightBoardTrips.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto min-h-[140px]">
                  {rightBoardTrips.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg p-6 dark:border-slate-800">
                      No completed trips on the Right.
                    </div>
                  ) : (
                    rightBoardTrips.map((t) => (
                      <div
                        key={t.id}
                        draggable={t.invoice_status !== 'invoiced'}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', t.id);
                          setDraggedTripId(t.id);
                        }}
                        onDragEnd={() => setDraggedTripId(null)}
                        className={`rounded-lg border border-slate-200 bg-slate-50/80 p-3 shadow-sm hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 cursor-grab active:cursor-grabbing transition-transform ${
                          draggedTripId === t.id ? 'opacity-40 scale-95 border-dashed border-emerald-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="h-3 w-3 text-slate-400" />
                            <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                              {t.trip_no}
                            </span>
                          </div>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              t.invoice_status === 'invoiced'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {t.invoice_status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                          {t.party_name || t.party_manual}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.from} → {t.to} ({t.vehicle_number || t.vehicle_manual})
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => moveTripStatus(t.id, 'in_progress')}
                            disabled={t.invoice_status === 'invoiced'}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            <span>Slide to Left</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewingTrip(t)}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* High-Density Pagination Footer */}
        {viewMode === 'table' && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900 dark:text-white">
                {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span> to <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(currentPage * pageSize, totalEntries)}
              </span> of <span className="font-semibold text-slate-900 dark:text-white">
                {totalEntries}
              </span> entries
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex h-8 items-center px-3 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trip Modal for Add / Edit */}
      <TripModal
        isOpen={isNewTripModalOpen}
        onClose={() => {
          setIsNewTripModalOpen(false);
          setEditingTrip(null);
        }}
        editTrip={editingTrip}
      />

      {/* Trip Preview Modal */}
      <TripPreviewModal
        trip={previewingTrip}
        onClose={() => setPreviewingTrip(null)}
        onOpenInvoice={() => setActiveView('invoices')}
      />
    </div>
  );
};
