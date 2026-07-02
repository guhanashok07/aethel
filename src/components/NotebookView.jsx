import { useEffect, useMemo, useRef, useState } from 'react';

const TOOLBAR_GROUPS = [
    [
        { id: 'bold', icon: 'fa-bold', label: 'Bold', command: 'bold' },
        { id: 'italic', icon: 'fa-italic', label: 'Italic', command: 'italic' },
        { id: 'underline', icon: 'fa-underline', label: 'Underline', command: 'underline' }
    ],
    [
        { id: 'h2', icon: 'fa-heading', label: 'Heading', command: 'formatBlock', value: 'h2' },
        { id: 'quote', icon: 'fa-quote-left', label: 'Quote', command: 'formatBlock', value: 'blockquote' },
        { id: 'clear', icon: 'fa-eraser', label: 'Clear formatting', command: 'removeFormat' }
    ],
    [
        { id: 'ul', icon: 'fa-list-ul', label: 'Bulleted list', command: 'insertUnorderedList' },
        { id: 'ol', icon: 'fa-list-ol', label: 'Numbered list', command: 'insertOrderedList' }
    ]
];

const getPlainText = (html = '') => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || '';
};

const formatUpdatedAt = (value) => {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const escapeAttribute = (value) => {
    return value.replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
};

export default function NotebookView({
    notes = [],
    onAddNote,
    onUpdateNote,
    onDeleteNote
}) {
    const [activeNoteId, setActiveNoteId] = useState('');
    const [query, setQuery] = useState('');
    const [isEmpty, setIsEmpty] = useState(true);
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const saveTimerRef = useRef(null);
    const loadedNoteIdRef = useRef('');

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
        });
    }, [notes]);

    const filteredNotes = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return sortedNotes;
        return sortedNotes.filter((note) => {
            const haystack = `${note.title} ${getPlainText(note.content)}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [query, sortedNotes]);

    const activeNote = sortedNotes.find((note) => note.id === activeNoteId) || sortedNotes[0] || null;

    useEffect(() => {
        if (!activeNote && sortedNotes.length > 0) {
            setActiveNoteId(sortedNotes[0].id);
            return;
        }
        if (activeNoteId && !sortedNotes.some((note) => note.id === activeNoteId)) {
            setActiveNoteId(sortedNotes[0]?.id || '');
        }
    }, [activeNote, activeNoteId, sortedNotes]);

    useEffect(() => {
        if (!editorRef.current || !activeNote) return;

        const editorHasFocus = document.activeElement === editorRef.current;
        const noteChanged = loadedNoteIdRef.current !== activeNote.id;
        if (noteChanged || !editorHasFocus) {
            editorRef.current.innerHTML = activeNote.content || '';
            loadedNoteIdRef.current = activeNote.id;
            setIsEmpty(getPlainText(activeNote.content).trim() === '' && !(activeNote.content || '').includes('<img'));
        }
    }, [activeNote]);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const queueContentSave = () => {
        if (!activeNote || !editorRef.current) return;
        const content = editorRef.current.innerHTML;
        setIsEmpty(getPlainText(content).trim() === '' && !content.includes('<img'));
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            onUpdateNote(activeNote.id, { content });
        }, 350);
    };

    const flushContentSave = () => {
        if (!activeNote || !editorRef.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        onUpdateNote(activeNote.id, { content: editorRef.current.innerHTML });
    };

    const handleCreateNote = () => {
        const id = onAddNote();
        setActiveNoteId(id);
        requestAnimationFrame(() => {
            editorRef.current?.focus();
        });
    };

    const handleDeleteNote = () => {
        if (!activeNote) return;
        if (confirm(`Delete "${activeNote.title || 'Untitled Note'}"?`)) {
            onDeleteNote(activeNote.id);
        }
    };

    const runCommand = (command, value = null) => {
        if (!activeNote) return;
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        queueContentSave();
    };

    const handleTitleChange = (e) => {
        if (!activeNote) return;
        onUpdateNote(activeNote.id, { title: e.target.value || 'Untitled Note' });
    };

    const handlePaste = (e) => {
        const imageFile = Array.from(e.clipboardData.files || []).find(file => file.type.startsWith('image/'));
        if (imageFile) {
            e.preventDefault();
            insertImageFile(imageFile);
            return;
        }

        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        queueContentSave();
    };

    const insertImageFile = (file) => {
        if (!file || !activeNote) return;
        const reader = new FileReader();
        reader.onload = () => {
            const alt = escapeAttribute(file.name || 'Notebook image');
            editorRef.current?.focus();
            document.execCommand('insertHTML', false, `<figure><img src="${reader.result}" alt="${alt}" /><figcaption>${alt}</figcaption></figure>`);
            queueContentSave();
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        insertImageFile(file);
        e.target.value = '';
    };

    return (
        <main className="flex-1 overflow-hidden pt-20 px-6 pb-8 bg-transparent text-stone-800 font-sans select-none">
            <div className="h-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
                <section className="min-h-0 bg-white/58 backdrop-blur-xl border border-stone-200/45 shadow-sm rounded-[28px] overflow-hidden flex flex-col">
                    {activeNote ? (
                        <>
                            <header className="px-6 md:px-10 pt-7 pb-4 border-b border-stone-200/45 flex flex-col gap-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-stone-400">Notebook</span>
                                        <input
                                            value={activeNote.title}
                                            onChange={handleTitleChange}
                                            className="mt-1 w-full bg-transparent outline-none font-cormorant italic text-4xl md:text-5xl leading-tight text-stone-850 placeholder:text-stone-300"
                                            placeholder="Untitled Note"
                                        />
                                    </div>
                                    <button
                                        onClick={handleDeleteNote}
                                        className="w-9 h-9 rounded-full bg-stone-50 border border-stone-200/60 text-stone-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition shrink-0"
                                        title="Delete note"
                                    >
                                        <i className="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {TOOLBAR_GROUPS.map((group, groupIndex) => (
                                            <div key={groupIndex} className="flex items-center gap-1 bg-stone-50/80 border border-stone-200/50 rounded-full p-1">
                                                {group.map(tool => (
                                                    <button
                                                        key={tool.id}
                                                        onClick={() => runCommand(tool.command, tool.value)}
                                                        className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-850 hover:bg-white transition"
                                                        title={tool.label}
                                                    >
                                                        <i className={`fa-solid ${tool.icon} text-[11px]`}></i>
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-9 px-3 rounded-full bg-stone-800 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-stone-700 transition flex items-center gap-2"
                                        >
                                            <i className="fa-solid fa-image text-[11px]"></i>
                                            Image
                                        </button>
                                    </div>
                                </div>
                            </header>

                            <div className="flex-1 min-h-0 overflow-y-auto scroll-hidden px-6 md:px-10 py-8 select-text">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={queueContentSave}
                                    onBlur={flushContentSave}
                                    onPaste={handlePaste}
                                    className={`notebook-page-editor max-w-3xl mx-auto min-h-full outline-none text-stone-750 ${isEmpty ? 'is-empty' : ''}`}
                                    placeholder="Start writing..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 mb-5">
                                <i className="fa-regular fa-note-sticky text-lg"></i>
                            </div>
                            <h2 className="font-cormorant italic text-4xl text-stone-800 mb-2">a blank shelf</h2>
                            <p className="text-sm text-stone-400 max-w-sm leading-relaxed mb-6">
                                Create your first note and Aethel will keep it with the rest of your workspace.
                            </p>
                            <button
                                onClick={handleCreateNote}
                                className="h-10 px-4 rounded-full bg-stone-800 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-stone-700 transition"
                            >
                                New Note
                            </button>
                        </div>
                    )}
                </section>

                <aside className="min-h-0 bg-white/46 backdrop-blur-xl border border-stone-200/45 shadow-sm rounded-[28px] overflow-hidden flex flex-col lg:order-last">
                    <header className="p-5 border-b border-stone-200/45">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-cormorant italic text-2xl text-stone-800 lowercase">pages</h2>
                                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400">{sortedNotes.length} notes</p>
                            </div>
                            <button
                                onClick={handleCreateNote}
                                className="w-9 h-9 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition"
                                title="New note"
                            >
                                <i className="fa-solid fa-plus text-xs"></i>
                            </button>
                        </div>
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-[11px]"></i>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search pages"
                                className="w-full h-9 rounded-full bg-stone-50/80 border border-stone-200/50 pl-9 pr-3 text-xs text-stone-700 placeholder:text-stone-400 outline-none focus:border-stone-300"
                            />
                        </div>
                    </header>

                    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 scroll-hidden">
                        {filteredNotes.map(note => {
                            const selected = note.id === activeNote?.id;
                            const preview = getPlainText(note.content).trim() || 'No additional text';
                            return (
                                <button
                                    key={note.id}
                                    onClick={() => setActiveNoteId(note.id)}
                                    className={`w-full text-left p-3 rounded-2xl border transition group ${selected ? 'bg-white border-stone-300/70 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/55 hover:border-stone-200/60'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-sm font-semibold text-stone-800 truncate">{note.title || 'Untitled Note'}</h3>
                                        <span className="text-[9px] font-mono text-stone-350 shrink-0 pt-0.5">{formatUpdatedAt(note.updatedAt)}</span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-snug text-stone-400 line-clamp-2">{preview}</p>
                                </button>
                            );
                        })}

                        {filteredNotes.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">No pages found.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </main>
    );
}
