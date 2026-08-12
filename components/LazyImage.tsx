/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const loadedImageUrls = new Set<string>();

export function optimizeImageUrl(url: string, width = 600, quality = 70): string {
  if (!url) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=70';
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  return url;
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=70',
  ...props
}) => {
  const optimizedSrc = optimizeImageUrl(src || fallbackSrc, 600, 70);
  const optimizedFallback = optimizeImageUrl(fallbackSrc, 600, 70);

  const [error, setError] = useState(false);
  const imgSrc = error ? optimizedFallback : optimizedSrc;
  
  const [loaded, setLoaded] = useState(() => loadedImageUrls.has(imgSrc));

  useEffect(() => {
    if (loadedImageUrls.has(imgSrc)) {
      setLoaded(true);
      return;
    }

    const img = new window.Image();
    img.src = imgSrc;
    if (img.complete) {
      loadedImageUrls.add(imgSrc);
      setLoaded(true);
    } else {
      img.onload = () => {
        loadedImageUrls.add(imgSrc);
        setLoaded(true);
      };
      img.onerror = () => {
        setError(true);
        setLoaded(true);
      };
    }
  }, [imgSrc]);

  return (
    <div className={`relative overflow-hidden bg-[#0d1c14] ${className}`}>
      {/* Skeleton Shimmer Overlay */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a140f] via-[#11291d] to-[#0a140f] animate-pulse flex items-center justify-center">
          <ImageIcon size={24} className="text-emerald-900/60 animate-bounce" />
        </div>
      )}

      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          loadedImageUrls.add(imgSrc);
          setLoaded(true);
        }}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
