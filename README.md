#  Asset Manager

A comprehensive web-based Asset Management System built with Next.js, PostgreSQL (Supabase), and deployed on Vercel with CI/CD integration.

## Live Demo

**Live Application:** [https://asset-manager-one.vercel.app](https://asset-manager-one.vercel.app)

##  Test Credentials

### Admin Account
- **Email:** admin@assetmanager.com
- **Password:** admin@123
- **Access:** Full system administration capabilities

### User Account
- **Email:** lunganokuthaba@gmail.com
- **Password:** noku@123
- **Access:** Personal asset management


## Core Features

### Authentication & Authorization
- ✅ **Role-Based Access Control** - Separate Admin and User roles
- ✅ **Secure Login/Signup** - Powered by Supabase Auth
- ✅ **Protected Routes** - Automatic redirection based on user role

### Admin Dashboard
- ✅ **User Management** - Create and manage system users
- ✅ **Department Management** - Create and manage departments
- ✅ **Category Management** - Create and manage asset categories
- ✅ **Asset Oversight** - View and delete all assets across the organization
- ✅ **Analytics Dashboard** - Comprehensive insights with 4 different chart types:
  - Pie Chart: Assets by Category
  - Bar Chart: Assets by Department
  - Bar Chart: Asset Value by Department
  - Line Chart: Asset Creation Trend (6 months)
- ✅ **Total Asset Value Tracking**

### User Dashboard
- ✅ **Personal Asset Management** - Create and manage own assets
- ✅ **Asset Creation** - Add new assets with complete details
- ✅ **Personal View** - View only self-created assets
- ✅ **Asset Statistics** - Personal asset count and metrics

### Asset Management
- ✅ **Complete Asset Information**
  - Asset Name
  - Unique Asset ID (Format: AST-2025-XXX)
  - Category
  - Department
  - Cost
  - Date Purchased
  - Asset Image Upload
  - Current Status
  - Current Location
- ✅ **Asset Images** - Upload and display asset images with placeholders
- ✅ **Asset Status Tracking** - Available, In Use, Under Maintenance, Retired
- ✅ **Location Tracking** - Track asset physical location
- ✅ **Detailed Asset View** - Modal with complete asset information

### Asset Tracking System
- ✅ **Movement History** - Complete audit trail of all changes
- ✅ **Status Change Tracking** - Automatic logging of status updates
- ✅ **Location Change Tracking** - Record location movements
- ✅ **User Attribution** - Track who made each change
- ✅ **Timestamped Records** - Precise datetime for each event
- ✅ **Notes Support** - Add context to tracking updates
- ✅ **Asset ID Search** - Quick lookup by Asset ID with full history modal

### Data Management
- ✅ **Search Functionality** - Search assets by name
- ✅ **Pagination** - 5 items per page for better performance
- ✅ **Referential Integrity** - Cannot delete departments/categories with assigned assets
- ✅ **Data Validation** - Form validation and error handling

### User Experience
- ✅ **Modern UI Design** - Navy blue and deep orange theme
- ✅ **Responsive Layout** - Works on desktop, tablet, and mobile
- ✅ **Professional Navigation Bar** - Clean, intuitive navigation
- ✅ **Interactive Modals** - Detailed views for assets
- ✅ **Visual Status Badges** - Color-coded status indicators
- ✅ **Loading States** - Smooth user experience with loading indicators
- ✅ **Error Handling** - Clear error messages and feedback
- ✅ **Success Messages** - Confirmation for successful actions
- ✅ **Custom 404 Page** - Professional error page

---

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library for analytics

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage (for images)
  - Row Level Security (RLS)
- **Supabase Storage** - Asset image storage

### Deployment & CI/CD
- **Vercel** - Hosting platform
- **GitHub** - Version control
- **Automatic Deployment** - Push to main branch triggers redeployment

---

##  Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Vercel account (for deployment)
.
 





