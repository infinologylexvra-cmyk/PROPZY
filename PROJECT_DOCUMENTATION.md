# PROPZY — Comprehensive Technical & Functional Documentation

**PROPZY** is a modern, high-performance real estate web application built for finding, renting, buying, and selling properties across Chandigarh Tricity (Chandigarh, Mohali, Kharar, Zirakpur, Panchkula) with **0% Brokerage**.


---

## 🚀 1. Technology Stack & Frameworks

| Layer | Technology | Purpose / Notes |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15.2.0 (App Router)** | Full-stack React framework with SSR, ISR, and API Routes |
| **Compiler / Bundler** | **Turbopack** | Ultra-fast dev server with ~1.8s startup time (`next dev --turbopack`) |
| **Frontend Library** | **React 19** | Modern UI rendering & Server/Client components |
| **Styling** | **TailwindCSS 4 + Vanilla CSS** | Custom dark mode theme system (`#050806`, Emerald accents) |
| **Database** | **MongoDB Atlas + Mongoose 8** | Cloud database with fast fallback store (`lib/memoryStore.ts`) |
| **State Management** | **Zustand 5.0.14** | Client state management with `persist` middleware to `localStorage` |
| **Icons** | **Lucide React** | Premium SVG icon library |
| **Language** | **TypeScript 5.7** | Strict type safety across models, APIs, and components |

---

## 🏗️ 2. Core Architecture & Design System

```
                      ┌─────────────────────────────────────────┐
                      │              Browser (Client)           │
                      └────────────────────┬────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │          Next.js App Router         │
                        │        (Pages & Components)         │
                        └──────────────────┬──────────────────┘
                                           │
                  ┌────────────────────────┴────────────────────────┐
                  │          Zustand Store (useAppStore.ts)         │
                  │   Synced with localStorage & MongoDB Atlas      │
                  └────────────────────────┬────────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         │                            Next.js APIs                           │
         │  /api/properties | /api/auth | /api/admin | /api/user/verify-owner │
         └─────────────────────────────────┬─────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         │                          MongoDB Atlas                            │
         │                  (Fallback: Memory Store Engine)                  │
         └───────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 3. Database Schemas & Data Models

### 3.1 User Schema ([models/User.ts](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/models/User.ts))

| Field Name | Type | Enum / Default | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto | Primary User ID |
| `name` | String | Required | Full Name |
| `email` | String | Unique, Index | Email Address |
| `phone` | String | Required | Contact Number |
| `password` | String | Required | Encrypted/Hashed Password |
| `role` | String | `'tenant' \| 'owner' \| 'admin'` | Account Role (Default: `'tenant'`) |
| `city` | String | Default: `'Mohali'` | Primary City |
| `wishlist` | Array | `[String]` | Array of saved Property PIDs |
| `ownerVerified` | Boolean | Default: `false` | Electricity Bill verification flag |
| `verificationStatus` | String | `'none' \| 'pending' \| 'approved' \| 'rejected'` | Verification workflow state |
| `electricityBillUrl` | String | Default: `''` | Uploaded Electricity Bill photo/document link |
| `consumerNumber` | String | Default: `''` | Electricity CA/Consumer Number |
| `createdAt` | Date | Default: `Date.now` | Registration timestamp |

---

### 3.2 Property Schema ([models/Property.ts](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/models/Property.ts))

| Field Name | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `pid` | String | Required, Unique, Index | Unique Property Identifier (e.g. `LR-101`) |
| `title` | String | Required | Listing title |
| `category` | String | Enum: `['rent', 'buy', 'sell', 'pg', 'commercial']` | Listing purpose |
| `type` | String | Enum: `['house', 'flat', 'pg', 'commercial', 'plot']` | Property type |
| `city` | String | Index | City name (e.g. Mohali, Chandigarh, Zirakpur, Panchkula) |
| `locality` | String | Index | Sector or locality |
| `address` | String | Required | Complete physical address |
| `price` | Number | Index | Monthly rent or selling price (Range: ₹1K - ₹2 Cr) |
| `deposit` | Number | Default: `0` | Security deposit amount |
| `bedrooms` | Number | Default: `1` | Number of BHK / bedrooms |
| `bathrooms` | Number | Default: `1` | Number of bathrooms |
| `areaSqFt` | Number | Default: `500` | Area size in square feet |
| `furnishing` | String | Enum: `['unfurnished', 'semi-furnished', 'fully-furnished']` | Furnishing status |
| `verified` | Boolean | Default: `false` | Live admin verification status |
| `featured` | Boolean | Default: `false` | Homepage featured banner status |
| `images` | Array | `[String]` | Array of image URLs |
| `description` | String | Required | Detailed description |
| `amenities` | Array | `[String]` | Power Backup, AC, Parking, etc. |
| `ownerName` | String | Required | Owner/Landlord name |
| `ownerPhone` | String | Required | Owner contact number |
| `ownerEmail` | String | Optional | Owner email address |
| `ownerRole` | String | `'owner' \| 'agent'` | Listing author role |
| `available` | Boolean | Default: `true` | Availability toggle |
| `createdAt` | Date | Default: `Date.now` | Creation timestamp |

---

## ⚡ 4. State Management System ([store/useAppStore.ts](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/store/useAppStore.ts))

Built using **Zustand** (`create` + `persist` middleware) for SSR-safe client persistence to `localStorage`:

- **State Interface (`AppState`)**:
  - `user`: Currently authenticated `UserProfile` object.
  - `wishlist`: Array of saved property PIDs.
  - `isAuthModalOpen`: Toggle state for login/register modal.
  - `isPidModalOpen`: Toggle state for PID search modal.
  - `toastMessage`: Active toast message string.

- **Store Actions**:
  - `setUser(user)`: Sets active user and normalizes wishlist array.
  - `logoutUser()`: Clears user session and resets wishlist state.
  - `toggleWishlist(pid)`: Saves/removes property PID and syncs with `/api/user/wishlist`.
  - `showToast(message)`: Triggers 3-second system notification.
  - `openAuthModal()` / `closeAuthModal()`: Auth modal trigger.
  - `openPidModal()` / `closePidModal()`: PID search trigger.

---

## 🔒 5. Key System Workflows

### 5.1 Electricity Bill Owner Verification Workflow
To prevent fraudulent listings, only verified property owners can post listings:

```
[Owner Dashboard] ──> Uploads Electricity Bill & Consumer No ──> Status: PENDING
                                                                      │
                                                                      ▼
                                                          [Admin Verification Queue]
                                                         (/admin/verifications)
                                                                      │
                                            ┌─────────────────────────┴─────────────────────────┐
                                            ▼                                                   ▼
                                 [Admin Clicks Approve]                              [Admin Clicks Reject]
                                            │                                                   │
                                            ▼                                                   ▼
                                Status: APPROVED (ownerVerified: true)              Status: REJECTED
                                            │
                                            ▼
                               [Post Property Unlocked!]
```

1. **Submission**: Owner opens **Dashboard -> My Profile** and submits Electricity Bill URL & CA/Consumer Number.
2. **Pending Gating**: Status updates to `verificationStatus: 'pending'`. The `/post-property` page shows a locked banner *"Electricity Bill Verification Under Admin Review"*.
3. **Admin Review**: Admin opens `/admin/verifications`, reviews document details, and clicks **Approve & Verify Owner**.
4. **Real-time Auto-Sync**: Client re-syncs via `/api/user/sync-profile` and unlocks `/post-property` for 0% brokerage property creation.

---

### 5.2 Property Search & Price Slider System ([app/properties/page.tsx](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/app/properties/page.tsx))

- **Price Bounds**:
  - Rent / PG / Commercial: Up to **₹15 Lakh** (`1,500,000`)
  - Buy / Sale: Up to **₹5 Crore** (`50,000,000`)
- **Debounced Slider**: 400ms debounce prevents API flooding while dragging the range slider.
- **Filters**: Category (`rent`, `buy`, `pg`, `commercial`), Property Type (`flat`, `house`, `commercial`, `plot`), City, Bedrooms, Furnishing, Verified Only.

---

### 5.3 PID (Property Identifier) Search System
- Every property generates a unique PID (e.g. `LR-101`, `LR-102`).
- Users can click **Search PID** in the top navigation bar to open `PidModal`, enter any PID, and directly jump to the property listing page.

---

## 🛠️ 6. Complete API Reference

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register new user account (`tenant` or `owner`) |
| `/api/auth/login` | `POST` | Public | Authenticate user email & password |
| `/api/properties` | `GET` | Public | Search & filter property listings with query params |
| `/api/properties` | `POST` | Verified Owner | Create new property listing (Gated by Electricity Bill verification) |
| `/api/properties/[id]` | `GET` | Public | Fetch specific property details by PID or ID |
| `/api/properties/[id]` | `PATCH` | Admin | Update property status, verification, or details |
| `/api/properties/[id]` | `DELETE` | Admin / Owner | Remove property listing |
| `/api/user/verify-owner` | `POST` | Owner | Submit Electricity Bill & Consumer No for verification |
| `/api/user/sync-profile` | `POST` | Authenticated | Sync client session with latest database user state |
| `/api/user/wishlist` | `POST` | Authenticated | Persist saved wishlist PIDs to MongoDB |
| `/api/inquiries` | `GET` | Authenticated | Fetch tenant lead inquiries |
| `/api/inquiries` | `POST` | Tenant | Submit direct contact inquiry for owner |
| `/api/admin/verifications` | `GET` | Admin | Fetch pending/all owner verification requests |
| `/api/admin/verifications` | `POST` | Admin | Approve or reject owner Electricity Bill verification |
| `/api/users` | `GET` | Admin | Retrieve user directory list |
| `/api/seed` | `GET` | Admin | Seed initial demo properties and users into MongoDB |

---

## ⚡ 7. Performance Optimizations

1. **Turbopack Dev Engine**: `next dev --turbopack` reduces dev server startup time to **1.8s**.
2. **Lazy Image Loading ([components/LazyImage.tsx](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/components/LazyImage.tsx))**: Deferred loading for off-screen images with animated skeleton loader.
3. **Dynamic Modal Splitting ([components/ClientModals.tsx](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/components/ClientModals.tsx))**: `AuthModal` & `PidModal` use `next/dynamic` with `ssr: false` to reduce initial JS payload.
4. **Component Memoization ([components/PropertyCard.tsx](file:///c:/Users/amank/Desktop/LetsRentz/letsrentz-app/components/PropertyCard.tsx))**: Wrapped with `React.memo` to prevent re-rendering cards during parent state updates.
5. **Fast MongoDB Fallback**: Reduced connection timeout values (3s server selection, 5s socket timeout) to fall back gracefully to `memoryStore.ts` if Atlas is unreachable.

---

## 📁 8. Directory & File Overview

```
letsrentz-app/
├── app/
│   ├── admin/                 # Admin Portal Pages
│   │   ├── inquiries/         # Tenant Leads Manager
│   │   ├── properties/        # Verification Queue & PID Manager
│   │   ├── users/             # User Directory
│   │   ├── verifications/     # Owner Electricity Bill Approval Queue
│   │   └── page.tsx           # Admin Overview Dashboard
│   ├── api/                   # REST API Handlers
│   ├── contact/               # Contact & Support Page
│   ├── dashboard/             # User Dashboard (Profile, My Properties, Wishlist, Inquiries)
│   ├── emi-calculator/        # Home Loan EMI Calculator
│   ├── localities/            # Top Localities Directory
│   ├── post-property/         # 0% Commission Property Creation Wizard
│   ├── properties/            # Catalog Page with Filter Controls
│   │   └── [id]/              # Property Detail Page
│   ├── rent-calculator/       # Rental Affordability Calculator
│   ├── layout.tsx             # Root Layout with Font & Metadata
│   ├── middleware.ts          # Extension Request Filter Middleware
│   └── page.tsx               # Homepage with Category Cards & Search Hero
├── components/
│   ├── AdminSidebar.tsx       # Admin Navigation Drawer
│   ├── AuthModal.tsx          # Login & Signup Dialog
│   ├── ClientModals.tsx       # Dynamic Client Modal Wrapper
│   ├── Footer.tsx             # Site Footer & Quick Links
│   ├── LazyImage.tsx          # Optimized Lazy Image Component
│   ├── MobileBottomNav.tsx    # Mobile Bottom Dock Navigation
│   ├── Navbar.tsx             # Top Header Navigation & Active Links
│   ├── PidModal.tsx           # Quick Property PID Search Dialog
│   ├── PropertyCard.tsx       # Memoized Property Card Component
│   └── Toast.tsx              # System Notification Alert
├── context/
│   └── AppContext.tsx         # React Context Wrapper
├── lib/
│   ├── memoryStore.ts         # In-memory Storage Fallback Engine
│   ├── mongodb.ts             # MongoDB Mongoose Connection Singleton
│   └── seedData.ts            # Initial Demo Dataset
├── models/
│   ├── Property.ts            # Mongoose Property Schema
│   └── User.ts                # Mongoose User Schema
├── store/
│   └── useAppStore.ts         # Zustand Global Application Store
├── eslint.config.mjs          # ESLint 9 Flat Configuration
├── next.config.ts             # Next.js Optimization Config
└── package.json               # Dependencies & NPM Scripts
```

---

## 💻 9. How to Run Locally

```bash
# 1. Install dependencies
pnpm install

# 2. Start Turbopack Development Server
npm run dev

# 3. Open in Browser
http://localhost:3000

# 4. Production Build Verification
npm run build
```
