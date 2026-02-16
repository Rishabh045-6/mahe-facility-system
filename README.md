# 🏛️ MAHE Facility Management System

**Zero-Cost Progressive Web Application for Streamlining Daily Facility Inspections at Manipal Academy of Higher Education**

![MAHE Logo](https://mahe.edu.in/images/mahe-logo.png)

---

## 📌 Table of Contents
- [🌟 Overview](#overview)
- [🚀 Key Features](#key-features)
- [🛠️ Tech Stack](#tech-stack)
- [📋 Prerequisites](#prerequisites)
- [⚡ Quick Start Guide](#quick-start-guide)
- [🗄️ Supabase Setup (Critical)](#supabase-setup-critical)
- [📧 SMTP Configuration Explained](#smtp-configuration-explained)
- [♻️ Auto-Cleanup System (2-Day Retention)](#auto-cleanup-system-2-day-retention)
- [📱 Usage Guide](#usage-guide)
- [🌐 Deployment to Vercel](#deployment-to-vercel)
- [🐛 Troubleshooting](#troubleshooting)
- [📁 Project Structure](#project-structure)
- [🔒 Security Notes](#security-notes)
- [📄 License](#license)

---

## 🌟 Overview

This system transforms MAHE's fragmented facility inspection process into a streamlined digital workflow. Marshals report issues via mobile PWA, admins review after 6 PM, and directors receive professional reports automatically—all with **zero infrastructure costs** using Supabase and Vercel free tiers.

**Key Innovation**: Replaces WhatsApp chaos and paper forms with structured digital workflows while maintaining offline capability for campus connectivity challenges.

---

## 🚀 Key Features

### 👷 For Marshals
- ✅ **Offline-First PWA**: Works without internet, auto-syncs when connected
- ✅ **Digital Checklist**: 19-item standardized inspection checklist
- ✅ **Smart Issue Reporting**: Auto-populated fields from checklist
- ✅ **Image Upload**: Up to 10 images per issue (auto-compressed to ~300KB)
- ✅ **Auto-Save**: Saves every 10 seconds
- ✅ **6 PM Deadline**: Form locks automatically (15-min grace period)
- ✅ **Simple Login**: Just Marshal ID + Name (no complex auth)

### 👨‍💼 For Admin
- ✅ **Post-6PM Access Only**: Clean daily review workflow
- ✅ **Email Notification**: Automatic summary at 6 PM
- ✅ **One-Click Toggle**: Approve/deny with instant save
- ✅ **Floor Coverage Alerts**: Visual warnings for unchecked floors
- ✅ **Image Gallery**: Lightbox viewer for Supabase Storage images
- ✅ **Report Generation**: One-click PDF + Excel download
- ✅ **Auto-Email**: Send reports to director instantly

### 👔 For Director
- ✅ **Professional Reports**: PDF (visual) + Excel (filterable)
- ✅ **Structured Data**: Consistent format daily
- ✅ **Clickable Image Links**: View full-resolution photos
- ✅ **Guaranteed Delivery**: Email sent even with zero issues
- ✅ **Small Attachments**: <5MB email size (images stored separately)

### ♻️ Auto-Cleanup System
- ✅ **2-Day Data Retention**: All reports automatically cleared after 48 hours
- ✅ **Storage Optimization**: Images + database records deleted automatically
- ✅ **Analytics Preservation**: Aggregated analytics kept permanently
- ✅ **Daily Cron Job**: Runs at 2 AM IST automatically

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript | Modern React framework with SSR |
| **Styling** | Tailwind CSS | Rapid UI development |
| **PWA** | next-pwa | Offline capability, installable app |
| **Database** | Supabase PostgreSQL | Free tier, RLS, real-time |
| **Storage** | Supabase Storage | Free 1GB storage, CDN delivery |
| **Auth** | Supabase Auth | Built-in security, session management |
| **PDF** | PDFKit | Server-side PDF generation (Node.js compatible) |
| **Excel** | ExcelJS | Professional spreadsheet generation |
| **Deployment** | Vercel | Free tier, automatic deployments |
| **Email** | Nodemailer + Gmail SMTP | Free email delivery |
| **Cleanup** | Vercel Cron Jobs | Automated daily cleanup |

---

## 📋 Prerequisites

✅ **Required**:
- Node.js 18+ installed ([Download](https://nodejs.org))
- Supabase account ([Sign up free](https://supabase.com))
- Vercel account ([Sign up free](https://vercel.com))
- Gmail account (for SMTP)

⚠️ **Recommended**:
- Git installed
- VS Code or similar editor
- Basic terminal/command line knowledge

---

## ⚡ Quick Start Guide

### Step 1: Clone & Install
```bash
git clone https://github.com/your-org/mahe-facility-system.git
cd mahe-facility-system
npm install

: Step 2: Set Up Supabase (See next section)
Create Supabase project
Run database schema
Create storage bucket
Create admin user

: Step 3: Configure Environment

cp .env.example .env.local
# Edit .env.local with your credentials (see SMTP section below)

:  Step 4: Run Development Server
npm run dev