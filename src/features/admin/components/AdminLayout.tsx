'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Layers,
  MessageSquare,
  ShoppingCart,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '../hooks/useAdminAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Layers, label: 'Harness Products', href: '/admin/harness' },
  { icon: Layers, label: 'EV Products', href: '/admin/ev' },
  { icon: Layers, label: 'Categories', href: '/admin/categories' },
  { icon: ShoppingCart, label: 'Order Inquiries', href: '/admin/orders' },
  { icon: MessageSquare, label: 'General Enquiries', href: '/admin/enquiries' },
  { icon: FileText, label: 'Blogs', href: '/admin/blogs' },
  { icon: Users, label: 'Clients', href: '/admin/clients' },
  {
    icon: Settings,
    label: 'Settings',
    href: '#',
    children: [
      { label: 'Upload Catalog', href: '/admin/settings/upload-catalog' },
      { label: 'Upload EV Catalog', href: '/admin/settings/upload-ev-catalog' },
      { label: 'Manage Login', href: '/admin/settings/manage-login' },
    ]
  },
];

interface MenuItemType {
  icon: React.ElementType;
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const MenuItem = ({ item, isSidebarOpen, pathname, onItemClick }: { item: MenuItemType, isSidebarOpen: boolean, pathname: string, onItemClick?: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = pathname === item.href || item.children?.some((c: { href: string }) => pathname === c.href);
  const hasChildren = !!item.children;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group w-full ${isActive
            ? 'bg-brand-red text-white'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
        >
          <item.icon size={22} className="flex-shrink-0" />
          <span className={`font-bold transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
            }`}>
            {item.label}
          </span>
          {isSidebarOpen && (
            <ChevronRight size={16} className={`ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && isSidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pl-12 space-y-1 overflow-hidden"
            >
              {item.children?.map((child: { label: string; href: string }) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onItemClick}
                  className={`block py-2 text-sm font-bold transition-colors ${pathname === child.href ? 'text-brand-red' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {child.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${isActive
        ? 'bg-brand-red text-white'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <item.icon size={22} className="flex-shrink-0" />
      <span className={`font-bold transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
        }`}>
        {item.label}
      </span>
      {isActive && isSidebarOpen && (
        <motion.div
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-brand-dark text-white transition-all duration-300 ease-in-out border-r border-white/5 ${isSidebarOpen ? 'w-72' : 'w-20'
          }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/admin" className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-brand-red rounded-lg flex-shrink-0" />
            <span className={`font-black text-xl tracking-tighter whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'
              }`}>
              AAJ TECH <span className="text-brand-red">ADMIN</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <MenuItem key={item.label} item={item} isSidebarOpen={isSidebarOpen} pathname={pathname} />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={logout}
            className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-brand-red transition-all w-full group ${!isSidebarOpen && 'justify-center'
              }`}
          >
            <LogOut size={22} className="flex-shrink-0" />
            <span className={`font-bold transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'
              }`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 hover:bg-gray-50 rounded-xl text-gray-400"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-50 rounded-xl text-gray-400"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-bold">Admin</span>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="text-brand-dark font-black capitalize">
                {pathname.split('/').pop() || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-red w-64 transition-all outline-none"
              />
            </div>

            <button className="relative p-2 text-gray-400 hover:text-brand-red transition-colors">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-brand-dark uppercase tracking-wider">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.role || 'Super Admin'}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user?.avatar || "https://ui-avatars.com/api/?name=Admin"} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-brand-dark z-[100] lg:hidden flex flex-col"
            >
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-red rounded-lg" />
                  <span className="font-black text-xl text-white tracking-tighter">AAJ TECH ADMIN</span>
                </div>
                <button onClick={() => setIsMobileOpen(false)} className="text-gray-400">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-2">
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    item={item}
                    isSidebarOpen={true}
                    pathname={pathname}
                    onItemClick={() => !item.children && setIsMobileOpen(false)}
                  />
                ))}
              </nav>
              <div className="p-6 border-t border-white/5">
                <button onClick={logout} className="flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-brand-red transition-all w-full">
                  <LogOut size={22} />
                  <span className="font-bold">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
