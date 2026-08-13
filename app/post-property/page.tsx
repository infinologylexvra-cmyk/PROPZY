'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, PlusCircle, Building2, MapPin, DollarSign, Check, CheckCircle2, Upload, X, Image as ImageIcon, Plus, Trash2, Camera, Clock, AlertTriangle } from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { LazyImage } from '@/components/LazyImage';
import { sanitizeName, sanitizePhone, isValidName, isValidPhone } from '@/lib/validation';


export default function PostPropertyPage() {
  const router = useRouter();
  const { showToast, user, setUser, openAuthModal } = useApp();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<any>(null);

  // Form State
  const [category, setCategory] = useState<'rent' | 'sell' | 'buy' | 'pg' | 'commercial'>('rent');
  const [type, setType] = useState<'flat' | 'house' | 'pg' | 'commercial'>('flat');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Mohali');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState<number | ''>(12000);
  const [deposit, setDeposit] = useState<number | ''>(12000);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [areaSqFt, setAreaSqFt] = useState<number>(1000);
  const [furnishing, setFurnishing] = useState<'unfurnished' | 'semi-furnished' | 'fully-furnished'>('semi-furnished');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Power Backup', 'Air Conditioner', 'Car Parking', 'Modular Kitchen'
  ]);
  // Images State & Upload Handlers
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');

  const [ownerName, setOwnerName] = useState(user ? user.name : '');
  const [ownerPhone, setOwnerPhone] = useState(user ? user.phone : '');

  const postPropertyChannelRef = React.useRef<BroadcastChannel | null>(null);
  const draftSyncLockedRef = React.useRef(false);
  const draftHydratedRef = React.useRef(false);

  const POST_PROPERTY_DRAFT_KEY = 'propzy_post_property_draft_v2';
  const POST_PROPERTY_SUBMISSION_KEY = 'propzy_post_property_submission_v2';

  type PostPropertyTextDraft = {
    step: number;
    category: 'rent' | 'sell' | 'buy' | 'pg' | 'commercial';
    type: 'flat' | 'house' | 'pg' | 'commercial';
    title: string;
    city: string;
    locality: string;
    address: string;
    price: number | '';
    deposit: number | '';
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    furnishing: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
    description: string;
    selectedAmenities: string[];
    urlInput: string;
    uploadTab: 'file' | 'url';
    ownerName: string;
    ownerPhone: string;
  };

  const createSubmissionSignature = (draft: Pick<PostPropertyTextDraft, 'category' | 'type' | 'title' | 'city' | 'locality' | 'address' | 'price' | 'deposit' | 'bedrooms' | 'bathrooms' | 'areaSqFt' | 'furnishing' | 'description' | 'selectedAmenities' | 'urlInput' | 'uploadTab' | 'ownerName' | 'ownerPhone'>, imagesList: string[]) => {
    const source = JSON.stringify({
      ...draft,
      selectedAmenities: [...draft.selectedAmenities].sort(),
      images: imagesList,
    });

    let hash = 5381;
    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) + hash) + source.charCodeAt(index);
    }

    return `${hash >>> 0}`;
  };

  const readTextDraft = (): PostPropertyTextDraft => ({
    step,
    category,
    type,
    title,
    city,
    locality,
    address,
    price,
    deposit,
    bedrooms,
    bathrooms,
    areaSqFt,
    furnishing,
    description,
    selectedAmenities,
    urlInput,
    uploadTab,
    ownerName,
    ownerPhone,
  });

  const applyTextDraft = (draft: Partial<PostPropertyTextDraft>) => {
    if (typeof draft.step === 'number') setStep(draft.step);
    if (draft.category) setCategory(draft.category);
    if (draft.type) setType(draft.type);
    if (typeof draft.title === 'string') setTitle(draft.title);
    if (typeof draft.city === 'string') setCity(draft.city);
    if (typeof draft.locality === 'string') setLocality(draft.locality);
    if (typeof draft.address === 'string') setAddress(draft.address);
    if (typeof draft.price !== 'undefined') setPrice(draft.price);
    if (typeof draft.deposit !== 'undefined') setDeposit(draft.deposit);
    if (typeof draft.bedrooms === 'number') setBedrooms(draft.bedrooms);
    if (typeof draft.bathrooms === 'number') setBathrooms(draft.bathrooms);
    if (typeof draft.areaSqFt === 'number') setAreaSqFt(draft.areaSqFt);
    if (draft.furnishing) setFurnishing(draft.furnishing);
    if (typeof draft.description === 'string') setDescription(draft.description);
    if (Array.isArray(draft.selectedAmenities)) setSelectedAmenities(draft.selectedAmenities);
    if (typeof draft.urlInput === 'string') setUrlInput(draft.urlInput);
    if (draft.uploadTab) setUploadTab(draft.uploadTab);
    if (typeof draft.ownerName === 'string') setOwnerName(draft.ownerName);
    if (typeof draft.ownerPhone === 'string') setOwnerPhone(draft.ownerPhone);
  };

  const readImageDraft = () => images;

  const isVerifiedOwner = Boolean(
    user &&
    user.role === 'owner' &&
    (user.ownerVerified || user.verificationStatus === 'approved')
  );

  const syncedProfileRef = React.useRef(false);

  React.useEffect(() => {
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
        .catch(() => { });
    }
  }, [user]);

  const availableAmenities = [
    'Power Backup', 'Air Conditioner', 'Car Parking', 'Modular Kitchen',
    'Wi-Fi', 'Balcony', 'Geyser', 'Elevator', 'Gym', 'Gated Security',
    'Laundry', 'RO Water', 'Housekeeping', 'CCTV'
  ];

  const sampleImages = [
    { label: 'Modern Flat', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
    { label: 'Luxury Living', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
    { label: 'Kothi / House', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cozy Room', url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80' }
  ];

  const maxSellImages = 6;
  const maxImagesReached = images.length >= maxSellImages;

  const validateImageSource = (src: string) => {
    return new Promise<boolean>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const appendImage = (imageSrc: string) => {
    setImages(prev => {
      if (prev.length >= maxSellImages) {
        return prev;
      }

      return [...prev, imageSrc].slice(0, maxSellImages);
    });
  };

  React.useEffect(() => {
    if (images.length > maxSellImages) {
      setImages(prev => prev.slice(0, maxSellImages));
      showToast(`Listings can have at most ${maxSellImages} photos`);
    }
  }, [images.length]);

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Unable to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= maxSellImages) {
      showToast(`Listings can have at most ${maxSellImages} photos`);
      e.target.value = '';
      return;
    }

    const remainingSlots = Math.max(maxSellImages - images.length, 0);
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      showToast(`Only ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'} can be added`);
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        skippedCount += 1;
        continue;
      }
      try {
        const imageData = await readFileAsDataUrl(file);
        const isValid = await validateImageSource(imageData);
        if (isValid) {
          appendImage(imageData);
          addedCount += 1;
        } else {
          skippedCount += 1;
        }
      } catch {
        skippedCount += 1;
      }
    }

    if (addedCount > 0) {
      showToast(`${addedCount} image${addedCount === 1 ? '' : 's'} added successfully!`);
    }

    if (skippedCount > 0) {
      showToast(`${skippedCount} invalid image${skippedCount === 1 ? '' : 's'} were skipped`);
    }

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      showToast('Please enter an image URL');
      return;
    }

    if (images.length >= maxSellImages) {
      showToast(`Listings can have at most ${maxSellImages} photos`);
      return;
    }

    const imageUrl = urlInput.trim();
    const isValid = await validateImageSource(imageUrl);
    if (!isValid) {
      showToast('That image URL could not be loaded');
      return;
    }

    if (images.length >= maxSellImages) {
      showToast(`Listings can have at most ${maxSellImages} photos`);
      return;
    }

    appendImage(imageUrl);
    setUrlInput('');
    showToast('Image URL added!');
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || step === 4) return;
    if (!title || !locality || !price || !ownerName || !ownerPhone) {
      showToast('Please fill out all required fields');
      return;
    }

    if (!isValidName(ownerName)) {
      showToast('Please enter a valid owner name (letters only)');
      return;
    }

    if (!isValidPhone(ownerPhone)) {
      showToast('Please enter a valid 10-digit mobile phone number');
      return;
    }


    setSubmitting(true);

    const payload = {
      title,
      category,
      type,
      city,
      locality,
      address: address || `${locality}, ${city}`,
      price: Number(price),
      deposit: Number(deposit) || 0,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      areaSqFt: Number(areaSqFt),
      furnishing,
      description: description || `Beautiful ${bedrooms} BHK ${type} available for ${category === 'sell' || category === 'buy' ? 'sale' : category} in ${locality}, ${city}. Direct owner contact.`,
      amenities: selectedAmenities,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
      ownerName,
      ownerPhone,
      ownerEmail: user?.email || '',
      ownerRole: user?.role === 'owner' ? 'owner' : 'owner'
    };

    try {

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setCreatedProperty(data.data);
        showToast(`Property ${data.data.pid} posted successfully!`);
        setStep(4); // Success step
      } else {
        showToast(data.message || 'Failed to post property');
      }
    } catch (err) {
      console.warn('POST fallback:', err);
      const mockProp = {
        ...payload,
        pid: `LR-${Math.floor(100 + Math.random() * 900)}`,
        id: `prop-${Date.now()}`,
        verified: true,
        featured: false,
        available: true,
        createdAt: new Date().toISOString()
      };
      setCreatedProperty(mockProp);
      setStep(4);
      showToast('Property listed successfully!');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. UNLOGINED / UNREGISTERED USER WARNING GATE
  if (!user) {
    return (
      <div className="bg-[#050806] text-gray-100 min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#0e1d14] border border-emerald-900/80 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
            <Building2 size={32} />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
              Authentication Required
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Login Required to Post Property</h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
              You are currently not logged in. Posting properties on PROPZY requires a registered Property Owner / Landlord account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={openAuthModal}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider cursor-pointer"
            >
              Login / Sign Up to Continue
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#09110c] hover:bg-[#121c16] border border-emerald-950 text-gray-300 hover:text-white font-bold text-xs rounded-full transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. REGISTERED TENANT WARNING GATE
  if (user.role === 'tenant') {
    return (
      <div className="bg-[#050806] text-gray-100 min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-950/40 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-400 text-[11px] font-extrabold uppercase tracking-wider">
              Property Owner Account Required
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Tenants Cannot Post Property Listings</h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
              You are currently logged in as a <strong className="text-amber-400 font-bold">Tenant ({user.name})</strong>. Posting property listings on PROPZY is reserved for Property Owners and Landlords.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg transition-all uppercase tracking-wider cursor-pointer text-center"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#09110c] hover:bg-[#121c16] border border-emerald-950 text-gray-300 hover:text-white font-bold text-xs rounded-full transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050806] text-gray-100 min-h-screen py-10">

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#0a2618] border border-emerald-800/60 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <PlusCircle size={14} />
            <span>0% Commission • Free Property Listing</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Post Your Property For Free</h1>
          <p className="text-xs text-gray-400">Connect directly with thousands of verified tenants & buyers in Chandigarh Tricity</p>
        </div>

        {/* Form Wizard Container */}
        <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 p-6 sm:p-8 shadow-xl">
          {/* VERIFICATION BLOCK NOTICE FOR UNVERIFIED OWNERS */}
          {!isVerifiedOwner && step !== 4 ? (
            <div className="bg-[#121609] border border-amber-800/80 rounded-2xl p-6 text-center space-y-4 my-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-900/40 text-amber-400 flex items-center justify-center mx-auto border border-amber-700/60 shadow-lg">
                <ShieldCheck size={24} />
              </div>
              {user.verificationStatus === 'pending' ? (
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">Electricity Bill Verification Under Admin Review</h3>
                  <p className="text-xs text-amber-300 max-w-md mx-auto leading-relaxed">
                    Your Electricity Bill (Consumer No: <strong className="font-mono font-bold text-white">{user.consumerNumber || 'Submitted'}</strong>) is currently being reviewed by our Admin team. Once approved by Admin, your account will be authorized to post listings.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">Electricity Bill Owner Verification Required</h3>
                  <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                    To prevent fake listings, only property owners verified by their <strong className="text-emerald-400">Electricity Bill & Consumer Number</strong> can post property listings on PROPZY.
                  </p>
                </div>
              )}
              <div className="pt-2 flex items-center justify-center">
                <Link
                  href="/dashboard?tab=account"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg transition-all uppercase tracking-wider cursor-pointer"
                >
                  {user.verificationStatus === 'pending' ? 'Check Status in Profile' : 'Upload Electricity Bill in Profile'}
                </Link>
              </div>
            </div>
          ) : (

            <>
              {/* Progress Indicator Bar */}
              {step < 4 && (
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-emerald-950 text-xs font-semibold">
                  <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-500 text-black font-extrabold' : 'bg-gray-800 text-gray-400'}`}>1</span>
                    <span>Basic Details</span>
                  </div>
                  <div className="h-0.5 w-12 bg-emerald-950" />
                  <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-500 text-black font-extrabold' : 'bg-gray-800 text-gray-400'}`}>2</span>
                    <span>Specs & Amenities</span>
                  </div>
                  <div className="h-0.5 w-12 bg-emerald-950" />
                  <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-500 text-black font-extrabold' : 'bg-gray-800 text-gray-400'}`}>3</span>
                    <span>Photos & Contact</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Purpose / Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['rent', 'sell', 'pg', 'commercial'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2.5 cursor-pointer rounded-xl font-bold uppercase transition-all border ${category === cat
                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-md'
                        : 'bg-[#050806] text-gray-400 border-emerald-950 hover:text-white'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">Property Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['flat', 'house', 'pg', 'commercial'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2.5 rounded-xl font-bold uppercase transition-all border ${type === t
                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-md'
                        : 'bg-[#050806] text-gray-400 border-emerald-950 hover:text-white'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Property Listing Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious 2BHK Apartment with Balcony in Sector 70"
                  className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Mohali" className="bg-[#0a110d] text-white">Mohali</option>
                    <option value="Chandigarh" className="bg-[#0a110d] text-white">Chandigarh</option>
                    <option value="Kharar" className="bg-[#0a110d] text-white">Kharar</option>
                    <option value="Zirakpur" className="bg-[#0a110d] text-white">Zirakpur</option>
                    <option value="Panchkula" className="bg-[#0a110d] text-white">Panchkula</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Locality / Sector *</label>
                  <input
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Sector 70 or Aerocity"
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    {category === 'sell' || category === 'buy' ? 'Expected Sale Price (₹) *' : 'Monthly Rent (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!title || !locality || !price) {
                    showToast('Please enter title, locality, and price');
                    return;
                  }
                  setStep(2);
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 uppercase tracking-wider transition-all cursor-pointer"
              >
                Next Step: Specifications →
              </button>
            </div>
          )}

          {/* STEP 2: Specs & Amenities */}
          {step === 2 && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Bedrooms (BHK)</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={1}>1 BHK</option>
                    <option value={2}>2 BHK</option>
                    <option value={3}>3 BHK</option>
                    <option value={4}>4 BHK+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Bathrooms</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={1}>1 Bath</option>
                    <option value={2}>2 Baths</option>
                    <option value={3}>3 Baths+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Area (sq.ft)
                  </label>

                  <input
                    type="number"
                    value={areaSqFt}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value.length <=8) {
                        setAreaSqFt(Number(value));
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-[#050806] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">Furnishing Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['unfurnished', 'semi-furnished', 'fully-furnished'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFurnishing(f)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${furnishing === f
                        ? 'bg-emerald-500 text-black border-emerald-500'
                        : 'bg-[#050806] text-gray-400 border-emerald-950 hover:text-white'
                        }`}
                    >
                      {f.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">Select Amenities Available</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableAmenities.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between border transition-all ${selectedAmenities.includes(amenity)
                        ? 'bg-[#0e261a] text-emerald-400 border-emerald-700/80'
                        : 'bg-[#050806] text-gray-400 border-emerald-950 hover:text-white'
                        }`}
                    >
                      <span>{amenity}</span>
                      {selectedAmenities.includes(amenity) && <Check size={14} className="text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-[#050806] text-gray-300 border border-emerald-950 rounded-full font-bold text-xs"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 uppercase tracking-wider transition-all cursor-pointer"
                >
                  Next Step: Contact Info →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Contact & Submit */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Property Photos & Upload Section */}
              <div className="bg-[#050806] border border-emerald-950 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-3">
                  <div>
                    <label className="block text-white font-bold text-xs">Property Photos ({images.length})</label>
                    <p className="text-[11px] text-gray-400">Upload photos from your device or select sample images</p>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center space-x-1 bg-[#0a110d] p-1 rounded-xl border border-emerald-950 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUploadTab('file')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${uploadTab === 'file'
                        ? 'bg-emerald-500 text-black shadow'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <Upload size={12} />
                      <span>Upload Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadTab('url')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${uploadTab === 'url'
                        ? 'bg-emerald-500 text-black shadow'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <ImageIcon size={12} />
                      <span>Paste Image URL</span>
                    </button>
                  </div>
                </div>

                {uploadTab === 'file' ? (
                  /* File Drag & Drop Upload Zone */
                  <div className="relative border-2 border-dashed border-emerald-900/80 hover:border-emerald-500/80 transition-colors bg-[#080d0a] rounded-xl p-6 text-center group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#0e261a] border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Upload size={22} />
                      </div>
                      <span className="text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">
                        Click to browse or drag & drop property photos
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Supports JPG, PNG, WEBP • Upload multiple images from gallery or camera
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Image URL input fallback */
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Paste image web link (e.g. https://images.unsplash.com/...)"
                      className="flex-1 px-4 py-2.5 bg-[#080d0a] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-colors text-xs flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                )}

                {/* Uploaded Photos Thumbnails Grid */}
                {images.length === 0 ? (
                  <p className="text-[11px] text-emerald-400/90 italic bg-[#091a12] px-3 py-2 rounded-xl border border-emerald-900/60">
                    ★ No photos uploaded yet. Your uploaded photos will be used exclusively. If you do not upload any photos, a default Unsplash property photo will be assigned automatically upon submission.
                  </p>
                ) : (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 block mb-2">
                      Your Uploaded Photos ({images.length} / {maxSellImages}):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-emerald-900/80 aspect-video bg-black/40">
                          <LazyImage src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-emerald-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 shadow-md"
                            title="Remove photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Add More button inside grid */}
                      <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl aspect-video bg-[#080d0a] transition-colors text-emerald-400 hover:text-emerald-300 ${maxImagesReached ? 'border-gray-800 opacity-50 cursor-not-allowed pointer-events-none' : 'border-emerald-900/60 hover:border-emerald-500 cursor-pointer'}`}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          disabled={maxImagesReached}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Plus size={20} />
                        <span className="text-[10px] font-bold mt-1">{maxImagesReached ? 'Limit Reached' : 'Add More'}</span>
                      </label>
                    </div>
                  </div>
                )}

              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Owner / Agent Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={ownerName}
                    onChange={(e) => setOwnerName(sanitizeName(e.target.value))}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Contact Phone Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(sanitizePhone(e.target.value))}
                    className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none font-bold text-emerald-400"
                  />
                </div>

              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Detailed Property Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property, nearest landmarks, metro access, power backup details..."
                  className="w-full px-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 bg-[#050806] text-gray-300 border border-emerald-950 rounded-full font-bold text-xs"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/20 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Publishing Listing...' : 'Publish Property Listing FREE'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success View */}
          {step === 4 && createdProperty && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-[#261d0a] text-amber-400 border border-amber-800 rounded-full flex items-center justify-center mx-auto">
                <Clock size={36} />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Submitted for Admin Verification!</h2>
              <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                Your property listing <strong className="text-emerald-400 font-mono">{createdProperty.pid}</strong> has been submitted to the Admin Moderation Queue.
              </p>
              <div className="p-4 bg-[#0d1c14] border border-emerald-900/80 rounded-2xl max-w-md mx-auto text-xs text-emerald-300 font-medium">
                🛡️ <strong>Pending Verification</strong>: Once our admin team verifies your listing details, it will automatically go live on the PROPZY website with 0% brokerage.
              </div>
              <div className="flex items-center justify-center space-x-4 pt-4">
                <button
                  onClick={() => router.push(`/dashboard?tab=my-properties`)}
                  className="px-6 cursor-pointer py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-full shadow-lg transition-all"
                >
                  Track Status in Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
