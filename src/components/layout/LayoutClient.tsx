'use client';

import React from 'react';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import InquiryModal from "@/components/common/InquiryModal";
import { usePathname } from "next/navigation";

// Intercept window.fetch to automatically include credentials (cookies) and Authorization headers for all backend API requests
if (typeof window !== 'undefined' && !(window as any).__fetchWrapped) {
  (window as any).__fetchWrapped = true;
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' 
      ? input 
      : (input instanceof URL ? input.toString() : (input as Request).url);
    
    const isBackend = url && (url.includes('localhost:8000') || url.includes('onrender.com'));
    
    if (isBackend) {
      init = init || {};
      init.credentials = 'include';
      
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      
      const token = getCookie('admin_token');
      if (token) {
        const headers = new Headers(init.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init.headers = headers;
      }
    } else if (url && url.startsWith('/api/')) {
      init = init || {};
      init.credentials = 'include';
    }
    return originalFetch(input, init);
  };
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isLogin = pathname === '/login';
  const isAuthPage = isAdmin || isLogin;

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAuthPage && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAuthPage && <InquiryModal />}
    </>
  );
}
