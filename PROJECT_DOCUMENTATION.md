# PROPZY — Comprehensive Technical & Functional Documentation

**PROPZY** is a modern, high-performance real estate web application built for finding, renting, buying, and selling properties across Chandigarh Tricity (Chandigarh, Mohali, Kharar, Zirakpur, Panchkula) and surrounding areas with **0% Brokerage**.

---

## 🚀 1. Technology Stack & Frameworks

| Layer | Technology | Purpose / Notes |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15.2.8 (App Router)** | Full-stack React framework with SSR, ISR, Server/Client components, and Route Handlers |
| **Compiler / Bundler** | **Turbopack** | Ultra-fast development server with ~1.8s startup time (`next dev --turbopack`) |
| **Frontend Library** | **React 19** (`react`, `react-dom ^19.0.0`) | Modern UI rendering with server and client components |
| **Styling** | **TailwindCSS 4 + `@tailwindcss/postcss`** | Custom dark mode theme system (`#040806` / `#050806`, Emerald `#10b981` accents) with `clsx` and `tailwind-merge` |
| **Database** | **MongoDB Atlas + Mongoose 8** (`mongoose ^8.24.2`, `mongodb ^6.21.0`) | Cloud NoSQL database with optimized compound indexes and in-memory fallback store (`lib/memoryStore.ts`) |
| **Image Storage & CDN** | **Cloudinary (`cloudinary ^2.5.1`)** | Secure direct-from-browser uploads with server-generated SHA-1 signatures (`/api/cloudinary/sign`) and automated asset cleanup on deletion |
| **Auth & Security** | **`jose ^6.2.8` + `bcryptjs ^2.4.3`** | JWT token signing/verification (`HS256`), salted password hashing, and 7-day secure HttpOnly cookies (`propzy_token`) |
| **State Management** | **Zustand 5 (`zustand ^5.0.14`)** | SSR-safe global client store with `persist` middleware to `localStorage` (`propzy_app_v1`) |
| **Cross-Tab Sync** | **BroadcastChannel API + Storage Events** | Instant cross-tab real-time state synchronization for the Admin portal (`lib/adminCache.ts`, `hooks/useAdminSync.ts`) |
| **Icons** | **Lucide React (`lucide-react ^0.479.0`)** | Lightweight, premium SVG icon system |
| **Language** | **TypeScript 5.7 (`typescript ^5.7.3`)** | Strict type definitions across models, API responses, store, and UI components |

---

## 🏗️ 2. Core Architecture & System Data Flow

```
                      ┌─────────────────────────────────────────┐
                      │              Browser (Client)           │
                      └────────────┬────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
   ┌──────────────────────┐ ┌───────────────┐ ┌───────────────────┐
   │ Next.js App Router   │ │ Zustand Store │ │ Direct Cloudinary │
   │ (Pages & Components) │ │(propzy_app_v1)│ │  Signed Upload    │
   └──────────┬───────────┘ └───────┬───────┘ └─────────┬─────────┘
              │                     │                   │
              ▼                     │                   │
   ┌──────────────────────┐         │                   │
   │ Next.js Middleware   │         │                   │
   │(Admin JWT RouteGuard)│         │                   │
   └──────────┬───────────┘         │                   │
              │                     │                   │
              ▼                     ▼                   ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                     Next.js API Route Handlers               │
   │  /api/properties | /api/auth | /api/admin | /api/cloudinary  │
   └──────────────┬───────────────────────────────┬───────────────┘
                  │                               │
                  ▼                               ▼
   ┌──────────────────────────────┐ ┌─────────────────────────────┐
   │ In-Memory Multi-Tier Cache   │ │   Cloudinary Media CDN      │
   │ (45s TTL + Stale + Dedup)    │ │   (letsrentz/properties)    │
   └──────────────┬───────────────┘ └─────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                      MongoDB Atlas Database                  │
   │             (Resilient Fallback: Memory Store Engine)        │
   └──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 3. Database Schemas & Data Models

### 3.1 User Schema ([`models/User.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/models/User.ts))

Manages platform users, authentication credentials, roles, saved properties, and landlord verification status.

| Field Name | Type | Enum / Default | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary User Identifier |
| `name` | `String` | Required | Full Name |
| `email` | `String` | Required, Unique, Indexed | Email Address (Normalized to lowercase) |
| `phone` | `String` | Required | Contact Phone Number |
| `password` | `String` | Required | Bcrypt-hashed password (Salt rounds: 10) |
| `role` | `String` | `'tenant' \| 'owner' \| 'admin'` | Account Role (Default: `'tenant'`) |
| `city` | `String` | Default: `'Mohali'` | Primary City of Residence |
| `wishlist` | `Array<String>` | Default: `[]` | Array of saved Property PIDs |
| `ownerVerified` | `Boolean` | Default: `false` | Electricity Bill verification flag |
| `verificationStatus` | `String` | `'none' \| 'pending' \| 'approved' \| 'rejected'` | Owner verification workflow state (Default: `'none'`) |
| `electricityBillUrl` | `String` | Default: `''` | Uploaded Electricity Bill document URL / data link |
| `consumerNumber` | `String` | Default: `''` | Electricity Bill CA / Consumer Account Number |
| `createdAt` | `Date` | Default: `Date.now` | User registration timestamp |

* **Hooks & Methods**:
  * `pre('save')`: Automatically salts and hashes modified passwords with `bcryptjs`.
  * `comparePassword(candidatePassword)`: Compares candidate passwords against stored bcrypt hashes (with plain-text fallback for legacy records).

---

### 3.2 Property Schema ([`models/Property.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/models/Property.ts))

Manages real estate property listings across rent, buy, sell, PG, and commercial categories.

| Field Name | Type | Options / Default | Description |
| :--- | :--- | :--- | :--- |
| `pid` | `String` | Required, Unique, Indexed | Unique Property Identifier (e.g. `PZ-101`, `PZ-102`) |
| `title` | `String` | Required | Listing headline title |
| `category` | `String` | Enum: `['rent', 'buy', 'sell', 'pg', 'commercial']` | Listing transaction category |
| `type` | `String` | Enum: `['house', 'flat', 'pg', 'commercial', 'plot']` | Structural property type |
| `city` | `String` | Required | City name (e.g., Mohali, Chandigarh, Zirakpur, Panchkula) |
| `locality` | `String` | Required, Indexed | Sector or neighborhood locality |
| `address` | `String` | Required | Complete street address |
| `price` | `Number` | Required | Monthly rent or purchase price (Range: ₹1,000 to ₹50,000,000) |
| `deposit` | `Number` | Default: `0` | Security deposit amount |
| `bedrooms` | `Number` | Default: `1` | Number of bedrooms / BHK configuration |
| `bathrooms` | `Number` | Default: `1` | Number of bathrooms |
| `areaSqFt` | `Number` | Default: `500` | Super built-up area in square feet |
| `furnishing` | `String` | Enum: `['unfurnished', 'semi-furnished', 'fully-furnished']` | Furnishing status (Default: `'semi-furnished'`) |
| `verified` | `Boolean` | Default: `false` | Admin verification badge flag |
| `featured` | `Boolean` | Default: `false` | Featured property banner flag |
| `images` | `Array<String>` | Required (Min: 1) | Array of Cloudinary / Unsplash image URLs |
| `description` | `String` | Required | Detailed property overview and features |
| `amenities` | `Array<String>` | Default: `[]` | Amenities list (Power Backup, AC, Parking, etc.) |
| `ownerName` | `String` | Required | Property Owner / Landlord name |
| `ownerPhone` | `String` | Required | Owner contact phone number |
| `ownerEmail` | `String` | Default: `''`, Indexed | Owner contact email address |
| `ownerRole` | `String` | Enum: `['owner', 'agent']` | Author role (Default: `'owner'`) |
| `available` | `Boolean` | Default: `true` | Listing availability toggle |
| `createdAt` | `Date` | Default: `Date.now` | Listing creation timestamp |

* **Compound MongoDB Indexes**:
  * `{ price: 1, createdAt: -1 }` — Fast price-sorted catalog browsing.
  * `{ category: 1, city: 1, verified: 1, createdAt: -1 }` — Optimized category + city filter queries.
  * `{ city: 1, category: 1, verified: 1, createdAt: -1 }` — Optimized city-first exploration.
  * `{ type: 1, bedrooms: 1, verified: 1, createdAt: -1 }` — Fast BHK & property-type matching.
  * `{ verified: 1, createdAt: -1 }` — Admin verification queue sorting.

---

### 3.3 Inquiry Schema ([`models/Inquiry.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/models/Inquiry.ts))

Manages direct tenant inquiries, scheduled visits, and Tenant "Relax Plan" service requests.

| Field Name | Type | Options / Default | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Inquiry Identifier |
| `propertyId` | `String` | Required | Target Property MongoDB ID or slug |
| `propertyTitle` | `String` | Required | Target Property Listing Title |
| `propertyPid` | `String` | Required | Target Property PID (e.g. `PZ-101` or `RELAX-PLAN`) |
| `tenantName` | `String` | Required | Inquiring Tenant's Full Name |
| `tenantPhone` | `String` | Required | Inquiring Tenant's Contact Number |
| `tenantEmail` | `String` | Default: `''`, Indexed | Inquiring Tenant's Email Address |
| `tenantMessage` | `String` | Default: `''` | Custom inquiry message or move-in requirements |
| `status` | `String` | Enum: `['pending', 'contacted', 'closed']` | Lead status (Default: `'pending'`) |
| `createdAt` | `Date` | Default: `Date.now` | Inquiry submission timestamp |

---

## ⚡ 4. State Management System ([`store/useAppStore.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/store/useAppStore.ts))

Global client-side application state is managed with **Zustand** using `persist` middleware to `localStorage` (`propzy_app_v1`):

### 4.1 State Interface (`AppState`)
* `user: UserProfile | null` — Currently authenticated user profile (including role, verified status, verification document, and billing history).
* `wishlist: string[]` — Array of saved property PIDs (normalized with `PZ-` prefix).
* `isAuthModalOpen: boolean` — Controls login/signup modal visibility.
* `isPidModalOpen: boolean` — Controls PID search dialog visibility.
* `toastMessage: string | null` — Active toast notification text.
* `toastType: 'success' | 'error'` — Visual styling variant for active notification.

### 4.2 Actions & Methods
* `setUser(user)`: Normalizes wishlist identifiers and sets the authenticated session.
* `logoutUser()`: Invokes `/api/auth/logout` to clear the HttpOnly JWT cookie, resets client session, and clears wishlist.
* `toggleWishlist(pidOrId)`: Optimistically toggles saved property in state, shows toast, and asynchronously persists changes to `/api/user/wishlist` in MongoDB.
* `isWishlisted(pidOrId)`: Checks if a given property is in the user's wishlist (handling both `prop-`, `LR-`, and `PZ-` prefix formats).
* `openAuthModal()` / `closeAuthModal()`: Triggers the dynamic authentication modal.
* `openPidModal()` / `closePidModal()`: Triggers the fast PID search modal.
* `showToast(msg, type?)`: Displays an auto-dismissing (3000ms) notification toast with intelligent success/error detection.
* `clearToast()`: Immediately dismisses any active toast.

---

## 🔒 5. Key System Workflows

### 5.1 Electricity Bill Owner Verification Workflow
To guarantee genuine 0% brokerage listings, only landlords verified via an official Electricity Bill can publish properties:

```
[Landlord Profile] ──> Submits CA / Consumer No & Electricity Bill ──> Status: PENDING
                                                                              │
                                                                              ▼
                                                                [Admin Verification Queue]
                                                                  (/admin/verifications)
                                                                              │
                                                     ┌────────────────────────┴────────────────────────┐
                                                     ▼                                                 ▼
                                          [Admin Clicks Approve]                            [Admin Clicks Reject]
                                                     │                                                 │
                                                     ▼                                                 ▼
                                         Status: APPROVED (ownerVerified: true)            Status: REJECTED
                                                     │
                                                     ▼
                                        [Post Property Unlocked!]
```

1. **Submission**: Property Owner opens **Dashboard -> My Profile** and inputs Electricity Bill CA/Consumer Number and uploads/pastes the document image.
2. **Review State**: Status transitions to `verificationStatus: 'pending'`. The `/post-property` route renders a review banner: *"Electricity Bill Verification Under Admin Review"*.
3. **Admin Verification**: Administrators view requests under `/admin/verifications`, verify document details, and execute an atomic update (`verificationStatus: 'approved'`, `ownerVerified: true`).
4. **Auto-Unlock**: The client session re-syncs via `/api/user/sync-profile` or `/api/auth/me`, unlocking `/post-property` creation.

---

### 5.2 Property Search, Filters & Debounced Price Slider ([`app/properties/page.tsx`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/app/properties/page.tsx))

* **Dynamic Price Range Bounds**:
  * Rent / PG / Commercial: Up to **₹15 Lakh** (`1,500,000`)
  * Buy / Sale: Up to **₹5 Crore** (`50,000,000`)
* **Debounced Slider Control**: 400ms debounce buffer prevents redundant API queries while sliding.
* **Filter Capabilities**: Category (`rent`, `buy`, `sell`, `pg`, `commercial`), Property Type (`flat`, `house`, `pg`, `commercial`, `plot`), City, Locality, Bedrooms (1, 2, 3, 4+ BHK), Furnishing (`unfurnished`, `semi-furnished`, `fully-furnished`), and Verified-only filter.
* **Infinite / Paginated Display**: Progressive client-side load more with animated skeleton placeholders.

---

### 5.3 Direct-to-Cloudinary Secure Image Upload Workflow ([`app/post-property/page.tsx`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/app/post-property/page.tsx))

To avoid streaming heavy base64 or multipart payloads through Next.js server memory:

```
[Browser] ──(1) POST /api/cloudinary/sign ──> [Next.js Server: Generates SHA-1 Signature]
    │                                                          │
    │<──────(2) Returns Signature, Timestamp, API Key──────────┘
    │
    └───────(3) POST https://api.cloudinary.com/v1_1/<cloud>/image/upload ──> [Cloudinary CDN]
                                                                                    │
    ┌───────(4) Returns Secure HTTPS Image URL (res.cloudinary.com/...)─────────────┘
    │
    ▼
[Next.js API: POST /api/properties] (Persists Clean CDN URL Array)
```

* **Automated Cleanup**: When a property is deleted (`DELETE /api/properties/[id]`), associated Cloudinary public IDs are extracted (`lib/cloudinary.ts`) and destroyed automatically from Cloudinary.

---

### 5.4 PID (Property Identifier) Quick Jump
* Every property listing has a unique PID (e.g. `PZ-101`, `PZ-102`).
* Clicking **Search PID** in the top navigation bar opens `PidModal`, allowing users to enter a PID and navigate directly to `/properties/[id]`.

---

## 🛠️ 6. Complete API Reference

| Endpoint | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Registers a new tenant or landlord user account with bcrypt password hashing |
| `/api/auth/login` | `POST` | Public | Authenticates credentials, issues a signed JWT, and sets 7-day HttpOnly cookie (`propzy_token`) |
| `/api/auth/logout` | `POST` | Public | Clears the `propzy_token` HttpOnly cookie |
| `/api/auth/me` | `GET` | Authenticated | Returns current authenticated user profile and reconciles saved wishlist with active properties |
| `/api/properties` | `GET` | Public | Searches and filters property listings with query caching, in-flight deduplication, and stale fallback |
| `/api/properties` | `POST` | Verified Owner / Admin | Creates a new property listing (strictly gated by Electricity Bill verification) |
| `/api/properties/[id]` | `GET` | Public | Fetches property details by PID or ObjectId (hides owner contact details from unauthenticated users) |
| `/api/properties/[id]` | `PATCH` | Owner / Admin | Updates property details, availability, verification, or featured badge (Owner can edit own listing) |
| `/api/properties/[id]` | `DELETE` | Owner / Admin | Deletes property listing and triggers background Cloudinary image deletion |
| `/api/cloudinary/sign` | `POST` | Verified Owner / Admin | Generates SHA-1 upload signature for direct client-to-Cloudinary image uploads |
| `/api/search/suggestions`| `GET` | Public | Returns typeahead autocomplete suggestions by title, locality, city, type, or PID |
| `/api/user/verify-owner`| `POST` | Owner | Submits Electricity Bill URL & Consumer Number for admin review |
| `/api/user/sync-profile`| `POST` | Authenticated | Returns fresh user state from MongoDB to synchronize client store |
| `/api/user/wishlist` | `POST` | Authenticated | Synchronizes saved wishlist PIDs to MongoDB Atlas |
| `/api/inquiries` | `GET` | Authenticated | Fetches inquiries (tenants see their submissions; admin sees all leads) |
| `/api/inquiries` | `POST` | Tenant / Public | Submits a property inquiry or Tenant Relax Plan assistance request |
| `/api/admin/verifications`| `GET` | Admin | Fetches pending, approved, and rejected owner verification requests |
| `/api/admin/verifications`| `POST` | Admin | Atomically approves or rejects owner Electricity Bill verification |
| `/api/users` | `GET` | Admin | Retrieves user directory list with mapped roles and timestamps |
| `/api/seed` | `GET` | Admin | Seeds initial demo properties, users, and inquiries into MongoDB |
| `/app/hybridaction/[...slug]`| `GET`, `POST` | Public | Catch-all handler to absorb browser extension tracker pings silently |

---

## ⚡ 7. Performance & Multi-Tier Caching Architecture

1. **Turbopack Dev Server**: `next dev --turbopack` achieves ~1.8s cold boot startup.
2. **In-Memory Server-Side Property Cache ([`lib/propertiesCache.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/lib/propertiesCache.ts))**:
   * **45-second Server TTL**: Eliminates repeated database lookups for identical filter queries.
   * **5-minute Stale Fallback**: Serves stale cache with `X-Cache-Status: STALE` header if MongoDB Atlas is momentarily slow or unreachable.
   * **Cache-Control Headers**: Emits `public, s-maxage=45, stale-while-revalidate=60` and `Server-Timing` metrics.
3. **In-Flight Request Deduplication**: Reuses concurrent in-flight query promises for identical filter combinations to prevent database query stampedes.
4. **Client-Side Property Query Cache ([`lib/clientPropertiesCache.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/lib/clientPropertiesCache.ts))**: 60-second in-memory client cache allows instantaneous filter switching.
5. **Real-Time Cross-Tab Admin Sync ([`lib/adminCache.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/lib/adminCache.ts) & [`hooks/useAdminSync.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/hooks/useAdminSync.ts))**:
   * Uses browser `BroadcastChannel` API and window `storage` events to synchronize property deletions, approvals, and inquiries across all open admin tabs without manual page reloads.
6. **Optimized Lazy Image Loading ([`components/LazyImage.tsx`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/components/LazyImage.tsx))**: IntersectionObserver-based lazy loading with skeleton shimmer placeholders.
7. **Dynamic Modal Code Splitting ([`components/ClientModals.tsx`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/components/ClientModals.tsx))**: `AuthModal` and `PidModal` use `next/dynamic` (`ssr: false`) to minimize initial JavaScript bundle size.
8. **Component Memoization ([`components/PropertyCard.tsx`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/components/PropertyCard.tsx))**: Wrapped with `React.memo` to prevent re-renders when parent states update.
9. **Resilient MongoDB Fallback ([`lib/memoryStore.ts`](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/lib/memoryStore.ts))**: Short server timeouts (3s selection, 5s socket) ensure immediate seamless fallback to memory store if database connectivity is interrupted.

---

## 📁 8. Directory & File Overview

```
letsrentz-app/
├── app/
│   ├── about/                         # About Us Page (Mission, values, story)
│   ├── admin/                         # Admin Portal Pages
│   │   ├── inquiries/                 # Tenant Leads & Relax Plan Requests Manager
│   │   ├── login/                     # Dedicated Admin Login Screen
│   │   ├── properties/                # Property Moderation & PID Manager
│   │   ├── users/                     # Registered Users Directory
│   │   ├── verifications/             # Owner Electricity Bill Approval Queue
│   │   ├── layout.tsx                 # Admin Layout with Sidebar & Auth Guard
│   │   ├── loading.tsx                # Admin Section Loader
│   │   └── page.tsx                   # Admin Analytics & Overview Dashboard
│   ├── api/                           # Next.js Route Handlers
│   │   ├── admin/verifications/       # Owner Verification Review API
│   │   ├── auth/                      # Authentication Handlers (login, logout, me, register)
│   │   ├── cloudinary/sign/           # Cloudinary Upload Signature API
│   │   ├── inquiries/                 # Inquiries & Relax Plan Leads API
│   │   ├── properties/                # Property Catalog & CRUD API
│   │   │   └── [id]/                  # Single Property Details, Patch & Delete API
│   │   ├── search/suggestions/        # Autocomplete Suggestions API
│   │   ├── seed/                      # Database Initializer API
│   │   ├── user/                      # User Profile, Verification, Wishlist Sync APIs
│   │   └── users/                     # User Directory API
│   ├── contact/                       # Contact & Support Page with Inquiries Form
│   ├── dashboard/                     # User Dashboard (Profile, Properties, Wishlist, Inquiries)
│   ├── emi-calculator/                # Home Loan EMI Financial Calculator
│   ├── faq/                           # Frequently Asked Questions Page
│   ├── help/                          # Help & Support Center
│   ├── hybridaction/[...slug]/        # Browser Extension Ping Handler
│   ├── localities/                    # Top Localities Directory (Mohali, Chandigarh, etc.)
│   ├── post-property/                 # 0% Commission Property Creation Wizard
│   ├── privacy/                       # Privacy Policy
│   ├── properties/                    # Property Catalog with Search & Filter Controls
│   │   └── [id]/                      # Property Detail View with Lightbox & Inquiries
│   ├── rent-calculator/               # Rental Affordability Calculator
│   ├── safety/                        # Safety & Fraud Prevention Guide
│   ├── tenant/relaxplan/              # Tenant Relax Plan Dedicated Assistance Page
│   ├── terms/                         # Terms & Conditions of Service
│   ├── error.tsx                      # Global Error Boundary
│   ├── global-error.tsx               # Root Global Error Handler
│   ├── layout.tsx                     # Root Application Layout with Navbar, Modals, Footer
│   ├── loading.tsx                    # Route Loading Placeholder
│   ├── not-found.tsx                  # Custom 404 Page
│   └── page.tsx                       # Homepage with Search Hero & Category Sliders
├── components/
│   ├── AdminRouteGuard.tsx            # Client-Side Admin Role Protection Wrapper
│   ├── AdminSidebar.tsx               # Admin Drawer Navigation with Active Highlights
│   ├── AuthModal.tsx                  # Sign In & Sign Up Modal with Role Selector
│   ├── CallToActionBanner.tsx         # Reusable Promotional Banner
│   ├── ClientModals.tsx               # Dynamically Imported Client Modals
│   ├── Footer.tsx                     # Global Footer with Navigation & Legal Links
│   ├── GlobalProgressBar.tsx          # Top Route Transition Progress Bar
│   ├── GlobalSearchBar.tsx            # Autocomplete Typeahead Search Bar
│   ├── HideOnRoute.tsx                # Route-based Component Visibility Controller
│   ├── InquiryModal.tsx               # Property Inquiry & Visit Booking Modal
│   ├── LazyImage.tsx                  # Optimized Lazy Image Loader with Shimmer
│   ├── Loader.tsx                     # Spinners, Skeletons, and Loading Components
│   ├── MobileBottomNav.tsx            # Mobile Bottom Navigation Bar
│   ├── Navbar.tsx                     # Global Top Header Navigation Bar
│   ├── PidModal.tsx                   # Property PID Quick-Search Dialog
│   ├── PropertyCard.tsx               # Memoized Property Listing Card Component
│   └── Toast.tsx                      # Global Alert Notification Toast
├── context/
│   └── AppContext.tsx                 # React Context Wrapper for Global Store
├── hooks/
│   └── useAdminSync.ts                # Real-Time Admin Cross-Tab Synchronization Hook
├── lib/
│   ├── accessControl.ts               # User Role, Ownership & Contact Sanitization Helpers
│   ├── adminCache.ts                  # Cross-Tab BroadcastChannel & Local Cache Manager
│   ├── auth.ts                        # JWT Token Signing, Verification & Cookie Helpers
│   ├── clientPropertiesCache.ts       # Client-Side In-Memory Property Query Cache
│   ├── cloudinary.ts                  # Cloudinary Server Instance & Signature Generator
│   ├── memoryStore.ts                 # In-Memory Database Fallback Engine
│   ├── mongodb.ts                     # MongoDB Mongoose Singleton Connection Handler
│   ├── propertiesCache.ts             # Server-Side In-Memory Property Cache & Request Dedup
│   ├── seedData.ts                    # Initial Demo Dataset (Properties, Users, Inquiries)
│   └── validation.ts                  # Form Input Validation & Sanitization Helpers
├── models/
│   ├── Inquiry.ts                     # Mongoose Inquiry Schema
│   ├── Property.ts                    # Mongoose Property Schema with Compound Indexes
│   └── User.ts                        # Mongoose User Schema with Password Hashing
├── public/                            # Static Images, Icons, and Assets
├── scripts/
│   ├── benchmark-caching.mjs          # Server Cache Benchmark Utility
│   ├── list-users.mjs                 # Database User Listing Script
│   ├── migrate-base64-to-cloudinary.mjs # Cloudinary Image Migration Script
│   ├── migrate-pid-prefix.mjs         # PID Prefix Normalization Script
│   ├── resolve-atlas.mjs              # MongoDB Atlas DNS Diagnostic Script
│   ├── seed-admin.mjs                 # Super Admin Seeding Script
│   ├── test-direct-connection.mjs     # Direct MongoDB Connection Test
│   ├── test-dns-fix.mjs               # Node DNS Resolver Test
│   ├── test-lib-mongo.mjs             # Mongoose Singleton Test
│   ├── test-sign.mjs                  # Cloudinary Signature Test
│   └── test-strict-auth.mjs           # Strict Authentication Test
├── store/
│   └── useAppStore.ts                 # Global Zustand Store with LocalStorage Persistence
├── middleware.ts                      # Admin Route Protection Middleware (JWT Verification)
├── next.config.ts                     # Next.js Configuration (Remote Image Domains, Headers)
├── package.json                       # Project Dependencies & NPM Scripts
├── postcss.config.mjs                 # PostCSS Configuration for TailwindCSS
└── tsconfig.json                      # TypeScript Strict Mode Configuration
```

---

## 🔑 9. Environment Variables Reference

Configure these variables in `.env.local` (local development) and your production deployment dashboard (e.g. Vercel, Netlify):

| Variable | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical base URL of the platform | `http://localhost:3000` / `https://propzy.vercel.app` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/propzy` |
| `JWT_SECRET` | Yes | Secret key for signing HS256 JWT tokens | `propzy-secret-jwt-key-2026-super-secure` |
| `NEXTAUTH_SECRET` | Optional | Alias fallback for `JWT_SECRET` | `propzy-secret-jwt-key-2026-super-secure` |
| `ADMIN_ID` | Yes | Master Admin login email identifier | `admin@propzy.com` |
| `ADMIN_PASSWORD` | Yes | Master Admin login password | `admin` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary Cloud Name for client uploads | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API Key for signing uploads | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API Secret (Keep confidential) | `abcdefghijklmnopqrstuvwxyz0123` |

---

## 💻 10. How to Run Locally & Build

```bash
# 1. Navigate to application folder
cd letsrentz-app

# 2. Install dependencies
pnpm install
# or
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Start Turbopack Development Server
npm run dev

# 5. Open in Browser
# http://localhost:3000

# 6. Seed Demo Database (Optional)
npm run seed

# 7. Production Build Verification
npm run build
```
