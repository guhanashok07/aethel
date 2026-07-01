import React from 'react';

export default function ArchiveModal({ 
    isOpen, 
    onToggle, 
    tasks = [], 
    onRestore, 
    onDelete, 
    onClearArchive,
    canUndo = false,
    onUndo
}) {
    if (!isOpen) return null;

    return (
        <div id="archive-modal" className="fixed inset-0 bg-white/55 backdrop-blur-xl z-[60] flex flex-col animate-page-fade select-none">
            <div className="flex justify-between items-center px-8 py-5 border-b border-stone-200/50">
                <h2 className="text-base font-cormorant font-normal italic tracking-wide text-stone-850">archive</h2>
                <div className="flex items-center gap-5">
                    {canUndo && (
                        <button
                            onClick={onUndo}
                            className="text-stone-400 hover:text-stone-700 transition-colors"
                            title="Undo last action (Ctrl+Z)"
                        >
                            <i className="fa-solid fa-rotate-left text-xs"></i>
                        </button>
                    )}
                    {tasks.length > 0 && (
                        <button
                            onClick={onClearArchive}
                            className="text-[10px] font-mono tracking-wider uppercase text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                            title="Permanently empty all archived tasks"
                        >
                            <i className="fa-solid fa-trash-can text-[9px]"></i> clear archive
                        </button>
                    )}
                    <span className="w-[1px] h-3 bg-stone-200" />
                    <button onClick={onToggle} className="text-stone-400 hover:text-stone-700 transition-colors duration-205">
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 max-w-2xl mx-auto w-full scroll-hidden" id="archive-list">
                {tasks.length === 0 ? (
                    <div className="text-stone-400 text-center py-12 flex flex-col items-center gap-2">
                        <i className="fa-solid fa-box-open text-xl text-stone-300"></i>
                        <p className="text-[11px] font-mono uppercase tracking-wider">No archived tasks found.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {tasks.map((t) => (
                            <div key={t.id} className="p-2.5 px-3 border border-stone-200/40 rounded-lg flex justify-between items-center text-[13px] font-sans antialiased tracking-normal text-stone-700 bg-stone-50/30 hover:border-stone-200 transition-all duration-200">
                                <span className="font-normal leading-relaxed pr-6" dangerouslySetInnerHTML={{ __html: t.text }} />
                                <div className="flex gap-4 shrink-0">
                                    <button
                                        onClick={() => onRestore(t.id)}
                                        className="text-stone-400 hover:text-stone-700 transition-colors"
                                        title="Restore task to board"
                                    >
                                        <i className="fa-solid fa-arrow-rotate-left text-[11px]"></i>
                                    </button>
                                    <button
                                        onClick={() => onDelete(t.id)}
                                        className="text-stone-400 hover:text-red-500 transition-colors"
                                        title="Delete task permanently"
                                    >
                                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
