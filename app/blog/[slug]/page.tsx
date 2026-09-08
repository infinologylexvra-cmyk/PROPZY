'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Tag,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CallToActionBanner } from '@/components/CallToActionBanner';
import { BlogItem } from '../page';

export default function SingleBlogPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const loadBlog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs/${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          setBlog(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040806] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#040806] text-white pt-32 pb-20 flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6 bg-[#06120b] border border-emerald-950 p-8 rounded-3xl">
          <BookOpen size={40} className="mx-auto text-emerald-400" />
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <p className="text-xs text-gray-400">
            The blog post you are looking for might have been moved or removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-extrabold hover:bg-emerald-400 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Blogs</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040806] text-white">
      {/* Article Header Hero */}
      <section className="relative pt-28 pb-12 border-b border-emerald-950/60 bg-gradient-to-b from-[#06120b] via-[#040906] to-[#040806]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0a140f] border border-emerald-900/80 hover:border-emerald-500 hover:bg-[#0f2219] text-gray-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 group"
            >
              <ArrowLeft size={15} className="text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Blogs</span>
            </Link>

            <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              {blog.category}
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-emerald-950/80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-extrabold text-xs">
                  {blog.authorName.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-white block">{blog.authorName}</span>
                  <span className="text-[10px] text-emerald-400 block">{blog.authorRole}</span>
                </div>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <Calendar size={13} className="text-emerald-400" />
                <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <Clock size={13} className="text-emerald-400" />
                <span>{blog.readTime || '4 min read'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Body Section */}
      <section className="py-10 sm:py-16 bg-[#030604]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Cover Image */}
          {blog.coverImage && (
            <div className="w-full h-56 sm:h-80 md:h-96 rounded-2xl sm:rounded-3xl overflow-hidden bg-emerald-950/40 border border-emerald-950 shadow-2xl">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Excerpt callout box */}
          <div className="p-4.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#06140c] border-l-4 border-emerald-400 text-xs sm:text-sm md:text-base text-gray-200 italic leading-relaxed shadow-inner">
            "{blog.excerpt}"
          </div>

          {/* Full content */}
          <div className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed space-y-5 sm:space-y-6 font-sans whitespace-pre-line">
            {blog.content}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="pt-6 border-t border-emerald-950 flex flex-wrap items-center gap-2">
              <Tag size={15} className="text-emerald-400" />
              {blog.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#08180e] text-gray-300 border border-emerald-950"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Share & Back bottom actions */}
          <div className="pt-8 border-t border-emerald-950 flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Explore More Articles</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Article link copied to clipboard!');
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#08180e] border border-emerald-900/80 hover:border-emerald-500 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share Article</span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <CallToActionBanner
          subTag="IS READY TO MOVE"
          titleMain="Let's find your"
          titleItalic="perfect space."
          description="Verified homes. Zero brokerage. Hassle-free renting."
          buttonText="Explore Properties"
          buttonHref="/properties"
        />
      </section>
    </div>
  );
}
