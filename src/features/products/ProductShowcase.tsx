'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';

const API_BASE = 'https://aaj-tech-backend.onrender.com/api';

const isValidImageUrl = (url: string) => {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

const ProductShowcase = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/products/`),
          fetch(`${API_BASE}/categories/`)
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData);
        setCategories(catData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="py-32 bg-brand-light relative overflow-hidden">
      {/* Decorative Text */}
      <div className="absolute top-0 right-0 text-[20vw] font-black text-brand-dark/[0.02] select-none pointer-events-none -translate-y-1/2">
        PRODUCTS
      </div>

      <div className="px-4 md:px-12 lg:px-24 xl:px-32 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <Reveal direction="up">
            <h2 className="text-5xl md:text-6xl font-black text-brand-dark mb-8">
              Explore Our <span className="text-brand-red">Solutions</span>
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.2}>
            <div className="w-32 h-2 bg-brand-red mx-auto rounded-full"></div>
          </Reveal>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-red w-12 h-12" />
          </div>
        ) : products.length > 0 ? (
          <div className="relative group/slider">
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 lg:-translate-x-12 z-20 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-dark hover:bg-brand-red hover:text-white transition-all opacity-0 group-hover/slider:opacity-100 group-hover/slider:translate-x-0"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 lg:translate-x-12 z-20 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-dark hover:bg-brand-red hover:text-white transition-all opacity-0 group-hover/slider:opacity-100 group-hover/slider:translate-x-0"
            >
              <ChevronRight size={32} />
            </button>

            {/* Slider Container */}
            <div className="overflow-hidden px-4">
              <motion.div
                className="flex gap-8"
                animate={{ x: `calc(-${currentIndex * (100 / itemsPerView)}% - ${currentIndex * (32 / itemsPerView)}px)` }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
              >
                {products.map((product) => {
                  const category = categories.find(c => c.id === product.category_id);
                  return (
                    <div
                      key={product.id}
                      className="min-w-full md:min-w-[calc(50%-16px)] lg:min-w-[calc(33.333%-21.33px)] bg-white rounded-[48px] overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-brand-red/20 transition-all duration-700 group"
                    >
                      {/* Image Container */}
                      <div className="relative h-80 overflow-hidden bg-brand-light flex items-center justify-center p-8">
                        {isValidImageUrl(product.image) ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.image}
                              alt={product.name}
                              className="max-w-full max-h-full object-contain transition-transform duration-1000 group-hover:scale-110"
                            />
                          </>
                        ) : (
                          <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Image</span>
                        )}

                        <div className="absolute top-8 left-8">
                          <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-brand-red uppercase tracking-widest shadow-sm">
                            {category?.name || 'Product'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-10">
                        <h3 className="text-2xl font-black text-brand-dark mb-4 group-hover:text-brand-red transition-colors duration-300">
                          {product.name}
                        </h3>
                        <p className="text-gray-500 text-base mb-8 line-clamp-2 font-medium min-h-[48px]">
                          {product.description || 'No description available.'}
                        </p>
                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex items-center gap-3 bg-brand-light group-hover:bg-brand-red text-brand-red group-hover:text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all duration-500 group/btn"
                        >
                          VIEW PRODUCT
                          <ArrowRight size={16} className="transform group-hover/btn:translate-x-2 transition-transform duration-500" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Dots Pagination */}
            <div className="flex justify-center gap-3 mt-12">
              {products.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${currentIndex === i ? 'bg-brand-red w-8' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">
            No products to display
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductShowcase;
