import { useState, useEffect } from 'react';
import { ArrowLeft, FolderOpen, Globe, ExternalLink, Edit3, User, Users, Calendar, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Capability } from '../lib/types';

interface Props {
  capabilityId: string;
  onBack: () => void;
}

export default function TriggerCapability({ capabilityId, onBack }: Props) {
  const [capability, setCapability] = useState<Capability | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          <p className="text-gray-600">Capability not found</p>
          <button onClick={onBack} className="mt-3 text-blue-600 text-sm hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const isSharedPath = capability.access_type === 'shared_path';
  const accessValue = isSharedPath ? capability.shared_path_location : capability.url_location;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Trigger Capability</p>
            <h1 className="text-2xl font-bold text-gray-900">{capability.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{capability.short_description}</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Access Card */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-xl border-2 shadow-sm p-6 ${isSharedPath ? 'border-blue-200' : 'border-sky-200'}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSharedPath ? 'bg-blue-50' : 'bg-sky-50'}`}>
                  {isSharedPath
                    ? <FolderOpen size={22} className="text-blue-600" />
                    : <Globe size={22} className="text-sky-600" />
                  }
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {isSharedPath ? 'Shared Path Access' : 'Web Application Access'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isSharedPath
                      ? 'Launch via network share location'
                      : 'Launch via web browser application'
                    }
                  </p>
                </div>
              </div>

              {/* Path / URL display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-5 flex items-center gap-3">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                  {accessValue || 'No location configured'}
                </code>
                {accessValue && (
                  <button
                    onClick={() => handleCopy(accessValue)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                )}
              </div>

              {/* Launch Button */}
              {accessValue && (
                <button
                  onClick={() => {
                    if (!isSharedPath) window.open(accessValue, '_blank', 'noopener,noreferrer');
                    else handleCopy(accessValue);
                  }}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    isSharedPath
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  {isSharedPath
                    ? <><FolderOpen size={16} /> Open Shared Path</>
                    : <><ExternalLink size={16} /> Launch Application</>
                  }
                </button>
              )}

              {isSharedPath && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  Path copied to clipboard — paste in File Explorer or Run dialog
                </p>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Capability Owner</h3>
            <div className="space-y-3">
              {capability.point_of_contact && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Point of Contact</p>
                    <p className="text-sm text-gray-800 mt-0.5">{capability.point_of_contact}</p>
                  </div>
                </div>
              )}
              {capability.implemented_team && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Support Team</p>
                    <p className="text-sm text-gray-800 mt-0.5">{capability.implemented_team}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar size={14} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</p>
                  <p className="text-sm text-gray-800 mt-0.5">
                    {new Date(capability.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          {capability.prerequisites && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Prerequisites</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{capability.prerequisites}</p>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Repository
          </button>
        </div>
      </div>
    </div>
  );
}
