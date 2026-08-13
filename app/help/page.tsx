'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, ShieldCheck, HelpCircle, UserCheck, Key, 
  CreditCard, MessageSquare, ArrowRight, FileText, Phone, Mail, Sparkles 
} from 'lucide-react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: Key,
      title: 'Tenant Support & Renting',
      desc: 'How to search, schedule visits, contact owners, and sign rental agreements.',
      articles: 12,
    },
    {
      icon: UserCheck,
      title: 'Owner & Landlord Guide',
      desc: 'Listing properties, electricity bill verification, and managing tenant inquiries.',
      articles: 10,
    },
    {
      icon: ShieldCheck,
      title: '0% Brokerage & Trust',
      desc: 'Understanding PROPZY zero brokerage model and verified owner guarantees.',
      articles: 8,
    },
    {
      icon: CreditCard,
      title: 'Payments & Security',
      desc: 'Security deposit guidelines, rent payment receipts, and refund policies.',
      articles: 6,
    },
  ];

  const popularArticles = [
    {
      title: 'How does PROPZY guarantee 0% Brokerage?',
      category: 'Trust & Safety',
      readTime: '2 min read',
      content: 'PROPZY connects tenants directly with verified property owners without any middleman brokers or hidden commissions. Owners list properties directly, and tenants contact them with 100% transparency.',
    },
    {
      title: 'What documents are needed for Owner Verification?',
      category: 'Owner Guide',
      readTime: '3 min read',
      content: 'Property owners must submit a valid Electricity Bill containing their Consumer Number and address matching the listing details. Our admin team verifies ownership before property approval.',
    },
    {
      title: 'How do I schedule a property visit?',
      category: 'Tenant Support',
      readTime: '2 min read',
      content: 'Click "Contact Owner" or "Schedule Visit" on any property listing page. You will get direct WhatsApp or phone access to coordinate visit times with the landlord.',
    },
    {
      title: 'What is the PROPZY Relax Plan?',
      category: 'Tenant Support',
      readTime: '3 min read',
      content: 'The Relax Plan pairs you with a dedicated Relationship Manager (RM) who handpicks listings, schedules visits, and negotiates rent terms on your behalf.',
    },
  ];

  const filteredArticles = popularArticles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050806] text-gray-100 font-sans antialiased pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>PROPZY Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            How can we <span className="text-emerald-400">help you</span> today?
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Search our knowledge base or browse help topics below to get instant answers.
          </p>

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search help articles, topics, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-[#0a110d] border border-emerald-950 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-lg"
            />
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-[#0a110d] border border-emerald-950 hover:border-emerald-700/80 p-6 rounded-3xl space-y-3 transition-all group cursor-pointer shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0e1d14] border border-emerald-900/60 group-hover:bg-emerald-500 group-hover:text-black text-emerald-400 flex items-center justify-center transition-all">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {cat.desc}
                </p>
                <div className="pt-2 text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                  <span>{cat.articles} articles</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Popular Articles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Popular Help Articles</h2>
            <Link href="/faq" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1">
              <span>View All FAQs</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredArticles.map((article, idx) => (
              <div
                key={idx}
                className="bg-[#09100c] border border-emerald-950/80 p-6 rounded-3xl space-y-3 shadow-md hover:border-emerald-900 transition-all"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-900/60">
                    {article.category}
                  </span>
                  <span className="text-gray-500">{article.readTime}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{article.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{article.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support Banner */}
        <div className="bg-linear-to-r from-[#0a1c12] to-[#07130c] border border-emerald-900/80 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">Still need assistance?</h3>
            <p className="text-xs text-gray-300 max-w-md">
              Our administrative support team is ready to help you with property verification, listings, or technical queries.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href="/contact"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg transition-all flex items-center space-x-2"
            >
              <MessageSquare size={14} />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
