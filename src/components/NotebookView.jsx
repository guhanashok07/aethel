import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SIDEBAR_STORAGE_KEY = 'aethel-notebook-sidebar-open';

const FONT_SIZE_OPTIONS = [
    { id: 'small', label: 'S' },
    { id: 'medium', label: 'M' },
    { id: 'large', label: 'L' }
];

const TOOLBAR_GROUPS = [
    [
        { id: 'undo', icon: 'fa-rotate-left', label: 'Undo', command: 'undo' },
        { id: 'redo', icon: 'fa-rotate-right', label: 'Redo', command: 'redo' }
    ],
    [
        { id: 'bold', icon: 'fa-bold', label: 'Bold', command: 'bold' },
        { id: 'italic', icon: 'fa-italic', label: 'Italic', command: 'italic' },
        { id: 'underline', icon: 'fa-underline', label: 'Underline', command: 'underline' }
    ],
    [
        { id: 'align-left', icon: 'fa-align-left', label: 'Align left', command: 'justifyLeft' },
        { id: 'align-center', icon: 'fa-align-center', label: 'Align center', command: 'justifyCenter' },
        { id: 'align-right', icon: 'fa-align-right', label: 'Align right', command: 'justifyRight' },
        { id: 'align-justify', icon: 'fa-align-justify', label: 'Justify', command: 'justifyFull' }
    ],
    [
        { id: 'paragraph', icon: 'fa-paragraph', label: 'Normal text', command: 'formatBlock', value: 'p' },
        { id: 'h2', icon: 'fa-heading', label: 'Heading', command: 'formatBlock', value: 'h2' },
        { id: 'quote', icon: 'fa-quote-left', label: 'Quote', command: 'formatBlock', value: 'blockquote' },
        { id: 'clear', icon: 'fa-eraser', label: 'Clear formatting', command: 'removeFormat' }
    ],
    [
        { id: 'ul', icon: 'fa-list-ul', label: 'Bulleted list', command: 'insertUnorderedList' },
        { id: 'ol', icon: 'fa-list-ol', label: 'Numbered list', command: 'insertOrderedList' },
        { id: 'divider', icon: 'fa-grip-lines', label: 'Section divider', command: 'insertHorizontalRule' }
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

const readSidebarPreference = () => {
    try {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored === null) return true;
        return stored === 'true';
    } catch {
        return true;
    }
};

function LinkPicker({ pages, query, onQueryChange, onSelect, onClose }) {
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return pages;
        return pages.filter((page) => {
            const haystack = `${page.title} ${getPlainText(page.content)}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [pages, query]);

    return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-stone-200/70 rounded-2xl shadow-xl z-30 overflow-hidden">
            <div className="p-3 border-b border-stone-100">
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search pages to link..."
                    className="w-full h-8 rounded-full bg-stone-50 border border-stone-200/60 px-3 text-xs text-stone-700 outline-none focus:border-stone-300"
                />
            </div>
            <div className="max-h-56 overflow-y-auto p-1.5 scroll-hidden">
                {filtered.map((page) => (
                    <button
                        key={page.id}
                        onClick={() => onSelect(page)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 transition"
                    >
                        <p className="text-sm font-medium text-stone-800 truncate">{page.title || 'Untitled Page'}</p>
                        <p className="text-[10px] text-stone-400 truncate">{getPlainText(page.content) || 'Empty page'}</p>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="text-center py-6 text-[10px] font-mono uppercase tracking-wider text-stone-400">No pages found</p>
                )}
            </div>
            <div className="p-2 border-t border-stone-100 flex justify-end">
                <button
                    onClick={onClose}
                    className="h-7 px-3 rounded-full text-[10px] font-mono uppercase tracking-wider text-stone-400 hover:text-stone-600 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default function NotebookView({
    notebooks = [],
    pages = [],
    onAddNotebook,
    onUpdateNotebook,
    onDeleteNotebook,
    onAddPage,
    onUpdatePage,
    onDeletePage
}) {
    const [activeNotebookId, setActiveNotebookId] = useState('');
    const [activePageId, setActivePageId] = useState('');
    const [expandedNotebooks, setExpandedNotebooks] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(readSidebarPreference);
    const [query, setQuery] = useState('');
    const [isEmpty, setIsEmpty] = useState(true);
    const [linkPickerOpen, setLinkPickerOpen] = useState(false);
    const [linkQuery, setLinkQuery] = useState('');
    const [editingNotebookId, setEditingNotebookId] = useState('');
    const [selectionFontSize, setSelectionFontSize] = useState('');

    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const linkPickerRef = useRef(null);
    const saveTimerRef = useRef(null);
    const loadedPageIdRef = useRef('');
    const scrollContainerRef = useRef(null);

    const pagesByNotebook = useMemo(() => {
        const grouped = {};
        pages.forEach((page) => {
            if (!grouped[page.notebookId]) grouped[page.notebookId] = [];
            grouped[page.notebookId].push(page);
        });
        return grouped;
    }, [pages]);

    const filteredNotebooks = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return notebooks;

        return notebooks.filter((notebook) => {
            const notebookPages = pagesByNotebook[notebook.id] || [];
            const notebookMatch = notebook.title.toLowerCase().includes(needle);
            const pageMatch = notebookPages.some((page) => {
                const haystack = `${page.title} ${getPlainText(page.content)}`.toLowerCase();
                return haystack.includes(needle);
            });
            return notebookMatch || pageMatch;
        });
    }, [notebooks, pagesByNotebook, query]);

    const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId) || notebooks[0] || null;
    const notebookPages = activeNotebook ? (pagesByNotebook[activeNotebook.id] || []) : [];
    const activePage = pages.find((page) => page.id === activePageId)
        || notebookPages[0]
        || pages[0]
        || null;

    const navigateToPage = useCallback((notebookId, pageId) => {
        setActiveNotebookId(notebookId);
        setActivePageId(pageId);
        setExpandedNotebooks((prev) => ({ ...prev, [notebookId]: true }));
    }, []);

    useEffect(() => {
        if (!activeNotebook && notebooks.length > 0) {
            setActiveNotebookId(notebooks[0].id);
        }
    }, [activeNotebook, notebooks]);

    useEffect(() => {
        if (!activePage && notebookPages.length > 0) {
            setActivePageId(notebookPages[0].id);
            return;
        }
        if (activePageId && !pages.some((page) => page.id === activePageId)) {
            setActivePageId(notebookPages[0]?.id || pages[0]?.id || '');
        }
    }, [activePage, activePageId, notebookPages, pages]);

    useEffect(() => {
        if (activeNotebookId) {
            setExpandedNotebooks((prev) => ({ ...prev, [activeNotebookId]: true }));
        }
    }, [activeNotebookId]);

    useEffect(() => {
        if (!editorRef.current || !activePage) return;

        const editorHasFocus = document.activeElement === editorRef.current;
        const pageChanged = loadedPageIdRef.current !== activePage.id;
        if (pageChanged || !editorHasFocus) {
            editorRef.current.innerHTML = activePage.content || '';
            loadedPageIdRef.current = activePage.id;
            setIsEmpty(getPlainText(activePage.content).trim() === '' && !(activePage.content || '').includes('<img'));
        }
    }, [activePage]);

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
        } catch {
            // ignore storage failures
        }
    }, [sidebarOpen]);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!linkPickerOpen) return;
        const handleClickOutside = (event) => {
            if (linkPickerRef.current && !linkPickerRef.current.contains(event.target)) {
                setLinkPickerOpen(false);
                setLinkQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [linkPickerOpen]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (document.activeElement === editorRef.current) {
                const size = document.queryCommandValue('fontSize');
                setSelectionFontSize(size || '');
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const queueContentSave = () => {
        if (!activePage || !editorRef.current) return;
        const content = editorRef.current.innerHTML;
        setIsEmpty(getPlainText(content).trim() === '' && !content.includes('<img'));
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            onUpdatePage(activePage.id, { content });
        }, 350);
    };

    const flushContentSave = () => {
        if (!activePage || !editorRef.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        onUpdatePage(activePage.id, { content: editorRef.current.innerHTML });
    };

    const handleCreateNotebook = () => {
        const id = onAddNotebook();
        setActiveNotebookId(id);
        setExpandedNotebooks((prev) => ({ ...prev, [id]: true }));
        setEditingNotebookId(id);
    };

    const handleCreatePage = (notebookId = activeNotebook?.id) => {
        if (!notebookId) {
            const newNotebookId = onAddNotebook();
            setActiveNotebookId(newNotebookId);
            setExpandedNotebooks((prev) => ({ ...prev, [newNotebookId]: true }));
            const pageId = onAddPage(newNotebookId);
            setActivePageId(pageId);
        } else {
            const pageId = onAddPage(notebookId);
            setActiveNotebookId(notebookId);
            setActivePageId(pageId);
            setExpandedNotebooks((prev) => ({ ...prev, [notebookId]: true }));
        }
        requestAnimationFrame(() => editorRef.current?.focus());
    };

    const handleDeletePage = () => {
        if (!activePage) return;
        if (confirm(`Delete "${activePage.title || 'Untitled Page'}"?`)) {
            onDeletePage(activePage.id);
        }
    };

    const handleDeleteNotebook = (notebookId) => {
        const notebook = notebooks.find((nb) => nb.id === notebookId);
        const pageCount = (pagesByNotebook[notebookId] || []).length;
        const label = notebook?.title || 'Untitled Notebook';
        const message = pageCount > 0
            ? `Delete "${label}" and its ${pageCount} page${pageCount === 1 ? '' : 's'}?`
            : `Delete "${label}"?`;
        if (confirm(message)) {
            onDeleteNotebook(notebookId);
            if (activeNotebookId === notebookId) {
                setActiveNotebookId('');
                setActivePageId('');
            }
        }
    };

    const toggleNotebookExpanded = (notebookId) => {
        setExpandedNotebooks((prev) => ({ ...prev, [notebookId]: !prev[notebookId] }));
    };

    const runCommand = (command, value = null) => {
        if (!activePage) return;
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        queueContentSave();
    };

    const handleTitleChange = (e) => {
        if (!activePage) return;
        onUpdatePage(activePage.id, { title: e.target.value || 'Untitled Page' });
    };

    const handleWidthModeChange = (widthMode) => {
        if (!activePage || activePage.widthMode === widthMode) return;
        onUpdatePage(activePage.id, { widthMode });
    };

    const handleFontSizeChange = (sizeId) => {
        if (!activePage) return;
        editorRef.current?.focus();
        const sizeMap = {
            small: '2',
            medium: '3',
            large: '5'
        };
        document.execCommand('fontSize', false, sizeMap[sizeId]);
        const size = document.queryCommandValue('fontSize');
        setSelectionFontSize(size || '');
        queueContentSave();
    };

    const insertPageLink = (page) => {
        if (!activePage || !editorRef.current) return;
        editorRef.current.focus();
        const selection = window.getSelection();
        const label = selection && !selection.isCollapsed
            ? selection.toString()
            : (page.title || 'Untitled Page');
        const html = `<a href="#" class="notebook-page-link" data-page-id="${escapeAttribute(page.id)}" data-notebook-id="${escapeAttribute(page.notebookId)}" contenteditable="false">${escapeAttribute(label)}</a>&nbsp;`;
        document.execCommand('insertHTML', false, html);
        queueContentSave();
        setLinkPickerOpen(false);
        setLinkQuery('');
    };

    const insertToggleList = () => {
        if (!activePage || !editorRef.current) return;
        editorRef.current.focus();
        const html = '<details class="notebook-toggle-list"><summary>Toggle</summary><p><br></p></details><p><br></p>';
        document.execCommand('insertHTML', false, html);
        queueContentSave();
    };

    const handleEditorClick = (e) => {
        const link = e.target.closest('.notebook-page-link');
        if (link) {
            e.preventDefault();
            const pageId = link.dataset.pageId;
            const notebookId = link.dataset.notebookId;
            if (pageId && notebookId) {
                navigateToPage(notebookId, pageId);
            }
            return;
        }

        const toggleSummary = e.target.closest('.notebook-toggle-list summary');
        if (toggleSummary) {
            e.preventDefault();
            const details = toggleSummary.parentElement;
            if (details) {
                if (details.hasAttribute('open')) {
                    details.removeAttribute('open');
                } else {
                    details.setAttribute('open', '');
                }
            }
            queueContentSave();
        }
    };

    const handleEditorKeyDown = (e) => {
        const mod = e.metaKey || e.ctrlKey;
        const key = e.key.toLowerCase();

        // Auto-formatting triggers on pressing Space key
        if (e.key === ' ' && !mod) {
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                const startNode = range.startContainer;
                
                if (startNode.nodeType === Node.TEXT_NODE) {
                    const text = startNode.textContent;
                    const offset = range.startOffset;
                    const textBeforeCursor = text.substring(0, offset);
                    const blockElement = startNode.parentElement?.closest('p, h1, h2, h3, div, li');
                    
                    if (blockElement && !['H1', 'H2', 'H3', 'PRE', 'LI'].includes(blockElement.tagName)) {
                        const cleanedTrigger = textBeforeCursor.trim();
                        
                        // 1. Unordered lists: "-" or "*" + Space
                        if (cleanedTrigger === '-' || cleanedTrigger === '*') {
                            e.preventDefault();
                            startNode.textContent = text.substring(offset);
                            document.execCommand('insertUnorderedList', false, null);
                            queueContentSave();
                            return;
                        }
                        
                        // 2. Ordered lists: "1." + Space
                        if (cleanedTrigger === '1.') {
                            e.preventDefault();
                            startNode.textContent = text.substring(offset);
                            document.execCommand('insertOrderedList', false, null);
                            queueContentSave();
                            return;
                        }
                        
                        // 3. Toggle details: ">" + Space
                        if (cleanedTrigger === '>') {
                            e.preventDefault();
                            startNode.textContent = text.substring(offset);
                            
                            const details = document.createElement('details');
                            details.className = 'notebook-toggle-list';
                            
                            const summary = document.createElement('summary');
                            summary.innerHTML = '<br>';
                            details.appendChild(summary);
                            
                            const innerContent = document.createElement('p');
                            innerContent.innerHTML = '<br>';
                            details.appendChild(innerContent);
                            
                            blockElement.parentNode.replaceChild(details, blockElement);
                            
                            const newRange = document.createRange();
                            newRange.setStart(summary, 0);
                            newRange.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            
                            queueContentSave();
                            return;
                        }
                    }
                }
            }
        }

        // 1. Cmd/Ctrl + Z / Y Undo & Redo
        if (mod) {
            if (key === 'z') {
                e.preventDefault();
                runCommand(e.shiftKey ? 'redo' : 'undo');
                return;
            }
            if (key === 'y') {
                e.preventDefault();
                runCommand('redo');
                return;
            }
        }

        // 2. Shift + Enter or Alt + Enter: Exit the list or details (toggle) container and insert a paragraph after it
        if (e.key === 'Enter' && (e.shiftKey || e.altKey)) {
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                
                // Find closest list or details container
                const startNode = range.startContainer;
                const element = startNode.nodeType === Node.ELEMENT_NODE ? startNode : startNode.parentElement;
                const container = element?.closest('details.notebook-toggle-list, ul, ol');
                
                if (container) {
                    e.preventDefault();
                    const newPara = document.createElement('p');
                    newPara.innerHTML = '<br>';
                    container.parentNode.insertBefore(newPara, container.nextSibling);
                    
                    const newRange = document.createRange();
                    newRange.setStart(newPara, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    queueContentSave();
                    return;
                }
            }
        }

        // 3. Enter on Toggle summary: Go into the details block content
        if (e.key === 'Enter' && !e.altKey && !e.shiftKey) {
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                const startNode = range.startContainer;
                const element = startNode.nodeType === Node.ELEMENT_NODE ? startNode : startNode.parentElement;
                
                const summary = element?.closest('.notebook-toggle-list summary');
                if (summary) {
                    e.preventDefault();
                    const details = summary.parentElement;
                    if (details) {
                        details.setAttribute('open', '');
                        
                        let firstChild = Array.from(details.children).find(child => child.tagName !== 'SUMMARY');
                        if (!firstChild) {
                            firstChild = document.createElement('p');
                            firstChild.innerHTML = '<br>';
                            details.appendChild(firstChild);
                        }
                        
                        const newRange = document.createRange();
                        newRange.setStart(firstChild, 0);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        
                        queueContentSave();
                    }
                    return;
                }
            }
        }
    };

    const handleDragStart = (e) => {
        if (e.target.tagName === 'IMG') {
            e.dataTransfer.setData('text/html', e.target.outerHTML);
            e.target.classList.add('is-dragging-temp');
        }
    };

    const handleDragEnd = (e) => {
        if (e.target.tagName === 'IMG') {
            e.target.classList.remove('is-dragging-temp');
        }
    };

    const handleDrop = (e) => {
        if (!editorRef.current) return;
        const draggedImg = editorRef.current.querySelector('img.is-dragging-temp');
        if (draggedImg) {
            let range;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(e.clientX, e.clientY);
            } else if (e.rangeParent) {
                range = document.createRange();
                range.setStart(e.rangeParent, e.rangeOffset);
            }
            
            if (range) {
                e.preventDefault();
                draggedImg.remove();
                
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                
                const cleanHtml = draggedImg.outerHTML.replace(' is-dragging-temp', '');
                document.execCommand('insertHTML', false, cleanHtml);
                queueContentSave();
            }
        }
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
        if (!file || !activePage) return;
        const reader = new FileReader();
        reader.onload = () => {
            const alt = escapeAttribute(file.name || 'Notebook image');
            editorRef.current?.focus();
            document.execCommand('insertHTML', false, `<img src="${reader.result}" alt="${alt}" />`);
            queueContentSave();
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        insertImageFile(file);
        e.target.value = '';
    };

    const handleNotebookTitleBlur = (notebookId, value) => {
        setEditingNotebookId('');
        onUpdateNotebook(notebookId, { title: value.trim() || 'Untitled Notebook' });
    };

    const renderNotebookPages = (notebookId) => {
        const notebookPageList = pagesByNotebook[notebookId] || [];
        const needle = query.trim().toLowerCase();
        const visiblePages = needle
            ? notebookPageList.filter((page) => {
                const haystack = `${page.title} ${getPlainText(page.content)}`.toLowerCase();
                return haystack.includes(needle);
            })
            : notebookPageList;

        if (visiblePages.length === 0 && needle) return null;

        return visiblePages.map((page) => {
            const selected = page.id === activePage?.id;
            const preview = getPlainText(page.content).trim() || 'No additional text';
            return (
                <button
                    key={page.id}
                    onClick={() => navigateToPage(notebookId, page.id)}
                    className={`w-full text-left pl-8 pr-3 py-2.5 rounded-xl border transition group ${selected ? 'sidebar-active-page bg-white border-stone-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)]' : 'bg-transparent border-transparent hover:bg-white/55 hover:border-stone-200/40'}`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2">
                            <i className="fa-regular fa-file-lines text-[10px] text-stone-300 mt-1 shrink-0"></i>
                            <h3 className="text-sm font-medium text-stone-800 truncate">{page.title || 'Untitled Page'}</h3>
                        </div>
                        <span className="text-[9px] font-mono text-stone-350 shrink-0 pt-0.5">{formatUpdatedAt(page.updatedAt)}</span>
                    </div>
                    <p className="mt-1 pl-5 text-[11px] leading-snug text-stone-400 line-clamp-2">{preview}</p>
                </button>
            );
        });
    };

    const widthMode = 'full';
    const fontSize = ['small', 'medium', 'large'].includes(activePage?.fontSize) ? activePage.fontSize : 'medium';

    return (
        <main className="flex-1 overflow-hidden pt-20 px-4 md:px-6 pb-8 bg-transparent text-stone-800 font-sans">
            <div className="h-full max-w-[1600px] mx-auto flex gap-4">
                <section className="flex-1 min-w-0 min-h-0 bg-white/58 backdrop-blur-xl border border-stone-200/45 shadow-sm rounded-[28px] overflow-hidden flex flex-col">
                    {activePage ? (
                        <>
                            <header className="px-6 md:px-10 pt-7 pb-4 border-b border-stone-200/45 flex flex-col gap-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                                            <span>{activeNotebook?.title || 'Notebook'}</span>
                                            <i className="fa-solid fa-chevron-right text-[8px] text-stone-300"></i>
                                            <span className="text-stone-500">page</span>
                                        </div>
                                        <input
                                            value={activePage.title}
                                            onChange={handleTitleChange}
                                            className="mt-1 w-full bg-transparent outline-none font-cormorant italic text-4xl md:text-5xl leading-tight text-stone-850 placeholder:text-stone-300"
                                            placeholder="Untitled Page"
                                        />
                                    </div>
                                    <button
                                        onClick={handleDeletePage}
                                        className="w-9 h-9 rounded-full bg-stone-50 border border-stone-200/60 text-stone-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition shrink-0"
                                        title="Delete page"
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
                                        <button
                                            onClick={insertToggleList}
                                            className="h-9 px-3 rounded-full bg-stone-50/80 border border-stone-200/50 text-stone-500 hover:text-stone-850 hover:bg-white transition flex items-center gap-2"
                                            title="Insert toggle list"
                                        >
                                            <i className="fa-solid fa-caret-down text-[11px]"></i>
                                            <span className="text-[10px] font-mono uppercase tracking-wider">Toggle</span>
                                        </button>
                                        <div className="relative" ref={linkPickerRef}>
                                            <button
                                                onClick={() => setLinkPickerOpen((open) => !open)}
                                                className="h-9 px-3 rounded-full bg-stone-50/80 border border-stone-200/50 text-stone-500 hover:text-stone-850 hover:bg-white transition flex items-center gap-2"
                                                title="Link to page"
                                            >
                                                <i className="fa-solid fa-link text-[11px]"></i>
                                                <span className="text-[10px] font-mono uppercase tracking-wider">Link</span>
                                            </button>
                                            {linkPickerOpen && (
                                                <LinkPicker
                                                    pages={pages.filter((page) => page.id !== activePage.id)}
                                                    query={linkQuery}
                                                    onQueryChange={setLinkQuery}
                                                    onSelect={insertPageLink}
                                                    onClose={() => {
                                                        setLinkPickerOpen(false);
                                                        setLinkQuery('');
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <div className="flex items-center gap-1 bg-stone-50/80 border border-stone-200/50 rounded-full p-1">
                                            {FONT_SIZE_OPTIONS.map((option) => {
                                                const sizeMap = { small: '2', medium: '3', large: '5' };
                                                const isSizeActive = selectionFontSize
                                                    ? selectionFontSize === sizeMap[option.id]
                                                    : fontSize === option.id;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => handleFontSizeChange(option.id)}
                                                        className={`w-8 h-8 rounded-full text-[10px] font-mono uppercase tracking-wider transition ${isSizeActive ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                                                        title={`${option.id.charAt(0).toUpperCase()}${option.id.slice(1)} text`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
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

                            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto scroll-hidden px-6 md:px-10 py-8 select-text">
                                <div className="notebook-canvas">
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={queueContentSave}
                                        onBlur={flushContentSave}
                                        onPaste={handlePaste}
                                        onClick={handleEditorClick}
                                        onKeyDown={handleEditorKeyDown}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDrop={handleDrop}
                                        className={`notebook-page-editor outline-none text-stone-750 min-h-full ${widthMode === 'full' ? 'is-full-width' : 'is-center-width'} is-${fontSize} ${isEmpty ? 'is-empty' : ''}`}
                                        placeholder="Start writing..."
                                    />                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 mb-5">
                                <i className="fa-regular fa-book-open text-lg"></i>
                            </div>
                            <h2 className="font-cormorant italic text-4xl text-stone-800 mb-2">a blank shelf</h2>
                            <p className="text-sm text-stone-400 max-w-sm leading-relaxed mb-6">
                                Create a notebook, add pages inside it, and link between them as your ideas grow.
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCreateNotebook}
                                    className="h-10 px-4 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-mono uppercase tracking-wider hover:bg-white transition"
                                >
                                    New Notebook
                                </button>
                                <button
                                    onClick={() => handleCreatePage()}
                                    className="h-10 px-4 rounded-full bg-stone-800 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-stone-700 transition"
                                >
                                    New Page
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="hidden lg:flex fixed right-4 top-24 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-stone-200/60 text-stone-500 hover:text-stone-850 hover:bg-white shadow-sm transition items-center justify-center"
                        title="Open sidebar"
                    >
                        <i className="fa-solid fa-bars-staggered text-sm"></i>
                    </button>
                )}

                <aside
                    className={`shrink-0 min-h-0 bg-white/46 backdrop-blur-xl border border-stone-200/45 shadow-sm rounded-[28px] overflow-hidden flex flex-col transition-all duration-300 ease-out ${sidebarOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 pointer-events-none overflow-hidden border-0 p-0'}`}
                >
                    <header className="p-5 border-b border-stone-200/45">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-cormorant italic text-2xl text-stone-800 lowercase">library</h2>
                                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400">
                                    {notebooks.length} notebook{notebooks.length === 1 ? '' : 's'} · {pages.length} page{pages.length === 1 ? '' : 's'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleCreateNotebook}
                                    className="w-9 h-9 rounded-full bg-stone-50 border border-stone-200/60 text-stone-400 hover:text-stone-750 transition flex items-center justify-center"
                                    title="New notebook"
                                >
                                    <i className="fa-solid fa-book text-xs"></i>
                                </button>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="w-9 h-9 rounded-full bg-stone-50 border border-stone-200/60 text-stone-400 hover:text-stone-750 transition flex items-center justify-center"
                                    title="Collapse sidebar"
                                >
                                    <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-[11px]"></i>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search notebooks & pages"
                                className="w-full h-9 rounded-full bg-stone-50/80 border border-stone-200/50 pl-9 pr-3 text-xs text-stone-700 placeholder:text-stone-400 outline-none focus:border-stone-300"
                            />
                        </div>
                    </header>

                    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scroll-hidden">
                        {filteredNotebooks.map((notebook) => {
                            const expanded = expandedNotebooks[notebook.id] ?? true;
                            const pageCount = (pagesByNotebook[notebook.id] || []).length;
                            const isActiveNotebook = notebook.id === activeNotebook?.id;

                            return (
                                <div key={notebook.id} className="rounded-2xl border border-transparent group">
                                    <div className={`flex items-center gap-1 rounded-2xl transition ${isActiveNotebook ? 'bg-stone-100/70' : 'hover:bg-white/50'}`}>
                                        <button
                                            onClick={() => toggleNotebookExpanded(notebook.id)}
                                            className="w-8 h-10 shrink-0 text-stone-400 hover:text-stone-600 transition"
                                            title={expanded ? 'Collapse notebook' : 'Expand notebook'}
                                        >
                                            <i className={`fa-solid fa-chevron-right text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}></i>
                                        </button>
                                        {editingNotebookId === notebook.id ? (
                                            <input
                                                autoFocus
                                                defaultValue={notebook.title}
                                                onBlur={(e) => handleNotebookTitleBlur(notebook.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                }}
                                                className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold text-stone-800 py-2 pr-2"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setActiveNotebookId(notebook.id);
                                                    setExpandedNotebooks((prev) => ({ ...prev, [notebook.id]: true }));
                                                }}
                                                onDoubleClick={() => setEditingNotebookId(notebook.id)}
                                                className="flex-1 min-w-0 text-left py-2 pr-1"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-book-open text-[11px] text-stone-400 shrink-0"></i>
                                                    <span className="text-sm font-semibold text-stone-800 truncate">{notebook.title}</span>
                                                    <span className="text-[9px] font-mono text-stone-350 shrink-0">{pageCount}</span>
                                                </div>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCreatePage(notebook.id)}
                                            className="w-8 h-10 shrink-0 text-stone-400 hover:text-stone-700 transition"
                                            title="Add page"
                                        >
                                            <i className="fa-solid fa-plus text-[10px]"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteNotebook(notebook.id)}
                                            className="w-8 h-10 shrink-0 text-stone-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 mr-1"
                                            title="Delete notebook"
                                        >
                                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                                        </button>
                                    </div>

                                    {expanded && (
                                        <div className="mt-1 space-y-1">
                                            {renderNotebookPages(notebook.id)}
                                            {(pagesByNotebook[notebook.id] || []).length === 0 && (
                                                <button
                                                    onClick={() => handleCreatePage(notebook.id)}
                                                    className="w-full text-left pl-8 pr-3 py-2 text-[11px] text-stone-400 hover:text-stone-600 transition"
                                                >
                                                    + Add first page
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {filteredNotebooks.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                                    {notebooks.length === 0 ? 'No notebooks yet.' : 'No matches found.'}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </main>
    );
}
