'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, MapPin, Bed, Bath, Maximize, Heart, PhoneCall, 
  ChevronLeft, ChevronRight, Check, User, Copy, Grid, X, Camera, Image as ImageIcon
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProperty(data.data);
        } else {
          setProperty(null);
        }
      } catch (e) {
        console.warn('Property detail fetch error:', e);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id, user?.email, user?.role]);

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isLightboxOpen) return;
    if (e.key === 'ArrowLeft') {
      setCurrentImgIndex((prev) => (prev - 1 + (property?.images?.length || 1)) % (property?.images?.length || 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentImgIndex((prev) => (prev + 1) % (property?.images?.length || 1));
    } else if (e.key === 'Escape') {
      setIsLightboxOpen(false);
    }
  }, [isLightboxOpen, property?.images?.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
  const hasPrivateContactAccess = Boolean(property.ownerName && property.ownerPhone);
  const listedBy = hasPrivateContactAccess ? property.ownerName : 'Verified owner';

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
            ID: {property.pid}
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

      {/* Seamless Airbnb/Zillow-Style Photo Gallery Hero Grid */}
      <div className="relative rounded-3xl overflow-hidden bg-[#070d0a] border border-emerald-950/80 shadow-2xl">
        <div className="h-[360px] sm:h-[440px] lg:h-[460px] grid grid-cols-1 lg:grid-cols-2 gap-2.5 p-2.5 bg-[#050806]">
          {/* Main Left Featured Frame (Balanced 50% width on Desktop) */}
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className={`relative h-full rounded-2xl overflow-hidden group bg-[#07110a] cursor-pointer ${
              images.length === 1 ? 'lg:col-span-2' : 'lg:col-span-1'
            }`}
          >
            <LazyImage
              src={images[currentImgIndex]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Main Tile Navigation Arrows - Vertically Centered */}
            {images.length > 1 && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between px-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex((prev) => (prev + 1) % images.length);
                  }}
                  className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Photo Counter Badge */}
            <div className="absolute bottom-3 left-3 z-20 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 flex items-center space-x-1.5 shadow-lg">
              <Camera size={13} className="text-emerald-400" />
              <span>Photo {currentImgIndex + 1} of {images.length}</span>
            </div>
          </div>

          {/* Right Thumbnails Dynamic Grid Layout for 2 Images */}
          {images.length === 2 && (
            <div className="hidden lg:block lg:col-span-1 h-full min-h-0">
              <button
                type="button"
                onClick={() => {
                  setCurrentImgIndex(1);
                  setIsLightboxOpen(true);
                }}
                className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${
                  currentImgIndex === 1 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                }`}
              >
                <LazyImage src={images[1]} alt="Photo 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>
            </div>
          )}

          {/* Right Thumbnails Dynamic Grid Layout for 3 Images */}
          {images.length === 3 && (
            <div className="hidden lg:grid lg:col-span-1 grid-cols-1 grid-rows-2 gap-2.5 h-full min-h-0">
              {[1, 2].map((actualIndex) => (
                <button
                  key={actualIndex}
                  type="button"
                  onClick={() => {
                    setCurrentImgIndex(actualIndex);
                    setIsLightboxOpen(true);
                  }}
                  className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${
                    currentImgIndex === actualIndex ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                  }`}
                >
                  <LazyImage 
                    src={images[actualIndex]} 
                    alt={`Photo ${actualIndex + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </button>
              ))}
            </div>
          )}

          {/* Right Thumbnails Dynamic Grid Layout for 4 Images */}
          {images.length === 4 && (
            <div className="hidden lg:grid lg:col-span-1 grid-cols-2 grid-rows-2 gap-2.5 h-full min-h-0 overflow-hidden">
              {/* Top Row: Photo #2 spanning full right column width */}
              <button
                type="button"
                onClick={() => {
                  setCurrentImgIndex(1);
                  setIsLightboxOpen(true);
                }}
                className={`col-span-2 row-span-1 relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${
                  currentImgIndex === 1 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                }`}
              >
                <LazyImage src={images[1]} alt="Photo 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>

              {/* Bottom Row: Photo #3 and Photo #4 */}
              <button
                type="button"
                onClick={() => {
                  setCurrentImgIndex(2);
                  setIsLightboxOpen(true);
                }}
                className={`col-span-1 row-span-1 relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${
                  currentImgIndex === 2 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                }`}
              >
                <LazyImage src={images[2]} alt="Photo 3" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentImgIndex(3);
                  setIsLightboxOpen(true);
                }}
                className={`col-span-1 row-span-1 relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${
                  currentImgIndex === 3 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                }`}
              >
                <LazyImage src={images[3]} alt="Photo 4" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>
            </div>
          )}

          {/* Right Thumbnails Dynamic Grid Layout for 5+ Images */}
          {images.length >= 5 && (
            <div className="hidden lg:grid lg:col-span-1 grid-cols-2 grid-rows-2 gap-2.5 h-full min-h-0 overflow-hidden">
              {[1, 2, 3, 4].map((actualIndex) => {
                const isLastTile = actualIndex === 4;
                const remainingCount = images.length - 5;
                return (
                  <button
                    key={actualIndex}
                    type="button"
                    onClick={() => {
                      setCurrentImgIndex(actualIndex);
                      setIsLightboxOpen(true);
                    }}
                    className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${
                      currentImgIndex === actualIndex ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                    }`}
                  >
                    <LazyImage src={images[actualIndex]} alt={`Photo ${actualIndex + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    
                    {/* "+X More Photos" Overlay on 5th tile if images > 5 */}
                    {isLastTile && remainingCount > 0 && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-all hover:bg-black/60">
                        <Grid size={20} className="text-emerald-400 mb-0.5" />
                        <span className="text-xs font-extrabold">+{remainingCount} Photos</span>
                        <span className="text-[9px] text-emerald-300 font-semibold uppercase tracking-wider">View all</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View All Photos Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-4 right-4 z-20 px-4 py-2.5 rounded-2xl bg-black/85 hover:bg-black text-white border border-emerald-500/50 backdrop-blur-md text-xs font-extrabold flex items-center space-x-2 shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Grid size={15} className="text-emerald-400" />
            <span>View All {images.length} Photos</span>
          </button>
        )}
      </div>

      {/* Full-Screen Photo Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-5 text-white w-screen h-screen overflow-hidden"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base font-extrabold text-white truncate max-w-md">{property.title}</h3>
              <p className="text-xs text-emerald-400 font-mono">Photo {currentImgIndex + 1} of {images.length}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Active Image View - Medium Crisp Sizing */}
          <div className="relative flex-1 w-full flex items-center justify-center py-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <LazyImage
              src={images[currentImgIndex]}
              alt={property.title}
              className="max-h-[75vh] max-w-4xl lg:max-w-5xl w-auto h-auto object-contain rounded-2xl shadow-2xl"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white shadow-xl transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImgIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white shadow-xl transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="pt-3 border-t border-gray-900 overflow-x-auto flex items-center justify-center space-x-2 max-w-4xl mx-auto w-full" onClick={(e) => e.stopPropagation()}>
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImgIndex(idx)}
                className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  currentImgIndex === idx ? 'border-emerald-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <LazyImage src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

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
                  <span>{listedBy}</span>
                </h4>
                <span className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {property.ownerRole}
                </span>
              </div>

              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg">
                {listedBy.charAt(0)}
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
