'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building, ShieldCheck, Search, Filter, RefreshCw, PlusCircle, 
  CheckCircle2, Clock, Trash2, Edit3, Star, X, MapPin 
} from 'lucide-react';
import { PropertyItem, INITIAL_PROPERTIES } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';
import { getCachedProperties, setCachedProperties } from '@/lib/adminCache';
import { useAdminSync } from '@/hooks/useAdminSync';

function AdminPropertiesContent() {
  const searchParams = useSearchParams();
  const urlPid = searchParams.get('pid') || '';
  const { showToast } = useApp();

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState(urlPid);
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, verified, pending, featured
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit Modal State
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [propertyPendingDeletion, setPropertyPendingDeletion] = useState<PropertyItem | null>(null);

  const fetchProperties = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/properties?admin=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProperties(data.data);
        setCachedProperties(data.data);
      }
    } catch (e) {
      console.warn('Using seeded properties fallback:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const localProps = getCachedProperties();
    if (localProps && localProps.length > 0) {
      setProperties(localProps);
      setLoading(false);
    } else {
      setProperties(INITIAL_PROPERTIES);
      fetchProperties();
    }
  }, [fetchProperties]);

  // Sync across open admin tabs and revalidate on focus/poll
  useAdminSync({
    dataType: 'properties',
    onSync: () => {
      const latest = getCachedProperties();
      if (latest) {
        setProperties(latest);
      } else {
        fetchProperties(true);
      }
    },
    enablePolling: true,
    pollIntervalMs: 12000,
  });

  // Filtered List
  const filteredProperties = properties.filter(item => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchPid = item.pid.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchLocality = item.locality.toLowerCase().includes(q);
      if (!matchPid && !matchTitle && !matchLocality) return false;
    }

    if (cityFilter !== 'all' && !item.city.toLowerCase().includes(cityFilter.toLowerCase())) {
      return false;
    }

    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    if (statusFilter === 'verified' && !item.verified) return false;
    if (statusFilter === 'pending' && item.verified) return false;
    if (statusFilter === 'featured' && !item.featured) return false;

    return true;
  });

  // Actions
  const handleVerifyToggle = async (id: string, currentVerified: boolean) => {
    if (actionPendingId) return;
    setActionPendingId(id);
    const newVerifiedStatus = !currentVerified;

    setProperties(prev => {
      const updated = prev.map(p => 
        (p._id === id || p.pid === id || p.id === id) 
          ? { ...p, verified: newVerifiedStatus } 
          : p
      );
      setCachedProperties(updated);
      return updated;
    });

    try {
      await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: newVerifiedStatus })
      });
    } catch (e) {
      console.warn('PATCH Error:', e);
    } finally {
      setActionPendingId(null);
    }

    showToast(newVerifiedStatus ? `Listing ${id} verified successfully!` : `Listing ${id} marked as Unverified (Pending Review)`);
  };

  const handleFeatureToggle = async (id: string, currentFeatured: boolean) => {
    if (actionPendingId) return;
    setActionPendingId(id);
    const newFeaturedStatus = !currentFeatured;

    setProperties(prev => {
      const updated = prev.map(p => 
        (p._id === id || p.pid === id || p.id === id) 
          ? { ...p, featured: newFeaturedStatus } 
          : p
      );
      setCachedProperties(updated);
      return updated;
    });

    try {
      await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: newFeaturedStatus })
      });
    } catch (e) {
      console.warn('PATCH Error:', e);
    } finally {
      setActionPendingId(null);
    }

    showToast(newFeaturedStatus ? `Listing featured on homepage!` : `Listing removed from featured`);
  };

  const handleDelete = async () => {
    if (!propertyPendingDeletion) return;
    if (actionPendingId) return;
    const id = propertyPendingDeletion._id || propertyPendingDeletion.pid || propertyPendingDeletion.id;
    if (!id) return;

    setActionPendingId(id);
    setProperties(prev => {
      const updated = prev.filter(p => p._id !== id && p.pid !== id && p.id !== id);
      setCachedProperties(updated);
      return updated;
    });
    setPropertyPendingDeletion(null);

    try {
      await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    } catch (e) {
    } finally {
      setActionPendingId(null);
    }
    showToast('Property listing deleted.');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    const targetId = editingProperty._id || editingProperty.pid || editingProperty.id;

    setProperties(prev => {
      const updated = prev.map(p => 
        (p._id === targetId || p.pid === targetId || p.id === targetId) ? editingProperty : p
      );
      setCachedProperties(updated);
      return updated;
    });

    try {
      await fetch(`/api/properties/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProperty)
      });
    } catch (e) {}

    setEditingProperty(null);
    showToast('Property updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Property Listings Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Search, moderate, verify, feature, or edit all registered PID listings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSearchTerm('');
              setCityFilter('all');
              setStatusFilter('all');
              setCategoryFilter('all');
              fetchProperties(false);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#0b140f] border border-emerald-900/80 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 hover:bg-emerald-950 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Reset Search</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#0a110d] p-4 sm:p-5 rounded-3xl border border-emerald-950/90 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search PID or Keyword */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PID, Title, Locality..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="absolute left-3 top-3 text-emerald-400" size={14} />
        </div>

        {/* City Select */}
        <div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Cities</option>
            <option value="Mohali">Mohali</option>
            <option value="Chandigarh">Chandigarh</option>
            <option value="Zirakpur">Zirakpur</option>
            <option value="Kharar">Kharar</option>
            <option value="Panchkula">Panchkula</option>
          </select>
        </div>

        {/* Purpose / Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="rent">Rent</option>
            <option value="buy">Buy / Sale</option>
            <option value="pg">PG / Co-living</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        {/* Verification / Feature Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Moderation</option>
            <option value="featured">Featured Homes</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300">
            Showing <span className="text-emerald-400 font-extrabold">{filteredProperties.length}</span> of {properties.length} Listings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#050806] text-gray-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-emerald-950">
              <tr>
                <th className="p-3.5">PID</th>
                <th className="p-3.5">Property Details</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Owner Contact</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No properties match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((item: any) => {
                  const targetId = item.pid || item._id || item.id;
                  return (
                    <tr key={targetId} className="hover:bg-[#07120a] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{item.pid}</td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-gray-400 truncate">{item.locality}, {item.city}</div>
                      </td>
                      <td className="p-3.5 capitalize font-semibold">{item.category} ({item.type})</td>
                      <td className="p-3.5 font-bold text-emerald-400">₹{item.price?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-gray-300">{item.ownerPhone || '+91 98765 43210'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col space-y-1">
                          {item.verified ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold w-fit">
                              <CheckCircle2 size={11} />
                              <span>VERIFIED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-extrabold w-fit">
                              <Clock size={11} />
                              <span>UNVERIFIED</span>
                            </span>
                          )}

                          {item.featured && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-[9px] font-extrabold w-fit">
                              <Star size={11} />
                              <span>FEATURED</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {/* Verify / Unverify Button */}
                        <button
                          disabled={Boolean(actionPendingId)}
                          onClick={() => handleVerifyToggle(targetId, !!item.verified)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            item.verified
                              ? 'bg-[#140b0d] text-rose-400 border-rose-900/80 hover:bg-rose-950'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-500 shadow-md shadow-emerald-500/20'
                          }`}
                        >
                          {item.verified ? 'Unverify' : 'Verify'}
                        </button>

                        {/* Feature Button */}
                        <button
                          disabled={Boolean(actionPendingId)}
                          onClick={() => handleFeatureToggle(targetId, !!item.featured)}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            item.featured
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-[#0a1810] text-gray-300 border-emerald-900 hover:text-white'
                          }`}
                          title="Toggle Featured status"
                        >
                          <Star size={12} className={item.featured ? 'text-purple-400 fill-purple-400' : ''} />
                        </button>

                        {/* Edit Button */}
                        <button
                          disabled={Boolean(actionPendingId)}
                          onClick={() => setEditingProperty(item)}
                          className="px-2 py-1 rounded-xl bg-[#0a1810] border border-emerald-900 text-gray-300 hover:text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Property Details"
                        >
                          <Edit3 size={12} />
                        </button>

                        {/* Delete Button */}
                        <button
                          disabled={Boolean(actionPendingId)}
                          onClick={() => setPropertyPendingDeletion(item)}
                          className="px-2 py-1 rounded-xl bg-[#180a0a] border border-rose-950 text-rose-400 hover:bg-rose-950 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Listing"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Property Confirmation */}
      {propertyPendingDeletion && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="presentation"
          onClick={() => setPropertyPendingDeletion(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-property-title"
            aria-describedby="delete-property-description"
            className="bg-[#0a110d] rounded-3xl border border-rose-900/80 p-6 max-w-md w-full space-y-5 text-gray-100 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl bg-rose-950/80 border border-rose-900 p-2.5 text-rose-400">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 id="delete-property-title" className="text-base font-extrabold text-white">Delete property listing?</h3>
                <p id="delete-property-description" className="mt-1 text-xs leading-5 text-gray-400">
                  You are about to permanently delete <span className="font-bold text-gray-200">{propertyPendingDeletion.title}</span> ({propertyPendingDeletion.pid}). This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-emerald-950 pt-4">
              <button
                type="button"
                onClick={() => setPropertyPendingDeletion(null)}
                className="px-4 py-2 rounded-xl bg-[#050806] border border-emerald-900 text-gray-300 text-xs font-semibold hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-500 transition-colors shadow-md shadow-rose-950/50"
              >
                Delete listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-900/80 p-6 max-w-lg w-full space-y-5 text-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-base font-extrabold text-white">Edit Property ({editingProperty.pid})</h3>
              <button onClick={() => setEditingProperty(null)} className="p-1 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Property Title</label>
                <input
                  type="text"
                  value={editingProperty.title}
                  onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#050806] border border-emerald-900 rounded-xl text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingProperty.price}
                    onChange={(e) => setEditingProperty({ ...editingProperty, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#050806] border border-emerald-900 rounded-xl text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={editingProperty.city}
                    onChange={(e) => setEditingProperty({ ...editingProperty, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050806] border border-emerald-900 rounded-xl text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Locality / Sector</label>
                  <input
                    type="text"
                    value={editingProperty.locality}
                    onChange={(e) => setEditingProperty({ ...editingProperty, locality: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050806] border border-emerald-900 rounded-xl text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Bedrooms (BHK)</label>
                  <input
                    type="number"
                    value={editingProperty.bedrooms || 2}
                    onChange={(e) => setEditingProperty({ ...editingProperty, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#050806] border border-emerald-900 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-950 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 rounded-xl bg-[#050806] text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-extrabold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPropertiesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-8">Loading properties manager...</div>}>
      <AdminPropertiesContent />
    </Suspense>
  );
}
