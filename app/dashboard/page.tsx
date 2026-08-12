'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Heart, User, Building, PhoneCall, ShieldCheck, CheckCircle2,
  XCircle, RefreshCw, CreditCard, Sparkles, FileText, Download, Check, Edit3, Save
} from 'lucide-react';
import { useApp, UserProfile, BillingRecord } from '@/context/AppContext';
import { PropertyItem, INITIAL_PROPERTIES } from '@/lib/seedData';
import { PropertyCard } from '@/components/PropertyCard';
import { LazyImage } from '@/components/LazyImage';

interface InquiryItem {
  _id?: string;
  propertyId: string;
  propertyTitle: string;
  propertyPid: string;
  tenantName: string;
  tenantPhone: string;
  tenantMessage?: string;
  status: string;
  createdAt?: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { wishlist, user, setUser, openAuthModal, logoutUser, showToast } = useApp();

  const tabParam = searchParams.get('tab') as 'account' | 'wishlist' | 'my-properties' | 'billing' | 'explore-plans' | 'inquiries' | null;
  const [activeTab, setActiveTab] = useState<'account' | 'wishlist' | 'my-properties' | 'billing' | 'explore-plans' | 'inquiries'>(tabParam || 'account');

  const [savedProperties, setSavedProperties] = useState<PropertyItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyItem[]>(INITIAL_PROPERTIES);
  const [loading, setLoading] = useState(true);

  // Account Edit Form State
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: user?.city || 'Mohali',
    role: user?.role || 'tenant'
  });

  // Owner Verification State
  const [verifyForm, setVerifyForm] = useState({
    consumerNumber: user?.consumerNumber || '',
    billUrl: user?.electricityBillUrl || ''
  });
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        city: user.city || 'Mohali',
        role: user.role
      });
      setVerifyForm({
        consumerNumber: user.consumerNumber || '',
        billUrl: user.electricityBillUrl || ''
      });
    }
  }, [user]);

  const syncedProfileRef = React.useRef(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Sync latest user profile status once (e.g. owner verification approval from Admin)
      if (user?.email && !syncedProfileRef.current) {
        syncedProfileRef.current = true;
        fetch('/api/user/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              if (
                user.verificationStatus !== data.user.verificationStatus ||
                user.ownerVerified !== data.user.ownerVerified ||
                user.role !== data.user.role
              ) {
                setUser({ ...user, ...data.user });
              }
            }
          })
          .catch(() => {});
      }

      // Fetch all properties (including owner's unverified listings awaiting moderation)
      const pRes = await fetch('/api/properties?verified=all');
      const pData = await pRes.json();
      if (pData.success && pData.data) {
        setAllProperties(pData.data);
        const filteredWishlist = pData.data.filter((p: any) => {
          if (wishlist.includes(p.pid)) return true;
          if (p.id && wishlist.includes(p.id)) return true;
          if (p._id && wishlist.includes(p._id.toString())) return true;
          if (p.id && p.id.startsWith('prop-') && wishlist.includes(`LR-${p.id.replace('prop-', '')}`)) return true;
          if (p.pid && p.pid.startsWith('LR-') && wishlist.includes(`prop-${p.pid.replace('LR-', '')}`)) return true;
          return false;
        });
        setSavedProperties(filteredWishlist);
      }

      // Fetch inquiries
      const iRes = await fetch('/api/inquiries');
      const iData = await iRes.json();
      if (iData.success && iData.data) {
        setInquiries(iData.data);
      }
    } catch (e) {
      console.warn('Dashboard fetch fallback:', e);
      const filteredWishlist = INITIAL_PROPERTIES.filter((p: any) =>
        wishlist.includes(p.pid) || (p.id && wishlist.includes(p.id))
      );
      setSavedProperties(filteredWishlist);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const myProperties = allProperties.filter((p: PropertyItem) => {
    if (!user) return false;

    // 1. Strict Email Match (most accurate)
    if (user.email && p.ownerEmail && user.email.toLowerCase().trim() === p.ownerEmail.toLowerCase().trim()) {
      return true;
    }

    // 2. Phone Match (ignore generic dummy numbers like 9876543210)
    const userPhoneClean = user.phone ? user.phone.replace(/\D/g, '') : '';
    const propPhoneClean = p.ownerPhone ? p.ownerPhone.replace(/\D/g, '') : '';
    const isDummyPhone = userPhoneClean === '9876543210' || userPhoneClean.length < 10;

    if (!isDummyPhone && userPhoneClean.length >= 10 && userPhoneClean === propPhoneClean) {
      const userFirst = user.name ? user.name.toLowerCase().trim().split(' ')[0] : '';
      const propFirst = p.ownerName ? p.ownerName.toLowerCase().trim().split(' ')[0] : '';
      if (userFirst && propFirst && userFirst === propFirst) {
        return true;
      }
    }

    // 3. Full Name Match (only if ownerEmail is unassigned or matches)
    if (user.name && p.ownerName && user.name.toLowerCase().trim() === p.ownerName.toLowerCase().trim()) {
      if (!p.ownerEmail || p.ownerEmail.toLowerCase().trim() === user.email?.toLowerCase().trim()) {
        return true;
      }
    }

    return false;
  });

  const myInquiries = inquiries.filter((inq: InquiryItem) => {
    if (!user) return false;

    const userPhoneClean = user.phone ? user.phone.replace(/\D/g, '') : '';
    const inqPhoneClean = inq.tenantPhone ? inq.tenantPhone.replace(/\D/g, '') : '';

    if (userPhoneClean && inqPhoneClean && userPhoneClean === inqPhoneClean) {
      return true;
    }
    if (user.name && inq.tenantName && user.name.toLowerCase().trim() === inq.tenantName.toLowerCase().trim()) {
      return true;
    }

    if (user.role === 'owner') {
      const isMyProp = myProperties.some(p => p.pid === inq.propertyPid || p.id === inq.propertyId);
      if (isMyProp) return true;
    }

    return false;
  });

  const handleAccountFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser: UserProfile = {
      ...user,
      name: accountForm.name,
      phone: accountForm.phone,
      email: accountForm.email,
      city: accountForm.city,
      role: accountForm.role as 'tenant' | 'owner' | 'admin'
    };

    setUser(updatedUser);
    setIsEditingAccount(false);
    showToast('Account details updated successfully!');
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!verifyForm.consumerNumber || !verifyForm.billUrl) {
      showToast('Please provide both Consumer Number and Electricity Bill photo/link');
      return;
    }
    setSubmittingVerify(true);
    try {
      const res = await fetch('/api/user/verify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          consumerNumber: verifyForm.consumerNumber,
          electricityBillUrl: verifyForm.billUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser({
          ...user,
          role: 'owner',
          ownerVerified: false,
          verificationStatus: 'pending',
          consumerNumber: verifyForm.consumerNumber,
          electricityBillUrl: verifyForm.billUrl
        });
        showToast(data.message);
      } else {
        showToast(data.message || 'Submission failed');
      }
    } catch (e) {
      showToast('Error submitting verification');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      syncedProfileRef.current = false;
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.race([fetchDashboardData(), timeoutPromise]);
      showToast('Dashboard overview refreshed!');
    } catch (e) {
      showToast('Dashboard overview refreshed!');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: 'account' | 'wishlist' | 'my-properties' | 'billing' | 'explore-plans' | 'inquiries') => {
    setActiveTab(tab);
    router.push(`/dashboard?tab=${tab}`);
  };

  if (!user) {
    return (
      <div className="bg-[#050806] text-gray-100 min-h-screen py-16">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 bg-[#0a1e14] text-emerald-400 border border-emerald-800/60 rounded-full flex items-center justify-center mx-auto">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Login Required</h2>
          <p className="text-xs text-gray-400">
            Please log in to your Propzy account to access your user dashboard, saved properties, and billing history.
          </p>
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider"
          >
            Log In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050806] text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* User Profile Header Card */}
        <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-black font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">{user.name}</h2>
                <span className="text-[10px] uppercase font-bold bg-[#092618] text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{user.phone} {user.email ? `• ${user.email}` : ''}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={logoutUser}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#140808] hover:bg-red-950/60 text-red-400 border border-red-900/60 rounded-full text-xs font-bold transition-all"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center cursor-pointer space-x-6 border-b border-emerald-950 overflow-x-auto text-xs font-medium pb-px">
          <button
            onClick={() => handleTabChange('account')}
            className={`pb-3.5 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-all ${activeTab === 'account'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <User size={16} />
            <span>My Profile</span>
          </button>

          {user.role === 'owner' && (
            <button
              onClick={() => handleTabChange('my-properties')}
              className={`pb-3.5 cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap transition-all ${activeTab === 'my-properties'
                  ? 'border-emerald-400 text-emerald-400 font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              <Building size={16} />
              <span>My Properties ({myProperties.length})</span>
            </button>
          )}

          <button
            onClick={() => handleTabChange('wishlist')}
            className={`pb-3.5 border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap transition-all ${activeTab === 'wishlist'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Heart size={16} />
            <span>Saved Property ({savedProperties.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('billing')}
            className={`pb-3.5 cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap transition-all ${activeTab === 'billing'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <CreditCard size={16} />
            <span>Billing History</span>
          </button>

          <button
            onClick={() => handleTabChange('explore-plans')}
            className={`pb-3.5 border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap transition-all ${activeTab === 'explore-plans'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Sparkles size={16} />
            <span>Explore Plans</span>
          </button>

          <button
            onClick={() => handleTabChange('inquiries')}
            className={`pb-3.5 border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap transition-all ${activeTab === 'inquiries'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <PhoneCall size={16} />
            <span>Inquiries ({myInquiries.length})</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNT PROFILE */}
        {activeTab === 'account' && (
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Personal Information</h3>
                <p className="text-xs text-gray-400">Manage your contact details, city, and account role</p>
              </div>

              {!isEditingAccount ? (
                <button
                  onClick={() => setIsEditingAccount(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#06180f] hover:bg-[#0e2c1d] text-emerald-400 border border-emerald-800/60 rounded-full text-xs font-bold transition-all"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingAccount(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditingAccount ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="p-4 bg-[#050806] rounded-2xl border border-emerald-950">
                  <span className="text-gray-500 font-medium block mb-1">Full Name</span>
                  <span className="text-sm font-bold text-white">{user.name}</span>
                </div>
                <div className="p-4 bg-[#050806] rounded-2xl border border-emerald-950">
                  <span className="text-gray-500 font-medium block mb-1">Phone Number</span>
                  <span className="text-sm font-mono font-bold text-white">{user.phone}</span>
                </div>
                <div className="p-4 bg-[#050806] rounded-2xl border border-emerald-950">
                  <span className="text-gray-500 font-medium block mb-1">Email Address</span>
                  <span className="text-sm font-bold text-white">{user.email || 'Not provided'}</span>
                </div>
                <div className="p-4 bg-[#050806] rounded-2xl border border-emerald-950">
                  <span className="text-gray-500 font-medium block mb-1">Account Role</span>
                  <span className="text-sm font-bold text-emerald-400 capitalize">{user.role === 'owner' ? 'Property Owner / Landlord' : 'Tenant'}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAccountFormSave} className="space-y-4 max-w-xl text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={accountForm.city}
                    onChange={(e) => setAccountForm({ ...accountForm, city: e.target.value })}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Account Profile Role</label>
                  <select
                    value={accountForm.role}
                    onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value as any })}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="tenant">Tenant (Looking for property to rent/buy)</option>
                    <option value="owner">Property Owner / Landlord (Post properties)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Save Account Changes
                  </button>
                </div>
              </form>
            )}

            {/* ELECTRICITY BILL OWNER VERIFICATION SECTION */}
            <div className="border-t border-emerald-950 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>⚡ Electricity Bill Owner Verification</span>
                  </h4>
                  <p className="text-xs text-gray-400">
                    Upload your Electricity Bill & Consumer Number to verify your property ownership. Only verified owners can post property listings.
                  </p>
                </div>

                {user.ownerVerified || user.verificationStatus === 'approved' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-extrabold flex items-center space-x-1">
                    <ShieldCheck size={14} />
                    <span>VERIFIED OWNER</span>
                  </span>
                ) : user.verificationStatus === 'pending' ? (
                  <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-xs font-extrabold flex items-center space-x-1">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>PENDING ADMIN REVIEW</span>
                  </span>
                ) : user.verificationStatus === 'rejected' ? (
                  <span className="px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-xs font-extrabold flex items-center space-x-1">
                    <XCircle size={14} />
                    <span>VERIFICATION REJECTED</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800 text-xs font-bold">
                    NOT VERIFIED
                  </span>
                )}
              </div>

              {/* Status Notice Banner */}
              {user.ownerVerified || user.verificationStatus === 'approved' ? (
                <div className="p-4 bg-[#0d2218] border border-emerald-800/80 rounded-2xl text-xs text-emerald-300 font-medium flex items-center space-x-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-white text-sm">Account Fully Verified!</span>
                    Your Electricity Bill and Consumer Number ({user.consumerNumber || 'Verified'}) have been approved by Admin. You can post unlimited property listings.
                  </div>
                </div>
              ) : user.verificationStatus === 'pending' ? (
                <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl text-xs text-amber-300 font-medium flex items-center space-x-3">
                  <RefreshCw size={20} className="text-amber-400 shrink-0 animate-spin" />
                  <div>
                    <span className="font-bold block text-white text-sm">Under Review by Admin</span>
                    Your Electricity Bill (CA/Consumer No: <strong className="font-mono text-amber-400">{user.consumerNumber}</strong>) is currently being reviewed by our Admin team. You will be able to post properties as soon as it is approved.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerifySubmit} className="space-y-4 max-w-xl text-xs pt-2">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Electricity Bill Consumer / CA Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CA-1004829103 or 100982341"
                      value={verifyForm.consumerNumber}
                      onChange={(e) => setVerifyForm({ ...verifyForm, consumerNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Electricity Bill Photo / Document URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="Paste image link or URL of your electricity bill document"
                      value={verifyForm.billUrl}
                      onChange={(e) => setVerifyForm({ ...verifyForm, billUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      💡 Tip: You can paste any image link (e.g. Unsplash sample link or image URL) or upload a photo of your latest electricity bill.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVerify}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    {submittingVerify ? 'Submitting...' : 'Submit Electricity Bill for Admin Verification'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY PROPERTIES */}
        {activeTab === 'my-properties' && (
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Posted Properties</h3>
                <p className="text-xs text-gray-400">Properties listed under your account ({user.name})</p>
              </div>
              <Link
                href="/post-property"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold rounded-full shadow-md transition-all"
              >
                + Post New Listing
              </Link>
            </div>

            {myProperties.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-[#06180f] text-emerald-400 border border-emerald-800/60 rounded-full flex items-center justify-center mx-auto">
                  <Building size={24} />
                </div>
                <p className="text-sm font-bold text-white">No properties posted under your account</p>
                <p className="text-xs text-gray-400">
                  You haven't posted any property listings under your account ({user.name}) yet.
                </p>
                <Link
                  href="/post-property"
                  className="inline-block px-6 py-3 bg-emerald-500 text-black rounded-full text-xs font-extrabold shadow-lg mt-2"
                >
                  + Post Property Now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-emerald-950">
                {myProperties.map((p: PropertyItem) => (
                  <div key={p.id || p.pid} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <LazyImage src={p.images?.[0] || ''} alt={p.title} className="w-16 h-16 rounded-2xl border border-emerald-950" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-emerald-400 font-extrabold">{p.pid}</span>
                          {p.verified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold">VERIFIED & LIVE</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-extrabold">UNDER REVIEW</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white">{p.title}</h4>
                        <p className="text-xs text-gray-400">{p.locality}, {p.city} • ₹{p.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/properties/${p.id || p.pid}`}
                        className="px-3.5 py-1.5 bg-[#06180f] text-emerald-400 border border-emerald-800/60 rounded-full text-xs font-bold hover:bg-emerald-900/60 transition-colors"
                      >
                        View Property →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WISHLIST / SAVED */}
        {activeTab === 'wishlist' && (
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-emerald-950 pb-4">
              <h3 className="text-lg font-bold text-white">Saved Properties</h3>
              <p className="text-xs text-gray-400">Shortlisted rental homes and properties for quick access</p>
            </div>

            {savedProperties.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-[#06180f] text-emerald-400 border border-emerald-800/60 rounded-full flex items-center justify-center mx-auto">
                  <Heart size={24} />
                </div>
                <p className="text-sm font-bold text-white">Your wishlist is empty</p>
                <p className="text-xs text-gray-400">
                  Click the heart icon on any property card to save it to your wishlist.
                </p>
                <Link href="/properties" className="inline-block px-6 py-3 bg-emerald-500 text-black rounded-full text-xs font-extrabold shadow-lg">
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((p: PropertyItem) => (
                  <PropertyCard key={p.id || p.pid} property={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BILLING HISTORY */}
        {activeTab === 'billing' && (
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Billing History & Invoices</h3>
                <p className="text-xs text-gray-400">View payment history and download tax invoice receipts</p>
              </div>
              <span className="text-xs bg-[#092618] text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-800/80">
                Active Plan: {user?.activePlan || 'Free Member'}
              </span>
            </div>

            {!user?.billingHistory || user.billingHistory.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No billing history found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#050806] text-gray-400 uppercase text-[10px] tracking-wider font-extrabold border-y border-emerald-950">
                    <tr>
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3 px-4">Plan / Service</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950 text-gray-300 font-medium">
                    {user.billingHistory?.map((item: BillingRecord) => (
                      <tr key={item.id} className="hover:bg-[#0e1813] transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-emerald-400">{item.invoiceNo}</td>
                        <td className="py-4 px-4 font-semibold text-white">{item.planName}</td>
                        <td className="py-4 px-4 text-gray-400">{item.date}</td>
                        <td className="py-4 px-4 font-bold text-white">₹{item.amount.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-4 text-gray-400">{item.paymentMethod}</td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-0.5 bg-[#092618] text-emerald-400 text-[10px] font-extrabold border border-emerald-800/60 rounded-full">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => showToast(`Downloading Invoice ${item.invoiceNo}...`)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 bg-[#050806] rounded-xl border border-emerald-950"
                          >
                            <Download size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: EXPLORE PLANS */}
        {activeTab === 'explore-plans' && (
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-white">Tenant & Owner Plans</h3>
              <p className="text-xs text-gray-400">Get a dedicated Relationship Manager to negotiate, shortlist & close properties 10x faster</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-[#050806] border border-emerald-900/60 rounded-3xl p-6 space-y-4">
                <span className="text-[10px] font-extrabold uppercase bg-[#092618] text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
                  Most Popular for Tenants
                </span>
                <h4 className="text-xl font-bold text-white">Relax Plan (Relationship Manager)</h4>
                <div className="text-2xl font-extrabold text-emerald-400">₹1,499 <span className="text-xs text-gray-400 font-normal">/ one-time</span></div>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li className="flex items-center space-x-2"><Check size={14} className="text-emerald-400" /><span>Dedicated Personal Relationship Manager</span></li>
                  <li className="flex items-center space-x-2"><Check size={14} className="text-emerald-400" /><span>Hand-picked verified owner property contacts</span></li>
                  <li className="flex items-center space-x-2"><Check size={14} className="text-emerald-400" /><span>Price negotiation assistance on your behalf</span></li>
                </ul>
                <button
                  onClick={() => showToast('Redirecting to payment gateway...')}
                  className="w-full py-3 bg-emerald-500 text-black font-extrabold text-xs rounded-full shadow-lg"
                >
                  Subscribe Now
                </button>
              </div>

              <div className="bg-[#050806] border border-emerald-950 rounded-3xl p-6 space-y-4">
                <span className="text-[10px] font-extrabold uppercase bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                  For Owners & Agents
                </span>
                <h4 className="text-xl font-bold text-white">Property Booster Plan</h4>
                <div className="text-2xl font-extrabold text-white">₹999 <span className="text-xs text-gray-400 font-normal">/ 30 days</span></div>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li className="flex items-center space-x-2"><Check size={14} className="text-emerald-400" /><span>Top homepage placement for 3x higher inquiries</span></li>
                  <li className="flex items-center space-x-2"><Check size={14} className="text-emerald-400" /><span>Verified Owner badge on property listing</span></li>
                </ul>
                <button
                  onClick={() => showToast('Redirecting to payment gateway...')}
                  className="w-full py-3 bg-[#0a1b12] text-emerald-400 border border-emerald-800 rounded-full font-extrabold text-xs"
                >
                  Boost My Listing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Your Submitted Callback Inquiries & Leads</h3>
            {myInquiries.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No callback inquiries recorded for your account yet.</p>
            ) : (
              <div className="divide-y divide-emerald-950">
                {myInquiries.map((inq: InquiryItem, idx: number) => (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono bg-[#092618] text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded font-bold mr-2">
                        {inq.propertyPid}
                      </span>
                      <strong className="text-white">{inq.propertyTitle}</strong>
                      <div className="text-gray-400 mt-1">
                        Tenant: <strong className="text-white">{inq.tenantName}</strong> ({inq.tenantPhone})
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-[#092618] text-emerald-400 border border-emerald-800/80 text-[10px] font-bold rounded-full uppercase">
                      {inq.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500 bg-[#050806] min-h-screen">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
