import { useState, useEffect } from 'react';
import {
  ArrowLeft, Edit3, Bot, Cpu, MapPin, Users, Mail, FolderOpen,
  Globe, Key, Terminal, DollarSign, Info, CheckCircle, Save, X, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Capability, CapabilityType, AccessType } from '../lib/types';

interface Props {
  capabilityId: string;
  onBack: () => void;
}

interface EditForm {
  name: string;
  short_description: string;
  long_description: string;
  area_of_impact: string[];
  capability_type: CapabilityType;
  how_to_access: string;
  prerequisites: string;
  where_to_execute: string;
  executable_path: string;
  estimated_savings: string;
  point_of_contact: string;
  implemented_team: string;
  access_type: AccessType;
  shared_path_location: string;
  url_location: string;
}

function capToForm(c: Capability): EditForm {
  return {
    name: c.name,
    short_description: c.short_description,
    long_description: c.long_description,
    area_of_impact: [...c.area_of_impact],
    capability_type: c.capability_type,
    how_to_access: c.how_to_access,
    prerequisites: c.prerequisites,
    where_to_execute: c.where_to_execute,
    executable_path: c.executable_path,
    estimated_savings: c.estimated_savings,
    point_of_contact: c.point_of_contact,
    implemented_team: c.implemented_team,
    access_type: c.access_type,
    shared_path_location: c.shared_path_location,
    url_location: c.url_location,
  };
}

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-gray-400';

export default function CapabilityDetails({ capabilityId, onBack }: Props) {
  const [capability, setCapability] = useState<Capability | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [areaInput, setAreaInput] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('capabilities')
        .select('*')
        .eq('id', capabilityId)
        .maybeSingle();
      setCapability(data);
      setLoading(false);
    }
    load();
  }, [capabilityId]);

  const startEdit = () => {
    if (capability) {
      setForm(capToForm(capability));
      setEditing(true);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
    setAreaInput('');
  };

  const set = (field: keyof EditForm, value: string | string[]) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const addArea = () => {
    const v = areaInput.trim();
    if (v && form && !form.area_of_impact.includes(v)) {
      set('area_of_impact', [...form.area_of_impact, v]);
    }
    setAreaInput('');
  };

  const removeArea = (a: string) => {
    if (form) set('area_of_impact', form.area_of_impact.filter(x => x !== a));
  };

  const handleSave = async () => {
    if (!form || !capability) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('capabilities')
      .update({ ...form, last_updated: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', capability.id)
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setCapability(data);
      setEditing(false);
      setForm(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!capability) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Capability not found</p>
          <button onClick={onBack} className="mt-4 text-blue-600 text-sm hover:underline">Back to Repository</button>
        </div>
      </div>
    );
  }

  if (editing && form) {
    return <EditView form={form} set={set} areaInput={areaInput} setAreaInput={setAreaInput} addArea={addArea} removeArea={removeArea} saving={saving} onSave={handleSave} onCancel={cancelEdit} />;
  }

  const isAI = capability.capability_type === 'AI';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${isAI ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                {isAI ? <Bot size={11} /> : <Cpu size={11} />}
                {capability.capability_type}
              </span>
              {capability.area_of_impact.map(a => (
                <span key={a} className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <MapPin size={10} /> {a}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{capability.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{capability.short_description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Edit3 size={15} /> Edit Capability
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={15} /> Back to Repository
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <Section icon={<Info size={16} className="text-blue-600" />} title="Description">
              <p className="text-gray-700 text-sm leading-relaxed">{capability.long_description || capability.short_description}</p>
            </Section>
            {capability.how_to_access && (
              <Section icon={<Key size={16} className="text-emerald-600" />} title="How to Access">
                <p className="text-gray-700 text-sm leading-relaxed">{capability.how_to_access}</p>
              </Section>
            )}
            {capability.prerequisites && (
              <Section icon={<CheckCircle size={16} className="text-sky-600" />} title="Prerequisites to Execute">
                <p className="text-gray-700 text-sm leading-relaxed">{capability.prerequisites}</p>
              </Section>
            )}
            <Section icon={<Terminal size={16} className="text-orange-500" />} title="Execution Details">
              <div className="space-y-3">
                {capability.where_to_execute && <DetailRow label="Execution Location" value={capability.where_to_execute} />}
                {capability.executable_path && <DetailRow label="Executable Path" value={capability.executable_path} mono />}
                <DetailRow label="Access Type" value={capability.access_type === 'shared_path' ? 'Shared Network Path' : 'Web URL'} />
                {capability.access_type === 'shared_path' && capability.shared_path_location && <DetailRow label="Shared Path" value={capability.shared_path_location} mono />}
                {capability.access_type === 'url' && capability.url_location && <DetailRow label="URL" value={capability.url_location} mono />}
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Section icon={<DollarSign size={16} className="text-emerald-600" />} title="Savings Details">
              <p className="text-gray-700 text-sm">{capability.estimated_savings || 'Not specified'}</p>
            </Section>
            <Section icon={<Users size={16} className="text-blue-600" />} title="Team Information">
              <div className="space-y-3">
                {capability.point_of_contact && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Point of Contact</p>
                    <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400 flex-shrink-0" /><p className="text-sm text-gray-800">{capability.point_of_contact}</p></div>
                  </div>
                )}
                {capability.implemented_team && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Implemented By</p>
                    <div className="flex items-center gap-2"><Users size={13} className="text-gray-400 flex-shrink-0" /><p className="text-sm text-gray-800">{capability.implemented_team}</p></div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
                  <p className="text-sm text-gray-800">{new Date(capability.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </Section>
            <Section icon={capability.access_type === 'url' ? <Globe size={16} className="text-sky-600" /> : <FolderOpen size={16} className="text-sky-600" />} title="Quick Access">
              {capability.access_type === 'shared_path' ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Shared Path</p>
                  <code className="text-xs text-gray-800 break-all font-mono">{capability.shared_path_location || 'Not configured'}</code>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Application URL</p>
                  <code className="text-xs text-sky-700 break-all font-mono">{capability.url_location || 'Not configured'}</code>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit View ────────────────────────────────────────────────────────────────
function EditView({
  form, set, areaInput, setAreaInput, addArea, removeArea, saving, onSave, onCancel,
}: {
  form: EditForm;
  set: (f: keyof EditForm, v: string | string[]) => void;
  areaInput: string;
  setAreaInput: (v: string) => void;
  addArea: () => void;
  removeArea: (a: string) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Editing</p>
            <h1 className="text-2xl font-bold text-gray-900">{form.name || 'Capability'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <X size={15} /> Cancel
            </button>
            <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl space-y-6">
        {/* Basic Info */}
        <FormCard title="Basic Information">
          <div className="space-y-4">
            <FormField label="Capability Name" required>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inp} />
            </FormField>
            <FormField label="Short Description" required>
              <textarea rows={2} value={form.short_description} onChange={e => set('short_description', e.target.value)} className={inp} />
            </FormField>
            <FormField label="Area of Impact">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={areaInput}
                  onChange={e => setAreaInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
                  placeholder="Add area and press Enter"
                  className={`${inp} flex-1`}
                />
                <button type="button" onClick={addArea} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
            </FormField>
            <FormField label="Capability Type">
              <div className="flex gap-3">
                {(['Non-AI', 'AI'] as CapabilityType[]).map(t => (
                  <label key={t} className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${form.capability_type === t ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" value={t} checked={form.capability_type === t} onChange={() => set('capability_type', t)} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{t === 'AI' ? 'AI Capability' : 'Non-AI Capability'}</span>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="Estimated Savings">
              <input type="text" value={form.estimated_savings} onChange={e => set('estimated_savings', e.target.value)} placeholder="e.g. $450K annual; 3,500+ hours" className={inp} />
            </FormField>
          </div>
        </FormCard>

        {/* Detailed Info */}
        <FormCard title="Detailed Information">
          <div className="space-y-4">
            <FormField label="Long Description">
              <textarea rows={4} value={form.long_description} onChange={e => set('long_description', e.target.value)} className={inp} />
            </FormField>
            <FormField label="How to Access">
              <textarea rows={2} value={form.how_to_access} onChange={e => set('how_to_access', e.target.value)} className={inp} />
            </FormField>
            <FormField label="Prerequisites to Execute">
              <textarea rows={2} value={form.prerequisites} onChange={e => set('prerequisites', e.target.value)} className={inp} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Where to Execute">
                <input type="text" value={form.where_to_execute} onChange={e => set('where_to_execute', e.target.value)} className={inp} />
              </FormField>
              <FormField label="Executable Path">
                <input type="text" value={form.executable_path} onChange={e => set('executable_path', e.target.value)} className={inp} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Point of Contact">
                <input type="text" value={form.point_of_contact} onChange={e => set('point_of_contact', e.target.value)} placeholder="Name – email@company.com" className={inp} />
              </FormField>
              <FormField label="Implemented Team">
                <input type="text" value={form.implemented_team} onChange={e => set('implemented_team', e.target.value)} className={inp} />
              </FormField>
            </div>
          </div>
        </FormCard>

        {/* Access Config */}
        <FormCard title="Access Configuration">
          <div className="space-y-4">
            <FormField label="Access Type">
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${form.access_type === 'shared_path' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value="shared_path" checked={form.access_type === 'shared_path'} onChange={() => set('access_type', 'shared_path')} className="text-blue-600" />
                  <div className="flex items-center gap-2"><FolderOpen size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">Shared Path</span></div>
                </label>
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${form.access_type === 'url' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value="url" checked={form.access_type === 'url'} onChange={() => set('access_type', 'url')} className="text-blue-600" />
                  <div className="flex items-center gap-2"><Globe size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">URL</span></div>
                </label>
              </div>
            </FormField>
            {form.access_type === 'shared_path' ? (
              <FormField label="Shared Path Location">
                <input type="text" value={form.shared_path_location} onChange={e => set('shared_path_location', e.target.value)} placeholder="\\Server\Applications\Capability\" className={inp} />
              </FormField>
            ) : (
              <FormField label="URL Location">
                <input type="url" value={form.url_location} onChange={e => set('url_location', e.target.value)} placeholder="https://application.company.com" className={inp} />
              </FormField>
            )}
          </div>
        </FormCard>

        {/* Save footer */}
        <div className="flex justify-end gap-3 pb-8">
          <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <X size={15} /> Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
            {saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">{icon}<h3 className="text-sm font-bold text-gray-900">{title}</h3></div>
      {children}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm text-gray-800 break-all ${mono ? 'font-mono bg-gray-50 px-2.5 py-1.5 rounded text-xs' : ''}`}>{value}</p>
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
