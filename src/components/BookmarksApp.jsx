import { useEffect, useMemo, useRef, useState } from 'react';
import BookmarksGraphView from './BookmarksGraphView';

const KIND_CONNECTOR = 'connector';
const KIND_LINK = 'link';

const normalizeUrl = (value = '') => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
};

const faviconFor = (url) => {
    try {
        const { hostname } = new URL(url);
        return `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
    } catch {
        return '';
    }
};

function NodeForm({ initialTitle = '', initialKind = KIND_CONNECTOR, initialUrl = '', hasChildren = false, submitLabel = 'Add', onSubmit, onCancel }) {
    const [title, setTitle] = useState(initialTitle);
    const [kind, setKind] = useState(initialKind);
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        onSubmit({ title: trimmedTitle, kind, url: kind === KIND_LINK ? normalizeUrl(url) : '' });
    };

    return (
        <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel(); } }}
            className="flex flex-col gap-2 bg-stone-50/90 border border-stone-200/70 rounded-2xl p-3"
        >
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Name"
                    className="flex-1 min-w-0 h-8 rounded-full bg-white border border-stone-200/70 px-3 text-xs text-stone-700 outline-none focus:border-stone-350"
                />
                <div className="flex items-center bg-white border border-stone-200/70 rounded-full p-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setKind(KIND_CONNECTOR)}
                        className={`h-7 px-2.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition ${kind === KIND_CONNECTOR ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-700'}`}
                    >
                        Folder
                    </button>
                    <button
                        type="button"
                        onClick={() => !hasChildren && setKind(KIND_LINK)}
                        disabled={hasChildren}
                        title={hasChildren ? 'Has nested items - remove them first to convert to a link' : ''}
                        className={`h-7 px-2.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition ${kind === KIND_LINK ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-700'} ${hasChildren ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        Link
                    </button>
                </div>
            </div>
            {kind === KIND_LINK && (
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-8 rounded-full bg-white border border-stone-200/70 px-3 text-xs text-stone-700 outline-none focus:border-stone-350"
                />
            )}
            <div className="flex items-center justify-end gap-2 pt-0.5">
                <button type="button" onClick={onCancel} className="h-7 px-3 rounded-full text-[9px] font-mono uppercase tracking-wider text-stone-400 hover:text-stone-600 transition">
                    Cancel
                </button>
                <button type="submit" className="h-7 px-3 rounded-full bg-stone-800 text-white text-[9px] font-mono uppercase tracking-wider hover:bg-stone-700 transition">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

function BookmarkRow({ node, depth, childrenByParent, visibleIds, matchedIds, onAdd, onUpdate, onDelete, editingId, setEditingId, addingParentId, setAddingParentId }) {
    const [copied, setCopied] = useState(false);
    const [faviconFailed, setFaviconFailed] = useState(false);

    if (visibleIds && !visibleIds.has(node.id)) return null;

    const searchActive = !!visibleIds;
    const isConnector = node.kind === KIND_CONNECTOR;
    const kids = (childrenByParent[node.id] || [])
        .filter((k) => !visibleIds || visibleIds.has(k.id))
        .sort((a, b) => a.order - b.order);
    const hasKids = kids.length > 0;
    const expanded = searchActive ? true : !node.collapsed;
    const isEditing = editingId === node.id;
    const isAddingChild = addingParentId === node.id;

    const handleOpen = () => {
        if (node.kind === KIND_LINK && node.url) {
            window.open(node.url, '_blank', 'noopener,noreferrer');
        } else if (isConnector) {
            onUpdate(node.id, { collapsed: !node.collapsed });
        }
    };

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(node.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // clipboard unavailable - silently ignore
        }
    };

    if (isEditing) {
        return (
            <div style={{ marginLeft: depth * 22 }} className="py-1">
                <NodeForm
                    initialTitle={node.title}
                    initialKind={node.kind}
                    initialUrl={node.url}
                    hasChildren={hasKids}
                    submitLabel="Save"
                    onSubmit={(vals) => { onUpdate(node.id, vals); setEditingId(''); }}
                    onCancel={() => setEditingId('')}
                />
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                className="group flex items-center gap-2 py-1.5 pr-2 rounded-xl hover:bg-stone-50/70 transition cursor-pointer"
                style={{ paddingLeft: depth * 22 + 6 }}
                onClick={handleOpen}
            >
                {isConnector ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(node.id, { collapsed: !node.collapsed }); }}
                        className="w-4 h-4 flex items-center justify-center text-stone-350 hover:text-stone-600 transition shrink-0"
                    >
                        <i className={`fa-solid fa-chevron-right text-[8px] transition-transform ${expanded ? 'rotate-90' : ''}`}></i>
                    </button>
                ) : (
                    <span className="w-4 shrink-0" />
                )}

                <span className="w-4 h-4 flex items-center justify-center shrink-0 text-stone-400">
                    {isConnector ? (
                        <i className={`fa-solid ${expanded && hasKids ? 'fa-folder-open' : 'fa-folder'} text-[11px]`}></i>
                    ) : node.url && !faviconFailed ? (
                        <img
                            src={faviconFor(node.url)}
                            alt=""
                            className="w-3.5 h-3.5 rounded-sm"
                            onError={() => setFaviconFailed(true)}
                        />
                    ) : (
                        <i className="fa-solid fa-link text-[10px]"></i>
                    )}
                </span>

                <span
                    className={`text-[13px] truncate ${isConnector ? 'text-stone-750 font-medium' : 'text-stone-600 group-hover:text-stone-900 group-hover:underline'} ${matchedIds.has(node.id) ? 'bg-amber-100/70 rounded px-1 -mx-1' : ''}`}
                >
                    {node.title}
                </span>

                {node.kind === KIND_LINK && node.url && (
                    <span className="text-[10px] text-stone-350 truncate hidden sm:inline">
                        {node.url.replace(/^https?:\/\//, '')}
                    </span>
                )}

                <span className="flex-1" />

                <div className="items-center gap-1 hidden group-hover:flex shrink-0">
                    {isConnector && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdate(node.id, { collapsed: false }); setAddingParentId(node.id); }}
                            title="Add inside"
                            className="w-6 h-6 rounded-full text-stone-350 hover:text-stone-700 hover:bg-stone-100 transition flex items-center justify-center"
                        >
                            <i className="fa-solid fa-plus text-[9px]"></i>
                        </button>
                    )}
                    {node.kind === KIND_LINK && node.url && (
                        <button
                            onClick={handleCopy}
                            title={copied ? 'Copied!' : 'Copy link'}
                            className="w-6 h-6 rounded-full text-stone-350 hover:text-stone-700 hover:bg-stone-100 transition flex items-center justify-center"
                        >
                            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-[9px]`}></i>
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(node.id); }}
                        title="Rename / edit"
                        className="w-6 h-6 rounded-full text-stone-350 hover:text-stone-700 hover:bg-stone-100 transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-pen text-[9px]"></i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                        title="Delete"
                        className="w-6 h-6 rounded-full text-stone-350 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-trash-can text-[9px]"></i>
                    </button>
                </div>
            </div>

            {isAddingChild && (
                <div style={{ marginLeft: (depth + 1) * 22 + 6 }} className="pb-1.5">
                    <NodeForm
                        submitLabel="Add"
                        onSubmit={(vals) => { onAdd(node.id, vals); setAddingParentId(''); }}
                        onCancel={() => setAddingParentId('')}
                    />
                </div>
            )}

            {isConnector && expanded && hasKids && (
                <div className="border-l border-stone-200/60" style={{ marginLeft: depth * 22 + 13 }}>
                    {kids.map((child) => (
                        <BookmarkRow
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            childrenByParent={childrenByParent}
                            visibleIds={visibleIds}
                            matchedIds={matchedIds}
                            onAdd={onAdd}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            addingParentId={addingParentId}
                            setAddingParentId={setAddingParentId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function BookmarksApp({ nodes, onAdd, onUpdate, onDelete, onBack }) {
    const [query, setQuery] = useState('');
    const [viewMode, setViewMode] = useState('graph');
    const [editingId, setEditingId] = useState('');
    const [addingParentId, setAddingParentId] = useState('');

    const childrenByParent = useMemo(() => {
        const map = {};
        nodes.forEach((n) => {
            const key = n.parentId || '';
            if (!map[key]) map[key] = [];
            map[key].push(n);
        });
        return map;
    }, [nodes]);

    const rootNodes = (childrenByParent[''] || []).sort((a, b) => a.order - b.order);

    const matchedIds = useMemo(() => {
        if (!query.trim()) return new Set();
        const needle = query.trim().toLowerCase();
        return new Set(nodes.filter((n) => n.title.toLowerCase().includes(needle)).map((n) => n.id));
    }, [nodes, query]);

    const visibleIds = useMemo(() => {
        if (!query.trim()) return null;
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const visible = new Set(matchedIds);
        matchedIds.forEach((id) => {
            let cur = byId.get(id);
            while (cur && cur.parentId) {
                visible.add(cur.parentId);
                cur = byId.get(cur.parentId);
            }
        });
        return visible;
    }, [nodes, matchedIds, query]);

    const handleDeleteWithConfirm = (id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;

        let count = 0;
        let frontier = [id];
        while (frontier.length) {
            const kids = nodes.filter((n) => frontier.includes(n.parentId));
            count += kids.length;
            frontier = kids.map((k) => k.id);
        }

        const message = count > 0
            ? `Delete "${node.title}" and its ${count} nested item${count === 1 ? '' : 's'}?`
            : `Delete "${node.title}"?`;
        if (confirm(message)) onDelete(id);
    };

    return (
        <main className="flex-1 overflow-hidden pt-20 px-4 md:px-6 pb-8 bg-transparent text-stone-800 font-sans">
            <div className="h-full max-w-4xl mx-auto flex flex-col gap-4">
                <header className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 transition mb-1.5"
                        >
                            <i className="fa-solid fa-arrow-left text-[9px]"></i> Vault
                        </button>
                        <h1 className="font-cormorant italic text-4xl text-stone-850">Bookmarks</h1>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">
                            {nodes.length} item{nodes.length === 1 ? '' : 's'} · {rootNodes.length} root{rootNodes.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Switcher: Graph / Tree */}
                        <div className="flex items-center bg-white/70 border border-stone-200/60 rounded-full p-0.5">
                            <button
                                onClick={() => setViewMode('graph')}
                                title="Interactive Graph View"
                                className={`h-8 px-3 rounded-full text-[10px] font-mono uppercase tracking-wider transition flex items-center gap-1.5 ${viewMode === 'graph' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-700'}`}
                            >
                                <i className="fa-solid fa-circle-nodes text-[10px]"></i>
                                <span>Graph</span>
                            </button>
                            <button
                                onClick={() => setViewMode('tree')}
                                title="List Tree View"
                                className={`h-8 px-3 rounded-full text-[10px] font-mono uppercase tracking-wider transition flex items-center gap-1.5 ${viewMode === 'tree' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-700'}`}
                            >
                                <i className="fa-solid fa-folder-tree text-[10px]"></i>
                                <span>Tree</span>
                            </button>
                        </div>

                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-[11px]"></i>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search bookmarks"
                                className="w-48 h-9 rounded-full bg-white/70 border border-stone-200/60 pl-9 pr-3 text-xs text-stone-700 placeholder:text-stone-400 outline-none focus:border-stone-300"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setViewMode('tree');
                                setAddingParentId('root');
                            }}
                            className="h-9 px-3 rounded-full bg-stone-800 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-stone-700 transition flex items-center gap-2 shrink-0"
                        >
                            <i className="fa-solid fa-plus text-[10px]"></i> New Root
                        </button>
                    </div>
                </header>

                <div className="flex-1 min-h-0 bg-white/58 backdrop-blur-xl border border-stone-200/45 shadow-sm rounded-[28px] overflow-hidden flex flex-col p-4 md:p-5">
                    {viewMode === 'graph' ? (
                        <div className="flex-1 min-h-0 w-full h-full">
                            <BookmarksGraphView
                                nodes={nodes}
                                query={query}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-y-auto scroll-hidden">
                            {addingParentId === 'root' && (
                                <div className="pb-2">
                                    <NodeForm
                                        submitLabel="Add"
                                        onSubmit={(vals) => { onAdd('', vals); setAddingParentId(''); }}
                                        onCancel={() => setAddingParentId('')}
                                    />
                                </div>
                            )}

                            {rootNodes.filter((n) => !visibleIds || visibleIds.has(n.id)).map((node) => (
                                <BookmarkRow
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    childrenByParent={childrenByParent}
                                    visibleIds={visibleIds}
                                    matchedIds={matchedIds}
                                    onAdd={onAdd}
                                    onUpdate={onUpdate}
                                    onDelete={handleDeleteWithConfirm}
                                    editingId={editingId}
                                    setEditingId={setEditingId}
                                    addingParentId={addingParentId}
                                    setAddingParentId={setAddingParentId}
                                />
                            ))}

                            {rootNodes.length === 0 && addingParentId !== 'root' && (
                                <div className="flex flex-col items-center justify-center text-center py-16">
                                    <div className="w-11 h-11 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 mb-4">
                                        <i className="fa-solid fa-diagram-project text-base"></i>
                                    </div>
                                    <h2 className="font-cormorant italic text-2xl text-stone-800 mb-1.5">an empty vault</h2>
                                    <p className="text-xs text-stone-400 max-w-xs leading-relaxed mb-5">
                                        Start a root item: a project, or place, then nest folders and links underneath it.
                                    </p>
                                    <button
                                        onClick={() => setAddingParentId('root')}
                                        className="h-9 px-4 rounded-full bg-stone-800 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-stone-700 transition"
                                    >
                                        Create first item
                                    </button>
                                </div>
                            )}

                            {query.trim() && visibleIds && visibleIds.size === 0 && (
                                <p className="text-center py-10 text-[10px] font-mono uppercase tracking-wider text-stone-400">No matches found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
