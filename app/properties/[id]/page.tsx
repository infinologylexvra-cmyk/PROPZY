'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, MapPin, Bed, Bath, Maximize, Heart, PhoneCall, 
  ChevronLeft, ChevronRight, Check, Share2, Calculator, Sparkles, Building2, User, Copy 
} from 'lucide-react';
import { PropertyItem, INITIAL_PROPERTIES } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';
import { InquiryModal } from '@/components/InquiryModal';
import { LazyImage } from '@/components/LazyImage';
import { BrandSpinner } from '@/components/Loader';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { user, openAuthModal, toggleWishlist, isWishlisted, showToast } = useApp();
  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProperty(data.data);
        } else {
          const found = INITIAL_PROPERTIES.find(p => p.id === id || p.pid === id);
          if (found) setProperty(found);
        }
      } catch (e) {
        const found = INITIAL_PROPERTIES.find(p => p.id === id || p.pid === id);
        if (found) setProperty(found);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id, user?.email, user?.role]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <BrandSpinner message="Loading verified property details..." size="lg" />
      </div>
    );
  }

  if (!property) {
    return notFound();
  }

  const wish = isWishlisted(property.id || property.pid);
  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'];

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Property link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Navigation & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center space-x-1.5 text-xs font-bold text-gray-300 hover:text-emerald-400 transition-colors"
        >
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="flex cursor-pointer items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
          >
            <Copy size={14} />
            <span>Copy Link</span>
          </button>

          <button
            onClick={() => toggleWishlist(property.id || property.pid)}
            className={`p-2 cursor-pointer rounded-xl transition-all ${
              wish ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart size={16} fill={wish ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Main Header & Tags */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-gray-900 text-white font-mono text-xs font-semibold px-2.5 py-1 rounded-md">
            PID: {property.pid}
          </span>
          {property.verified && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center space-x-1">
              <ShieldCheck size={14} />
              <span>Verified Listing</span>
            </span>
          )}
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
            0% Brokerage
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {property.title}
        </h1>

        <div className="flex items-center text-xs sm:text-sm text-gray-600 space-x-2">
          <MapPin size={16} className="text-emerald-500 shrink-0" />
          <span>{property.address}</span>
        </div>
      </div>

      {/* Photo Gallery Grid / Lightbox */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative aspect-16/10 rounded-3xl overflow-hidden bg-[#050806] group shadow-sm">
          <LazyImage
            src={images[currentImgIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentImgIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Preview Side Grid */}
        <div className="hidden md:flex flex-col space-y-4">
          {images.slice(0, 3).map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImgIndex(idx)}
              className={`relative flex-1 rounded-2xl overflow-hidden border-2 transition-all ${
                currentImgIndex === idx ? 'border-emerald-500 scale-95' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <LazyImage src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Specification Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 block">Rent / Price</span>
              <span className="text-xl font-extrabold text-gray-900 block">{formatPrice(property.price)}</span>
            </div>

            {property.bedrooms !== undefined && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Bedrooms</span>
                <span className="text-base font-bold text-gray-900 flex items-center space-x-1">
                  <Bed size={18} className="text-emerald-500" />
                  <span>{property.bedrooms} BHK</span>
                </span>
              </div>
            )}

            {property.bathrooms !== undefined && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Bathrooms</span>
                <span className="text-base font-bold text-gray-900 flex items-center space-x-1">
                  <Bath size={18} className="text-emerald-500" />
                  <span>{property.bathrooms} Baths</span>
                </span>
              </div>
            )}

            {property.areaSqFt && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Super Area</span>
                <span className="text-base font-bold text-gray-900 flex items-center space-x-1">
                  <Maximize size={18} className="text-emerald-500" />
                  <span>{property.areaSqFt} sqft</span>
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Property Overview & Details</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Checklist */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Features & Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2 text-xs font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Owner Contact Sidebar Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs text-gray-500 block">Listed By</span>
                <h4 className="text-base font-bold text-gray-900 flex items-center space-x-1.5">
                  <User size={16} className="text-emerald-500" />
                  <span>{property.ownerName}</span>
                </h4>
                <span className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {property.ownerRole}
                </span>
              </div>

              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg">
                {property.ownerName.charAt(0)}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!user) {
                    showToast('Please login to get owner contact details');
                    openAuthModal();
                    return;
                  }
                  setShowInquiryModal(true);
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PhoneCall size={18} />
                <span>Get Owner Contact Number</span>
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    showToast('Please login to contact owner on WhatsApp');
                    openAuthModal();
                    return;
                  }
                  const cleanPhone = property.ownerPhone ? property.ownerPhone.replace(/\D/g, '') : '';
                  window.open(`https://wa.me/${cleanPhone}?text=Hi,%20I%20am%20interested%20in%20your%20property%20PID%20${property.pid}`, '_blank');
                }}
                className="w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Chat on WhatsApp</span>
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-600 space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold">
                <ShieldCheck size={14} />
                <span>PROPZY Verified Protection</span>

              </div>
              <p>Zero brokerage guarantee. Direct visit scheduling without commission.</p>
            </div>
          </div>
        </div>
      </div>

      <InquiryModal
        property={showInquiryModal ? property : null}
        onClose={() => setShowInquiryModal(false)}
      />
    </div>
  );
}
