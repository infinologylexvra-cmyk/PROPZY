'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, MapPin, Bed, Bath, Maximize, PhoneCall, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { PropertyItem } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';

import { LazyImage } from '@/components/LazyImage';

interface PropertyCardProps {
  property: PropertyItem;
  onContactClick?: (property: PropertyItem) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = React.memo(({ property, onContactClick }) => {
  const { toggleWishlist, isWishlisted } = useApp();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const wish = mounted ? (isWishlisted(property.pid) || (property.id ? isWishlisted(property.id) : false)) : false;

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'];

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const propertyUrl = `/properties/${property.pid || property.id}`;

  return (
    <Link
      href={propertyUrl}
      onClick={() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          sessionStorage.setItem('home_scroll_target', 'handpicked-properties');
          sessionStorage.setItem('home_scroll_y', String(window.scrollY));
        }
      }}
      className="group bg-[#0a110d] rounded-3xl border border-emerald-950/90 hover:border-emerald-800/60 shadow-xl hover:shadow-emerald-950/40 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Photo Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-[#050806]">
        <LazyImage
          src={images[currentImgIndex]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Verified Badge */}
        {property.verified && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-black text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1 shadow-md z-10">
            <ShieldCheck size={13} className="stroke-[2.5]" />
            <span>Verified</span>
          </div>
        )}

        {/* PID Badge */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-900/60 z-10">
          {property.pid}
        </div>

        {/* Wishlist Button */}
        <div
          role="button"
          tabIndex={0}
          suppressHydrationWarning
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(property.pid || property.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 z-20 ${wish ? 'bg-emerald-500 text-black' : 'bg-black/60 text-gray-300 hover:bg-black/90 hover:text-white'
            }`}
          title="Save Property"
        >
          <Heart size={16} fill={wish ? 'currentColor' : 'none'} />
        </div>

        {/* Slider Controls */}
        {images.length > 1 && (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
            >
              <ChevronRight size={16} />
            </div>
          </>
        )}
      </div>

      {/* Card Content matching Screenshot 3 */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Locality */}
          <p className="text-xs text-gray-400 font-medium truncate mb-1">
            {property.locality}, {property.city}
          </p>

          {/* Title & Price Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-bold text-gray-100 group-hover:text-emerald-400 transition-colors line-clamp-1 flex-1">
              {property.title}
            </h3>
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-emerald-400">
                {formatPrice(property.price)}
              </span>
              {property.category === 'rent' && <span className="text-[11px] font-normal text-gray-400">/month</span>}
            </div>
          </div>

          {/* Specs Row */}
          <div className="flex items-center space-x-4 py-2 text-xs text-gray-300 border-t border-emerald-950/80">
            {property.bedrooms !== undefined && (
              <div className="flex items-center space-x-1.5">
                <Bed size={14} className="text-emerald-500" />
                <span>{property.bedrooms} Bed</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center space-x-1.5">
                <Bath size={14} className="text-emerald-500" />
                <span>{property.bathrooms} Bath</span>
              </div>
            )}
            {property.areaSqFt !== undefined && property.areaSqFt <= 99999 && (
              <div className="flex items-center space-x-1.5">
                <Maximize size={14} className="text-emerald-500" />
                <span>{property.areaSqFt} sq.ft</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer matching Screenshot 3 */}
        <div className="pt-2 flex items-center justify-between border-t border-emerald-950/80 text-xs">
          <div className="flex items-center space-x-1.5 text-gray-400 font-medium">
            <UserCheck size={14} className="text-emerald-400" />
            <span>Direct Owner</span>
          </div>

          <div className="flex items-center space-x-1 text-emerald-400 font-bold group-hover:text-emerald-300 transition-colors">
            <span>Explore</span>
            <span className="text-sm group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

PropertyCard.displayName = 'PropertyCard';
