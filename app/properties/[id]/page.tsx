'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, MapPin, Bed, Bath, Maximize, Heart, PhoneCall,
  ChevronLeft, ChevronRight, Check, User, Copy, Grid, X, Camera, Image as ImageIcon, Building2, Sparkles
} from 'lucide-react';
import { PropertyItem } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';
import { InquiryModal } from '@/components/InquiryModal';
import { LazyImage } from '@/components/LazyImage';
import { BrandSpinner } from '@/components/Loader';
import { PropertyCard } from '@/components/PropertyCard';

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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Recommendations / Similar Properties State & Scroller Ref
  const [similarProperties, setSimilarProperties] = useState<PropertyItem[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [totalSimilarCount, setTotalSimilarCount] = useState(0);
  const similarSliderRef = useRef<HTMLDivElement>(null);

  const scrollSimilarSlider = (direction: 'left' | 'right') => {
    if (similarSliderRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      similarSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [id]);

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

  // Fetch Similar Properties based on BHK / Category / Locality
  useEffect(() => {
    async function fetchSimilarProperties() {
      if (!property) return;
      setLoadingSimilar(true);
      try {
        const isPg = property.category === 'pg' || property.type === 'pg';
        const is1Bhk = property.bedrooms === 1;

        const queryParams = new URLSearchParams();
        if (isPg) {
          queryParams.set('category', 'pg,rent');
        } else if (is1Bhk) {
          queryParams.set('category', 'rent,pg');
          queryParams.set('bedrooms', '1');
        } else if (property.bedrooms && property.bedrooms > 0) {
          if (property.bedrooms === 3 || property.bedrooms === 4) {
            queryParams.set('bedrooms', '3,4');
          } else {
            queryParams.set('bedrooms', String(property.bedrooms));
          }
          if (property.category) {
            queryParams.set('category', property.category);
          }
        } else if (property.category) {
          queryParams.set('category', property.category);
        }
        queryParams.set('limit', '50');

        const res = await fetch(`/api/properties?${queryParams.toString()}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const currentPid = property.pid?.toUpperCase();
          const currentId = property.id;
          const currentMongoId = (property as any)._id?.toString();

          // Filter out the active property and ensure relevance
          const filtered = data.data.filter((p: PropertyItem) => {
            if (p.pid && currentPid && p.pid.toUpperCase() === currentPid) return false;
            if (p.id && currentId && p.id === currentId) return false;
            if ((p as any)._id && currentMongoId && (p as any)._id.toString() === currentMongoId) return false;

            if (isPg) {
              return p.category === 'pg' || p.type === 'pg' || p.bedrooms === 1;
            }
            if (is1Bhk) {
              return p.bedrooms === 1 || p.category === 'pg' || p.type === 'pg';
            }
            return true;
          });

          // Sort by exact category/BHK match first, then locality match, then city match, then price proximity
          const sorted = filtered.sort((a: PropertyItem, b: PropertyItem) => {
            if (isPg) {
              const aIsPg = a.category === 'pg' || a.type === 'pg';
              const bIsPg = b.category === 'pg' || b.type === 'pg';
              if (aIsPg && !bIsPg) return -1;
              if (!aIsPg && bIsPg) return 1;
            } else if (is1Bhk) {
              const aIs1Bhk = a.bedrooms === 1 && a.category !== 'pg';
              const bIs1Bhk = b.bedrooms === 1 && b.category !== 'pg';
              if (aIs1Bhk && !bIs1Bhk) return -1;
              if (!aIs1Bhk && bIs1Bhk) return 1;
            } else {
              const aExactBhk = a.bedrooms === property.bedrooms;
              const bExactBhk = b.bedrooms === property.bedrooms;
              if (aExactBhk && !bExactBhk) return -1;
              if (!aExactBhk && bExactBhk) return 1;
            }

            const aLocalityMatch = a.locality && property.locality && a.locality.toLowerCase() === property.locality.toLowerCase();
            const bLocalityMatch = b.locality && property.locality && b.locality.toLowerCase() === property.locality.toLowerCase();
            if (aLocalityMatch && !bLocalityMatch) return -1;
            if (!aLocalityMatch && bLocalityMatch) return 1;

            const aCityMatch = a.city && property.city && a.city.toLowerCase() === property.city.toLowerCase();
            const bCityMatch = b.city && property.city && b.city.toLowerCase() === property.city.toLowerCase();
            if (aCityMatch && !bCityMatch) return -1;
            if (!aCityMatch && bCityMatch) return 1;

            const aDiff = Math.abs(a.price - property.price);
            const bDiff = Math.abs(b.price - property.price);
            return aDiff - bDiff;
          });

          setSimilarProperties(sorted);
          setTotalSimilarCount(filtered.length);
        } else {
          setSimilarProperties([]);
          setTotalSimilarCount(0);
        }
      } catch (e) {
        console.warn('Similar properties fetch error:', e);
        setSimilarProperties([]);
      } finally {
        setLoadingSimilar(false);
      }
    }

    fetchSimilarProperties();
  }, [property?.pid, property?.id, property?.bedrooms, property?.category, property?.type, property?.locality, property?.city, property?.price]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = touchStartX - currentX;
    const diffY = touchStartY - currentY;
    if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const diffX = touchStartX - currentX;
    const diffY = touchStartY - currentY;

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        setCurrentImgIndex((prev) => (prev + 1) % images.length);
      } else {
        setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setTimeout(() => setIsSwiping(false), 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
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
            className={`p-2 cursor-pointer rounded-xl transition-all ${wish ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

        <h1 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">
          {property.title}
        </h1>

        <div className="flex items-center text-xs sm:text-sm text-gray-400 space-x-2">
          <MapPin size={16} className="text-emerald-500 shrink-0" />
          <span>{property.address}</span>
        </div>
      </div>

      {/* Seamless Photo Gallery Hero Grid */}
      <div className="relative rounded-3xl overflow-hidden bg-[#070d0a] border border-emerald-950/80 shadow-2xl">
        <div className="h-[360px] sm:h-[440px] lg:h-[460px] grid grid-cols-1 lg:grid-cols-2 gap-2.5 p-2.5 bg-[#050806]">
          {/* Main Left Featured Frame (50% width on Desktop) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (!isSwiping) {
                setIsLightboxOpen(true);
              }
            }}
            className={`relative h-full rounded-2xl overflow-hidden group bg-[#07110a] cursor-pointer select-none ${images.length === 1 ? 'lg:col-span-2' : 'lg:col-span-1'
              }`}
          >
            {/* Sliding Track */}
            <div
              className="flex w-full h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
            >
              {images.map((img, idx) => (
                <div key={idx} className="w-full h-full shrink-0 relative">
                  <LazyImage
                    src={img}
                    alt={`${property.title} - Photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>

            {/* Desktop Navigation Arrows */}
            {images.length > 1 && (
              <div className="hidden sm:flex absolute inset-0 z-20 pointer-events-none items-center justify-between px-3">
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

            {/* Mobile Swipe Pagination Dots */}
            {images.length > 1 && (
              <div className="sm:hidden absolute bottom-3.5 right-3.5 z-20 flex items-center space-x-1 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                {images.slice(0, 6).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIndex
                        ? 'w-3.5 bg-emerald-400'
                        : 'w-1.5 bg-white/40'
                      }`}
                  />
                ))}
                {images.length > 6 && (
                  <span className="text-[9px] text-gray-400 font-mono leading-none">+</span>
                )}
              </div>
            )}
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
                className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${currentImgIndex === 1 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
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
                  className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${currentImgIndex === actualIndex ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
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
              <button
                type="button"
                onClick={() => {
                  setCurrentImgIndex(1);
                  setIsLightboxOpen(true);
                }}
                className={`col-span-2 row-span-1 relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${currentImgIndex === 1 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                  }`}
              >
                <LazyImage src={images[1]} alt="Photo 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentImgIndex(2);
                  setIsLightboxOpen(true);
                }}
                className={`col-span-1 row-span-1 relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${currentImgIndex === 2 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
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
                className={`col-span-1 row-span-1 relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${currentImgIndex === 3 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
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
                    className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group bg-[#07110a] ${currentImgIndex === actualIndex ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-transparent opacity-90 hover:opacity-100'
                      }`}
                  >
                    <LazyImage src={images[actualIndex]} alt={`Photo ${actualIndex + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

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
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-5 pb-6 sm:pb-5 text-white w-screen h-screen overflow-hidden"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug break-words">{property.title}</h3>
              <p className="text-[11px] sm:text-xs text-emerald-400 font-mono mt-0.5">Photo {currentImgIndex + 1} of {images.length}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 sm:p-2.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Active Image View */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative flex-1 min-h-0 w-full flex items-center justify-center py-2 overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <LazyImage
              src={images[currentImgIndex]}
              alt={property.title}
              className="max-h-[62vh] sm:max-h-[72vh] max-w-4xl lg:max-w-5xl w-auto h-auto object-contain rounded-2xl shadow-2xl"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="hidden sm:flex absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white shadow-xl transition-all cursor-pointer items-center justify-center"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImgIndex((prev) => (prev + 1) % images.length)}
                  className="hidden sm:flex absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white shadow-xl transition-all cursor-pointer items-center justify-center"
                  aria-label="Next image"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="pt-2.5 pb-2 border-t border-gray-900 overflow-x-auto flex items-center justify-center space-x-2.5 max-w-4xl mx-auto w-full shrink-0" onClick={(e) => e.stopPropagation()}>
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImgIndex(idx)}
                className={`relative w-14 h-11 sm:w-16 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${currentImgIndex === idx ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/30' : 'border-transparent opacity-50 hover:opacity-100'
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-[#0a110d] rounded-3xl border border-emerald-950/90 shadow-xl">
            <div className="space-y-1">
              <span className="text-xs text-gray-400 block">
                {property.category === 'commercial' ? 'Commercial Rate' : 'Rent / Price'}
              </span>
              <span className="text-xl font-extrabold text-white block">{formatPrice(property.price)}</span>
            </div>

            {property.category === 'commercial' || property.type === 'commercial' ? (
              <div className="space-y-1">
                <span className="text-xs text-gray-400 block">Property Type</span>
                <span className="text-base font-bold text-white flex items-center space-x-1">
                  <Building2 size={18} className="text-emerald-500" />
                  <span className="capitalize">Commercial</span>
                </span>
              </div>
            ) : (
              property.bedrooms !== undefined && property.bedrooms > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">Bedrooms</span>
                  <span className="text-base font-bold text-white flex items-center space-x-1">
                    <Bed size={18} className="text-emerald-500" />
                    <span>{property.bedrooms} BHK</span>
                  </span>
                </div>
              )
            )}

            {property.bathrooms !== undefined && (
              <div className="space-y-1">
                <span className="text-xs text-gray-400 block">
                  {property.category === 'commercial' || property.type === 'commercial' ? 'Washrooms' : 'Bathrooms'}
                </span>
                <span className="text-base font-bold text-white flex items-center space-x-1">
                  <Bath size={18} className="text-emerald-500" />
                  <span>
                    {property.bathrooms === 0 ? 'Shared / Common' : `${property.bathrooms} ${(property.category === 'commercial' || property.type === 'commercial') ? (property.bathrooms === 1 ? 'Washroom' : 'Washrooms') : (property.bathrooms === 1 ? 'Bath' : 'Baths')}`}
                  </span>
                </span>
              </div>
            )}

            {property.areaSqFt && (
              <div className="space-y-1">
                <span className="text-xs text-gray-400 block">Super Area</span>
                <span className="text-base font-bold text-white flex items-center space-x-1">
                  <Maximize size={18} className="text-emerald-500" />
                  <span>{property.areaSqFt} sqft</span>
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 flex flex-col">
            <h3 className="text-lg font-bold text-white shrink-0">Property Overview & Details</h3>
            <div className="max-h-60 sm:max-h-68 overflow-y-auto pr-3 text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line select-text">
              {property.description}
            </div>
          </div>

          {/* Amenities Checklist */}
          <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Features & Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2 text-xs font-semibold text-gray-200 bg-[#06120b] p-3 rounded-xl border border-emerald-950">
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/80">
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
          <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <div>
                <span className="text-xs text-gray-400 block">Listed By</span>
                <h4 className="text-base font-bold text-white flex items-center space-x-1.5">
                  <User size={16} className="text-emerald-400" />
                  <span>{listedBy}</span>
                </h4>
                <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                  {property.ownerRole}
                </span>
              </div>

              <div className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
                {listedBy.charAt(0)}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  if (!user) {
                    showToast('Please login to get owner contact');
                    openAuthModal();
                    return;
                  }

                  try {
                    await fetch('/api/inquiries', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      keepalive: true,
                      body: JSON.stringify({
                        propertyId: property.id || property.pid,
                        propertyTitle: property.title,
                        propertyPid: property.pid,
                        tenantName: user.name || 'Interested Tenant',
                        tenantPhone: user.phone || '',
                        tenantEmail: user.email || '',
                        tenantMessage: `Direct contact request for ${property.pid} (${property.title})`,
                        status: 'New'
                      })
                    });
                  } catch (err) {
                    console.warn('Inquiry submission error:', err);
                  }

                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }
                  router.push('/plans');
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <PhoneCall size={18} />
                <span>Contact Now</span>
              </button>
            </div>

            <div className="p-4 bg-[#06120b] rounded-2xl border border-emerald-950 text-[11px] text-gray-300 space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <ShieldCheck size={14} />
                <span>PROPZY Verified Protection</span>
              </div>
              <p>Zero brokerage guarantee. Direct visit scheduling without commission.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SIMILAR HOMES / PROPERTIES RECOMMENDATION HORIZONTAL SCROLLER
      ───────────────────────────────────────────────────────────── */}
      {(loadingSimilar || similarProperties.length > 0) && (
        <section className="pt-8 border-t border-emerald-950/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-2 shadow-inner">
                <Sparkles size={13} />
                <span>Verified Recommendations</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Similar homes nearby
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                {property.category === 'pg' || property.type === 'pg'
                  ? `PG & 1 BHK properties around ₹${property.price.toLocaleString('en-IN')}${property.locality ? ` in ${property.locality}` : property.city ? ` in ${property.city}` : ''}`
                  : property.bedrooms === 1
                  ? `1 BHK & PG properties around ₹${property.price.toLocaleString('en-IN')}${property.locality ? ` in ${property.locality}` : property.city ? ` in ${property.city}` : ''}`
                  : property.bedrooms && (property.bedrooms === 3 || property.bedrooms === 4)
                  ? `3 & 4 BHK properties around ₹${property.price.toLocaleString('en-IN')}${property.locality ? ` in ${property.locality}` : property.city ? ` in ${property.city}` : ''}`
                  : property.bedrooms && property.bedrooms > 0
                  ? `${property.bedrooms} BHK properties around ₹${property.price.toLocaleString('en-IN')}${property.locality ? ` in ${property.locality}` : property.city ? ` in ${property.city}` : ''}`
                  : `Similar ${property.category === 'commercial' || property.type === 'commercial' ? 'Commercial' : ''} properties in ${property.city || 'Tricity'}`}
              </p>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
              {totalSimilarCount > 0 && (
                <Link
                  href={
                    property.category === 'pg' || property.type === 'pg'
                      ? `/properties?category=pg`
                      : property.bedrooms && property.bedrooms > 0
                      ? `/properties?bedrooms=${property.bedrooms}${property.category ? `&category=${property.category}` : ''}`
                      : `/properties?category=${property.category}`
                  }
                  className="inline-flex items-center justify-center px-4 h-10 rounded-2xl bg-[#08120b] border border-emerald-900/80 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer mr-1"
                >
                  <span>See all</span>
                </Link>
              )}

              {/* Slider Left & Right Arrow Buttons */}
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => scrollSimilarSlider('left')}
                className="w-10 h-10 rounded-2xl bg-[#08120b] border border-emerald-900/80 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                aria-label="Previous properties"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => scrollSimilarSlider('right')}
                className="w-10 h-10 rounded-2xl bg-[#08120b] border border-emerald-900/80 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                aria-label="Next properties"
              >
                <ChevronRight size={18} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Horizontal Scroller Container */}
          <div
            ref={similarSliderRef}
            className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loadingSimilar ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`similar-skel-${i}`}
                  className="w-[82vw] max-w-[340px] sm:w-80 lg:w-[360px] shrink-0 snap-center sm:snap-start h-88 rounded-3xl bg-[#0a110d] border border-emerald-950/80 animate-pulse"
                />
              ))
            ) : (
              similarProperties.map((item) => (
                <div
                  key={item.id || item.pid}
                  className="w-[82vw] max-w-[340px] sm:w-80 lg:w-[360px] shrink-0 snap-center sm:snap-start flex flex-col"
                >
                  <PropertyCard property={item} />
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <InquiryModal
        property={showInquiryModal ? property : null}
        onClose={() => setShowInquiryModal(false)}
      />
    </div>
  );
}
