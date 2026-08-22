# PROPZY — 0% Brokerage Real Estate Platform

**PROPZY** is a modern, high-performance real estate discovery and listing platform designed for finding, renting, buying, and selling residential and commercial properties across Chandigarh Tricity (Chandigarh, Mohali, Kharar, Zirakpur, Panchkula) with **0% Brokerage**.

---

## ✨ Key Features

- **0% Brokerage Guarantee**: Connects prospective tenants and buyers directly with verified property owners.
- **⚡ Electricity Bill Landlord Verification**: Mandatory CA / Consumer Number & Electricity Bill proof moderation to eliminate fraudulent listings and broker spam.
- **☁️ Cloudinary Media Integration**: Direct browser-to-Cloudinary image uploads with server-signed SHA-1 authentication and automatic image lifecycle cleanup.
- **⚡ Multi-Tier High-Performance Caching**:
  - In-memory server-side cache with 45s TTL, 5-minute stale fallback, and in-flight request deduplication.
  - Client-side in-memory query cache for instant filter response.
  - Real-time cross-tab synchronization for the Admin portal using the `BroadcastChannel` API.
- **🔍 Global Autocomplete Search & Debounced Slider**: Real-time typeahead suggestions across localities, PIDs, property types, and budgets (Rent up to ₹15 Lakh, Buy up to ₹5 Crore).
- **🛡️ JWT Cookie Authentication & Admin Route Guard**: Secure session management using `jose` and `bcryptjs` with HttpOnly cookies.
- **📱 Responsive Dark-Theme UI**: Built with Next.js 15 App Router, React 19, and TailwindCSS 4 with fluid mobile dock navigation.
- **💼 Tenant Relax Plan**: Dedicated assistance workflow for personalized rental search and scheduled owner visits.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- **Package Manager**: `pnpm` (recommended) or `npm`
- **MongoDB Atlas Database**
- **Cloudinary Account**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/propzy.git
cd LetsRentz/letsrentz-app

# Install dependencies
pnpm install
```


### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Seed Initial Data (Optional)
```bash
npm run seed
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.2.8](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose 8](https://mongoosejs.com/)
- **Media CDN**: [Cloudinary](https://cloudinary.com/)
- **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/)
- **Security**: [jose](https://github.com/panva/jose) (JWT) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📖 Documentation

For full architectural blueprints, database schemas, complete API reference, performance benchmarks, and admin moderation workflows, consult:
- **[Comprehensive Technical & Functional Documentation](PROJECT_DOCUMENTATION.md)**
- **[Production Deployment Guide](DEPLOYMENT.md)**