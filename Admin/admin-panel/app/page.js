'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import UserManagement from '../components/Dashboard/UserManagement';
import VendorManagement from '../components/VendorManagement';
import CategoryManagement from '../components/CategoryManagement';
import PriceVerification from '../components/PriceVerification';
import Reports from '../components/Reports';
import NotificationManagement from '../components/NotificationManagement';
import LocationManagement from '../components/LocationManagement';
import PaymentFeesManagement from '../components/PaymentFeesManagement';
import FestiveOffersManagement from '../components/FestiveOffersManagement';
import BannerManagement from '../components/BannerManagement';
import EAuctionManagement from '../components/EAuctionManagement';
import CircleAnalytics from '../components/Analytics/CircleAnalytics';
import FeaturedManagement from '../components/FeaturedManagement';
import Settings from '../components/Settings';
import WelcomeAnimation from '../components/WelcomeAnimation';
import LoginPage from '../components/LoginPage';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication state
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('admin_authenticated');
      const savedUser = localStorage.getItem('admin_user');
      
      if (isAuth === 'true' && savedUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(savedUser));
      }

      // Show welcome animation once per session
      const hasSeenWelcome = sessionStorage.getItem('admin_seen_welcome');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('admin_seen_welcome', 'true');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('admin_authenticated', 'true');
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getPageTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Dashboard';
      case 'users':
        return 'User Management';
      case 'vendors':
        return 'Vendor Management';
      case 'categories':
        return 'Category & Products';
      case 'price-verification':
        return 'Price Verification';
      case 'reports':
        return 'Reports & Analytics';
      case 'notifications':
        return 'Notifications';
      case 'locations':
        return 'Location Management';
      case 'payment-fees':
        return 'Payment & Fees Management';
      case 'festive-offers':
        return 'Festive Offers Management';
      case 'banners':
        return 'Banner Management';
      case 'featured':
        return 'Home Featured Management';
      case 'e-auction':
        return 'E-Auction & Online Draw';
      case 'circle-analytics':
        return 'Circle Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'users':
        return <UserManagement />;
      case 'vendors':
        return <VendorManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'price-verification':
        return <PriceVerification />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return <NotificationManagement />;
      case 'locations':
        return <LocationManagement />;
      case 'payment-fees':
        return <PaymentFeesManagement />;
      case 'festive-offers':
        return <FestiveOffersManagement />;
      case 'banners':
        return <BannerManagement />;
      case 'featured':
        return <FeaturedManagement />;
      case 'e-auction':
        return <EAuctionManagement />;
      case 'circle-analytics':
        return <CircleAnalytics />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (showWelcome) {
    return <WelcomeAnimation onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Full Width Header */}
      <Header currentPage={getPageTitle()} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
