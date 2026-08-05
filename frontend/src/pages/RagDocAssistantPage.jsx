import React from 'react';
import Sidebar from '../components/ragdoc/Sidebar';
import ChatArea from '../components/ragdoc/ChatArea';
import SourcesPanel from '../components/ragdoc/SourcesPanel';

export default function RagDocAssistantPage() {
  return (
    <div className="bg-rag-background text-rag-on-surface overflow-hidden h-screen flex flex-col font-rag-body-sm">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center h-16 px-rag-gutter w-full sticky top-0 z-50 bg-rag-surface/80 backdrop-blur-md border-b border-rag-outline-variant">
        <div className="flex items-center space-x-4">
          <span className="font-rag-headline-sm text-rag-headline-sm font-black text-rag-primary">RAGDoc-Assistant</span>
          <nav className="hidden md:flex ml-8 space-x-6">
            <a className="font-rag-label-caps text-rag-label-caps text-rag-primary border-b-2 border-rag-primary pb-2" href="#">Chat</a>
            <a className="font-rag-label-caps text-rag-label-caps text-rag-on-surface-variant hover:text-rag-primary transition-all" href="#">Sources</a>
            <a className="font-rag-label-caps text-rag-label-caps text-rag-on-surface-variant hover:text-rag-primary transition-all" href="#">Intelligence</a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-rag-stack-md">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-rag-outline">search</span>
            <input 
              className="pl-10 pr-4 py-2 bg-rag-surface-container rounded-full border-none text-rag-body-sm w-64 focus:ring-2 focus:ring-rag-primary" 
              placeholder="Search insights..." 
              type="text" 
            />
          </div>
          <button className="p-2 text-rag-on-surface-variant hover:bg-rag-surface-variant rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-rag-on-surface-variant hover:bg-rag-surface-variant rounded-full transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-rag-primary-fixed-dim flex items-center justify-center overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="User profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuArDVtPh-rmj_kDZt1_WEjtmhai-8Hvx3DfwHF3TiNHwXDUgTk-BlbyMsLISGUojmqyGLrZybzeYRdpPrxWYcqU_exvn0Q9n8dfRVwoC4SSskRmLBogL9JkDVq3_YV6u5CeoiNdTqugmBXJsgrJgXgEiuERvOIMo37_phcpdnn4YccxA1u2tdfzJyJ5KfQZ7558ZKgelhWfKDyG3Bmv2fmaEEhSpMAPpH88ljrn6Stm7AIfihfpC6fVQA" 
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatArea />
        <SourcesPanel />
      </div>
      
      {/* Background Atmospheric Effect (Shader Placeholder) */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30"></div>
    </div>
  );
}
