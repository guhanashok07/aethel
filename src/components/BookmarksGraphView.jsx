import React, { useRef, useEffect, useState, useMemo } from 'react';

export default function BookmarksGraphView({ nodes = [], query = '', onSelectNode }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDraggingPanRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const draggedNodeRef = useRef(null);
    const animFrameRef = useRef(null);

    // Color palette matching Aethel's muted editorial tones
    const FOLDER_COLORS = ['#bd5338', '#5c6e4f', '#a87834', '#4a433b', '#6b7280'];
    const LINK_COLOR = '#44403c';

    // Build graph data: nodes and edges
    const { graphNodes, graphEdges } = useMemo(() => {
        if (!nodes || nodes.length === 0) {
            return { graphNodes: [], graphEdges: [] };
        }

        const folderIndexMap = new Map();
        let folderCounter = 0;

        const gNodes = nodes.map((n) => {
            const isConnector = n.kind === 'connector' || !n.url;
            let folderColor = '#4a433b';
            if (isConnector) {
                if (!folderIndexMap.has(n.id)) {
                    folderIndexMap.set(n.id, folderCounter++);
                }
                folderColor = FOLDER_COLORS[folderIndexMap.get(n.id) % FOLDER_COLORS.length];
            } else if (n.parentId && folderIndexMap.has(n.parentId)) {
                folderColor = FOLDER_COLORS[folderIndexMap.get(n.parentId) % FOLDER_COLORS.length];
            }

            return {
                id: n.id,
                title: n.title,
                url: n.url || '',
                parentId: n.parentId || '',
                isConnector,
                color: folderColor,
                radius: isConnector ? (n.parentId ? 16 : 22) : 10,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0
            };
        });

        const nodeMap = new Map(gNodes.map((n) => [n.id, n]));
        const gEdges = [];

        gNodes.forEach((n) => {
            if (n.parentId && nodeMap.has(n.parentId)) {
                gEdges.push({
                    source: nodeMap.get(n.parentId),
                    target: n
                });
            }
        });

        // Initialize positions in a circular layout
        const total = gNodes.length;
        const radius = Math.min(260, 20 + total * 14);
        gNodes.forEach((n, idx) => {
            const angle = (idx / total) * Math.PI * 2;
            const dist = n.isConnector ? radius * 0.45 : radius * (0.8 + (idx % 3) * 0.12);
            n.x = Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
            n.y = Math.sin(angle) * dist + (Math.random() - 0.5) * 20;
        });

        return { graphNodes: gNodes, graphEdges: gEdges };
    }, [nodes]);

    // Keep physics simulation running
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isRunning = true;

        const simulate = () => {
            if (!isRunning) return;

            // Physics step
            const repulsion = 500;
            const springLength = 80;
            const springK = 0.035;
            const centerGravity = 0.008;
            const damping = 0.86;

            // Node repulsion
            for (let i = 0; i < graphNodes.length; i++) {
                const n1 = graphNodes[i];
                for (let j = i + 1; j < graphNodes.length; j++) {
                    const n2 = graphNodes[j];
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const distSq = dx * dx + dy * dy || 1;
                    const dist = Math.sqrt(distSq);
                    const force = repulsion / distSq;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    n1.vx -= fx;
                    n1.vy -= fy;
                    n2.vx += fx;
                    n2.vy += fy;
                }
            }

            // Edge springs
            for (let i = 0; i < graphEdges.length; i++) {
                const { source, target } = graphEdges[i];
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const displacement = dist - springLength;
                const fx = (dx / dist) * displacement * springK;
                const fy = (dy / dist) * displacement * springK;

                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            }

            // Center gravity and velocity integration
            for (let i = 0; i < graphNodes.length; i++) {
                const n = graphNodes[i];
                if (draggedNodeRef.current && draggedNodeRef.current.id === n.id) {
                    continue;
                }
                n.vx -= n.x * centerGravity;
                n.vy -= n.y * centerGravity;

                n.vx *= damping;
                n.vy *= damping;

                n.x += n.vx;
                n.y += n.vy;
            }

            // Render step
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            // Center of canvas plus pan and zoom
            ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
            ctx.scale(zoom, zoom);

            const needle = query.trim().toLowerCase();

            // Draw edges
            graphEdges.forEach(({ source, target }) => {
                const isHovered = (hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id));
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = isHovered ? 'rgba(120, 113, 108, 0.65)' : 'rgba(214, 211, 209, 0.5)';
                ctx.lineWidth = isHovered ? 2 : 1.2;
                ctx.stroke();
            });

            // Draw nodes
            graphNodes.forEach((n) => {
                const isHovered = hoveredNode && hoveredNode.id === n.id;
                const isSelected = selectedNode && selectedNode.id === n.id;
                const matchesQuery = needle ? n.title.toLowerCase().includes(needle) || (n.url && n.url.toLowerCase().includes(needle)) : true;
                const isDimmed = needle && !matchesQuery;

                ctx.save();
                ctx.globalAlpha = isDimmed ? 0.25 : 1.0;

                // Outer halo if hovered or matches query
                if (isHovered || isSelected || (needle && matchesQuery)) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
                    ctx.fillStyle = (needle && matchesQuery) ? 'rgba(225, 29, 72, 0.18)' : 'rgba(120, 113, 108, 0.15)';
                    ctx.fill();
                }

                // Node circle
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                if (n.isConnector) {
                    ctx.fillStyle = n.color;
                    ctx.fill();
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = '#ffffff';
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = n.color || LINK_COLOR;
                    ctx.stroke();
                }

                // Inner dot for links
                if (!n.isConnector) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = n.color || LINK_COLOR;
                    ctx.fill();
                }

                // Label
                ctx.font = n.isConnector ? '600 11px system-ui, sans-serif' : '400 10px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                const labelY = n.y + n.radius + 4;
                const displayTitle = n.title.length > 24 ? n.title.slice(0, 22) + '...' : n.title;

                // Subtle text background pill for readability
                const textWidth = ctx.measureText(displayTitle).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(n.x - textWidth / 2 - 4, labelY - 1, textWidth + 8, 14);

                ctx.fillStyle = n.isConnector ? '#1c1917' : '#57534e';
                ctx.fillText(displayTitle, n.x, labelY);

                ctx.restore();
            });

            ctx.restore();

            animFrameRef.current = requestAnimationFrame(simulate);
        };

        animFrameRef.current = requestAnimationFrame(simulate);

        return () => {
            isRunning = false;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [graphNodes, graphEdges, zoom, pan, hoveredNode, selectedNode, query]);

    // Resize canvas to match display size with HiDPI support
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Screen coordinate to graph coordinate
    const toGraphCoords = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const graphX = (screenX - centerX - pan.x) / zoom;
        const graphY = (screenY - centerY - pan.y) / zoom;
        return { x: graphX, y: graphY };
    };

    const findNodeAt = (graphX, graphY) => {
        for (let i = graphNodes.length - 1; i >= 0; i--) {
            const n = graphNodes[i];
            const dx = graphX - n.x;
            const dy = graphY - n.y;
            if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
                return n;
            }
        }
        return null;
    };

    const handleMouseDown = (e) => {
        const { x, y } = toGraphCoords(e.clientX, e.clientY);
        const node = findNodeAt(x, y);

        if (node) {
            draggedNodeRef.current = node;
        } else {
            isDraggingPanRef.current = true;
            panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }
    };

    const handleMouseMove = (e) => {
        const { x, y } = toGraphCoords(e.clientX, e.clientY);

        if (draggedNodeRef.current) {
            draggedNodeRef.current.x = x;
            draggedNodeRef.current.y = y;
            draggedNodeRef.current.vx = 0;
            draggedNodeRef.current.vy = 0;
            return;
        }

        if (isDraggingPanRef.current) {
            setPan({
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y
            });
            return;
        }

        const node = findNodeAt(x, y);
        setHoveredNode(node);
    };

    const handleMouseUp = () => {
        draggedNodeRef.current = null;
        isDraggingPanRef.current = false;
    };

    const handleClick = (e) => {
        const { x, y } = toGraphCoords(e.clientX, e.clientY);
        const node = findNodeAt(x, y);
        if (node) {
            setSelectedNode(node);
            if (onSelectNode) onSelectNode(node);
            if (node.url) {
                window.open(node.url, '_blank', 'noopener,noreferrer');
            }
        } else {
            setSelectedNode(null);
        }
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
        setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomDelta)));
    };

    const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev * 1.2));
    const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev / 1.2));
    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div ref={containerRef} className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden select-none bg-stone-50/50">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                onWheel={handleWheel}
                className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            {/* Floating Top Stats */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/60 shadow-xs pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 font-medium">
                    {graphNodes.length} nodes · {graphEdges.length} connections
                </span>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/85 backdrop-blur-md p-1 rounded-full border border-stone-200/60 shadow-xs">
                <button
                    onClick={handleZoomIn}
                    title="Zoom in"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition text-xs"
                >
                    <i className="fa-solid fa-plus"></i>
                </button>
                <button
                    onClick={handleZoomOut}
                    title="Zoom out"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition text-xs"
                >
                    <i className="fa-solid fa-minus"></i>
                </button>
                <button
                    onClick={handleReset}
                    title="Reset view"
                    className="px-2.5 h-7 rounded-full flex items-center justify-center text-[10px] font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
                >
                    Reset
                </button>
            </div>

            {/* Hover Tooltip / Detail Card */}
            {hoveredNode && (
                <div className="absolute bottom-3 left-3 max-w-sm bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-stone-200/80 shadow-md pointer-events-none transition-all animate-page-fade">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hoveredNode.color || '#44403c' }}
                        />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
                            {hoveredNode.isConnector ? 'Category Hub' : 'Bookmark Link'}
                        </span>
                    </div>
                    <div className="text-xs font-semibold text-stone-850">
                        {hoveredNode.title}
                    </div>
                    {hoveredNode.url && (
                        <div className="text-[10px] text-stone-500 font-mono truncate mt-0.5">
                            {hoveredNode.url}
                        </div>
                    )}
                    <div className="text-[9px] text-stone-400 font-mono mt-1.5 flex items-center gap-1">
                        {hoveredNode.url ? 'Click to open in new tab' : 'Category folder'}
                    </div>
                </div>
            )}
        </div>
    );
}
