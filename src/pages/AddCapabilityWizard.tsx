import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, X, Plus, FolderOpen, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { WizardFormData, CapabilityType, AccessType } from '../lib/types';

const INITIAL_FORM: WizardFormData = {
  name: '',
  short_description: '',
  area_of_impact: [],
  capability_type: 'Non-AI',
  ytd_hours_saved: '',
  ytd_financial_savings: '',
  long_description: '',
  how_to_access: '',
  prerequisites: '',
  where_to_execute: '',
  executable_path: '',
  estimated_savings: '',
  point_of_contact: '',
  implemented_team: '',
  access_type: 'shared_path',
  shared_path_location: '',
  url_location: '',
  avg_hours_saved_per_run: '',
  total_runs: '',
  monthly_savings: '',
  weekly_savings: '',
  quarterly_savings: '',
  yearly_savings: '',
  financial_savings: '',
  operational_efficiency_gain_pct: '',
  automation_accuracy_pct: '',
};

const STEPS = ['Basic Information', 'Detailed Information', 'Access Configuration', 'Operational Metrics'];

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export default function AddCapabilityWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [areaInput, setAreaInput] = useState('');

  const set = (field: keyof WizardFormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addArea = () => {
    const v = areaInput.trim();
    if (v && !form.area_of_impact.includes(v)) {
      set('area_of_impact', [...form.area_of_impact, v]);
    }
    setAreaInput('');
  };

  const removeArea = (a: string) => {
    set('area_of_impact', form.area_of_impact.filter(x => x !== a));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: cap, error } = await supabase
      .from('capabilities')
      .insert({
        name: form.name,
        short_description: form.short_description,
        long_description: form.long_description,
        area_of_impact: form.area_of_impact,
        capability_type: form.capability_type as CapabilityType,
        how_to_access: form.how_to_access,
        prerequisites: form.prerequisites,
        where_to_execute: form.where_to_execute,
        executable_path: form.executable_path,
        estimated_savings: form.estimated_savings,
        point_of_contact: form.point_of_contact,
        implemented_team: form.implemented_team,
        access_type: form.access_type as AccessType,
        shared_path_location: form.shared_path_location,
        url_location: form.url_location,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !cap) { setSaving(false); return; }

    await supabase.from('capability_metrics').insert({
      capability_id: cap.id,
      avg_hours_saved_per_run: parseFloat(form.avg_hours_saved_per_run) || 0,
      total_runs: parseInt(form.total_runs) || 0,
      ytd_hours_saved: parseFloat(form.ytd_hours_saved) || 0,
      ytd_financial_savings: parseFloat(form.ytd_financial_savings) || 0,
      weekly_savings: parseFloat(form.weekly_savings) || 0,
      monthly_savings: parseFloat(form.monthly_savings) || 0,
      quarterly_savings: parseFloat(form.quarterly_savings) || 0,
      yearly_savings: parseFloat(form.yearly_savings) || 0,
      financial_savings: parseFloat(form.financial_savings) || 0,
      operational_efficiency_gain_pct: parseFloat(form.operational_efficiency_gain_pct) || 0,
      automation_accuracy_pct: parseFloat(form.automation_accuracy_pct) || 0,
      last_execution_date: null,
    });

    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Capability</h1>
            <p className="text-sm text-gray-500 mt-1">Register a new capability in the repository</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="px-8 py-8 max-w-3xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-blue-600 z-0 transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === step
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`mt-2 text-xs font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {step === 0 && <StepBasic form={form} set={set} areaInput={areaInput} setAreaInput={setAreaInput} addArea={addArea} removeArea={removeArea} />}
          {step === 1 && <StepDetailed form={form} set={set} />}
          {step === 2 && <StepAccess form={form} set={set} />}
          {step === 3 && <StepMetrics form={form} set={set} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {step === 0 ? (
              <><X size={15} /> Cancel</>
            ) : (
              <><ChevronLeft size={15} /> Previous</>
            )}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : <><Check size={15} /> Save Capability</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2A ───────────────────────────────────────────────────────────────
function StepBasic({ form, set, areaInput, setAreaInput, addArea, removeArea }: {
  form: WizardFormData;
  set: (f: keyof WizardFormData, v: string | string[]) => void;
  areaInput: string;
  setAreaInput: (v: string) => void;
  addArea: () => void;
  removeArea: (a: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Capability Information</h2>
      <p className="text-sm text-gray-500 mb-6">Provide the core details for this capability.</p>
      <div className="space-y-4">
        <Field label="Capability Name" required>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. OEC Medicare Member Flow"
            className={inputCls}
          />
        </Field>

        <Field label="Short Description" required>
          <textarea
            rows={3}
            value={form.short_description}
            onChange={e => set('short_description', e.target.value)}
            placeholder="Brief summary of the capability..."
            className={inputCls}
          />
        </Field>

        <Field label="Area of Impact" required>
          <div className="flex gap-2">
            <input
              type="text"
              value={areaInput}
              onChange={e => setAreaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
              placeholder="e.g. Medicare Enrollment"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={addArea}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {form.area_of_impact.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.area_of_impact.map(a => (
                <span key={a} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {a}
                  <button onClick={() => removeArea(a)} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </Field>

        <Field label="Capability Type" required>
          <div className="flex gap-3">
            {(['Non-AI', 'AI'] as CapabilityType[]).map(t => (
              <label
                key={t}
                className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  form.capability_type === t ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={t}
                  checked={form.capability_type === t}
                  onChange={() => set('capability_type', t)}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">{t === 'AI' ? 'AI Capability' : 'Non-AI Capability'}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="YTD Hours Saved">
            <input
              type="number"
              value={form.ytd_hours_saved}
              onChange={e => set('ytd_hours_saved', e.target.value)}
              placeholder="e.g. 3500"
              className={inputCls}
            />
          </Field>
          <Field label="YTD Financial Savings ($)">
            <input
              type="number"
              value={form.ytd_financial_savings}
              onChange={e => set('ytd_financial_savings', e.target.value)}
              placeholder="e.g. 450000"
              className={inputCls}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2B ───────────────────────────────────────────────────────────────
function StepDetailed({ form, set }: { form: WizardFormData; set: (f: keyof WizardFormData, v: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Capability Details</h2>
      <p className="text-sm text-gray-500 mb-6">Provide comprehensive operational details.</p>
      <div className="space-y-4">
        <Field label="Long Description">
          <textarea rows={4} value={form.long_description} onChange={e => set('long_description', e.target.value)} placeholder="Detailed description of the capability..." className={inputCls} />
        </Field>
        <Field label="How to Access">
          <textarea rows={2} value={form.how_to_access} onChange={e => set('how_to_access', e.target.value)} placeholder="Instructions for accessing this capability..." className={inputCls} />
        </Field>
        <Field label="Prerequisites to Execute">
          <textarea rows={2} value={form.prerequisites} onChange={e => set('prerequisites', e.target.value)} placeholder="Required permissions, tools, or configurations..." className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Where to Execute">
            <input type="text" value={form.where_to_execute} onChange={e => set('where_to_execute', e.target.value)} placeholder="e.g. Internal Operations Server" className={inputCls} />
          </Field>
          <Field label="Executable Path">
            <input type="text" value={form.executable_path} onChange={e => set('executable_path', e.target.value)} placeholder="\\Server\App\run.bat" className={inputCls} />
          </Field>
        </div>
        <Field label="Estimated Savings">
          <input type="text" value={form.estimated_savings} onChange={e => set('estimated_savings', e.target.value)} placeholder="e.g. $450K annual; 3,500+ hours" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Point of Contact (POC)">
            <input type="text" value={form.point_of_contact} onChange={e => set('point_of_contact', e.target.value)} placeholder="Name – email@company.com" className={inputCls} />
          </Field>
          <Field label="Implemented Team Name">
            <input type="text" value={form.implemented_team} onChange={e => set('implemented_team', e.target.value)} placeholder="e.g. Medicare Automation Team" className={inputCls} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2C ───────────────────────────────────────────────────────────────
function StepAccess({ form, set }: { form: WizardFormData; set: (f: keyof WizardFormData, v: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Execution Access Details</h2>
      <p className="text-sm text-gray-500 mb-6">Configure how users access and execute this capability.</p>
      <div className="space-y-5">
        <Field label="Access Type" required>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                form.access_type === 'shared_path' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" value="shared_path" checked={form.access_type === 'shared_path'} onChange={() => set('access_type', 'shared_path')} className="text-blue-600" />
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Shared Path</span>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                form.access_type === 'url' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" value="url" checked={form.access_type === 'url'} onChange={() => set('access_type', 'url')} className="text-blue-600" />
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">URL</span>
              </div>
            </label>
          </div>
        </Field>

        {form.access_type === 'shared_path' ? (
          <Field label="Shared Path Location" required>
            <input
              type="text"
              value={form.shared_path_location}
              onChange={e => set('shared_path_location', e.target.value)}
              placeholder="\\Server\Applications\Capability\"
              className={inputCls}
            />
          </Field>
        ) : (
          <Field label="URL Location" required>
            <input
              type="url"
              value={form.url_location}
              onChange={e => set('url_location', e.target.value)}
              placeholder="https://application.company.com"
              className={inputCls}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

// ─── Step 2D ───────────────────────────────────────────────────────────────
function StepMetrics({ form, set }: { form: WizardFormData; set: (f: keyof WizardFormData, v: string) => void }) {
  const fields: { label: string; key: keyof WizardFormData; placeholder: string }[] = [
    { label: 'Avg Hours Saved Per Run', key: 'avg_hours_saved_per_run', placeholder: 'e.g. 14.2' },
    { label: 'Total Runs', key: 'total_runs', placeholder: 'e.g. 246' },
    { label: 'Monthly Savings ($)', key: 'monthly_savings', placeholder: 'e.g. 37500' },
    { label: 'Weekly Savings ($)', key: 'weekly_savings', placeholder: 'e.g. 8500' },
    { label: 'Quarterly Savings ($)', key: 'quarterly_savings', placeholder: 'e.g. 112500' },
    { label: 'Yearly Savings ($)', key: 'yearly_savings', placeholder: 'e.g. 450000' },
    { label: 'Financial Savings ($)', key: 'financial_savings', placeholder: 'e.g. 450000' },
    { label: 'Operational Efficiency Gain (%)', key: 'operational_efficiency_gain_pct', placeholder: 'e.g. 78.5' },
    { label: 'Automation Accuracy (%)', key: 'automation_accuracy_pct', placeholder: 'e.g. 99.1' },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Operational Metrics</h2>
      <p className="text-sm text-gray-500 mb-6">Enter performance and savings metrics for reporting.</p>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <Field key={f.key} label={f.label}>
            <input
              type="number"
              value={form[f.key] as string}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className={inputCls}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-gray-400';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
