'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Settings,
  Bot,
  User,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  Loader2,
  FileText,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

interface Intent {
  id: string;
  intent: string;
  keywords: string[];
  response: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DocumentMeta {
  id: string;
  filename: string;
  uploadDate: string;
  size: number;
  chunkCount: number;
}

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  sessionId: string;
  fullName: string;
  messages: Array<{
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    products?: any[];
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ChatbotSettings {
  greetingMessage: string;
  fallbackMessage: string;
  whatsappNumber: string;
}

export default function ChatbotManagement() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'intents' | 'faqs' | 'conversations' | 'leads' | 'documents' | 'settings'>('dashboard');
  
  // Data States
  const [intents, setIntents] = useState<Intent[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [settings, setSettings] = useState<ChatbotSettings>({
    greetingMessage: '',
    fallbackMessage: '',
    whatsappNumber: ''
  });

  // Loading / UI States
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Forms
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General',
    keywords: ''
  });

  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState<Intent | null>(null);
  const [intentForm, setIntentForm] = useState({
    intent: '',
    keywords: '',
    response: '',
    isActive: true
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  
  // CSV Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Catalog Upload & Rebuild States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rebuildLoading, setRebuildLoading] = useState(false);

  // Format Helper: File Size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Fetch functions
  const fetchIntents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot/intents');
      if (res.ok) {
        const data = await res.json();
        setIntents(data);
      }
    } catch (err) {
      console.error('Fetch intents error:', err);
    }
  }, []);

  const fetchFAQs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (err) {
      console.error('Fetch FAQs error:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Fetch documents error:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  }, []);

  // Fetch initial data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'dashboard') {
        await Promise.all([
          fetchConversations(),
          fetchLeads(),
          fetchIntents(),
          fetchDocuments()
        ]);
      } else if (activeTab === 'intents') {
        await fetchIntents();
      } else if (activeTab === 'faqs') {
        await fetchFAQs();
      } else if (activeTab === 'leads') {
        await fetchLeads();
      } else if (activeTab === 'conversations') {
        await fetchConversations();
      } else if (activeTab === 'documents') {
        await fetchDocuments();
      } else if (activeTab === 'settings') {
        await fetchSettings();
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab, fetchIntents, fetchFAQs, fetchLeads, fetchConversations, fetchDocuments, fetchSettings]);

  // Intent CRUD Handlers
  const handleIntentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentForm.intent || !intentForm.response) return;

    setSaveLoading(true);
    const keywordsArr = intentForm.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    try {
      const method = editingIntent ? 'PUT' : 'POST';
      const url = editingIntent 
        ? `/api/admin/chatbot/intents/${editingIntent.id}`
        : '/api/admin/chatbot/intents';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intentForm.intent,
          response: intentForm.response,
          keywords: keywordsArr,
          isActive: intentForm.isActive
        })
      });

      if (res.ok) {
        setIsIntentModalOpen(false);
        setEditingIntent(null);
        setIntentForm({ intent: '', response: '', keywords: '', isActive: true });
        await fetchIntents();
      } else {
        const data = await res.json();
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditIntentClick = (item: Intent) => {
    setEditingIntent(item);
    setIntentForm({
      intent: item.intent,
      response: item.response,
      keywords: item.keywords?.join(', ') || '',
      isActive: item.isActive ?? true
    });
    setIsIntentModalOpen(true);
  };

  const handleToggleIntentActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/chatbot/intents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        await fetchIntents();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteIntentClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Intent?')) return;

    try {
      const res = await fetch(`/api/admin/chatbot/intents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchIntents();
      } else {
        alert('Failed to delete Intent');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // FAQ CRUD Handlers
  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) return;

    setSaveLoading(true);
    const keywordsArr = faqForm.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    try {
      const method = editingFaq ? 'PUT' : 'POST';
      const url = editingFaq 
        ? `/api/admin/chatbot/faqs/${editingFaq.id}`
        : '/api/admin/chatbot/faqs';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: faqForm.question,
          answer: faqForm.answer,
          category: faqForm.category,
          keywords: keywordsArr
        })
      });

      if (res.ok) {
        setIsFaqModalOpen(false);
        setEditingFaq(null);
        setFaqForm({ question: '', answer: '', category: 'General', keywords: '' });
        await fetchFAQs();
      } else {
        const data = await res.json();
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditFaqClick = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      keywords: faq.keywords?.join(', ') || ''
    });
    setIsFaqModalOpen(true);
  };

  const handleDeleteFaqClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const res = await fetch(`/api/admin/chatbot/faqs/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchFAQs();
      } else {
        alert('Failed to delete FAQ');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Bulk FAQ Upload
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setCsvLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('/api/admin/chatbot/upload-faqs', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'CSV Imported successfully');
        setCsvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchFAQs();
      } else {
        alert(data.message || 'CSV Import failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to import CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  // Lead CRUD Handlers
  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/chatbot/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
        await fetchLeads();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLeadClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead capture record?')) return;

    try {
      const res = await fetch(`/api/admin/chatbot/leads/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedLead(null);
        await fetchLeads();
      } else {
        alert('Failed to delete lead');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Conversation Log Handler
  const handleDeleteConvoClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation history?')) return;

    try {
      const res = await fetch(`/api/admin/chatbot/conversations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedConvo(null);
        await fetchConversations();
      } else {
        alert('Failed to delete conversation');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Save Handler
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const res = await fetch('/api/admin/chatbot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        alert('Settings saved successfully!');
        await fetchSettings();
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Document Management Handlers
  const handlePdfUpload = async () => {
    if (!pdfFile || pdfLoading) return;
    setPdfLoading(true);
    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const res = await fetch('/api/admin/chatbot/upload-pdf', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'PDF Catalog uploaded and indexed successfully!');
        setPdfFile(null);
        await fetchDocuments();
      } else {
        alert(data.message || 'Failed to upload PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This will clear its indexes and trigger a complete vector DB rebuild.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chatbot/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Catalog PDF deleted and vector database rebuilt.');
        await fetchDocuments();
      } else {
        alert('Failed to delete document');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRebuildEmbeddings = async () => {
    if (rebuildLoading) return;
    if (!confirm('Rebuilding embeddings will clear and re-index your entire RAG search database. This may take a few moments. Proceed?')) return;
    
    setRebuildLoading(true);
    try {
      const res = await fetch('/api/admin/chatbot/rebuild', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Vector embeddings rebuilt successfully!');
      } else {
        alert(data.message || 'Failed to rebuild vector store');
      }
    } catch (err) {
      console.error(err);
      alert('Error rebuilding vector database');
    } finally {
      setRebuildLoading(false);
    }
  };

  // Filtering Lists
  const filteredIntents = intents.filter(item => 
    item.intent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(lead =>
    lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.inquiryType && lead.inquiryType.toLowerCase().includes(searchQuery.toLowerCase())) ||
    lead.phone.includes(searchQuery)
  );

  const filteredConversations = conversations.filter(convo =>
    convo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    convo.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-dark mb-2 tracking-tight">Chatbot Management</h1>
          <p className="text-gray-400 font-bold">Configure responses, intents, FAQs, analyze chat histories, leads, and catalog embeddings.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-6 pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'intents', label: 'Intents' },
          { id: 'faqs', label: 'FAQs & CSV' },
          { id: 'conversations', label: 'Conversations' },
          { id: 'leads', label: 'Leads' },
          { id: 'documents', label: 'Documents' },
          { id: 'settings', label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
            className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-brand-red text-brand-red' 
                : 'border-transparent text-gray-400 hover:text-brand-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Data...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Sessions', count: conversations.length, label: 'Chat logs saved', icon: MessageSquare, color: 'text-blue-500 bg-blue-50 border-blue-100' },
                  { title: 'Total Leads', count: leads.length, label: 'Enquiries captured', icon: FileSpreadsheet, color: 'text-green-500 bg-green-50 border-green-100' },
                  { title: 'Active Intents', count: intents.filter(i => i.isActive).length, label: 'Intent rules active', icon: Bot, color: 'text-brand-red bg-brand-red/5 border-brand-red/10' },
                  { title: 'Tracked PDFs', count: documents.length, label: 'Catalog resources', icon: FileText, color: 'text-purple-500 bg-purple-50 border-purple-100' }
                ].map((card, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.title}</p>
                      <h2 className="text-3xl font-black text-brand-dark tracking-tight">{card.count}</h2>
                      <p className="text-[10px] text-gray-400 font-bold">{card.label}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${card.color}`}>
                      <card.icon size={22} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activities Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Recent Leads */}
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-brand-dark flex items-center gap-2 border-b border-gray-50 pb-4">
                    <TrendingUp size={20} className="text-brand-red" /> Recent Leads
                  </h3>
                  {leads.length === 0 ? (
                    <p className="text-gray-400 font-medium text-sm text-center py-6">No leads captured yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {leads.slice(0, 3).map(lead => (
                        <div key={lead.id} className="py-4 flex justify-between items-center group cursor-pointer" onClick={() => { setActiveTab('leads'); setSelectedLead(lead); }}>
                          <div>
                            <p className="font-black text-sm text-brand-dark group-hover:text-brand-red transition-colors">{lead.fullName}</p>
                            <p className="text-xs text-gray-400 font-bold">{lead.email} | {lead.phone}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            {lead.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Conversations */}
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-brand-dark flex items-center gap-2 border-b border-gray-50 pb-4">
                    <MessageSquare size={20} className="text-brand-red" /> Recent Active Sessions
                  </h3>
                  {conversations.length === 0 ? (
                    <p className="text-gray-400 font-medium text-sm text-center py-6">No conversation logs yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {conversations.slice(0, 3).map(convo => (
                        <div key={convo.id} className="py-4 flex justify-between items-center group cursor-pointer" onClick={() => { setActiveTab('conversations'); setSelectedConvo(convo); }}>
                          <div>
                            <p className="font-black text-sm text-brand-dark group-hover:text-brand-red transition-colors">{convo.fullName}</p>
                            <p className="text-xs text-gray-400 font-bold">{convo.messages.length} messages | Session: {convo.sessionId.substring(0, 8)}...</p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <Clock size={11} /> {new Date(convo.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: INTENTS */}
          {activeTab === 'intents' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search intents by name, keywords, response..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingIntent(null);
                    setIntentForm({ intent: '', response: '', keywords: '', isActive: true });
                    setIsIntentModalOpen(true);
                  }}
                  className="bg-brand-red hover:bg-brand-dark text-white font-black px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all w-full md:w-auto shrink-0 uppercase tracking-wider text-xs"
                >
                  <Plus size={16} /> Add Intent Rule
                </button>
              </div>

              {/* List */}
              {filteredIntents.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <Bot size={48} className="mx-auto text-gray-200 mb-6" />
                  <h3 className="text-xl font-black text-brand-dark mb-2">No Intents defined</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Define quick intent response rules to capture basic greetings or standard FAQs instantly.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredIntents.map(item => (
                    <div
                      key={item.id}
                      className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            item.isActive 
                              ? 'bg-green-50 text-green-600 border-green-100' 
                              : 'bg-gray-100 text-gray-500 border-transparent'
                          }`}>
                            {item.isActive ? 'Active' : 'Disabled'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleIntentActive(item.id, item.isActive)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                item.isActive
                                  ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                  : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {item.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleEditIntentClick(item)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteIntentClick(item.id)}
                              className="p-2 hover:bg-red-50 text-brand-red rounded-lg transition-colors border border-transparent hover:border-red-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-black text-brand-dark text-lg mb-1 leading-tight">Intent: {item.intent}</h4>
                        <p className="text-gray-500 font-medium text-xs leading-relaxed mb-4">Reply: {item.response}</p>
                      </div>

                      {item.keywords && item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-t border-gray-50 pt-4 mt-auto">
                          {item.keywords.map((kw, i) => (
                            <span key={i} className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FAQs */}
          {activeTab === 'faqs' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Search */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search FAQs by question, answer or category..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingFaq(null);
                      setFaqForm({ question: '', answer: '', category: 'General', keywords: '' });
                      setIsFaqModalOpen(true);
                    }}
                    className="bg-brand-red hover:bg-brand-dark text-white font-black px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all w-full md:w-auto shrink-0 uppercase tracking-wider text-xs"
                  >
                    <Plus size={16} /> Add FAQ
                  </button>
                </div>

                {/* CSV Import */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                  <h3 className="font-black text-brand-dark mb-1 text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-brand-red" /> Bulk Import FAQs (CSV)
                  </h3>
                  <p className="text-gray-400 text-[10px] font-bold mb-4">Required header format: Question, Answer, Category, Keywords</p>
                  
                  <form onSubmit={handleCsvUpload} className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      required
                      onChange={e => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <label
                      htmlFor="csv-file-input"
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-brand-dark font-bold text-xs p-3 rounded-xl border border-dashed border-gray-200 text-center cursor-pointer transition-all truncate"
                    >
                      {csvFile ? csvFile.name : 'Choose CSV File'}
                    </label>
                    <button
                      type="submit"
                      disabled={!csvFile || csvLoading}
                      className="bg-brand-dark hover:bg-brand-red text-white font-black p-3.5 rounded-xl transition-all shrink-0 disabled:opacity-30"
                    >
                      {csvLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    </button>
                  </form>
                </div>
              </div>

              {/* FAQs Listing */}
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <HelpCircle size={48} className="mx-auto text-gray-200 mb-6" />
                  <h3 className="text-xl font-black text-brand-dark mb-2">No FAQs defined</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Click Add FAQ or import a CSV file to seed customer assistant responses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredFaqs.map(faq => (
                    <div
                      key={faq.id}
                      className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-brand-red/5 text-brand-red rounded-full border border-brand-red/10">
                            {faq.category || 'General'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFaqClick(faq)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteFaqClick(faq.id)}
                              className="p-2 hover:bg-red-50 text-brand-red rounded-lg transition-colors border border-transparent hover:border-red-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-black text-brand-dark text-base mb-2 leading-tight">Q: {faq.question}</h4>
                        <p className="text-gray-500 font-medium text-xs leading-relaxed mb-4">A: {faq.answer}</p>
                      </div>

                      {faq.keywords && faq.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-t border-gray-50 pt-4 mt-auto">
                          {faq.keywords.map((kw, i) => (
                            <span key={i} className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: CONVERSATIONS HISTORY */}
          {activeTab === 'conversations' && (
            <>
              {/* Search Bar */}
              <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search conversations by user name or session ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none"
                  />
                </div>
              </div>

              {/* Conversations Listing */}
              {filteredConversations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <MessageSquare size={48} className="mx-auto text-gray-200 mb-6" />
                  <h3 className="text-xl font-black text-brand-dark mb-2">No active sessions</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Conversations initiated by visitors will appear here for review.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConversations.map(convo => (
                    <div
                      key={convo.id}
                      className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            ID: {convo.sessionId.substring(0, 10)}...
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 font-bold">
                            <Clock size={12} /> {new Date(convo.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-black text-brand-dark text-base mb-1">{convo.fullName || 'Anonymous User'}</h4>
                        <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest border-b border-gray-50 pb-2">
                          {convo.messages.length} Messages
                        </p>
                        
                        {convo.messages.length > 0 && (
                          <div className="space-y-2 text-xs">
                            <p className="text-gray-400 truncate">
                              <span className="font-black text-brand-dark">User:</span> {
                                convo.messages.slice().reverse().find(m => m.sender === 'user')?.text || 'None'
                              }
                            </p>
                            <p className="text-gray-400 truncate">
                              <span className="font-black text-brand-red">Bot:</span> {
                                convo.messages.slice().reverse().find(m => m.sender === 'bot')?.text || 'None'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                        <button
                          onClick={() => handleDeleteConvoClick(convo.id)}
                          className="text-gray-400 hover:text-brand-red p-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                          title="Delete Session Log"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedConvo(convo)}
                          className="flex items-center text-brand-red font-black text-[11px] uppercase tracking-widest gap-1 group"
                        >
                          View Transcript <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: LEADS LIST */}
          {activeTab === 'leads' && (
            <>
              {/* Search Bar */}
              <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search chatbot leads by name, email, phone or inquiry type..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none"
                  />
                </div>
              </div>

              {/* Leads Table */}
              {filteredLeads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <FileSpreadsheet size={48} className="mx-auto text-gray-200 mb-6" />
                  <h3 className="text-xl font-black text-brand-dark mb-2">No leads captured</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Leads captured from the public chatbot widget will display here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Visitor Info</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Inquiry Type</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Message</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredLeads.map(lead => (
                          <tr
                            key={lead.id}
                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-3">
                                <Clock size={16} className="text-gray-300" />
                                <span className="text-sm font-bold text-brand-dark">
                                  {new Date(lead.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div>
                                <p className="font-black text-brand-dark group-hover:text-brand-red transition-colors">{lead.fullName}</p>
                                <p className="text-xs font-bold text-gray-400">{lead.email}</p>
                                <p className="text-xs font-bold text-gray-400">{lead.phone}</p>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <span className="text-xs font-black text-brand-dark uppercase tracking-wide">
                                {lead.inquiryType || 'General Enquiry'}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <p className="text-sm font-medium text-gray-500 line-clamp-1 max-w-xs">{lead.message}</p>
                            </td>
                            <td className="px-6 py-6">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                lead.status === 'New' ? 'bg-blue-50 text-blue-600' :
                                lead.status === 'In Progress' ? 'bg-orange-50 text-orange-600' :
                                lead.status === 'Replied' ? 'bg-green-50 text-green-600' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteLeadClick(lead.id); }}
                                className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                                title="Delete Lead Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB: DOCUMENTS / PDF CATALOGS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Search Catalogs */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search catalog files by filename..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none"
                    />
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                  <h3 className="font-black text-brand-dark mb-1 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Upload size={15} className="text-brand-red" /> Upload PDF Catalog
                  </h3>
                  <p className="text-gray-400 text-[10px] font-bold mb-4">Supported formats: PDF catalogs/datasheets only.</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="pdf-document-input"
                    />
                    <label
                      htmlFor="pdf-document-input"
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-brand-dark font-bold text-xs p-3.5 rounded-xl border border-dashed border-gray-200 text-center cursor-pointer transition-all truncate flex items-center justify-center h-11"
                    >
                      {pdfFile ? pdfFile.name : 'Select PDF file'}
                    </label>
                    <button
                      type="button"
                      onClick={handlePdfUpload}
                      disabled={!pdfFile || pdfLoading}
                      className="bg-brand-dark hover:bg-brand-red text-white font-black p-3 rounded-xl transition-all shrink-0 disabled:opacity-30 h-11 flex items-center justify-center"
                    >
                      {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Documents Listing */}
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <FileText size={48} className="mx-auto text-gray-200 mb-6" />
                  <h3 className="text-xl font-black text-brand-dark mb-2">No documents indexed</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Upload catalog PDF files here to allow local RAG engine to parse and answer queries using their pages.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Filename</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Upload Date</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">File Size</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">RAG Text Chunks</th>
                          <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredDocuments.map(doc => (
                          <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-3">
                                <FileText className="text-brand-red shrink-0" size={18} />
                                <span className="text-sm font-black text-brand-dark">{doc.filename}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <span className="text-xs font-bold text-gray-400">
                                {new Date(doc.uploadDate).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <span className="text-xs font-bold text-gray-500">
                                {formatBytes(doc.size)}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <span className="text-xs font-bold text-brand-dark bg-brand-red/5 text-brand-red px-2.5 py-1 rounded-md border border-brand-red/10">
                                {doc.chunkCount} chunks
                              </span>
                            </td>
                            <td className="px-6 py-6 text-right">
                              <button
                                onClick={() => handleDeleteDocument(doc.filename)}
                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                title="Delete Document & Index"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 lg:p-10">
              <form onSubmit={handleSettingsSubmit} className="space-y-8">
                
                {/* System response config */}
                <div className="border-b border-gray-100 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-red/5 text-brand-red rounded-xl flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-brand-dark text-lg">System Responses</h3>
                    <p className="text-gray-400 text-xs font-bold">Configure chatbot conversational replies and links.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Greeting message */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-dark uppercase tracking-widest">Greeting Message *</label>
                    <textarea
                      required
                      rows={3}
                      value={settings.greetingMessage}
                      onChange={e => setSettings(prev => ({ ...prev, greetingMessage: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none resize-none text-sm"
                      placeholder="Welcome greeting when widget is opened"
                    />
                  </div>

                  {/* Fallback response */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-dark uppercase tracking-widest">Fallback Response *</label>
                    <textarea
                      required
                      rows={3}
                      value={settings.fallbackMessage}
                      onChange={e => setSettings(prev => ({ ...prev, fallbackMessage: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none resize-none text-sm"
                      placeholder="Triggered when no matching FAQ or product is found"
                    />
                  </div>

                  {/* WhatsApp number */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-dark uppercase tracking-widest">WhatsApp Handoff Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        required
                        value={settings.whatsappNumber}
                        onChange={e => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red transition-all outline-none text-sm"
                        placeholder="e.g. 9910009227"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold">Include country code without special characters (e.g. 919910009227 for India).</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full bg-brand-red hover:bg-brand-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-brand-red/15 uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer h-12"
                >
                  {saveLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save System Settings'}
                </button>

              </form>

              {/* Rebuild Vector Database */}
              <div className="border-t border-gray-100 pt-8 mt-8 border-b border-gray-100 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-red/5 text-brand-red rounded-xl flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-black text-brand-dark text-lg">RAG Knowledge Base Rebuild</h3>
                  <p className="text-gray-400 text-xs font-bold">Reconstruct local vector embeddings from catalog PDFs and store products.</p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                  <div>
                    <h4 className="font-black text-sm text-brand-dark">Rebuild Vector Embeddings</h4>
                    <p className="text-xs text-gray-400 font-bold mt-1 leading-relaxed">
                      Clears and reconstructs the ChromaDB database indexes using updated product specs, categories, blogs, and uploaded PDF document catalogs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRebuildEmbeddings}
                    disabled={rebuildLoading}
                    className="bg-brand-red hover:bg-brand-dark text-white font-black px-6 py-3 rounded-xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-brand-red/10 cursor-pointer h-11"
                  >
                    {rebuildLoading ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
                    Rebuild Vector DB
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* INTENT ADD/EDIT DIALOG MODAL */}
      <AnimatePresence>
        {isIntentModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIntentModalOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[32px] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                <h3 className="text-2xl font-black text-brand-dark">{editingIntent ? 'Edit Intent Rule' : 'Create Intent Rule'}</h3>
                <button
                  onClick={() => setIsIntentModalOpen(false)}
                  className="text-gray-400 hover:text-brand-dark p-1 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleIntentSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intent Name (Category) *</label>
                  <input
                    type="text"
                    required
                    value={intentForm.intent}
                    onChange={e => setIntentForm(prev => ({ ...prev, intent: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red outline-none text-sm"
                    placeholder="e.g. Contact details"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trigger Keywords (comma-separated) *</label>
                  <input
                    type="text"
                    required
                    value={intentForm.keywords}
                    onChange={e => setIntentForm(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red outline-none text-sm"
                    placeholder="e.g. contact, address, office, mobile, phone number"
                  />
                  <p className="text-[9px] text-gray-400 font-bold ml-1">If the user inputs any of these words, this response triggers instantly.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bot Response Text *</label>
                  <textarea
                    required
                    rows={4}
                    value={intentForm.response}
                    onChange={e => setIntentForm(prev => ({ ...prev, response: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red outline-none resize-none text-sm"
                    placeholder="bot answer reply message"
                  />
                </div>

                <div className="flex items-center gap-3 py-2 border-t border-gray-50 mt-4">
                  <input
                    type="checkbox"
                    id="intent-active-checkbox"
                    checked={intentForm.isActive}
                    onChange={e => setIntentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4.5 h-4.5 rounded border-gray-300 text-brand-red focus:ring-brand-red outline-none cursor-pointer"
                  />
                  <label htmlFor="intent-active-checkbox" className="text-xs font-black text-brand-dark uppercase tracking-wide cursor-pointer select-none">
                    Enable intent immediately
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full bg-brand-dark hover:bg-brand-red text-white font-black py-4 rounded-xl transition-all shadow-md shadow-brand-dark/15 uppercase tracking-wider text-xs flex items-center justify-center gap-1 mt-4 cursor-pointer"
                >
                  {saveLoading ? <Loader2 size={16} className="animate-spin" /> : editingIntent ? 'Save Intent Rule' : 'Create Intent Rule'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAQ ADD/EDIT DIALOG MODAL */}
      <AnimatePresence>
        {isFaqModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFaqModalOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[32px] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                <h3 className="text-2xl font-black text-brand-dark">{editingFaq ? 'Edit FAQ Item' : 'Create FAQ Item'}</h3>
                <button
                  onClick={() => setIsFaqModalOpen(false)}
                  className="text-gray-400 hover:text-brand-dark p-1 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleFaqSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question *</label>
                  <input
                    type="text"
                    required
                    value={faqForm.question}
                    onChange={e => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red outline-none text-sm"
                    placeholder="User question (e.g. Do you ship internationally?)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Answer *</label>
                  <textarea
                    required
                    rows={4}
                    value={faqForm.answer}
                    onChange={e => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red outline-none resize-none text-sm"
                    placeholder="Auto response content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <select
                      value={faqForm.category}
                      onChange={e => setFaqForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-gray-500 focus:ring-2 focus:ring-brand-red outline-none cursor-pointer text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Products">Products</option>
                      <option value="Shipping & Delivery">Shipping & Delivery</option>
                      <option value="Support">Support</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keywords</label>
                    <input
                      type="text"
                      value={faqForm.keywords}
                      onChange={e => setFaqForm(prev => ({ ...prev, keywords: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-brand-dark focus:ring-2 focus:ring-brand-red outline-none text-sm"
                      placeholder="comma-separated tags"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full bg-brand-dark hover:bg-brand-red text-white font-black py-4 rounded-xl transition-all shadow-md shadow-brand-dark/15 uppercase tracking-wider text-xs flex items-center justify-center gap-1 mt-4 cursor-pointer"
                >
                  {saveLoading ? <Loader2 size={16} className="animate-spin" /> : editingFaq ? 'Save Changes' : 'Create FAQ'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LEAD DETAILS DRAWER MODAL */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white z-[210] shadow-2xl p-8 lg:p-12 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-red/5 text-brand-red rounded-2xl flex items-center justify-center">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark">Chatbot Lead Detail</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {selectedLead.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-l-2 border-brand-red pl-4">Visitor Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400">Full Name</span>
                      <span className="text-sm font-black text-brand-dark">{selectedLead.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400">Email Address</span>
                      <span className="text-sm font-black text-brand-dark">{selectedLead.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400">Phone Number</span>
                      <span className="text-sm font-black text-brand-dark">{selectedLead.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400">Inquiry Type</span>
                      <span className="text-sm font-black text-brand-red uppercase tracking-wider">{selectedLead.inquiryType || 'General Inquiry'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400">Submission Date</span>
                      <span className="text-sm font-black text-brand-dark">
                        {new Date(selectedLead.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded-xl text-sm font-black text-brand-dark hover:border-brand-red transition-all h-11"
                    >
                      <Mail size={16} className="text-brand-red" /> Email
                    </a>
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded-xl text-sm font-black text-brand-dark hover:border-brand-red transition-all h-11"
                    >
                      <Phone size={16} className="text-brand-red" /> Call
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-l-2 border-brand-red pl-4">Lead Requirements</h3>
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl">
                    <p className="text-gray-500 font-medium leading-relaxed text-sm">
                      {selectedLead.message}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-l-2 border-brand-red pl-4">Internal Actions</h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateLeadStatus(selectedLead.id, 'In Progress')}
                        disabled={selectedLead.status === 'In Progress'}
                        className="flex-1 bg-brand-dark hover:bg-brand-red text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 h-11 cursor-pointer"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateLeadStatus(selectedLead.id, 'Replied')}
                        disabled={selectedLead.status === 'Replied'}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 h-11 cursor-pointer"
                      >
                        Mark Replied
                      </button>
                    </div>

                    <button
                      onClick={() => handleUpdateLeadStatus(selectedLead.id, 'Closed')}
                      disabled={selectedLead.status === 'Closed'}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider border border-gray-200 transition-all disabled:opacity-40 h-11 cursor-pointer"
                    >
                      Close Lead
                    </button>

                    <button
                      onClick={() => handleDeleteLeadClick(selectedLead.id)}
                      className="w-full bg-red-50 hover:bg-red-100 text-brand-red py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 h-11 cursor-pointer border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={14} /> Delete Lead Record
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONVERSATION TRANSCRIPT DRAWER MODAL */}
      <AnimatePresence>
        {selectedConvo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedConvo(null)}
              className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white z-[210] shadow-2xl p-8 lg:p-12 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-red/5 text-brand-red rounded-xl flex items-center justify-center">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-brand-dark">Chat Session Transcript</h2>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Session: {selectedConvo.sessionId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex justify-between items-center text-xs text-gray-400 font-bold border border-gray-100">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-brand-dark" />
                    <span className="font-black text-brand-dark">{selectedConvo.fullName || 'Anonymous User'}</span>
                  </div>
                  <div>
                    Started: {new Date(selectedConvo.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Chat transcript bubble thread */}
                <div className="space-y-4 max-h-[55vh] overflow-y-auto p-4 border border-gray-100 bg-gray-50/20 rounded-2xl">
                  {selectedConvo.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-brand-red text-white font-medium rounded-tr-none'
                            : 'bg-white text-brand-dark border border-gray-100 shadow-sm rounded-tl-none font-medium'
                        }`}
                      >
                        <p>{msg.text}</p>
                        
                        {/* Suggested products */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="mt-2 space-y-1.5 border-t border-gray-50 pt-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Suggested Products:</p>
                            {msg.products.map((p, idx) => (
                              <div key={idx} className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-brand-dark truncate flex items-center justify-between">
                                {p.name}
                                <ChevronRight size={10} className="text-brand-red" />
                              </div>
                            ))}
                          </div>
                        )}
                        <p className={`text-[8px] text-right mt-1.5 font-bold ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteConvoClick(selectedConvo.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-brand-red py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 h-11 border border-transparent hover:border-red-100 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Session Log
                </button>
                <button
                  onClick={() => setSelectedConvo(null)}
                  className="w-full bg-brand-dark hover:bg-brand-red text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all h-11 cursor-pointer"
                >
                  Close Transcript Viewer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
