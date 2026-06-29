'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  X,
  Send,
  MoreVertical,
  Maximize2,
  Minimize2,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Headphones,
  Menu,
  FileText,
  Package,
  MapPin,
  Briefcase
} from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isLeadForm?: boolean;
  products?: Array<{
    id: string;
    name: string;
    sku: string;
    type: string;
    link: string;
    image?: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    description?: string;
    image?: string;
    link: string;
  }>;
}

interface ChatbotSettings {
  greetingMessage: string;
  fallbackMessage: string;
  whatsappNumber: string;
}

export default function ChatbotWidget() {
  const dragControls = useDragControls();
  const [isOpen, setIsOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [settings, setSettings] = useState<ChatbotSettings>({
    greetingMessage: 'Hi, I am Aaj Tech virtual assistant. How can I help you today?',
    fallbackMessage: "I'm sorry, I couldn't find an answer to your question. Would you like to submit an inquiry or contact us on WhatsApp?",
    whatsappNumber: '9910009227'
  });
  const [loading, setLoading] = useState(false);
  const [suggestionChips, setSuggestionChips] = useState<string[]>([
    'Show Products',
    'Submit Inquiry',
    'Connect on WhatsApp'
  ]);

  // Lead Form State
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadInquiryType, setLeadInquiryType] = useState('Product Quotation');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getApiBaseUrl = () => {
    let apiBase = 'https://aaj-tech-backend.onrender.com/api';
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        apiBase = 'https://aaj-tech-backend.onrender.com/api';
      }
    }
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      apiBase = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
    }
    return apiBase;
  };

  // Initialize Session and Fetch Settings
  useEffect(() => {
    // Session ID setup
    const storedSession = sessionStorage.getItem('chatbot_session_id');
    if (storedSession) {
      setTimeout(() => setSessionId(storedSession), 0);
    } else {
      const newSession = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('chatbot_session_id', newSession);
      setTimeout(() => setSessionId(newSession), 0);
    }

    // Fetch settings and suggestion FAQs
    const initChatbot = async () => {
      try {
        const settingsRes = await fetch('/api/admin/chatbot/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);

          // Seed initial greeting message
          setMessages([
            {
              sender: 'bot',
              text: settingsData.greetingMessage,
              timestamp: new Date()
            }
          ]);
        } else {
          setMessages([
            {
              sender: 'bot',
              text: settings.greetingMessage,
              timestamp: new Date()
            }
          ]);
        }

        setSuggestionChips(['Show Products', 'Submit Inquiry', 'Connect on WhatsApp']);
      } catch (err) {
        console.error('Chatbot init error:', err);
        setMessages([
          {
            sender: 'bot',
            text: settings.greetingMessage,
            timestamp: new Date()
          }
        ]);
      }
    };

    initChatbot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Add User Message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const API_BASE = getApiBaseUrl();
      const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          sessionId: sessionId
        })
      });

      if (res.ok) {
        const data = await res.json();

        const botMsg: Message = {
          sender: 'bot',
          text: data.reply,
          products: data.products,
          categories: data.categories,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMsg]);
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestionChips(data.suggestions);
        } else {
          setSuggestionChips([]);
        }
      } else {
        throw new Error('Chat failed');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I am facing a connection issue. Please try again or chat with us on WhatsApp.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (chip: string) => {
    if (
      chip === 'Contact WhatsApp' ||
      chip === 'Chat on WhatsApp' ||
      chip === 'Connect on WhatsApp' ||
      chip === 'Connect with WhatsApp'
    ) {
      triggerWhatsAppHandoff();
    } else if (chip === 'Submit Inquiry' || chip === 'Request a Quote') {
      // Add inline lead form message
      const botLeadMsg: Message = {
        sender: 'bot',
        text: 'Please fill out the form below to submit your inquiry directly to our sales team:',
        timestamp: new Date(),
        isLeadForm: true
      };
      setMessages(prev => [...prev, botLeadMsg]);
      setSuggestionChips([]);
    } else if (chip === 'Show Categories') {
      handleSendMessage('Show product categories');
    } else {
      handleSendMessage(chip);
    }
  };

  const triggerWhatsAppHandoff = () => {
    const defaultMsg = 'Hello, I was visiting your website and have an inquiry.';
    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(defaultMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone || !leadMessage || leadSubmitting) return;

    setLeadSubmitting(true);

    try {
      const API_BASE = getApiBaseUrl();
      const res = await fetch(`${API_BASE}/chatbot/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone,
          inquiryType: leadInquiryType,
          message: leadMessage,
          sessionId: sessionId
        })
      });

      if (res.ok) {
        setLeadSubmitted(true);
        // Add success message
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Thank you, ${leadName}! Your inquiry has been submitted successfully. Our sales team will get back to you shortly.`,
            timestamp: new Date()
          }
        ]);
        setSuggestionChips(['Ask something else', 'Products Offered', 'Chat on WhatsApp']);
      } else {
        alert('Failed to submit inquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting inquiry. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const menuOptions = [
    {
      title: 'Request a Quote',
      description: 'Get pricing for pumps & seals',
      icon: <FileText size={18} />,
      onClick: () => {
        handleSuggestionClick('Submit Inquiry');
        setIsMenuOpen(false);
      }
    },
    {
      title: 'View Catalog',
      description: 'Browse industrial categories',
      icon: <Package size={18} />,
      onClick: () => {
        handleSuggestionClick('Show Categories');
        setIsMenuOpen(false);
      }
    },
    {
      title: 'Talk to Expert',
      description: 'Connect with our engineers',
      icon: <Headphones size={18} />,
      onClick: () => {
        handleSendMessage('Connect with sales support');
        setIsMenuOpen(false);
      }
    },
    {
      title: 'Visit Office',
      description: 'Get location & directions',
      icon: <MapPin size={18} />,
      onClick: () => {
        handleSendMessage('Show office location');
        setIsMenuOpen(false);
      }
    },
    {
      title: 'WhatsApp Chat',
      description: 'Instant chat on WhatsApp',
      icon: <MessageCircle size={18} />,
      onClick: () => {
        triggerWhatsAppHandoff();
        setIsMenuOpen(false);
      }
    },
    {
      title: 'Careers',
      description: 'Explore job opportunities',
      icon: <Briefcase size={18} />,
      onClick: () => {
        window.open('/career', '_blank');
        setIsMenuOpen(false);
      }
    }
  ];

  const handleMenuClick = () => {
    setIsMenuOpen(prev => !prev);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        <motion.button
          drag
          dragMomentum={false}
          onClick={() => setIsOpen(!isOpen)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`${isOpen ? 'bg-brand-dark' : 'bg-brand-red'
            } text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative group border border-white/10 cursor-grab active:cursor-grabbing`}
          style={{ width: '60px', height: '60px' }}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
          {!isOpen && (
            <>
              <span className="absolute right-full mr-4 bg-brand-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap border border-white/5 uppercase tracking-wider">
                Chat with Assistant
              </span>
              <span className="absolute inset-0 bg-brand-red rounded-full animate-ping opacity-20 -z-10"></span>
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 80 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 80 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className={`fixed bottom-28 right-8 z-[110] bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col font-sans ${isMaximized
              ? 'w-[95vw] h-[85vh] sm:w-[600px]'
              : 'w-[92vw] sm:w-[400px] h-[550px]'
              }`}
          >
            {/* Header: Styled with red-gold gradient matching the reference image layout */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="bg-gradient-to-r from-brand-red via-brand-red to-red-800 p-5 text-white flex items-center justify-between relative border-b border-white/10 rounded-t-[32px] cursor-grab active:cursor-grabbing select-none shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shadow-lg border border-white/20 overflow-hidden shrink-0">
                  <span className="text-white font-black text-sm uppercase">AT</span>
                </div>
                <div>
                  <h3 className="font-black tracking-tight text-base leading-tight">Aaj Tech Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{"We're online!"}</span>
                  </div>
                </div>
              </div>

              {/* Header Action Icons */}
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/5"
                  title="Menu"
                  onClick={handleMenuClick}
                >
                  <MoreVertical size={15} />
                </button>
                <button
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/5"
                  title={isMaximized ? "Minimize" : "Maximize"}
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/5"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
              {messages.map((msg, index) => (
                <div key={index} className="space-y-3">
                  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex gap-2 max-w-[85%]">
                      {msg.sender === 'bot' && (
                        <div className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center shrink-0 text-[10px] border border-white/15 font-black mt-0.5 shadow-sm">
                          at
                        </div>
                      )}

                      <div className="flex flex-col space-y-1">
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed border shadow-sm ${msg.sender === 'user'
                            ? 'bg-brand-red text-white border-transparent rounded-tr-none'
                            : 'bg-white text-brand-dark border-gray-100/80 rounded-tl-none'
                            }`}
                        >
                          {msg.text}

                          {/* Product search attachment */}
                          {msg.products && msg.products.length > 0 && (
                            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                              {msg.products.map(prod => (
                                <a
                                  key={prod.id}
                                  href={prod.link}
                                  className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-brand-red/5 rounded-xl border border-gray-100 group transition-all"
                                >
                                  {prod.image ? (
                                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform duration-300"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-brand-light rounded-lg border border-gray-100 shrink-0 flex items-center justify-center text-[10px] font-black text-brand-red uppercase">
                                      {prod.name.slice(0, 2)}
                                    </div>
                                  )}
                                  <div className="text-left flex-grow min-w-0">
                                    <p className="text-xs font-black text-brand-dark group-hover:text-brand-red transition-colors line-clamp-1 truncate">
                                      {prod.name}
                                    </p>
                                    {prod.sku && <p className="text-[9px] font-bold text-gray-400">SKU: {prod.sku}</p>}
                                  </div>
                                  <ExternalLink size={12} className="text-gray-400 group-hover:text-brand-red shrink-0 mr-1" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Category attachment list */}
                          {msg.categories && msg.categories.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3">
                              {msg.categories.map(cat => (
                                <div
                                  key={cat.id}
                                  onClick={() => handleSuggestionClick(cat.name)}
                                  className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-brand-red/5 rounded-xl border border-gray-100 group cursor-pointer transition-all"
                                >
                                  {cat.image ? (
                                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center animate-fade-in">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 bg-brand-light rounded-lg border border-gray-100 shrink-0 flex items-center justify-center text-[10px] font-black text-brand-red uppercase">
                                      {cat.name.slice(0, 2)}
                                    </div>
                                  )}
                                  <div className="text-left flex-grow min-w-0">
                                    <p className="text-xs font-black text-brand-dark group-hover:text-brand-red transition-colors truncate">
                                      {cat.name}
                                    </p>
                                    {cat.description && (
                                      <p className="text-[10px] text-gray-500 truncate">
                                        {cat.description}
                                      </p>
                                    )}
                                  </div>
                                  <ExternalLink size={12} className="text-gray-400 group-hover:text-brand-red shrink-0 mr-1" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <span className={`text-[9px] font-bold text-gray-400/80 ${msg.sender === 'user' ? 'text-right' : 'text-left ml-1'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion Chips: Rendered INSIDE the chat scroll feed, matching tattoo shop layout */}
                  {index === messages.length - 1 && msg.sender === 'bot' && suggestionChips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-9 max-w-[90%] select-none">
                      {suggestionChips.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(chip)}
                          className="px-5 py-2.5 bg-white hover:bg-brand-red/5 text-brand-red hover:text-brand-red rounded-full text-xs font-bold border border-brand-red/40 hover:border-brand-red transition-all shadow-sm active:scale-95 duration-200"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline Lead Capture Form */}
                  {msg.isLeadForm && !leadSubmitted && (
                    <div className="flex justify-start ml-9 max-w-[85%]">
                      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-md w-full space-y-4">
                        {/* Form Header */}
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2 shrink-0">
                          <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-red/15 shrink-0">
                            <Headphones size={20} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-brand-dark leading-tight">Send an Inquiry</h4>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] mt-0.5">
                              Avg Response Time: 4 Hours
                            </p>
                          </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleLeadSubmit} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-0.5">
                              Full Name
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your name"
                              required
                              value={leadName}
                              onChange={e => setLeadName(e.target.value)}
                              className="w-full bg-[#F4F7FA] border-none rounded-xl py-2.5 px-3 text-xs font-bold text-brand-dark focus:ring-1 focus:ring-brand-red outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-0.5">
                              Corporate Email
                            </label>
                            <input
                              type="email"
                              placeholder="name@company.com"
                              required
                              value={leadEmail}
                              onChange={e => setLeadEmail(e.target.value)}
                              className="w-full bg-[#F4F7FA] border-none rounded-xl py-2.5 px-3 text-xs font-bold text-brand-dark focus:ring-1 focus:ring-brand-red outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-0.5">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              placeholder="+91 00000 00000"
                              required
                              value={leadPhone}
                              onChange={e => setLeadPhone(e.target.value)}
                              className="w-full bg-[#F4F7FA] border-none rounded-xl py-2.5 px-3 text-xs font-bold text-brand-dark focus:ring-1 focus:ring-brand-red outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-0.5">
                              Inquiry Type
                            </label>
                            <div className="relative">
                              <select
                                value={leadInquiryType}
                                onChange={e => setLeadInquiryType(e.target.value)}
                                className="w-full bg-[#F4F7FA] border-none rounded-xl py-2.5 px-3 text-xs font-bold text-brand-dark focus:ring-1 focus:ring-brand-red outline-none appearance-none cursor-pointer"
                              >
                                <option>Product Quotation</option>
                                <option>Technical Support</option>
                                <option>Dealership Request</option>
                                <option>Shipping & Logistics</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">
                                ▼
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-0.5">
                              Your Requirements
                            </label>
                            <textarea
                              placeholder="Tell us about your project or specific component needs..."
                              required
                              rows={3}
                              value={leadMessage}
                              onChange={e => setLeadMessage(e.target.value)}
                              className="w-full bg-[#F4F7FA] border-none rounded-xl py-2.5 px-3 text-xs font-bold text-brand-dark focus:ring-1 focus:ring-brand-red outline-none resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={leadSubmitting}
                            className="w-full bg-brand-dark text-white text-xs font-black py-3 rounded-xl hover:bg-brand-red transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-dark/10 group active:scale-[0.98] cursor-pointer"
                          >
                            {leadSubmitting ? 'Sending...' : 'Send'}
                            {!leadSubmitting && <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center shrink-0 text-[10px] border border-white/15 font-black mt-0.5 shadow-sm">
                      at
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm rounded-tl-none flex items-center gap-1 h-9">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Connect Menu Overlay */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute bottom-[84px] left-0 right-0 top-[88px] bg-white z-40 flex flex-col border-t border-gray-100"
                >
                  {/* Connect Menu Header */}
                  <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 shrink-0 animate-fade-in">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Connect</span>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Connect Menu Grid */}
                  <div className="flex-grow overflow-y-auto p-4 select-none">
                    <div className="grid grid-cols-2 gap-3">
                      {menuOptions.map((opt, i) => (
                        <button
                          key={i}
                          onClick={opt.onClick}
                          className="p-4 bg-white hover:bg-brand-red/5 border border-gray-200/60 hover:border-brand-red/40 rounded-2xl flex flex-col items-start text-left transition-all active:scale-[0.98] cursor-pointer group shadow-sm hover:shadow-md"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-red/5 group-hover:bg-brand-red/10 text-brand-red flex items-center justify-center mb-3 transition-colors shrink-0">
                            {opt.icon}
                          </div>
                          <span className="text-xs font-black text-brand-dark group-hover:text-brand-red transition-colors block mb-1">
                            {opt.title}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold leading-normal">
                            {opt.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Footer: Styled capsule matching the reference image */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0 flex flex-col items-center">
              <div className="bg-[#F4F7FA] rounded-full p-1.5 flex items-center shadow-inner w-full border border-gray-100 pl-2 pr-1.5">
                <button
                  type="button"
                  onClick={handleMenuClick}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer ${isMenuOpen
                    ? 'bg-brand-red text-white hover:bg-brand-red-hover shadow-md shadow-brand-red/20'
                    : 'bg-[#edf2f7] hover:bg-[#e2e8f0] text-[#5a6e85]'
                    }`}
                  title="Menu"
                >
                  <Menu size={16} />
                </button>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }}
                  className="flex-1 flex items-center min-w-0"
                >
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    disabled={loading}
                    className="flex-grow bg-transparent border-none py-2 px-3 text-xs font-bold text-brand-dark focus:ring-0 outline-none placeholder-gray-400 min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className="w-10 h-10 bg-brand-red hover:bg-brand-red-hover text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-red/20 transition-all shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </form>
              </div>

              <div className="mt-2 text-[9px] font-black text-gray-400/80 uppercase tracking-widest">
                Powered By <span className="text-brand-dark">Aaj Tech Trading</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
