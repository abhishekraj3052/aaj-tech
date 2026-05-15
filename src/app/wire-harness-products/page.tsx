'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const WireHarnessProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/harness/');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching harness products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  } as const;

  return (
    <div className="bg-white min-h-screen">
      {/* Banner Section */}
      <section className="relative bg-brand-red pt-40 pb-24 overflow-hidden mt-16 lg:mt-0">
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-30 pointer-events-none">
           <Image
             src="/Wire to board Assemblies.webp"
             alt="Wire Harness Background"
             fill
             className="object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-brand-red/80 to-transparent" />
        </div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">Products</h1>
            <div className="flex items-center gap-2 text-white/80 font-bold text-xs md:text-sm tracking-widest uppercase">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={14} />
              <Link href="/about-wire-harness" className="hover:text-white transition-colors">Wire Harness</Link>
              <ChevronRight size={14} />
              <span className="text-white">Products</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="relative py-24 bg-white z-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div {...fadeInUp} className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-8 tracking-tight">
              Wire Harness Solutions You Can Trust
            </h2>
            <div className="space-y-6 text-gray-600 text-xl leading-relaxed font-medium max-w-5xl">
              <p>
                At <span className="text-brand-red font-black">Aaj Tech Trading Corporation</span>, we understand that every client has unique wire requirements. Therefore, every wire harness solution we offer is tailored to meet your exact technical specifications, connector configurations, and environmental conditions.
              </p>
              <p>
                Whether you need high-performance signal transmission, power delivery, or specialized shielding, our flexible approach and in-house engineering support ensure your assemblies are built for durability, precision, and compliance — every time.
              </p>
              <p className="text-brand-dark font-bold pt-4">
                We offer a range of specialized categories of wire harnesses to support diverse industries and functions:
              </p>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[40px]">
              <h3 className="text-2xl font-black text-brand-dark mb-4">No products found</h3>
              <p className="text-gray-400">Please check back later for updates to our catalog.</p>
            </div>
          ) : (
            <div className="space-y-32">
              {products.map((product, index) => (
                <div key={product.id} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}>
                  <motion.div 
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-1/2"
                  >
                    <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden bg-[#f4f4f4] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 group cursor-pointer">
                      <Image
                        src={product.image?.startsWith('http') ? product.image : (product.image?.startsWith('/uploads/') ? `http://localhost:8000${product.image}` : (product.image || "/Wire to board Assemblies.webp"))}
                        alt={product.title}
                        fill
                        unoptimized
                        className="object-contain p-8 mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                        <Link 
                          href="/contact"
                          className="bg-brand-red text-white px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl hover:bg-white hover:text-brand-red"
                        >
                          Contact Us
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-1/2 space-y-8 text-gray-700 text-lg"
                  >
                    <h3 className="text-4xl font-black text-brand-dark mb-8">{product.title}</h3>
                    
                    <div className="space-y-6">
                      {product.applications && (
                        <div>
                          <strong className="text-brand-dark font-black text-xl">Applications:</strong> 
                          <span className="font-medium ml-2 text-gray-600">{product.applications}</span>
                        </div>
                      )}
                      
                      {product.details && (
                        <div>
                          <strong className="text-brand-dark font-black text-xl">Details:</strong> 
                          <span className="font-medium ml-2 text-gray-600">{product.details}</span>
                        </div>
                      )}
                      
                      {product.variants && product.variants.length > 0 && (
                        <div className="bg-gray-50 p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
                          <strong className="text-brand-dark font-black text-xl mb-6 block">Variants:</strong>
                          <ul className="space-y-4 font-medium text-gray-600">
                            {product.variants.map((variant: string, i: number) => (
                              <li key={i} className="flex items-start gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-red mt-2.5 flex-shrink-0"></div> 
                                <span>{variant}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default WireHarnessProductsPage;
