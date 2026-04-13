# Local Market - Admin Panel

A comprehensive admin panel for managing the Local Market platform, built with Next.js and using the same color theme as the mobile app.

## Features

### 1. Vendor Management
- **Vendor List & Status**: View all vendors with their status (Pending/Active/Blocked)
- **Approval Workflow**: Review KYC documents and approve/reject/put on hold vendors
- **Block/Unblock Vendors**: Manually block vendors violating terms with internal notes
- **Vendor Profile View**: See vendor's store details, KYC status, product count, and activity logs

### 2. Product & Category Master Management
- **Category Master**: Create/edit/delete categories and sub-categories with visibility control
- **Master Product Import**: Bulk product import via Excel/CSV for faster onboarding
- **Global Settings**: Manage standard units, tax flags, and other global configurations

### 3. Price Verification & Quality Control
- **Flagging Engine**: System flags unrealistic pricing (too high/too low vs market)
- **Auto-alerts**: Generate alerts when price is outside defined threshold
- **Manual Review Tools**: Review flagged products with options to warn vendor, hide product, or block vendor

### 4. Reporting & Analytics
- **Search & Demand Reports**: List of highest searched products by location
- **Vendor Activity Reports**: Active vs inactive vendors, price updates, view counts, listing completeness
- **Operational Dashboards**: Total vendors, daily active vendors, total products, search volume trends

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the admin panel directory:
```bash
cd Admin/admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Color Theme

The admin panel uses the same color theme as the mobile app:

- **Primary Orange**: `#E86A2C`
- **Primary Blue**: `#4A6CF7`
- **Gradient**: Orange to Blue (`#E86A2C` → `#4A6CF7`)
- **Dark Background**: `#0B1324`
- **Text Colors**: Primary `#0F172A`, Secondary `#475569`, Muted `#9CA3AF`

## Project Structure

```
admin-panel/
├── app/
│   ├── globals.css          # Global styles with color theme
│   ├── layout.js            # Root layout
│   └── page.js              # Main admin panel page
├── components/
│   ├── Sidebar.js           # Navigation sidebar
│   ├── Dashboard.js         # Main dashboard
│   ├── VendorManagement/   # Vendor management components
│   ├── CategoryManagement/  # Category & product management
│   ├── PriceVerification.js # Price verification tools
│   └── Reports/             # Reporting components
└── constants/
    └── colors.js            # Color theme constants
```

## Build for Production

```bash
npm run build
npm start
```

## Technologies Used

- **Next.js 16** - React framework
- **Tailwind CSS 4** - Styling
- **React 19** - UI library

## Notes

- All components use the same color theme as the mobile app for consistency
- The admin panel is designed to be responsive and work on desktop screens
- All functionality matches the requirements from the admin panel specification
