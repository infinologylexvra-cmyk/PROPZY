'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Linkedin,
  Twitter,
  Github,
  ArrowRight
} from 'lucide-react';
import { CallToActionBanner } from '@/components/CallToActionBanner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    company: '',
    inquiryType: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.workEmail || !formData.message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#040806] text-white">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO HEADER (EXACT SCREENSHOT 1 DESIGN)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-b from-[#06140b] via-[#040906] to-[#040806]">
        {/* Neon Green Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* City Skyline Vector Illustration Background */}
        <div className="absolute inset-x-0 bottom-0 opacity-25 pointer-events-none flex justify-center overflow-hidden">
          <svg className="w-full max-w-6xl h-52 sm:h-64 text-emerald-500 stroke-current fill-none" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
            <path d="M50,300 L50,180 L90,180 L90,300 M90,300 L90,140 L150,140 L150,300 M150,300 L150,200 L200,200 L200,300 M250,300 L250,80 L350,80 L350,300 M350,300 L350,160 L420,160 L420,300 M450,300 L450,100 L520,100 L520,300 M520,300 L520,50 L650,50 L650,300 M650,300 L650,120 L730,120 L730,300 M750,300 L750,90 L850,90 L850,300 M850,300 L850,170 L920,170 L920,300 M950,300 L950,130 L1050,130 L1050,300 M1050,300 L1050,210 L1150,210 L1150,300" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="600" cy="80" r="3.5" fill="#10b981" />
            <circle cx="300" cy="110" r="3.5" fill="#10b981" />
            <circle cx="800" cy="120" r="3.5" fill="#10b981" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold shadow-inner">
            <span>★</span>
            <span>Contact Us</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            Let's Talk About Your <br />
            <span className="italic font-serif font-normal text-emerald-400">
              Next Property.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-300 text-xs sm:text-sm max-w-xl mx-auto font-normal leading-relaxed">
            Whether you're looking for your dream home, need help finding the perfect rental, or want to list your property, our team is here to help every step of the way.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: CONTACT FORM & DIRECT DETAILS (EXACT SCREENSHOT 2)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Card */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-[#070e0a] border border-emerald-900/60 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Send us a message</h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Fill in your details and we'll get back to you within 2 hours.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Message Received!</h3>
                <p className="text-xs text-gray-300 max-w-md mx-auto">
                  Thank you for contacting Propzy. Our support team will respond to your email within 2 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: '', workEmail: '', company: '', inquiryType: 'General Inquiry', message: '' });
                  }}
                  className="mt-2 px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Full Name & Work Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Maya Okonkwo"
                      className="w-full px-4 py-3 rounded-xl bg-[#0b1610] border border-emerald-950 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.workEmail}
                      onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                      placeholder="maya@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-[#0b1610] border border-emerald-950 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Row 2: Company & Inquiry Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Nexora Inc."
                      className="w-full px-4 py-3 rounded-xl bg-[#0b1610] border border-emerald-950 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Inquiry Type</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0b1610] border border-emerald-950 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Property Listing Help">Property Listing Help</option>
                      <option value="Tenant / Owner Help">Tenant / Owner Help</option>
                      <option value="Corporate Partnership">Corporate Partnership</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Message */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your project, team size, and how we can help..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0b1610] border border-emerald-950 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || submitted}
                  className="w-full py-4 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Sending Message...' : 'Send Message'}</span>
                  <ArrowRight size={18} />
                </button>

                <p className="text-[11px] text-gray-500 text-center font-normal pt-1">
                  By submitting, you agree to our <Link href="/privacy" className="text-gray-300 cursor-pointer underline underline-offset-2">Privacy Policy</Link>. We never share your data.
                </p>
              </form>
            )}
          </div>

          {/* Right Column: Cards Stack */}
          <div className="lg:col-span-4 space-y-5">
            {/* Card 1: Live Status Header */}
            <div className="p-5 rounded-2xl bg-[#070f0b] border border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-white">All systems operational</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">Avg response: 1.8 hrs</span>
            </div>

            {/* Card 2: REACH US DIRECTLY */}
            <div className="p-6 rounded-3xl bg-[#070e0a] border border-emerald-900/60 space-y-6">
              <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest text-gray-400">
                REACH US DIRECTLY
              </h3>

              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#0d1d13] border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Mail size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">EMAIL</div>
                    <div className="text-xs font-semibold text-white mt-0.5">Lexverainfology.com</div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#0d1d13] border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">PHONE</div>
                    <div className="text-xs font-semibold text-white mt-0.5">9317902609</div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#0d1d13] border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">MOHALI</div>
                    <div className="text-xs font-semibold text-white mt-0.5">75 sector 8b</div>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#0d1d13] border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">HOURS</div>
                    <div className="text-xs font-semibold text-white mt-0.5">Mon-Fri, 9am-6pm EST</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: FOLLOW US */}
            <div className="p-6 rounded-3xl bg-[#070e0a] border border-emerald-900/60 space-y-4">
              <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest text-gray-400">
                FOLLOW US
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-[#0b1610] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center text-center group"
                >
                  <Linkedin size={18} className="text-gray-400 group-hover:text-emerald-400 transition-colors mb-1" />
                  <span className="text-xs font-semibold text-white">LinkedIn</span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">@lexvera</span>
                </a>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-[#0b1610] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center text-center group"
                >
                  <Twitter size={18} className="text-gray-400 group-hover:text-emerald-400 transition-colors mb-1" />
                  <span className="text-xs font-semibold text-white">Twitter</span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">@lexvera</span>
                </a>

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-[#0b1610] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center text-center group"
                >
                  <Github size={18} className="text-gray-400 group-hover:text-emerald-400 transition-colors mb-1" />
                  <span className="text-xs font-semibold text-white">GitHub</span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">@lexvera</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: BOTTOM CTA BANNER (EXACT SCREENSHOT 3 COMPONENT)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <CallToActionBanner
          subTag="IS READY TO MOVE"
          titleMain="Let's find your"
          titleItalic="perfect space."
          description="Verified homes. Zero brokerage. Hassle-free renting."
          buttonText="Explore Properties"
          buttonHref="/properties"
        />
      </section>
    </div>
  );
}
