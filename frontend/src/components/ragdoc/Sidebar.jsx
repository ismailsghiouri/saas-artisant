export default function Sidebar() {
  return (
    <aside className="flex flex-col h-full border-r border-rag-outline-variant bg-rag-surface-container-low w-rag-sidebar-width flex-shrink-0">
      <div className="p-4 border-b border-rag-outline-variant">
        <button className="w-full bg-rag-primary text-rag-on-primary py-3 px-4 rounded-xl font-rag-body-md flex items-center justify-center space-x-2 active:scale-95 duration-150 shadow-sm">
          <span className="material-symbols-outlined">add_comment</span>
          <span>New Chat</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2">
          <h3 className="font-rag-label-caps text-rag-label-caps text-rag-outline uppercase tracking-wider">Recents</h3>
        </div>
        <div className="space-y-1">
          <div className="px-4 py-3 bg-rag-surface-variant border-l-4 border-rag-primary cursor-pointer">
            <p className="font-rag-body-sm text-rag-on-surface font-bold truncate">Q3 2023 Results Analysis</p>
            <p className="text-xs text-rag-outline mt-1">2 hours ago</p>
          </div>
          <div className="px-4 py-3 hover:bg-rag-surface-variant transition-colors cursor-pointer group">
            <p className="font-rag-body-sm text-rag-on-surface-variant group-hover:text-rag-on-surface truncate">Legal Compliance Check</p>
            <p className="text-xs text-rag-outline mt-1">Yesterday</p>
          </div>
          <div className="px-4 py-3 hover:bg-rag-surface-variant transition-colors cursor-pointer group">
            <p className="font-rag-body-sm text-rag-on-surface-variant group-hover:text-rag-on-surface truncate">Employee Handbook Update</p>
            <p className="text-xs text-rag-outline mt-1">3 days ago</p>
          </div>
        </div>
        <div className="px-4 mt-8 mb-2">
          <h3 className="font-rag-label-caps text-rag-label-caps text-rag-outline uppercase tracking-wider">Documents</h3>
        </div>
        <div className="px-4 space-y-3">
          <div className="flex items-center space-x-3 p-2 border border-rag-outline-variant rounded-lg bg-rag-surface-container-lowest">
            <span className="material-symbols-outlined text-rag-tertiary">description</span>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate">Rapport_Annuel_2023.pdf</p>
              <p className="text-[10px] text-rag-outline">4.2 MB • Indexed</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-rag-outline-variant">
        <div className="flex items-center space-x-3 p-2 hover:bg-rag-surface-variant rounded-lg transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-rag-on-surface-variant">account_circle</span>
          <span className="font-rag-body-sm text-rag-on-surface-variant">Account Settings</span>
        </div>
      </div>
    </aside>
  );
}
