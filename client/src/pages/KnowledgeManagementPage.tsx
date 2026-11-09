import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  BookOpen,
  Volume2,
  ListOrdered,
  FileCheck,
  Shield,
  Layers,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FolderLock
} from 'lucide-react';

export const KnowledgeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'BRAND_ADMIN';

  const [activeTab, setActiveTab] = useState<
    'GUIDELINES' | 'VOICE' | 'TERMINOLOGY' | 'FACTS' | 'CLAIMS' | 'ASSETS' | 'CAMPAIGNS'
  >('GUIDELINES');

  const [knowledge, setKnowledge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [isFactModalOpen, setIsFactModalOpen] = useState(false);

  // Form states for Guideline
  const [gTitle, setGTitle] = useState('');
  const [gCategory, setGCategory] = useState('VOICE_TONE');
  const [gContent, setGContent] = useState('');
  const [gVersion, setGVersion] = useState('1.0');

  // Form states for Terminology
  const [tProhibited, setTProhibited] = useState('');
  const [tPreferred, setTPreferred] = useState('');
  const [tExplanation, setTExplanation] = useState('');
  const [tCategory, setTCategory] = useState('BRAND_IDENTITY');
  const [tSeverity, setTSeverity] = useState('HIGH');

  // Form states for Approved Fact
  const [fClaimText, setFClaimText] = useState('');
  const [fSourceName, setFSourceName] = useState('');
  const [fSourceId, setFSourceId] = useState('');
  const [fCategory, setFCategory] = useState('PRODUCT_SPECS');
  const [fNotes, setFNotes] = useState('');

  const loadBrandKnowledge = async () => {
    try {
      const res = await api.get('/brands/knowledge');
      setKnowledge(res.data);
    } catch (err) {
      console.error('Failed to load brand knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrandKnowledge();
  }, []);

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/brands/guidelines', {
        title: gTitle,
        category: gCategory,
        content: gContent,
        version: gVersion
      });
      setIsGuidelineModalOpen(false);
      setGTitle('');
      setGContent('');
      loadBrandKnowledge();
    } catch (err: any) {
      alert(`Failed to create guideline: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCreateTerminology = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/brands/terminology', {
        prohibitedTerm: tProhibited,
        preferredTerm: tPreferred,
        contextExplanation: tExplanation,
        category: tCategory,
        severity: tSeverity
      });
      setIsTermModalOpen(false);
      setTProhibited('');
      setTPreferred('');
      setTExplanation('');
      loadBrandKnowledge();
    } catch (err: any) {
      alert(`Failed to add terminology rule: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/brands/approved-facts', {
        claimText: fClaimText,
        sourceName: fSourceName,
        sourceId: fSourceId,
        category: fCategory,
        contextNotes: fNotes
      });
      setIsFactModalOpen(false);
      setFClaimText('');
      setFSourceName('');
      setFSourceId('');
      setFNotes('');
      loadBrandKnowledge();
    } catch (err: any) {
      alert(`Failed to register approved fact: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading Brand Truth Repository...</div>;
  }

  const tabs = [
    { key: 'GUIDELINES', label: 'Brand Guidelines', icon: BookOpen, count: knowledge?.guidelines?.length || 0 },
    { key: 'VOICE', label: 'Voice & Tone Rules', icon: Volume2, count: knowledge?.voiceRules?.length || 0 },
    { key: 'TERMINOLOGY', label: 'Terminology Rules', icon: ListOrdered, count: knowledge?.terminologyRules?.length || 0 },
    { key: 'FACTS', label: 'Approved Facts', icon: FileCheck, count: knowledge?.approvedFacts?.length || 0 },
    { key: 'CLAIMS', label: 'Approved Claims', icon: Shield, count: knowledge?.approvedClaims?.length || 0 },
    { key: 'ASSETS', label: 'Brand Assets', icon: FolderLock, count: knowledge?.brandAssets?.length || 0 },
    { key: 'CAMPAIGNS', label: 'Campaign Briefs', icon: Layers, count: knowledge?.campaigns?.length || 0 }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Brand Knowledge Command</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Authoritative Truth
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally governed repository of guidelines, certified facts, and terminology rules used by the AI engine.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            {activeTab === 'GUIDELINES' && (
              <button
                onClick={() => setIsGuidelineModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Brand Guideline
              </button>
            )}
            {activeTab === 'TERMINOLOGY' && (
              <button
                onClick={() => setIsTermModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Terminology Rule
              </button>
            )}
            {activeTab === 'FACTS' && (
              <button
                onClick={() => setIsFactModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Register Approved Fact
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-600 bg-brand-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Guidelines */}
      {activeTab === 'GUIDELINES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledge?.guidelines?.map((g: any) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                    {g.category}
                  </span>
                  <span className="text-xs font-bold text-slate-600">v{g.current_version}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{g.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                  {g.current_content}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  {g.status}
                </span>
                <span>Effective: {g.effective_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Voice & Tone Rules */}
      {activeTab === 'VOICE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledge?.voiceRules?.map((rule: any) => (
            <div key={rule.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{rule.trait_name}</h3>
                <SeverityBadge severity={rule.severity} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-emerald-950">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 block mb-1">
                    DO (Required Tone)
                  </span>
                  {rule.do_guideline}
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-lg text-rose-950">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-rose-700 block mb-1">
                    DON'T (Prohibited)
                  </span>
                  {rule.dont_guideline}
                </div>

                {rule.example_good && (
                  <p className="text-[11px] text-slate-600 italic">
                    <strong>Ex (Good):</strong> "{rule.example_good}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Terminology Rules */}
      {activeTab === 'TERMINOLOGY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Prohibited Term
                </th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Preferred Replacement
                </th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Governance Context
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {knowledge?.terminologyRules?.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3 font-bold text-rose-600 line-through">
                    {t.prohibited_term}
                  </td>
                  <td className="px-6 py-3 font-semibold text-emerald-700">
                    {t.preferred_term || 'Rephrase with context'}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-600 uppercase text-[10px]">
                    {t.category}
                  </td>
                  <td className="px-6 py-3">
                    <SeverityBadge severity={t.severity} />
                  </td>
                  <td className="px-6 py-3 text-slate-600 max-w-sm">
                    {t.context_explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Approved Facts */}
      {activeTab === 'FACTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {knowledge?.approvedFacts?.map((fact: any) => (
            <div key={fact.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                  {fact.category}
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {fact.source_id} (v{fact.source_version})
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900 leading-snug">
                "{fact.claim_text}"
              </p>

              {fact.context_notes && (
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                  <strong>Verification Note:</strong> {fact.context_notes}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Certified Source: {fact.source_name}</span>
                <span>Effective: {fact.effective_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Approved Claims */}
      {activeTab === 'CLAIMS' && (
        <div className="space-y-4">
          {knowledge?.approvedClaims?.map((claim: any) => (
            <div key={claim.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Approved Marketing Claim Statement</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  APPROVED
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 italic">
                "{claim.claim_statement}"
              </p>
              {claim.required_disclaimer && (
                <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Mandatory Legal Disclaimer:</span>
                  {claim.required_disclaimer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Brand Assets */}
      {activeTab === 'ASSETS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {knowledge?.brandAssets?.map((asset: any) => (
            <div key={asset.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{asset.asset_name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                  {asset.asset_type}
                </span>
              </div>
              <div className="text-xs space-y-2">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Usage Rules:</span>
                  {asset.usage_guidelines}
                </div>
                <div className="p-3 bg-rose-50/60 rounded border border-rose-200 text-rose-900">
                  <span className="font-bold text-rose-950 block mb-1">Strict Restrictions:</span>
                  {asset.restrictions}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Campaigns */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-4">
          {knowledge?.campaigns?.map((camp: any) => (
            <div key={camp.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-brand-600 font-bold uppercase">{camp.code}</span>
                  <h3 className="text-base font-bold text-slate-900">{camp.name}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {camp.status}
                </span>
              </div>
              <p className="text-xs text-slate-600">{camp.description}</p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Target Audience: <strong className="text-slate-800">{camp.target_audience}</strong></span>
                <span>Active: {camp.start_date} to {camp.end_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Guideline Modal */}
      <Modal isOpen={isGuidelineModalOpen} onClose={() => setIsGuidelineModalOpen(false)} title="Add Brand Guideline">
        <form onSubmit={handleCreateGuideline} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Guideline Title</label>
            <input
              type="text"
              required
              value={gTitle}
              onChange={(e) => setGTitle(e.target.value)}
              placeholder="e.g. Executive Editorial Standards 2026"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
            <select
              value={gCategory}
              onChange={(e) => setGCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="VOICE_TONE">Voice & Tone</option>
              <option value="EDITORIAL">Editorial</option>
              <option value="LEGAL_COMPLIANCE">Legal Compliance</option>
              <option value="CAMPAIGN">Campaign</option>
              <option value="VISUAL">Visual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Guideline Policy Content</label>
            <textarea
              rows={4}
              required
              value={gContent}
              onChange={(e) => setGContent(e.target.value)}
              placeholder="Explain mandatory rules, tone expectations, and compliance guidelines."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGuidelineModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Publish Guideline
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Terminology Modal */}
      <Modal isOpen={isTermModalOpen} onClose={() => setIsTermModalOpen(false)} title="Register Terminology Rule">
        <form onSubmit={handleCreateTerminology} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Prohibited Term</label>
            <input
              type="text"
              required
              value={tProhibited}
              onChange={(e) => setTProhibited(e.target.value)}
              placeholder="e.g. cheap"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Preferred Replacement</label>
            <input
              type="text"
              value={tPreferred}
              onChange={(e) => setTPreferred(e.target.value)}
              placeholder="e.g. cost-effective / high ROI"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Context Explanation</label>
            <textarea
              rows={3}
              required
              value={tExplanation}
              onChange={(e) => setTExplanation(e.target.value)}
              placeholder="Explain why this term hurts brand positioning or carries legal liability."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Severity</label>
              <select
                value={tSeverity}
                onChange={(e) => setTSeverity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={tCategory}
                onChange={(e) => setTCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="BRAND_IDENTITY">Brand Identity</option>
                <option value="LEGAL_RISK">Legal Risk</option>
                <option value="PRODUCT_NAMING">Product Naming</option>
                <option value="HYPERBOLE">Hyperbole</option>
                <option value="INCLUSIVE_LANGUAGE">Inclusive Language</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTermModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Fact Modal */}
      <Modal isOpen={isFactModalOpen} onClose={() => setIsFactModalOpen(false)} title="Register Approved Fact">
        <form onSubmit={handleCreateFact} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Claim Statement</label>
            <input
              type="text"
              required
              value={fClaimText}
              onChange={(e) => setFClaimText(e.target.value)}
              placeholder="e.g. Over 2,500 enterprise customers across 42 countries."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Source ID</label>
              <input
                type="text"
                required
                value={fSourceId}
                onChange={(e) => setFSourceId(e.target.value)}
                placeholder="e.g. SRC-FIN-2025-09"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Source Name</label>
              <input
                type="text"
                required
                value={fSourceName}
                onChange={(e) => setFSourceName(e.target.value)}
                placeholder="e.g. Audited 2025 Financial Statement"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="PRODUCT_SPECS">Product Specifications</option>
              <option value="FINANCIAL">Financial / Customer Counts</option>
              <option value="SECURITY">Security / Certifications</option>
              <option value="ESG">ESG / Sustainability</option>
              <option value="COMPANY_HISTORY">Company History</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Verification Notes</label>
            <textarea
              rows={2}
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
              placeholder="Details on the audit, certifier, or underlying benchmark methodology."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFactModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Register Fact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

