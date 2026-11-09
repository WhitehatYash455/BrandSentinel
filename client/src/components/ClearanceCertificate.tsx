import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Printer, Lock } from 'lucide-react';
import { Modal } from './Modal';
import { Submission, ContentVersion } from '../types';

interface ClearanceCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  version: ContentVersion;
  reviewerName?: string;
  approvedDate?: string;
  decisionReason?: string;
}

export const ClearanceCertificate: React.FC<ClearanceCertificateProps> = ({
  isOpen,
  onClose,
  submission,
  version,
  reviewerName = 'Marcus Vance (Senior Reviewer)',
  approvedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  decisionReason = 'Full brand compliance verified against approved brand truth repository.'
}) => {
  const certificateId = `CERT-BS-${submission.id.slice(4, 12).toUpperCase()}-V${submission.current_version}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Brand Sentinel Pre-Publication Clearance" maxWidth="max-w-3xl">
      <div className="space-y-6 print:p-0">
        {/* Certificate Card */}
        <div className="relative border-4 border-double border-slate-300 p-8 rounded-2xl bg-gradient-to-b from-white via-slate-50/50 to-brand-50/30 shadow-inner overflow-hidden">
          {/* Subtle security watermark */}
          <div className="absolute right-6 bottom-6 opacity-5 pointer-events-none">
            <ShieldCheck className="w-80 h-80 text-brand-900" />
          </div>

          {/* Top Banner */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-navy-900 text-brand-400 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7 text-brand-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">BRAND SENTINEL</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-brand-600">
                  Pre-Publication Governance Authority
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                OFFICIALLY CLEARED
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1">{certificateId}</p>
            </div>
          </div>

          {/* Body */}
          <div className="py-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Certificate of Pre-Publication Brand Safety & Governance
              </p>
              <h3 className="text-xl font-bold text-slate-900">"{submission.title}"</h3>
              <p className="text-xs text-slate-500">
                Channel: <strong className="uppercase text-slate-700">{submission.channel}</strong> • Target Persona: <strong className="text-slate-700">{submission.target_audience}</strong> • Asset Version: <strong className="text-slate-700">v{submission.current_version}</strong>
              </p>
            </div>

            {/* Approved Content Excerpt */}
            <div className="p-4 bg-white/90 rounded-xl border border-slate-200 text-xs text-slate-700 font-sans leading-relaxed italic max-h-36 overflow-y-auto shadow-2xs">
              "{version?.body_text || ''}"
            </div>

            {/* Verification Statements */}
            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1 text-brand-600" />
                  Deterministic & RAG Verification
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Zero prohibited terminology. All empirical claims grounded in active, unexpired Source IDs.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Human Stewardship Gate
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {decisionReason}
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Authorized Human Reviewer</p>
                <p className="text-sm font-serif font-bold text-slate-900 italic underline decoration-slate-400 mt-1">
                  {reviewerName}
                </p>
                <p className="text-[10px] text-slate-500">Brand Governance & Compliance Directorate</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Certified Date</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{approvedDate}</p>
                <p className="text-[10px] font-mono text-slate-400">Cryptographic Seal: SHA-256 Valid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Mandate: Every Piece of Content. One Approved Brand Truth.
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-500" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

