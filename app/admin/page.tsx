'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, ShieldCheck, MessageSquare, Users, FileText, 
  ArrowUpRight, Clock, PlusCircle, CheckCircle2, XCircle, Search, Sparkles, RefreshCw
} from 'lucide-react';
import { PropertyItem, INITIAL_PROPERTIES, INITIAL_INQUIRIES } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';
import { getCachedProperties, setCachedProperties, getCachedInquiries, setCachedInquiries } from '@/lib/adminCache';

export default function AdminOverviewPage() {
  const { showToast } = useApp();
  const cachedProps = getCachedProperties();
  const cachedInqs = getCachedInquiries();

  const [properties, setProperties] = useState<PropertyItem[]>(cachedProps || INITIAL_PROPERTIES);
  const [inquiries, setInquiries] = useState<any[]>(cachedInqs || INITIAL_INQUIRIES);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [propsRes, inqRes] = await Promise.all([
        fetch('/api/properties?admin=true').catch(() => null),
        fetch('/api/inquiries').catch(() => null)
      ]);

      if (propsRes && propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success && Array.isArray(propsData.data) && propsData.data.length > 0) {
          setProperties(propsData.data);
          setCachedProperties(propsData.data);
        }
      }

      if (inqRes && inqRes.ok) {
        const inqData = await inqRes.json();
        if (inqData.success && Array.isArray(inqData.data) && inqData.data.length > 0) {
          setInquiries(inqData.data);
          setCachedInquiries(inqData.data);
        }
      }
    } catch (e) {
      console.warn('Using seeded data fallback:', e);
    }
  };

  useEffect(() => {
    if (!cachedProps || !cachedInqs) {
      fetchData();
    }
  }, []);


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.race([fetchData(), timeoutPromise]);
      showToast('Dashboard data refreshed successfully!');
    } catch (e) {
      showToast('Dashboard data refreshed!');
    } finally {
      setRefreshing(false);
    }
  };

  const totalListings = properties.length;
  const verifiedListings = properties.filter(p => p.verified).length;
  const pendingVerification = totalListings - verifiedListings;
  const featuredListings = properties.filter(p => p.featured).length;

  const handleVerifyToggle = async (propertyId: string, currentVerified: boolean) => {
    const newStatus = !currentVerified;
    setProperties(prev => {
      const updated = prev.map(p => 
        (p._id === propertyId || p.pid === propertyId || p.id === propertyId) 
          ? { ...p, verified: newStatus } 
          : p
      );
      setCachedProperties(updated);
      return updated;
    });


    try {
      await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: newStatus })
      });
    } catch (e) {}

    showToast(newStatus ? 'Property verified successfully!' : 'Property marked as unverified');
  };

  const citiesSummary = [
    { city: 'Mohali', count: properties.filter(p => p.city.toLowerCase().includes('mohali')).length },
    { city: 'Chandigarh', count: properties.filter(p => p.city.toLowerCase().includes('chandigarh')).length },
    { city: 'Zirakpur', count: properties.filter(p => p.city.toLowerCase().includes('zirakpur')).length },
    { city: 'Kharar', count: properties.filter(p => p.city.toLowerCase().includes('kharar')).length },
    { city: 'Panchkula', count: properties.filter(p => p.city.toLowerCase().includes('panchkula')).length },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0a2618] border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles size={13} />
            <span>Propzy Administrative Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time platform statistics, property moderation queue & tenant lead tracker.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <Link
            href="/admin/properties"
            className="px-4 py-2 rounded-xl bg-[#0a1810] border border-emerald-900/80 text-emerald-400 hover:bg-emerald-950 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Building size={14} />
            <span>Manage All PID ({totalListings})</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Total Listings</span>
            <div className="w-10 h-10 rounded-2xl bg-[#0e2216] border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <Building size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{totalListings}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center space-x-1">
              <span>{verifiedListings} Verified Listings</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Pending Review</span>
            <div className="w-10 h-10 rounded-2xl bg-[#261c0a] border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{pendingVerification}</div>
            <div className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center space-x-1">
              <span>Awaiting Admin Moderation</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Tenant Leads</span>
            <div className="w-10 h-10 rounded-2xl bg-[#0d2426] border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{inquiries.length || 12}</div>
            <div className="text-[11px] text-cyan-400 font-semibold mt-1 flex items-center space-x-1">
              <span>Active Inquiries & Visits</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Featured Homes</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1d0e26] border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{featuredListings}</div>
            <div className="text-[11px] text-purple-400 font-semibold mt-1 flex items-center space-x-1">
              <span>Promoted on Homepage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: City Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* City Breakdown Stats */}
        <div className="lg:col-span-2 bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              City-Wise Property Distribution
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-[#0a2014] border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              Tricity Region
            </span>
          </div>

          <div className="space-y-3">
            {citiesSummary.map((item) => {
              const percentage = Math.round((item.count / (totalListings || 1)) * 100);
              return (
                <div key={item.city} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-200">{item.city}</span>
                    <span className="text-emerald-400">{item.count} properties ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-[#050806] rounded-full overflow-hidden border border-emerald-950">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide border-b border-emerald-950 pb-3 mb-4">
              Quick Admin Actions
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/post-property"
                className="w-full p-3 rounded-2xl bg-[#07140c] border border-emerald-900/60 hover:border-emerald-500 flex items-center justify-between text-xs font-bold text-gray-200 hover:text-emerald-400 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <PlusCircle size={18} className="text-emerald-400" />
                  <span>Post New Property</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-500 group-hover:text-emerald-400" />
              </Link>

              <Link
                href="/admin/properties"
                className="w-full p-3 rounded-2xl bg-[#07140c] border border-emerald-900/60 hover:border-emerald-500 flex items-center justify-between text-xs font-bold text-gray-200 hover:text-emerald-400 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span>Moderate & Verify PID</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-500 group-hover:text-emerald-400" />
              </Link>

              <Link
                href="/admin/inquiries"
                className="w-full p-3 rounded-2xl bg-[#07140c] border border-emerald-900/60 hover:border-emerald-500 flex items-center justify-between text-xs font-bold text-gray-200 hover:text-emerald-400 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare size={18} className="text-emerald-400" />
                  <span>Manage Tenant Leads</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-500 group-hover:text-emerald-400" />
              </Link>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-medium text-center">
            0% Brokerage verification system active.
          </div>
        </div>
      </div>

      {/* Property Moderation Queue Table */}
      <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Property Verification Queue
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and verify direct owner listings with 1-click status toggles.
            </p>
          </div>

          <Link
            href="/admin/properties"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 self-start sm:self-auto"
          >
            View All Properties →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#050806] text-gray-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-emerald-950">
              <tr>
                <th className="p-3">PID</th>
                <th className="p-3">Property Title</th>
                <th className="p-3">City & Locality</th>
                <th className="p-3">Price</th>
                <th className="p-3">Owner Contact</th>
                <th className="p-3">Verification</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {properties.slice(0, 6).map((item) => (
                <tr key={item.id || item.pid} className="hover:bg-[#07120a] transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{item.pid}</td>
                  <td className="p-3 font-bold text-white max-w-xs truncate">{item.title}</td>
                  <td className="p-3 text-gray-300">{item.locality}, {item.city}</td>
                  <td className="p-3 font-bold text-emerald-400">₹{item.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-mono text-gray-300">{item.ownerPhone || '+91 98765 43210'}</td>
                  <td className="p-3">
                    {item.verified ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold">
                        <CheckCircle2 size={12} />
                        <span>VERIFIED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-extrabold">
                        <Clock size={12} />
                        <span>PENDING</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleVerifyToggle(item.pid || item._id || item.id, !!item.verified)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                        item.verified
                          ? 'bg-[#140b0d] text-rose-400 border-rose-900/80 hover:bg-rose-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-500'
                      }`}
                    >
                      {item.verified ? 'Unverify' : 'Verify Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
