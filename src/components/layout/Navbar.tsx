'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/utils';
import { navItems as initialNavItems } from '@/data/mockData';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navItems, setNavItems] = useState(initialNavItems);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://aaj-tech-backend.onrender.com/api/categories/');
        if (!res.ok) throw new Error('Failed to fetch');
        const categories = await res.json();

        if (isMounted) {
          const categoryItems = categories.map((cat: { id: string; name: string }) => ({
            title: cat.name,
            href: `/products?category=${cat.id}`,
          }));

          setNavItems((prevItems) =>
            prevItems.map((item) => {
              if (item.title === 'Connectors') {
                return {
                  ...item,
                  items: categoryItems.length > 0 ? categoryItems : item.items,
                };
              }
              return item;
            })
          );
        }
      } catch (error) {
        console.error('Failed to fetch categories for navbar:', error);
      }
    };

    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setIsScrolled(latest > 50);
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] py-2'
          : 'bg-white py-4 shadow-sm'
      )}
    >
      <div className="px-4 md:px-12 lg:px-24 xl:px-32 flex justify-between items-center w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="block group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="AAJ Tech Trading Logo"
              className="h-24 md:h-28 w-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {navItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative group"
            >
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-black transition-all hover:text-brand-red py-2 flex items-center gap-1.5 tracking-wider uppercase",
                  pathname === item.href ? "text-brand-red" : "text-gray-600"
                )}
              >
                {item.title}
                {item.items && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
              </Link>

              {/* Animated underline */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-brand-red rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />

              {item.items && (
                <div className="absolute top-full left-0 mt-4 w-64 bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 -translate-y-4 group-hover:translate-y-0 backdrop-blur-xl">
                  <div className="p-3">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="block px-6 py-4 text-xs text-gray-700 hover:bg-brand-red hover:text-white rounded-2xl transition-all duration-300 font-black uppercase tracking-widest"
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex items-center gap-6"
        >
          <Link
            href="/login"
            className="group relative bg-brand-red hover:bg-brand-red-hover text-white px-10 py-4 rounded-full text-sm font-black transition-all shadow-[0_15px_30px_-5px_rgba(210,35,42,0.4)] active:scale-95 uppercase tracking-widest overflow-hidden"
          >
            <span className="relative z-10">Sign In</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Link>
        </motion.div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-3 text-brand-dark bg-brand-light rounded-2xl active:scale-90 transition-transform"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-2xl"
          >
            <div className="container mx-auto px-4 py-12 flex flex-col gap-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "text-3xl font-black block py-2 uppercase tracking-tight",
                      pathname === item.href ? "text-brand-red" : "text-brand-dark"
                    )}
                    onClick={() => !item.items && setIsOpen(false)}
                  >
                    {item.title}
                  </Link>
                  {item.items && (
                    <div className="pl-6 mt-4 flex flex-col gap-4 border-l-2 border-brand-red/20 mb-4">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className="text-lg font-bold text-gray-500 hover:text-brand-red transition-colors uppercase tracking-widest"
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-4 mt-4"
              >
                <Link
                  href="/login"
                  className="bg-brand-red text-white text-center py-6 rounded-3xl font-black text-xl shadow-2xl shadow-brand-red/30 block uppercase tracking-widest"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
