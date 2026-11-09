import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sparkles,
  Upload,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

export const CreatorWorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [channel, setChannel] = useState('LINKEDIN');
  const [contentType, setContentType] = useState('SOCIAL_COPY');
  const [targetAudience, setTargetAudience] = useState('Enterprise Marketing Leaders & Risk Officers');
  const [campaignId, setCampaignId] = useState('');

  // Aux state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Status flags
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data
  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const [brandRes, subsRes] = await Promise.all([
          api.get('/brands/knowledge'),
          api.get('/content')
        ]);
        setCampaigns(brandRes.data.campaigns || []);
        if (brandRes.data.campaigns?.length > 0) {
          setCampaignId(brandRes.data.campaigns[0].id);
        }
        setMySubmissions(subsRes.data.submissions || []);
      } catch (err) {
        console.error('Failed to load workspace metadata:', err);
      }
    }
    loadWorkspaceData();
  }, []);

  // Handle Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setStatusMessage('Extracting document text...');

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { document } = res.data;
      setDocumentId(document.id);
      setUploadedFileName(file.name);
      if (document.extractedText) {
        setBodyText(document.extractedText);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
      setStatusMessage(`Extracted text from ${file.name}`);
    } catch (err: any) {
      alert(`File upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!title || !bodyText) {
      alert('Please provide a content title and body text.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post('/content', {
        title,
        bodyText,
        channel,
        contentType,
        targetAudience,
        campaignId: campaignId || null,
        documentId: documentId || null
      });

      setStatusMessage('Draft saved successfully!');
      // Refresh submissions
      const subsRes = await api.get('/content');
      setMySubmissions(subsRes.data.submissions || []);
      return res.data.submissionId;
    } catch (err: any) {
      alert(`Failed to save draft: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Run Preflight Scan
  const handleRunScan = async () => {
    if (!title || !bodyText) {
      alert('Please provide a content title and body text to scan.');
      return;
    }

    setIsScanning(true);
    setStatusMessage('Saving draft and running preflight brand scan...');

    try {
      // 1. Save or create submission
      const subRes = await api.post('/content', {
        title,
        bodyText,
        channel,
        contentType,
        targetAudience,
        campaignId: campaignId || null,
        documentId: documentId || null
      });

      const subId = subRes.data.submissionId;

      // 2. Trigger Preflight Scan
      setStatusMessage('Executing AI Governance Engine & grounded fact verification...');
      const scanRes = await api.post('/scans/run', { submissionId: subId });

      // 3. Navigate directly to inspection studio
      navigate(`/inspection/${subId}`);
    } catch (err: any) {
      alert(`Preflight scan failed: ${err.response?.data?.error || err.message}`);
      setIsScanning(false);
    }
  };

  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = bodyText.length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Creator Governance Workspace</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-brand-50 text-brand-700 border border-brand-200">
              Pre-Publication Studio
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author marketing copy, upload documents, and run automated preflight brand safety scans.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving || isScanning}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5 text-slate-500" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning || isSaving}
            className="inline-flex items-center px-5 py-2 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Scanning Guidelines...
              </span>
            ) : (
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-brand-200" />
                Run Preflight Scan
              </span>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-800 rounded-lg text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-brand-500 hover:text-brand-700">
            ×
          </button>
        </div>
      )}

      {/* Editor & Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Content Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operation Shield Press Release: Enterprise Cloud Security"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-900"
              />
            </div>

            {/* Document Upload Area */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc,.txt,.md"
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Import Document Draft'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supported formats: PDF, Word (DOCX), Markdown, Text (Max 15MB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 shadow-xs"
                >
                  {isUploading ? 'Extracting...' : uploadedFileName ? 'Replace File' : 'Browse File'}
                </button>
              </div>

              {/* Quick Sample Demonstrator Buttons */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Samples:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Operation Shield Launch: Revolutionary Unhackable Cloud Security Release');
                    setChannel('PRESS_RELEASE');
                    setContentType('PRESS_RELEASE');
                    setBodyText('VajraAI is proud to announce our revolutionary new cloud governance platform that delivers a guaranteed 100% uptime with magic-like automated precision.\n\nOur foolproof technology is completely unhackable, making all other legacy vendors look like cheap dinosaurs. With our 100% compliance guarantee, your legal team can sleep soundly while our algorithms eliminate 100% of risk without human review.\n\nWe are serving over 10,000 enterprise customers across the world today with flawless performance.');
                    setStatusMessage('Loaded uncompliant press release test sample (13 violations)');
                  }}
                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold hover:bg-rose-100"
                >
                  Load Uncompliant Draft (13 Violations)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTitle('Leadership Blog: Unverified Metric Claims');
                    setChannel('WEBSITE');
                    setContentType('MARKETING_BLOG');
                    setBodyText('In modern multi-channel marketing, inconsistencies compound quickly.\n\nVajra Sentinel was recently awarded the 2026 World AI Breakthrough Trophy for cutting deployment risk by 97.4% across 80,000 global servers. Furthermore, our proprietary quantum algorithms guarantee complete immunity from regulatory penalties.\n\nWhile legacy tools struggle with manual compliance, our autonomous pipeline replaces compliance departments completely.');
                    setStatusMessage('Loaded unverified metric claims sample (Guideline Gaps)');
                  }}
                  className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold hover:bg-amber-100"
                >
                  Load Unverified Claims Sample
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTitle('LinkedIn Leadership: Verified Continuous Brand Governance');
                    setChannel('LINKEDIN');
                    setContentType('SOCIAL_COPY');
                    setBodyText('Modern enterprise governance requires empirical rigor. Vajra Sentinel empowers marketing teams to accelerate pre-publication reviews by up to 64%*, while retaining full human stewardship over critical releases.\n\nBacked by our verified SOC 2 Type II compliance and 99.99% high-availability SLA, organizations safeguard brand equity across every channel. Over 2,500 enterprise organizations trust our solution today.\n\n*Based on an internal 90-day benchmark of 14,000 reviewed marketing assets compared to manual email approval loops.');
                    setStatusMessage('Loaded compliant marketing post sample (Pass 100/100)');
                  }}
                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100"
                >
                  Load Compliant Post (Pass 100/100)
                </button>
              </div>
            </div>

            {/* Content Body Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Content Body Text
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {wordCount} words • {charCount} characters
                </span>
              </div>
              <textarea
                rows={14}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Paste or write your marketing draft, social copy, or press release here. The Sentinel engine will analyze voice consistency, banned terms, SLA claims, and grounded evidence."
                className="w-full p-4 text-sm bg-slate-50/30 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-900 font-sans leading-relaxed resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Governance Metadata & Submissions (1 col) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-brand-600" />
              Target Governance Parameters
            </h3>

            {/* Distribution Channel */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-800 font-medium"
              >
                <option value="LINKEDIN">LinkedIn Post</option>
                <option value="WEBSITE">Website / Landing Page</option>
                <option value="PRESS_RELEASE">Official Press Release</option>
                <option value="TWITTER">Twitter / X Post (280 chars max)</option>
                <option value="EMAIL">Marketing Email</option>
                <option value="INTERNAL">Internal Communications</option>
                <option value="PRINT">Print Collateral</option>
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-800 font-medium"
              >
                <option value="SOCIAL_COPY">Social Media Copy</option>
                <option value="MARKETING_BLOG">Marketing Blog / Article</option>
                <option value="ADVERTISEMENT">Advertisement Copy</option>
                <option value="PRESS_RELEASE">Press Release</option>
                <option value="GENERAL_DOC">General Marketing Doc</option>
              </select>
            </div>

            {/* Campaign Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Associated Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-800 font-medium"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Persona</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-800"
              />
            </div>
          </div>

          {/* Previous Submissions List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>My Submissions</span>
              <span className="text-[10px] text-slate-400 font-normal">{mySubmissions.length} assets</span>
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/inspection/${sub.id}`)}
                  className="p-3 rounded-lg border border-slate-100 hover:border-brand-300 hover:bg-slate-50/80 cursor-pointer transition-all space-y-1.5"
                >
                  <p className="text-xs font-semibold text-slate-900 truncate">{sub.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {sub.channel} • v{sub.current_version}
                    </span>
                    <StatusBadge status={sub.current_status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

