'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  User,
  Calendar,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Tag,
  Share2,
  FileText,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { CallToActionBanner } from '@/components/CallToActionBanner';

export interface BlogItem {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  authorRole: string;
  coverImage?: string;
  readTime: string;
  tags?: string[];
  createdAt: string | Date;
}

const CATEGORIES = [
  'All',
  'Rental Guide',
  'Market Trends',
  'Tenant Tips',
  'Landlord Advice',
  'Interior & Decor',
  'Legal & RERA'
];

const PRESET_IMAGES = [
  {
    label: 'Modern Apartment',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Luxury Living',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Cozy Room',
    url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'City Skyline',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function BlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBlogForReading, setSelectedBlogForReading] = useState<BlogItem | null>(null);

  // Add Blog Form State
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Rental Guide',
    authorName: 'PROPZY Editorial',
    authorRole: 'Real Estate Expert',
    readTime: '4 min read',
    coverImage: PRESET_IMAGES[0].url,
    excerpt: '',
    content: '',
    tagsString: 'Mohali, Renting, 0% Brokerage'
  });

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blogs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBlogs(json.data);
      } else {
        setBlogs([]);
      }
    } catch (err) {
      console.error('Failed to load blogs:', err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      setFormError('Please fill in all required fields (Title, Excerpt, and Content).');
      return;
    }

    setFormSubmitting(true);
    try {
      const tags = formData.tagsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          authorName: formData.authorName.trim() || 'PROPZY Team',
          authorRole: formData.authorRole.trim() || 'Real Estate Expert',
          readTime: formData.readTime.trim() || '4 min read',
          coverImage: formData.coverImage.trim() || PRESET_IMAGES[0].url,
          excerpt: formData.excerpt.trim(),
          content: formData.content.trim(),
          tags
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          title: '',
          category: 'Rental Guide',
          authorName: 'PROPZY Editorial',
          authorRole: 'Real Estate Expert',
          readTime: '4 min read',
          coverImage: PRESET_IMAGES[0].url,
          excerpt: '',
          content: '',
          tagsString: 'Mohali, Renting, 0% Brokerage'
        });
        await fetchBlogs();
      } else {
        setFormError(data.message || 'Failed to publish blog post.');
      }
    } catch (err: any) {
      console.error('Blog creation error:', err);
      setFormError('Network error while publishing blog.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered blogs
  const filteredBlogs = blogs.filter((b) => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.excerpt.toLowerCase().includes(q) ||
      b.content.toLowerCase().includes(q) ||
      (b.authorName && b.authorName.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#040806] text-white">
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden border-b border-emerald-950/60 bg-gradient-to-b from-[#06120b] via-[#040906] to-[#040806]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0a140f] border border-emerald-900/80 hover:border-emerald-500 hover:bg-[#0f2219] text-gray-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 group cursor-pointer"
            >
              <ArrowLeft size={15} className="text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>

            {/* "+ Add New Blog" CTA Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Add New Blog</span>
            </button>
          </div>

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold shadow-inner">
              <BookOpen size={14} />
              <span>PROPZY Knowledge Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
              Insights, Guides & <br />
              <span className="text-emerald-400 font-sans italic">Rental Wisdom</span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
              Explore expert tips on renting, property laws, Tricity market trends, neighborhood guides, and home decor without middleman bias.
            </p>

            {/* SEARCH & FILTERS */}
            <div className="pt-4 max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search articles, topics, guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#08150d] border border-emerald-950 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* CATEGORY CHIPS */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-[#09150e] border border-emerald-950 text-gray-400 hover:text-white hover:border-emerald-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BLOG CONTENT SECTION / EMPTY STATE
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[#030604] min-h-[450px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            /* Loading State */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-3xl bg-[#06120b] border border-emerald-950 p-6 space-y-4 animate-pulse">
                  <div className="w-full h-48 bg-emerald-950/40 rounded-2xl" />
                  <div className="w-1/3 h-4 bg-emerald-950/60 rounded" />
                  <div className="w-3/4 h-6 bg-emerald-950/80 rounded" />
                  <div className="w-full h-12 bg-emerald-950/40 rounded" />
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            /* EMPTY STATE: "No blog yet" with "Add New Blog" Button */
            <div className="max-w-md mx-auto text-center py-16 px-6 rounded-3xl bg-[#06120b] border border-emerald-950/80 space-y-6 shadow-2xl">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#0a2315] border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-inner">
                <BookOpen size={36} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">No blogs yet</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Be the first to share rental insights, neighborhood guides, or property advice with the community.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={18} className="stroke-[3]" />
                  <span>Add New Blog</span>
                </button>
              </div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            /* Search/Filter Empty State */
            <div className="max-w-md mx-auto text-center py-12 px-6 rounded-3xl bg-[#06120b] border border-emerald-950 space-y-4">
              <Search size={32} className="mx-auto text-gray-500" />
              <h3 className="text-lg font-bold text-white">No articles match your filter</h3>
              <p className="text-xs text-gray-400">
                Try searching for different keywords or select 'All' categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#0a1e14] border border-emerald-800 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* BLOG CARDS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => (
                <article
                  key={blog._id || blog.slug}
                  onClick={() => setSelectedBlogForReading(blog)}
                  className="group rounded-3xl bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg cursor-pointer"
                >
                  {/* Card Cover Image */}
                  <div className="relative w-full h-48 sm:h-52 bg-emerald-950/40 overflow-hidden">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#08180e] flex items-center justify-center text-emerald-500">
                        <BookOpen size={36} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-800/60">
                        {blog.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-gray-300 flex items-center space-x-1">
                        <Clock size={11} className="text-emerald-400" />
                        <span>{blog.readTime || '4 min read'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                        <Calendar size={12} className="text-emerald-400" />
                        <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <User size={12} className="text-emerald-400" />
                        <span>{blog.authorName || 'PROPZY Editorial'}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    </div>

                    {/* Read More Link */}
                    <div className="pt-4 border-t border-emerald-950/80 flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span className="group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1.5">
                        <span>Read Full Article</span>
                        <ArrowRight size={14} />
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                        {blog.authorRole || 'PROPZY'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD NEW BLOG
      ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-[#06120b] border border-emerald-800/80 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase text-emerald-400 tracking-wider">
                  <Sparkles size={13} />
                  <span>Publish Article</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Blog Post</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#0a1f14] border border-emerald-900 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateBlog} className="space-y-4 text-xs sm:text-sm">
              {/* Title */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Article Title <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Things to Inspect Before Renting an Apartment in Mohali"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat} className="bg-[#08180e] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">Estimated Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Author & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">Author Name</label>
                  <input
                    type="text"
                    placeholder="e.g. PROPZY Editorial / Aman Kumar"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">Author Role / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Real Estate Expert"
                    value={formData.authorRole}
                    onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                    className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Cover Image URL + Presets */}
              <div className="space-y-2">
                <label className="block text-gray-300 font-semibold">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-gray-400 font-medium">Quick Presets:</span>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: preset.url })}
                      className="px-2.5 py-1 rounded-lg bg-[#0a2014] border border-emerald-900/60 text-[11px] text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Excerpt / Summary */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Short Excerpt / Teaser <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="A brief 1-2 sentence summary to display on the blog card..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Full Article Content <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write the full article content here. You can use separate paragraphs..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mohali, Renting, No Brokerage, Security Deposit"
                  value={formData.tagsString}
                  onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                  className="w-full p-3 bg-[#08180e] border border-emerald-950 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#09150e] border border-emerald-950 text-gray-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center space-x-2"
                >
                  {formSubmitting ? (
                    <span>Publishing...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Publish Blog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ARTICLE READER VIEW
      ───────────────────────────────────────────────────────────── */}
      {selectedBlogForReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-[#06120b] border border-emerald-800/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Top Bar */}
            <div className="p-4 sm:p-6 border-b border-emerald-950 flex items-center justify-between bg-[#040c07]">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  {selectedBlogForReading.category}
                </span>
                <span className="text-xs text-gray-400 flex items-center space-x-1">
                  <Clock size={12} className="text-emerald-400" />
                  <span>{selectedBlogForReading.readTime || '4 min read'}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBlogForReading(null)}
                className="w-8 h-8 rounded-full bg-[#0a1f14] border border-emerald-900 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Cover Image */}
              {selectedBlogForReading.coverImage && (
                <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-emerald-950">
                  <img
                    src={selectedBlogForReading.coverImage}
                    alt={selectedBlogForReading.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Meta */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
                  {selectedBlogForReading.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 py-2 border-y border-emerald-950">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {selectedBlogForReading.authorName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-white">{selectedBlogForReading.authorName}</span>
                      <span className="text-[10px] text-emerald-400 block">{selectedBlogForReading.authorRole}</span>
                    </div>
                  </div>
                  <span>•</span>
                  <span>{new Date(selectedBlogForReading.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Excerpt callout */}
              <div className="p-4 rounded-2xl bg-[#0a2014] border-l-4 border-emerald-400 text-xs sm:text-sm text-gray-200 italic leading-relaxed">
                "{selectedBlogForReading.excerpt}"
              </div>

              {/* Full Article Content */}
              <div className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-4 font-sans whitespace-pre-line">
                {selectedBlogForReading.content}
              </div>

              {/* Tags */}
              {selectedBlogForReading.tags && selectedBlogForReading.tags.length > 0 && (
                <div className="pt-4 border-t border-emerald-950 flex flex-wrap items-center gap-2">
                  <Tag size={13} className="text-emerald-400" />
                  {selectedBlogForReading.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-[#09170e] text-gray-300 border border-emerald-950"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 sm:p-6 border-t border-emerald-950 bg-[#040c07] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Article link copied to clipboard!');
                  }
                }}
                className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                <Share2 size={14} />
                <span>Share Article</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBlogForReading(null)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CALL TO ACTION BANNER
      ───────────────────────────────────────────────────────────── */}
      <CallToActionBanner />
    </div>
  );
}
