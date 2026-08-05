export default function ChatArea() {
  return (
    <main className="flex-1 flex flex-col bg-rag-background relative">
      <div className="flex-1 overflow-y-auto px-rag-gutter py-8">
        <div className="max-w-[800px] mx-auto space-y-8">
          {/* User Message */}
          <div className="flex flex-col items-end space-y-2">
            <div className="max-w-[80%] bg-rag-surface-container-lowest border border-rag-outline-variant p-4 rounded-2xl rounded-tr-none shadow-sm">
              <p className="font-rag-body-md text-rag-on-surface">Quels sont les résultats du T3 2023 ?</p>
            </div>
            <span className="text-[10px] text-rag-outline px-2">Envoyé à 14:22</span>
          </div>

          {/* Assistant Response */}
          <div className="flex flex-col items-start space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-rag-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <span className="font-rag-label-caps text-rag-label-caps text-rag-primary">RAGDoc Assistant</span>
            </div>
            <div className="max-w-[90%] bg-blue-50 border border-blue-100 p-6 rounded-2xl rounded-tl-none space-y-4">
              <p className="font-rag-body-md text-rag-on-surface leading-relaxed">
                Selon le <span className="font-bold underline decoration-rag-primary/30">Rapport Annuel 2023</span> <span className="citation-badge">1</span>, le chiffre d'affaires du troisième trimestre a augmenté de <span className="text-rag-primary font-bold">15%</span> par rapport à l'année précédente, atteignant 4.2 milliards d'euros. Cette croissance a été principalement tirée par une forte performance dans le secteur des services cloud et une expansion sur les marchés asiatiques.
              </p>

              {/* Trust Indicator */}
              <div className="flex items-center space-x-4 pt-2 border-t border-blue-200/50">
                <div className="flex items-center space-x-1 text-rag-tertiary">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-[11px] font-bold">High Confidence</span>
                </div>
                <div className="text-[11px] text-rag-outline">
                  Time to retrieve: <span className="text-rag-on-surface font-semibold">1.4s</span>
                </div>
                <div className="text-[11px] text-rag-outline">
                  Sources scanned: <span className="text-rag-on-surface font-semibold">12 docs</span>
                </div>
              </div>
            </div>

            {/* Feedback Icons */}
            <div className="flex items-center space-x-2 px-2">
              <button className="p-1 hover:bg-rag-surface-variant rounded transition-colors">
                <span className="material-symbols-outlined text-sm text-rag-outline">thumb_up</span>
              </button>
              <button className="p-1 hover:bg-rag-surface-variant rounded transition-colors">
                <span className="material-symbols-outlined text-sm text-rag-outline">thumb_down</span>
              </button>
              <button className="p-1 hover:bg-rag-surface-variant rounded transition-colors">
                <span className="material-symbols-outlined text-sm text-rag-outline">content_copy</span>
              </button>
            </div>
          </div>

          {/* Status Indicator (Searching) */}
          <div className="flex items-center space-x-3 text-rag-primary searching-pulse py-4">
            <span className="material-symbols-outlined animate-spin">cyclone</span>
            <span className="font-rag-body-sm font-semibold">Searching in documents...</span>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-rag-gutter pb-rag-gutter pt-2 bg-rag-background">
        <div className="max-w-[800px] mx-auto">
          <div className="bg-rag-surface-container-lowest border border-rag-outline-variant rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-rag-primary transition-all">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 font-rag-body-md min-h-[48px] max-h-[200px] resize-none px-4 py-2" 
              placeholder="Ask another question about your documents..."
              rows={1}
            />
            <div className="flex items-center justify-between mt-2 border-t border-rag-outline-variant/30 pt-2 px-2">
              <div className="flex space-x-1">
                <button className="p-2 hover:bg-rag-surface-variant rounded-lg text-rag-on-surface-variant transition-colors" title="Upload Document">
                  <span className="material-symbols-outlined">upload_file</span>
                </button>
                <button className="p-2 hover:bg-rag-surface-variant rounded-lg text-rag-on-surface-variant transition-colors" title="Prompt Settings">
                  <span className="material-symbols-outlined">tune</span>
                </button>
              </div>
              <button className="bg-rag-primary text-white p-2 rounded-xl flex items-center space-x-2 px-4 active:scale-95 transition-all">
                <span className="font-bold text-sm">Send</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-rag-outline mt-3">Verified by RAG Engine • Secure Enterprise AI</p>
        </div>
      </div>
    </main>
  );
}
