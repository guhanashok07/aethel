import React from 'react';

export default function ArchiveModal({ isOpen, onToggle, tasks = [], onRestore, onDelete }) {
    if (!isOpen) return null;

    return (
        <div id="archive-modal" class="fixed inset-0 bg-cream/95 backdrop-blur-md z-[60] flex flex-col">
            <div class="flex justify-between items-center px-8 py-6 border-b border-gray-200">
                <h2 class="text-lg font-medium text-stone-900">Archive</h2>
                <button onClick={onToggle} class="text-xl text-stone-700 hover:text-stone-900">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-8 overflow-y-auto flex-1 max-w-3xl mx-auto w-full" id="archive-list">
                {tasks.length === 0 ? (
                    <p class="text-stone-500 text-center py-8">No archived tasks found.</p>
                ) : (
                    tasks.map((t) => (
                        <div key={t.id} class="p-2 border-b flex justify-between items-center text-stone-800 border-gray-200/60">
                            <span>{t.text}</span>
                            <div class="flex gap-3">
                                <button
                                    onClick={() => onRestore(t.id)}
                                    class="text-xs text-blue-500 hover:underline"
                                >
                                    Restore
                                </button>
                                <button
                                    onClick={() => onDelete(t.id)}
                                    class="text-xs text-red-500 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
