import React, { useState } from 'react';
import { X, ExternalLink, Mail, CheckCircle2, Check, ShieldCheck, Award, Calendar, Sparkles, Send } from 'lucide-react';
import { ConsultationRequest } from '../types/cost';

interface PremiumSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumSupportModal: React.FC<PremiumSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ConsultationRequest>({
    fullName: '',
    email: '',
    company: '',
    monthlySpend: '$50,000 - $250,000/mo',
    cloudProviders: ['AWS', 'GCP'],
    interestArea: 'Bespoke FinOps Cloud Cost Audit & Commitment Plan',
    message: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleToggleProvider = (prov: string) => {
    setFormData((prev) => {
      const exists = prev.cloudProviders.includes(prov);
      return {
        ...prev,
        cloudProviders: exists
          ? prev.cloudProviders.filter((p) => p !== prov)
          : [...prev.cloudProviders, prov],
      };
    });
  };

  const emailSubject = encodeURIComponent(
    `CloudCostIQ Premium Support Request - ${formData.company || 'Enterprise'}`
  );
  const emailBody = encodeURIComponent(
    `Hello Mani,\n\nI would like to request premium support access for cloud cost optimization.\n\nName: ${formData.fullName}\nEmail: ${formData.email}\nCompany: ${formData.company}\nMonthly Spend: ${formData.monthlySpend}\nClouds: ${formData.cloudProviders.join(', ')}\nFocus: ${formData.interestArea}\n\nDetails: ${formData.message}\n`
  );
  const directMailtoUrl = `mailto:MANI.RAVINDRAN@gmail.com?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Advisor Bio & Credential Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          {/* Avatar Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-950/60 shrink-0">
            MR
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Mani Ravindran
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                Principal FinOps Cloud Architect
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Enterprise Cloud Cost Optimization Specialist · AWS, Google Cloud & Azure
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <a
                href="https://ravindran.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 underline underline-offset-2"
              >
                <span>ravindran.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <span className="text-slate-600" aria-hidden="true">·</span>

              <a
                href={directMailtoUrl}
                className="text-slate-300 hover:text-emerald-300 flex items-center gap-1"
              >
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>MANI.RAVINDRAN@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Consultation Request Received!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{formData.fullName || 'there'}</strong>. Mani Ravindran will review your cloud footprint and respond directly via email (<span className="text-emerald-400 font-mono">{formData.email || 'your email'}</span>) within 24 business hours.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <a
                href={directMailtoUrl}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Send Direct Email to Mani</span>
              </a>

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Request Premium Support & Bespoke FinOps Advisory
              </h3>
              <p className="text-xs text-slate-400">
                Get hands-on architectural audit, customized reservation planning (RI/SP/CUD), and dedicated emergency cost spike mitigation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Tech"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Monthly Cloud Spend Bracket
                  </label>
                  <select
                    value={formData.monthlySpend}
                    onChange={(e) => setFormData({ ...formData, monthlySpend: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="<$25,000/mo">&lt; $25,000 / month</option>
                    <option value="$25,000 - $75,000/mo">$25,000 - $75,000 / month</option>
                    <option value="$75,000 - $250,000/mo">$75,000 - $250,000 / month</option>
                    <option value="$250,000 - $1,000,000/mo">$250,000 - $1,000,000 / month</option>
                    <option value="$1,000,000+/mo">&gt; $1,000,000+ / month (Enterprise EDP)</option>
                  </select>
                </div>
              </div>

              {/* Cloud Providers Selection */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Target Cloud Environments
                </label>
                <div className="flex flex-wrap gap-2">
                  {['AWS', 'GCP', 'Azure', 'Kubernetes', 'Multi-Cloud'].map((prov) => {
                    const isChecked = formData.cloudProviders.includes(prov);
                    return (
                      <button
                        type="button"
                        key={prov}
                        onClick={() => handleToggleProvider(prov)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{prov}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus Area */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Primary Engagement Objective
                </label>
                <select
                  value={formData.interestArea}
                  onChange={(e) => setFormData({ ...formData, interestArea: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Bespoke FinOps Cloud Cost Audit & Commitment Plan">
                    Bespoke FinOps Cloud Cost Audit & Commitment Plan
                  </option>
                  <option value="AWS EDP / GCP CUD Negotiation Strategy">
                    AWS EDP / GCP CUD Enterprise Discount Negotiation
                  </option>
                  <option value="Real-Time Anomaly & Spike Webhook Integration">
                    Real-Time Anomaly & Spike Webhook Integration
                  </option>
                  <option value="Kubernetes / Spot Fleet Cost Architecture">
                    Kubernetes & Spot Fleet Cost Engineering
                  </option>
                  <option value="1-on-1 Monthly FinOps Advisory Retainer">
                    1-on-1 Monthly FinOps Advisory Retainer
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Brief Context or Message (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell Mani about your architecture, urgent cost challenges, or timeline..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={directMailtoUrl}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Or email directly to MANI.RAVINDRAN@gmail.com</span>
                </a>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Consultation Request 🚀</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
