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
} from "lucide-react";
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/patients", icon: Users, label: "Patients" },
  { href: "/staff", icon: UserCheck, label: "Staff" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/feedback", icon: MessageSquare, label: "Feedback" },
  { href: "/automation", icon: Zap, label: "Automation" },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => item.href === location.pathname);
    return currentItem ? currentItem.label : "Dashboard";
  };

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
              <span className="text-white font-bold text-lg">🦷</span>
              <span>DentalCare Pro</span>
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
            <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600 font-medium">
            <User className="w-8 h-8 text-primary-500" />
            <span>Admin User</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-70px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
