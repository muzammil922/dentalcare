import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  UserCheck,
  Package,
  MessageSquare,
  Zap,
  Menu,
  X,
  User,
  Loader2,
  Settings,
  LogOut,
  ChevronDown,
  FileText,
} from "lucide-react";
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/patients", icon: Users, label: "Patients" },
  { href: "/staff", icon: UserCheck, label: "Staff" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/feedback", icon: MessageSquare, label: "Feedback" },
  { href: "/automation", icon: Zap, label: "Automation" },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, clinicInfo, userInfo } = useAppStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown')) {
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Handle initial app loading - only on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000); // Show loading only on first page load

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => item.href === location.pathname);
    if (location.pathname === '/dashboard') {
      return clinicInfo.name || "Dashboard";
    }
    return currentItem ? currentItem.label : "Dashboard";
  };

  const handleSettingsClick = () => {
    setUserDropdownOpen(false);
    navigate('/settings');
  };

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    // Add logout logic here
    console.log('Logout clicked');
  };

  const handleUserClick = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Show global loader during initialization
  if (isInitializing) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="p-6 w-full">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.nav
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-white border-r border-gray-200 z-[9999] shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          !isMobile && "translate-x-0"
        )}
        initial={false}
        animate={{ x: sidebarOpen || !isMobile ? 0 : -280 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 text-xl font-bold text-primary-500">
              {clinicInfo.logo && (
                <img
                  src={clinicInfo.logo}
                  alt="Clinic Logo"
                  className="w-8 h-8 object-contain border-0"
                />
              )}
              {clinicInfo.name && <span>{clinicInfo.name}</span>}
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <ul className="flex-1 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <li key={item.href}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex items-center gap-3 w-full px-6 py-4 text-left transition-all duration-150 border-l-3 border-transparent",
                      isActive
                        ? "bg-primary-50 text-primary-500 border-l-primary-500 font-semibold"
                        : "text-gray-600 hover:bg-primary-50 hover:text-primary-500 hover:border-l-primary-500 font-medium"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.nav>

      {/* Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-100"
      )}>
        {/* Header */}
        <header className="bg-white h-[70px] border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-[9997] shadow-sm transition-all duration-100">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              {location.pathname === '/dashboard' && clinicInfo.logo && (
                <img
                  src={clinicInfo.logo}
                  alt="Clinic Logo"
                  className="w-8 h-8 object-contain border-0"
                />
            )}
            <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
            </div>
          </div>
          
          <div className="relative user-dropdown">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={handleUserClick}
                  className="flex items-center hover:opacity-80 transition-opacity border-0 focus:outline-none focus:border-0 focus:ring-0 focus:ring-offset-0 active:border-0 active:outline-none"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                >
{clinicInfo.profileImage ? (
                    <img
                      src={clinicInfo.profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-0"
                    />
                  ) : (
                    <User className="w-8 h-8 text-blue-600 border-0" />
                  )}
                </button>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
            
            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                {/* User Profile Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {clinicInfo.profileImage ? (
                        <img
                          src={clinicInfo.profileImage}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{userInfo.name}</div>
                      <div className="text-sm text-gray-500">{userInfo.email}</div>
                    </div>
                  </div>
          </div>
          
                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-70px)]">
          {children}
        </main>

        {/* Version Footer */}
        <footer className=" py-3 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-12 lg:px-40">
            <p className="text-sm text-gray-500">
              myDashy v1.0.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Skeleton Loader Component
function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading your dental clinic...</span>
        </div>
      </div>
    </div>
  );
}
