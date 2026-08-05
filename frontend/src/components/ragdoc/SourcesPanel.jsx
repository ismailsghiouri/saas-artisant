export default function SourcesPanel() {
  return (
    <aside className="w-[320px] h-full border-l border-rag-outline-variant bg-rag-surface flex flex-col">
      <div className="p-rag-gutter border-b border-rag-outline-variant flex items-center justify-between">
        <h2 className="font-rag-headline-md text-sm font-bold uppercase tracking-widest text-rag-on-surface">Sources Citées</h2>
        <span className="bg-rag-tertiary-container text-rag-on-tertiary-container px-2 py-0.5 rounded text-[10px] font-bold">1 Document Found</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source Card [1] */}
        <div className="group border-l-4 border-rag-tertiary bg-rag-surface-container-lowest border-y border-r border-rag-outline-variant rounded-r-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 flex items-center justify-center bg-rag-tertiary text-white text-[10px] font-bold rounded">1</span>
              <h4 className="font-rag-body-sm font-bold text-rag-on-surface truncate max-w-[150px]">Rapport Annuel 2023</h4>
            </div>
            <span className="text-[10px] font-bold text-rag-tertiary bg-rag-tertiary-container/20 px-1.5 py-0.5 rounded">98% Rel.</span>
          </div>
          <p className="font-rag-code-sm text-rag-code-sm text-rag-on-surface-variant line-clamp-4 leading-relaxed mb-4 p-2 bg-rag-surface rounded border border-rag-outline-variant/10 italic">
            "...les résultats du troisième trimestre montrent une résilience opérationnelle avec un chiffre d'affaires consolidé en hausse de 15%. Cette dynamique est soutenue par l'adoption massive de nos solutions d'intelligence documentaire..."
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rag-outline font-semibold uppercase">Page 12 • PDF</span>
            <button className="text-rag-primary font-bold text-[11px] flex items-center hover:underline">
              View Document
              <span className="material-symbols-outlined text-xs ml-1">open_in_new</span>
            </button>
          </div>
        </div>

        {/* Empty state for secondary visual density */}
        <div className="p-8 border border-dashed border-rag-outline-variant rounded-xl flex flex-col items-center justify-center opacity-40">
          <span className="material-symbols-outlined text-3xl mb-2">find_in_page</span>
          <p className="text-xs font-medium text-center">Reference metadata will appear here during analysis</p>
        </div>
      </div>
      <div className="p-4 bg-rag-surface-container-low border-t border-rag-outline-variant">
        <div className="flex items-center justify-between text-xs text-rag-outline mb-2">
          <span>Processing Engine:</span>
          <span className="text-rag-on-surface font-semibold">Titan-v4.2</span>
        </div>
        <div className="w-full bg-rag-outline-variant h-1 rounded-full overflow-hidden">
          <div className="bg-rag-tertiary h-full w-[85%]"></div>
        </div>
      </div>
    </aside>
  );
}
