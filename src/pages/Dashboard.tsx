import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, Clock, DollarSign, Eye, Zap, BarChart2,
  ChevronDown, Bot, Cpu, X, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Capability, CapabilityMetrics } from '../lib/types';

type FilterType = 'all' | 'AI' | 'Non-AI';

interface CapabilityWithMetrics extends Capability {
  metrics?: CapabilityMetrics;
}

interface DashboardProps {
  onAddCapability: () => void;
  onViewCapability: (id: string) => void;
  onTriggerCapability: (id: string) => void;
  onMetricsCapability: (id: string) => void;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatHours(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n.toLocaleString()}`;
}

export default function Dashboard({ onAddCapability, onViewCapability, onTriggerCapability, onMetricsCapability }: DashboardProps) {
  const [capabilities, setCapabilities] = useState<CapabilityWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCapabilities = useCallback(async () => {
    setLoading(true);
    const { data: caps, error: capsErr } = await supabase
      .from('capabilities')
      .select('*')
      .order('created_at', { ascending: true });

    if (capsErr) { setLoading(false); return; }

    const { data: metrics } = await supabase
      .from('capability_metrics')
      .select('*');

    const metricsMap = new Map<string, CapabilityMetrics>();
    metrics?.forEach(m => metricsMap.set(m.capability_id, m));

    const enriched = (caps || []).map(c => ({
      ...c,
      metrics: metricsMap.get(c.id),
    }));
    setCapabilities(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCapabilities(); }, [fetchCapabilities]);

  const totalHours = capabilities.reduce((s, c) => s + (c.metrics?.ytd_hours_saved ?? 0), 0);
  const totalSavings = capabilities.reduce((s, c) => s + (c.metrics?.ytd_financial_savings ?? 0), 0);

  const filtered = capabilities.filter(c => {
    if (filterType !== 'all' && c.capability_type !== filterType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.implemented_team.toLowerCase().includes(q) ||
      c.area_of_impact.some(a => a.toLowerCase().includes(q)) ||
      c.point_of_contact.toLowerCase().includes(q)
    );
  });

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    await supabase.from('capabilities').delete().in('id', Array.from(selectedForDelete));
    setDeleting(false);
    setDeleteConfirm(false);
    setDeleteMode(false);
    setSelectedForDelete(new Set());
    fetchCapabilities();
  };

  const toggleSelect = (id: string) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ETMO Capability Store</h1>
            <p className="text-sm text-gray-500 mt-1">
              Discover, access, and measure ETMO capabilities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onAddCapability}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Capability
            </button>
            <button
              onClick={() => { setDeleteMode(!deleteMode); setSelectedForDelete(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                deleteMode
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Trash2 size={16} />
              Delete Capability
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Total Capabilities</span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Cpu size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{capabilities.length}</p>
            <p className="text-xs text-gray-400 mt-1">Available in store</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">YTD Hours Saved</span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Clock size={20} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatHours(totalHours)}</p>
            <p className="text-xs text-gray-400 mt-1">Hours reclaimed YTD</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">YTD Operational Savings</span>
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <DollarSign size={20} className="text-sky-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSavings)}</p>
            <p className="text-xs text-gray-400 mt-1">Financial savings YTD</p>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by capability name, team, area of impact, or POC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[180px] justify-between"
            >
              <span>
                {filterType === 'all' ? 'All Capabilities' : filterType === 'AI' ? 'AI Capabilities' : 'Non-AI Capabilities'}
              </span>
              <ChevronDown size={14} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                {(['all', 'AI', 'Non-AI'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setFilterType(opt); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      filterType === opt ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    {opt === 'all' ? 'All Capabilities' : opt === 'AI' ? 'AI Capabilities' : 'Non-AI Capabilities'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete mode banner */}
        {deleteMode && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle size={16} />
              <span>Select capabilities to delete, then confirm.</span>
              {selectedForDelete.size > 0 && (
                <span className="font-semibold">{selectedForDelete.size} selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setDeleteMode(false); setSelectedForDelete(new Set()); }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded"
              >
                Cancel
              </button>
              {selectedForDelete.size > 0 && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-700 font-semibold"
                >
                  Delete Selected
                </button>
              )}
            </div>
          </div>
        )}

        {/* Capability Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Search size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No capabilities found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(cap => (
              <CapabilityCard
                key={cap.id}
                capability={cap}
                deleteMode={deleteMode}
                selected={selectedForDelete.has(cap.id)}
                onToggleSelect={() => toggleSelect(cap.id)}
                onView={() => onViewCapability(cap.id)}
                onTrigger={() => onTriggerCapability(cap.id)}
                onMetrics={() => onMetricsCapability(cap.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              You are about to permanently delete <strong>{selectedForDelete.size}</strong> capability{selectedForDelete.size !== 1 ? 'ies' : ''}. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  capability: CapabilityWithMetrics;
  deleteMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onTrigger: () => void;
  onMetrics: () => void;
}

function CapabilityCard({ capability: c, deleteMode, selected, onToggleSelect, onView, onTrigger, onMetrics }: CardProps) {
  const isAI = c.capability_type === 'AI';
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-all duration-200 flex flex-col ${
        deleteMode
          ? selected
            ? 'border-red-400 shadow-md ring-2 ring-red-200 cursor-pointer'
            : 'border-gray-200 hover:border-red-300 hover:shadow-md cursor-pointer'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={deleteMode ? onToggleSelect : undefined}
    >
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            {deleteMode && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                className="mt-0.5 rounded border-gray-300 text-red-600 flex-shrink-0"
                onClick={e => e.stopPropagation()}
              />
            )}
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{c.name}</h3>
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isAI
                ? 'bg-violet-100 text-violet-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isAI ? <Bot size={10} /> : <Cpu size={10} />}
            {c.capability_type}
          </span>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed mb-4">{c.short_description}</p>

        {/* Area of Impact */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {c.area_of_impact.map(area => (
            <span key={area} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">
              {area}
            </span>
          ))}
        </div>

        {/* Savings */}
        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
          <div>
            <div className="flex items-center gap-1 text-gray-400 mb-0.5">
              <Clock size={11} />
              <span className="text-xs">YTD Hours</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {c.metrics ? formatHours(c.metrics.ytd_hours_saved) : '—'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-400 mb-0.5">
              <DollarSign size={11} />
              <span className="text-xs">YTD Savings</span>
            </div>
            <p className="text-sm font-bold text-emerald-600">
              {c.metrics ? formatCurrency(c.metrics.ytd_financial_savings) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!deleteMode && (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
          >
            <Eye size={13} />
            View
          </button>
          <button
            onClick={onTrigger}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-lg transition-colors"
          >
            <Zap size={13} />
            Trigger
          </button>
          <button
            onClick={onMetrics}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 py-2 rounded-lg transition-colors"
          >
            <BarChart2 size={13} />
            Metrics
          </button>
        </div>
      )}
    </div>
  );
}
