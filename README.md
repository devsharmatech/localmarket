# Local Market - Complete Platform

A comprehensive local marketplace platform with mobile app (React Native), web app (React), and admin panel (Next.js).

## Project Structure

```
LocalMarket/
├── LocalMarketMobile/      # React Native mobile app
├── Localmarketweb/         # React web application
├── Admin/admin-panel/      # Next.js admin panel
└── website/                # Next.js website (matches mobile app)
```

## Features

### Mobile App (React Native)
- Customer and Vendor login/registration
- Vendor dashboard with analytics
- Product management
- Search and discovery
- Offers and promotions
- Saved items
- Vendor performance insights
- Competition analysis

### Web App (React)
- Full marketplace functionality
- Vendor and customer portals
- Business listings
- Search and filters

### Website (Next.js)
- Complete replica of mobile app functionality
- All pages from mobile app (Home, Categories, Search, Saved, Offers)
- Vendor dashboard with Analytics, Catalog, Enquiries, Reviews, Profile
- Settings, Help, Notifications pages
- Responsive design matching mobile app UI/UX

### Admin Panel (Next.js)
- Vendor management and approval
- Category and product management
- Price verification
- Reports and analytics
- Notification management

## Getting Started

### Mobile App
```bash
cd LocalMarketMobile
npm install
npm run android  # For Android
npm run ios      # For iOS
```

### Web App
```bash
cd Localmarketweb/ArgosMob
npm install
npm run dev
```

### Admin Panel
```bash
cd Admin/admin-panel
npm install
npm run dev
```

### Website (Next.js)
```bash
cd website
npm install
npm run dev
```

## Tech Stack

- **Mobile**: React Native 0.83, React Navigation
- **Web**: React, Vite, TypeScript
- **Website**: Next.js 16, React 19, Tailwind CSS, TypeScript
- **Admin**: Next.js 16, React 19, Tailwind CSS
- **Icons**: React Native Vector Icons (Feather), Lucide React

## Deployment

See individual README files in each directory for deployment instructions.

## License

Private project


