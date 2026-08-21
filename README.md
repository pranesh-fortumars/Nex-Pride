# NexTirupur.in | Tirupur Job Hub

> The most trusted digital bridge for Tirupur's Garment & Textile Industry.

---

## 📌 Project Overview

**NexTirupur.in** is a specialized job marketplace platform built to connect textile factories, garment manufacturers, tailors, checkers, merchandisers, and administrative staff in Tirupur, Tamil Nadu.

It provides role-based interfaces for:
- **Job Seekers (Workers & Staff)**: Simplified profile creation, language options (Tamil/English/Hindi), job location filtering, distance calculation, local benefit highlights (ESI/EPF, Tea Cash), and WhatsApp job sharing.
- **Employers (Factories & Garment Units)**: GST verification, factory gate proof upload, job posting with salary/payout schedules, applicant management, and candidate unlocking control.
- **Platform Administrators**: Central moderation dashboard for approving employer accounts, monitoring reports, designation management, system configuration, and payments tracking.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database & Auth**: [Firebase Firestore](https://firebase.google.com/docs/firestore) & Firebase Authentication
- **Styling**: Tailwind CSS & Lucide Icons
- **Language**: TypeScript

---

## ⚡ Recent Fixes & Firestore Security Configuration

### Resolved Permission Issues:
1. **`Users` Aggregation Query Fix**:
   - Updated `Users` collection security rules to allow `list` queries for authenticated and anonymous users. This permits landing page statistical count aggregations (e.g. counting approved employers and active job seekers) without triggering HTTP 403 `permission-denied` errors.
2. **Collection Subscription Permissions**:
   - Fixed `list` permission denials on `Payments`, `AdminNotifications`, `Reports`, and `UserNotifications` collections for signed-in users so dashboards and notifications stream reliably.

### Updated Firestore Rules Summary (`firestore.rules`)
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles & Public Stats
    match /Users/{userId} {
      allow get, list: if true;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // Job listings
    match /Jobs/{jobId} {
      allow list, read: if true;
      allow create, update: if request.auth != null;
    }
    
    // Payments, Notifications & Safety Reports
    match /Payments/{paymentId} { allow read, create: if request.auth != null; }
    match /AdminNotifications/{id} { allow read, create: if request.auth != null; }
    match /Reports/{reportId} { allow read, create: if request.auth != null; }
    match /reports/{reportId} { allow read, create: if request.auth != null; }
  }
}
```

---

## 🚀 Key Features

### 🧵 Job Seeker Experience
- **Simplified Worker Setup**: Fast onboarding for tailors & checkers without requiring resume uploads.
- **Staff Resume Builder**: Structured digital resume creation and PDF upload options.
- **Multilingual UI**: Quick toggle for English, Tamil (தமிழ்), and Hindi (हिन्दी).
- **Proximity Search**: "Near Me" radius filtering for textile clusters across Tirupur.
- **Local Perks Display**: Clear indicators for ESI/EPF, Transport allowance, and "Tea Cash".

### 🏭 Employer Experience
- **GST & Factory Gate Verification**: Employer verification workflow with mandatory proof uploads.
- **Privacy Protection**: Phone numbers are masked until explicit candidate unlock.
- **Draft & Job Management**: Save job drafts, manage active listings, and close positions.
- **View & Conversion Stats**: Real-time tracking of candidate views and application rates.

### 🛡️ Moderation & Security
- **Super Admin Dashboard**: Full control over user approvals, flags, payments, and platform designations.
- **Anti-Fraud Safety**: Contextual incident reporting and moderation workflows.

---

## 📦 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm / pnpm / yarn

### Environment Variables (`.env.local`)
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seeker-platform-8854-7bad6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Installation
```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in the browser.

---

## 📄 License
© 2026 NexTirupur.in. All rights reserved.
