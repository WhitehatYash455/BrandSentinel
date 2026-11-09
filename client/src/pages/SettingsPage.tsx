import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Cpu, Bell, Key, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings & Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage user identity, active enterprise workspace parameters, and AI governance engine settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-20 h-20 rounded-full border-2 border-brand-500 object-cover shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">{user?.fullName}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 uppercase">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Brand Workspace:</span>
              <strong className="text-slate-900">Vajra Sentinel</strong>
            </div>
            <div className="flex justify-between">
              <span>Security Tier:</span>
              <strong className="text-slate-900">Enterprise SOC2</strong>
            </div>
            <div className="flex justify-between">
              <span>Session Status:</span>
              <strong className="text-emerald-600">Authenticated (JWT)</strong>
            </div>
          </div>
        </div>

        {/* Right Columns: Engine & Workspace Configuration (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* AI Governance Engine Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-brand-600" />
              <span>AI Governance Engine Architecture</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Deterministic Rule Engine</p>
                  <p className="text-slate-500 text-[11px]">
                    Prohibited terms regex matching, length constraints, required claim disclaimers.
                  </p>
                </div>
                <span className="flex items-center text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Active
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Retrieval-Augmented Brand Grounding</p>
                  <p className="text-slate-500 text-[11px]">
                    BM25 & Semantic cosine similarity lookup across active approved brand facts and voice rules.
                  </p>
                </div>
                <span className="flex items-center text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Active
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Factual Claim Discrepancy & Gap Detector</p>
                  <p className="text-slate-500 text-[11px]">
                    Identifies metric discrepancies and marks unverified statements with "Approved evidence not found".
                  </p>
                </div>
                <span className="flex items-center text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Core Mandate Banner */}
          <div className="bg-navy-900 text-white rounded-xl p-6 border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center space-x-2 text-brand-400">
              <Shield className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Brand Sentinel Operating Standard</h4>
            </div>
            <p className="text-sm font-semibold text-slate-100">
              "EVERY PIECE OF CONTENT. ONE APPROVED BRAND TRUTH."
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated intelligence surfaces verified findings and suggests non-destructive revisions, while the final publication decision remains strictly under human reviewer stewardship.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
