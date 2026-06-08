import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Download, Clock, TrendingUp, BarChart2, DollarSign,
  Target, Zap, Award, RefreshCw, Edit3, Save, X, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Capability, CapabilityMetrics } from '../lib/types';

interface Props {
  capabilityId?: string;
  onBack: () => void;
  onMetricsUpdated?: () => void;
}

interface CapWithMetrics extends Capability {
  metrics?: CapabilityMetrics;
}

interface MetricsEditForm {
  avg_hours_saved_per_run: string;
  total_runs: string;
  ytd_hours_saved: string;
  ytd_financial_savings: string;
  weekly_savings: string;
  monthly_savings: string;
  quarterly_savings: string;
  yearly_savings: string;
  financial_savings: string;
  operational_efficiency_gain_pct: string;
  automation_accuracy_pct: string;
}

function metricsToForm(m: CapabilityMetrics): MetricsEditForm {
  return {
    avg_hours_saved_per_run: String(m.avg_hours_saved_per_run),
    total_runs: String(m.total_runs),
    ytd_hours_saved: String(m.ytd_hours_saved),
    ytd_financial_savings: String(m.ytd_financial_savings),
    weekly_savings: String(m.weekly_savings),
    monthly_savings: String(m.monthly_savings),
    quarterly_savings: String(m.quarterly_savings),
    yearly_savings: String(m.yearly_savings),
    financial_savings: String(m.financial_savings),
    operational_efficiency_gain_pct: String(m.operational_efficiency_gain_pct),
    automation_accuracy_pct: String(m.automation_accuracy_pct),
  };
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtH(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n.toLocaleString()}`;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

// ── Chart helpers ──────────────────────────────────────────────────────────

function LineChart({ data, label, color = '#2563eb' }: { data: number[]; label: string; color?: string }) {
  const w = 600; const h = 160; const pad = 30;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id={`lg-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`} fill={`url(#lg-${label})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - (v / max) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="white" strokeWidth="2" />;
      })}
      {months.map((m, i) => (
        <text key={m} x={pad + (i / (months.length - 1)) * (w - pad * 2)} y={h - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">{m}</text>
      ))}
    </svg>
  );
}

function BarChartSvg({ data, color = '#0ea5e9' }: { data: { label: string; value: number }[]; color?: string }) {
  const w = 600; const h = 160; const pad = 30;
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = (w - pad * 2) / data.length - 4;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - pad * 2);
        const x = pad + i * ((w - pad * 2) / data.length) + 2;
        const y = h - pad - bh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw} height={bh} rx="3" fill={color} opacity="0.85" />
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 80; const cy = 80; const r = 70;
  let angle = -Math.PI / 2;
  const arcs = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    return { ...s, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2},${y2} Z` };
  });
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} opacity="0.9" />)}
      </svg>
      <div className="space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-700 font-medium">{s.label}</span>
            <span className="text-gray-400">{((s.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBar({ capabilities }: { capabilities: CapWithMetrics[] }) {
  const w = 600; const h = 160; const pad = 30;
  const ai = capabilities.filter(c => c.capability_type === 'AI');
  const nonAI = capabilities.filter(c => c.capability_type !== 'AI');
  const aiTotal = ai.reduce((s, c) => s + (c.metrics?.ytd_financial_savings ?? 0), 0);
  const nonAITotal = nonAI.reduce((s, c) => s + (c.metrics?.ytd_financial_savings ?? 0), 0);
  const max = Math.max(aiTotal, nonAITotal, 1);
  const bw = 100;
  const data = [
    { label: 'AI', value: aiTotal, color: '#8b5cf6' },
    { label: 'Non-AI', value: nonAITotal, color: '#2563eb' },
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - pad * 2);
        const x = pad + i * 180 + 20;
        const y = h - pad - bh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={d.color} opacity="0.85" />
            <text x={x + bw / 2} y={h - 8} textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="600">{d.label}</text>
            <text x={x + bw / 2} y={Math.max(y - 6, 14)} textAnchor="middle" fontSize="10" fill={d.color} fontWeight="700">{fmt$(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function MetricsDashboard({ capabilityId, onBack, onMetricsUpdated }: Props) {
  const [capabilities, setCapabilities] = useState<CapWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MetricsEditForm | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('capabilities').select('*');
    if (capabilityId) query = query.eq('id', capabilityId);
    const { data: caps } = await query;
    const { data: metrics } = await supabase.from('capability_metrics').select('*');
    const metricsMap = new Map<string, CapabilityMetrics>();
    metrics?.forEach(m => metricsMap.set(m.capability_id, m));
    setCapabilities((caps || []).map(c => ({ ...c, metrics: metricsMap.get(c.id) })));
    setLoading(false);
  }, [capabilityId]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (cap: CapWithMetrics) => {
    if (cap.metrics) {
      setEditingId(cap.id);
      setEditForm(metricsToForm(cap.metrics));
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const setField = (k: keyof MetricsEditForm, v: string) =>
    setEditForm(prev => prev ? { ...prev, [k]: v } : prev);

  const saveEdit = async (cap: CapWithMetrics) => {
    if (!editForm || !cap.metrics) return;
    setSavingId(cap.id);
    const updates = {
      avg_hours_saved_per_run: parseFloat(editForm.avg_hours_saved_per_run) || 0,
      total_runs: parseInt(editForm.total_runs) || 0,
      ytd_hours_saved: parseFloat(editForm.ytd_hours_saved) || 0,
      ytd_financial_savings: parseFloat(editForm.ytd_financial_savings) || 0,
      weekly_savings: parseFloat(editForm.weekly_savings) || 0,
      monthly_savings: parseFloat(editForm.monthly_savings) || 0,
      quarterly_savings: parseFloat(editForm.quarterly_savings) || 0,
      yearly_savings: parseFloat(editForm.yearly_savings) || 0,
      financial_savings: parseFloat(editForm.financial_savings) || 0,
      operational_efficiency_gain_pct: parseFloat(editForm.operational_efficiency_gain_pct) || 0,
      automation_accuracy_pct: parseFloat(editForm.automation_accuracy_pct) || 0,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('capability_metrics').update(updates).eq('id', cap.metrics.id);
    setSavingId(null);
    setEditingId(null);
    setEditForm(null);
    setSavedId(cap.id);
    setTimeout(() => setSavedId(null), 2500);
    await load();
    onMetricsUpdated?.();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Aggregated KPIs
  const totalRuns = capabilities.reduce((s, c) => s + (c.metrics?.total_runs ?? 0), 0);
  const totalHours = capabilities.reduce((s, c) => s + (c.metrics?.ytd_hours_saved ?? 0), 0);
  const totalFinancial = capabilities.reduce((s, c) => s + (c.metrics?.ytd_financial_savings ?? 0), 0);
  const avgEfficiency = capabilities.length
    ? capabilities.reduce((s, c) => s + (c.metrics?.operational_efficiency_gain_pct ?? 0), 0) / capabilities.length
    : 0;
  const avgAccuracy = capabilities.length
    ? capabilities.reduce((s, c) => s + (c.metrics?.automation_accuracy_pct ?? 0), 0) / capabilities.length
    : 0;
  const weeklyTotal = capabilities.reduce((s, c) => s + (c.metrics?.weekly_savings ?? 0), 0);
  const monthlyTotal = capabilities.reduce((s, c) => s + (c.metrics?.monthly_savings ?? 0), 0);
  const quarterlyTotal = capabilities.reduce((s, c) => s + (c.metrics?.quarterly_savings ?? 0), 0);
  const yearlyTotal = capabilities.reduce((s, c) => s + (c.metrics?.yearly_savings ?? 0), 0);
  const avgHours = capabilities.length
    ? capabilities.reduce((s, c) => s + (c.metrics?.avg_hours_saved_per_run ?? 0), 0) / capabilities.length
    : 0;

  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const base = monthlyTotal * 0.85;
    const variance = monthlyTotal * 0.3 * Math.sin(i * 0.8 + 1);
    return Math.max(base + variance, 0);
  });

  const weeklyUsage = Array.from({ length: 8 }, (_, i) => ({
    label: `W${i + 1}`,
    value: Math.floor(totalRuns / 8 + Math.sin(i) * (totalRuns / 16)),
  }));

  const pieSlices = capabilities.map((c, i) => ({
    label: c.name.length > 22 ? c.name.slice(0, 22) + '…' : c.name,
    value: c.metrics?.ytd_hours_saved ?? 0,
    color: ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'][i % 7],
  }));

  const kpiCards = [
    { icon: <Clock size={18} className="text-blue-600" />, bg: 'bg-blue-50', label: 'Avg Hours / Run', value: fmtH(avgHours) },
    { icon: <RefreshCw size={18} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Total Runs', value: totalRuns.toLocaleString() },
    { icon: <DollarSign size={18} className="text-sky-600" />, bg: 'bg-sky-50', label: 'Weekly Savings', value: fmt$(weeklyTotal) },
    { icon: <DollarSign size={18} className="text-teal-600" />, bg: 'bg-teal-50', label: 'Monthly Savings', value: fmt$(monthlyTotal) },
    { icon: <BarChart2 size={18} className="text-orange-500" />, bg: 'bg-orange-50', label: 'Quarterly Savings', value: fmt$(quarterlyTotal) },
    { icon: <TrendingUp size={18} className="text-indigo-500" />, bg: 'bg-indigo-50', label: 'Yearly Savings', value: fmt$(yearlyTotal) },
    { icon: <Award size={18} className="text-rose-500" />, bg: 'bg-rose-50', label: 'Financial Savings', value: fmt$(totalFinancial) },
    { icon: <Target size={18} className="text-violet-600" />, bg: 'bg-violet-50', label: 'YTD Hours Saved', value: fmtH(totalHours) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
              {capabilityId ? 'Capability Metrics' : 'Portfolio Metrics'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {capabilityId && capabilities[0] ? capabilities[0].name : 'Capability Repository'} — Metrics Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Performance analytics and savings reporting</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download size={15} /> Export Metrics
            </button>
            <button
              onClick={() => {
                const first = capabilities.find(c => c.metrics);
                if (first) startEdit(first);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Edit3 size={15} /> Edit Metrics
            </button>
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={15} /> Back to Repository
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{k.label}</span>
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>{k.icon}</div>
              </div>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Progress KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'YTD Hours Saved', value: fmtH(totalHours), pct: 75, color: 'blue', icon: <Clock size={16} className="text-blue-600" />, bg: 'bg-blue-50', bar: 'bg-blue-600', trackBg: 'bg-blue-50' },
            { label: 'Operational Efficiency Gain', value: fmtPct(avgEfficiency), pct: avgEfficiency, color: 'emerald', icon: <Zap size={16} className="text-emerald-600" />, bg: 'bg-emerald-50', bar: 'bg-emerald-500', trackBg: 'bg-emerald-50' },
            { label: 'Automation Accuracy', value: fmtPct(avgAccuracy), pct: avgAccuracy, color: 'sky', icon: <Target size={16} className="text-sky-600" />, bg: 'bg-sky-50', bar: 'bg-sky-500', trackBg: 'bg-sky-50' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{k.label}</span>
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>{k.icon}</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <div className={`mt-2 ${k.trackBg} rounded-full h-1.5`}>
                <div className={`${k.bar} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(k.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Monthly Savings Trend" subtitle="Jan – Dec financial savings">
            <LineChart data={monthlyTrend} label="monthly" color="#2563eb" />
          </ChartCard>
          <ChartCard title="Capability Usage Trend" subtitle="Weekly execution volume">
            <BarChartSvg data={weeklyUsage} color="#0ea5e9" />
          </ChartCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Hours Saved Distribution" subtitle="Savings contribution by capability">
            <PieChart slices={pieSlices} />
          </ChartCard>
          <ChartCard title="AI vs Non-AI Savings Comparison" subtitle="YTD financial savings by capability type">
            <StackedBar capabilities={capabilities} />
          </ChartCard>
        </div>

        {/* Detailed Metrics Table with Edit */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Detailed Metrics</h3>
              <p className="text-xs text-gray-500 mt-0.5">Click the edit icon on any row to update metrics — changes reflect immediately across the dashboard.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Capability</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Runs</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">YTD Hours</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">YTD Savings</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Efficiency</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Run</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {capabilities.map((c, i) => {
                  const m = c.metrics;
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className={`transition-colors ${isEditing ? 'bg-blue-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm leading-snug">{c.name}</div>
                        <div className={`text-xs mt-0.5 font-medium ${c.capability_type === 'AI' ? 'text-violet-600' : 'text-blue-600'}`}>{c.capability_type}</div>
                      </td>

                      {isEditing && editForm ? (
                        <>
                          <td className="px-4 py-3"><MetricInput value={editForm.total_runs} onChange={v => setField('total_runs', v)} /></td>
                          <td className="px-4 py-3"><MetricInput value={editForm.ytd_hours_saved} onChange={v => setField('ytd_hours_saved', v)} /></td>
                          <td className="px-4 py-3"><MetricInput value={editForm.ytd_financial_savings} onChange={v => setField('ytd_financial_savings', v)} /></td>
                          <td className="px-4 py-3"><MetricInput value={editForm.monthly_savings} onChange={v => setField('monthly_savings', v)} /></td>
                          <td className="px-4 py-3"><MetricInput value={editForm.operational_efficiency_gain_pct} onChange={v => setField('operational_efficiency_gain_pct', v)} suffix="%" /></td>
                          <td className="px-4 py-4 text-right text-gray-400 text-xs">—</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => saveEdit(c)} disabled={savingId === c.id} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
                                {savingId === c.id ? '...' : <><Save size={12} /> Save</>}
                              </button>
                              <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-right text-gray-600 tabular-nums">{m?.total_runs?.toLocaleString() ?? '—'}</td>
                          <td className="px-4 py-4 text-right text-gray-600 tabular-nums">{m ? fmtH(m.ytd_hours_saved) : '—'}</td>
                          <td className="px-4 py-4 text-right font-semibold text-emerald-600 tabular-nums">{m ? fmt$(m.ytd_financial_savings) : '—'}</td>
                          <td className="px-4 py-4 text-right text-gray-600 tabular-nums">{m ? fmt$(m.monthly_savings) : '—'}</td>
                          <td className="px-4 py-4 text-right">
                            {m ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                {fmtPct(m.operational_efficiency_gain_pct)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-500 text-xs">
                            {m?.last_execution_date
                              ? new Date(m.last_execution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {savedId === c.id ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold px-2 py-1">
                                  <Check size={12} /> Saved
                                </span>
                              ) : (
                                <button
                                  onClick={() => startEdit(c)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                  title="Edit metrics"
                                >
                                  <Edit3 size={12} /> Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expand all metrics panel — shown when a capability is being edited */}
        {editingId && editForm && (() => {
          const cap = capabilities.find(c => c.id === editingId);
          if (!cap) return null;
          return (
            <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Full Metrics Edit — {cap.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Edit all metric fields below. Changes are saved when you click Save in the table row.</p>
                </div>
                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(
                  [
                    { label: 'Avg Hours Saved Per Run', key: 'avg_hours_saved_per_run' },
                    { label: 'Total Runs', key: 'total_runs' },
                    { label: 'YTD Hours Saved', key: 'ytd_hours_saved' },
                    { label: 'YTD Financial Savings ($)', key: 'ytd_financial_savings' },
                    { label: 'Weekly Savings ($)', key: 'weekly_savings' },
                    { label: 'Monthly Savings ($)', key: 'monthly_savings' },
                    { label: 'Quarterly Savings ($)', key: 'quarterly_savings' },
                    { label: 'Yearly Savings ($)', key: 'yearly_savings' },
                    { label: 'Financial Savings ($)', key: 'financial_savings' },
                    { label: 'Operational Efficiency Gain (%)', key: 'operational_efficiency_gain_pct' },
                    { label: 'Automation Accuracy (%)', key: 'automation_accuracy_pct' },
                  ] as { label: string; key: keyof MetricsEditForm }[]
                ).map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                    <input
                      type="number"
                      value={editForm[f.key]}
                      onChange={e => setField(f.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                <button onClick={cancelEdit} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={() => saveEdit(cap)}
                  disabled={savingId === cap.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {savingId === cap.id ? 'Saving...' : <><Save size={14} /> Save All Metrics</>}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function MetricInput({ value, onChange, suffix }: { value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tabular-nums"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
