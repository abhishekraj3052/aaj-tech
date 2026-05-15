'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamic import for libraries that require browser environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HTMLFlipBook: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any;

interface FlipbookProps {
  pdfUrl: string;
}

const Flipbook: React.FC<FlipbookProps> = ({ pdfUrl }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const loadLibs = async () => {
      if (typeof window !== 'undefined') {
        const pageFlipMod = await import('react-pageflip');
        const pdfjsMod = await import('pdfjs-dist');
        HTMLFlipBook = pageFlipMod.default;
        pdfjsLib = pdfjsMod;
        
        // Set worker path - Using unpkg for better reliability with v5.x
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';
        
        setLibsLoaded(true);
      }
    };
    loadLibs();
  }, []);

  useEffect(() => {
    const loadPdf = async () => {
      if (!libsLoaded || !pdfUrl) return;
      
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const pageImages: string[] = [];

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
          }
        }
        setPages(pageImages);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl, libsLoaded]);

  if (!libsLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-gray-50 rounded-[3rem] border border-gray-100">
        <Loader2 className="w-12 h-12 text-brand-red animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Preparing Your Catalog...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col items-center justify-center relative ${isFullscreen ? 'bg-gray-100 p-8 overflow-hidden' : ''}`}>
      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className={`absolute z-50 w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-brand-dark hover:text-brand-red transition-all ${isFullscreen ? 'top-8 right-8' : 'top-0 right-0 -translate-y-12 md:-translate-y-0 md:top-0 md:-right-16'}`}
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      <div className="relative group max-w-full overflow-hidden px-4 md:px-0 flex-grow flex items-center justify-center">
        <HTMLFlipBook
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={420}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onFlip={(e: any) => setCurrentPage(e.data)}
          className="shadow-2xl rounded-lg"
          ref={flipBookRef}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={false}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((image, index) => (
            <div key={index} className="bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`Page ${index + 1}`} className="w-full h-full object-contain shadow-inner" />
            </div>
          ))}
        </HTMLFlipBook>

        {/* Controls */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 hidden md:block z-10">
           <button 
             onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
             className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-dark hover:text-brand-red transition-all"
           >
             <ChevronLeft size={32} />
           </button>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 hidden md:block z-10">
           <button 
             onClick={() => flipBookRef.current?.pageFlip().flipNext()}
             className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-dark hover:text-brand-red transition-all"
           >
             <ChevronRight size={32} />
           </button>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-8">
        <div className="text-sm font-black text-brand-dark uppercase tracking-widest">
          Page <span className="text-brand-red">{currentPage + 1}</span> of {pages.length}
        </div>
        <div className="h-1 w-32 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand-red"
            initial={{ width: 0 }}
            animate={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Flipbook;

