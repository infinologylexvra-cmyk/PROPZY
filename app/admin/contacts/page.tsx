'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, MessageSquare, Building2, User, Calendar, CheckCircle2,
  Clock, Search, ArrowUpRight, Sparkles, Filter, RefreshCw, Send, Trash2,
  Tag, Check, Archive, Inbox, AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCachedContacts, setCachedContacts, hasCachedContacts } from '@/lib/adminCache';
import { useAdminSync } from '@/hooks/useAdminSync';
import { TableSkeletonLoader } from '@/components/Loader';

interface ContactItem {
  _id?: string;
  id?: string;
  fullName: string;
  workEmail: string;
  company?: string;
  inquiryType: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  createdAt: string | Date;
}

export default function AdminContactsPage() {
  const { showToast } = useApp();
  const [contacts, setContacts] = useState<ContactItem[]>(() => getCachedContacts() || []);
  const [loading, setLoading] = useState<boolean>(() => !hasCachedContacts());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied' | 'archived'>('all');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/contacts', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setContacts(data.data);
        setCachedContacts(data.data, false);
      }
    } catch (e) {
      console.warn('Failed to fetch contacts:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasCachedContacts()) {
      fetchContacts(false);
    }
  }, [fetchContacts]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(10);
  }, [statusFilter, inquiryTypeFilter, searchQuery]);

  // Real-time cross-tab sync hook
  useAdminSync({
    dataType: 'contacts',
    onSync: () => {
      fetchContacts(true);
    },
    enablePolling: false,
  });

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'read' | 'replied' | 'archived') => {
    setContacts(prev => {
      const updated = prev.map(c => ((c._id === id || c.id === id) ? { ...c, status: newStatus } : c));
      setCachedContacts(updated);
      return updated;
    });

    showToast(`Message marked as ${newStatus}`);

    try {
      await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (e) {
      console.warn('Status update API error:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contact submission?')) return;
    setDeletingId(id);

    setContacts(prev => {
      const updated = prev.filter(c => c._id !== id && c.id !== id);
      setCachedContacts(updated);
      return updated;
    });

    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Message deleted successfully');
      }
    } catch (e) {
      showToast('Message removed from view');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered dataset
  const filteredContacts = contacts.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (inquiryTypeFilter !== 'all' && item.inquiryType !== inquiryTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.fullName || '').toLowerCase();
      const email = (item.workEmail || '').toLowerCase();
      const company = (item.company || '').toLowerCase();
      const type = (item.inquiryType || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();
      return name.includes(q) || email.includes(q) || company.includes(q) || type.includes(q) || msg.includes(q);
    }
    return true;
  });

  const displayedContacts = filteredContacts.slice(0, visibleCount);

  const pendingCount = contacts.filter(c => c.status === 'pending').length;
  const repliedCount = contacts.filter(c => c.status === 'replied').length;
  const corporateCount = contacts.filter(c => c.inquiryType === 'Corporate Partnership').length;

  return (
    <div className="space-y-3.5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-emerald-950/80 pb-3.5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Contact Form Messages
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-[10px] sm:text-xs whitespace-nowrap shrink-0">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
            Dedicated inbox for inquiries submitted through the public Contact Us page. Separate from property leads.
          </p>
        </div>

        <button
          onClick={() => {
            setVisibleCount(10);
            fetchContacts(false);
          }}
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#091a12] border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Messages</span>
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-[#09110c] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-950/90 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Messages</span>
            <Inbox size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-white mt-1">{contacts.length}</p>
          <span className="text-[9px] sm:text-[10px] text-gray-500">Contact form submissions</span>
        </div>

        <div className="bg-[#09110c] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-950/90 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider">Needs Reply</span>
            <Clock size={14} className="text-amber-400 sm:w-4 sm:h-4" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
          <span className="text-[9px] sm:text-[10px] text-gray-500">Pending inquiries</span>
        </div>

        <div className="bg-[#09110c] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-950/90 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Replied</span>
            <CheckCircle2 size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">{repliedCount}</p>
          <span className="text-[9px] sm:text-[10px] text-gray-500">Resolved queries</span>
        </div>

        <div className="bg-[#09110c] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-950/90 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Corporate Leads</span>
            <Building2 size={14} className="text-cyan-400 sm:w-4 sm:h-4" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-cyan-400 mt-1">{corporateCount}</p>
          <span className="text-[9px] sm:text-[10px] text-gray-500">Partnership requests</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-[#08100b] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-950/90">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, company, message..."
            className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-[#050806] border border-emerald-900/80 rounded-lg sm:rounded-xl text-[11px] sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'pending', 'replied', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-500 text-black shadow font-extrabold'
                  : 'bg-[#050806] text-gray-400 hover:text-white border border-emerald-950'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Inquiry Type Filter */}
        <select
          value={inquiryTypeFilter}
          onChange={(e) => setInquiryTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#050806] border border-emerald-900/80 rounded-lg sm:rounded-xl text-[11px] sm:text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">All Inquiry Types</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Property Listing Help">Property Listing Help</option>
          <option value="Tenant / Owner Help">Tenant / Owner Help</option>
          <option value="Corporate Partnership">Corporate Partnership</option>
        </select>
      </div>

      {/* Messages List */}
      {loading ? (
        <TableSkeletonLoader rows={5} cols={4} />
      ) : displayedContacts.length === 0 ? (
        <div className="bg-[#09110c] border border-emerald-950/90 rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
            <Mail size={20} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">No Contact Messages Found</h3>
          <p className="text-[11px] sm:text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || inquiryTypeFilter !== 'all'
              ? 'No messages match your search or filter criteria. Try clearing the filters.'
              : 'Messages submitted via the public Contact Us page will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3.5">
          {displayedContacts.map((item) => {
            const id = item._id || item.id || `msg-${Math.random()}`;
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recently';

            return (
              <div
                key={id}
                className={`bg-[#08120c] rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all shadow-md space-y-2.5 sm:space-y-3.5 ${
                  item.status === 'pending'
                    ? 'border-amber-700/60 bg-[#0d140e]'
                    : item.status === 'replied'
                    ? 'border-emerald-900/80'
                    : 'border-gray-800/80 opacity-75'
                }`}
              >
                {/* Header row: Sender + Badges + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-emerald-950/80 pb-2.5 sm:pb-3">
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0e261a] border border-emerald-800/80 text-emerald-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow">
                      {item.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white">{item.fullName}</span>
                        {item.company && (
                          <span className="text-[9px] sm:text-[10px] bg-[#0d261a] text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded-full font-bold">
                            🏢 {item.company}
                          </span>
                        )}
                        <span className="text-[9px] sm:text-[10px] bg-[#1a1c0d] text-amber-300 border border-amber-800/60 px-1.5 py-0.2 rounded-full font-semibold">
                          {item.inquiryType}
                        </span>
                      </div>
                      <a
                        href={`mailto:${item.workEmail}`}
                        className="text-[11px] sm:text-xs text-emerald-400 hover:underline flex items-center space-x-1 mt-0.5"
                      >
                        <Mail size={11} />
                        <span>{item.workEmail}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{dateStr}</span>
                    <span
                      className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-extrabold capitalize border ${
                        item.status === 'pending'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                          : item.status === 'replied'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                          : 'bg-gray-900 text-gray-400 border-gray-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-[#050806] rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-emerald-950/80 text-[11px] sm:text-xs text-gray-200 leading-relaxed font-normal whitespace-pre-wrap">
                  {item.message}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <a
                      href={`mailto:${item.workEmail}?subject=${encodeURIComponent(`Re: Propzy Tricity - ${item.inquiryType}`)}&body=${encodeURIComponent(`Hi ${item.fullName},\n\nThank you for reaching out to Propzy regarding: "${item.message.slice(0, 80)}..."\n\n`)}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 h-7 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] sm:text-xs transition-colors cursor-pointer shadow"
                    >
                      <Send size={11} />
                      <span>Reply Email</span>
                    </a>

                    {item.status !== 'replied' && (
                      <button
                        onClick={() => handleStatusChange(id, 'replied')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 h-7 rounded-lg sm:rounded-xl bg-[#0b1610] hover:bg-[#122319] text-emerald-400 border border-emerald-800 text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Check size={11} />
                        <span>Mark Replied</span>
                      </button>
                    )}

                    {item.status !== 'pending' && (
                      <button
                        onClick={() => handleStatusChange(id, 'pending')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 h-7 rounded-lg sm:rounded-xl bg-[#0b1610] hover:bg-[#122319] text-amber-400 border border-amber-900/60 text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Clock size={11} />
                        <span>Mark Pending</span>
                      </button>
                    )}

                    {item.status !== 'archived' && (
                      <button
                        onClick={() => handleStatusChange(id, 'archived')}
                        className="inline-flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 rounded-lg sm:rounded-xl bg-[#0b1610] hover:bg-[#122319] text-gray-400 hover:text-white border border-emerald-950 text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
                        title="Archive message"
                      >
                        <Archive size={11} />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(id)}
                    disabled={deletingId === id}
                    className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Delete message"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Show More Pagination Button */}
          {filteredContacts.length > visibleCount && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-6 py-2.5 bg-[#091a12] border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow"
              >
                Show More Messages ({filteredContacts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
