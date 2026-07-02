import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_HEIGHT = 60;
const MIN_WIDTH = 200;
export const DEFAULT_HEIGHT = 240;
export const DEFAULT_WIDTH = 280;

export default function ContentBlock({
    block,
    onUpdate,
    onDelete,
    isActive,
    onFocus,
    fontSize = 'medium',
    canvasWidth = 800
}) {
    const editorRef = useRef(null);
    const blockRef = useRef(null);
    const loadedIdRef = useRef('');
    const saveTimerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [justCreated, setJustCreated] = useState(!block.content);

    // Load content into the editor
    useEffect(() => {
        if (!editorRef.current) return;
        if (loadedIdRef.current !== block.id || document.activeElement !== editorRef.current) {
            editorRef.current.innerHTML = block.content || '';
            loadedIdRef.current = block.id;
        }
    }, [block.id, block.content]);

    // Entrance animation
    useEffect(() => {
        if (justCreated) {
            const timer = setTimeout(() => setJustCreated(false), 500);
            return () => clearTimeout(timer);
        }
    }, [justCreated]);

    // Cleanup save timer
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const queueSave = useCallback(() => {
        if (!editorRef.current) return;
        const content = editorRef.current.innerHTML;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            onUpdate(block.id, { content });
        }, 350);
    }, [block.id, onUpdate]);

    const flushSave = useCallback(() => {
        if (!editorRef.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        onUpdate(block.id, { content: editorRef.current.innerHTML });
    }, [block.id, onUpdate]);

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        queueSave();
    };

    // Drag to move
    const handleDragStart = (e) => {
        // Don't drag if clicking on the title input or delete button
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        e.preventDefault();
        setIsDragging(true);
        onFocus?.(block.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = block.x || 0;
        const startTop = block.y || 0;

        const handleMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            const newX = Math.max(0, startLeft + dx);
            const newY = Math.max(0, startTop + dy);
            onUpdate(block.id, { x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Resize drag handler (bottom-right corner)
    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = block.width || DEFAULT_WIDTH;
        const startHeight = block.height || DEFAULT_HEIGHT;

        const handleMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            const newWidth = Math.max(MIN_WIDTH, Math.min(canvasWidth - (block.x || 0), startWidth + dx));
            const newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
            onUpdate(block.id, { width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const blockWidth = block.width || DEFAULT_WIDTH;
    const blockHeight = block.height || DEFAULT_HEIGHT;
    const blockX = block.x || 0;
    const blockY = block.y || 0;

    return (
        <div
            ref={blockRef}
            className={`content-block ${isActive ? 'is-active' : ''} ${justCreated ? 'is-entering' : ''} ${isDragging ? 'is-dragging' : ''} ${isResizing ? 'is-resizing' : ''}`}
            style={{
                position: 'absolute',
                left: `${blockX}px`,
                top: `${blockY}px`,
                width: `${blockWidth}px`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onFocus?.(block.id)}
        >
            {/* Drag handle / header */}
            <div
                className="content-block-handle"
                onMouseDown={handleDragStart}
            >
                <div className="content-block-divider" />
                <div className="content-block-handle-label">
                    <i className="fa-solid fa-grip-vertical text-[9px] opacity-0 group-hover:opacity-100 content-block-grip" />
                </div>
                <div className={`content-block-actions ${isHovered || isActive ? 'is-visible' : ''}`}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(block.id);
                        }}
                        className="content-block-delete"
                        title="Remove sticky"
                    >
                        <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                </div>
            </div>

            {/* Block editor */}
            <div
                className="content-block-editor-wrapper"
                style={{ height: `${blockHeight}px` }}
            >
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={queueSave}
                    onBlur={flushSave}
                    onPaste={handlePaste}
                    onFocus={() => onFocus?.(block.id)}
                    className={`content-block-editor notebook-page-editor is-${fontSize}`}
                    data-placeholder="Start writing..."
                />
            </div>

            {/* Resize handle (bottom-right corner) */}
            <div
                className="content-block-resize-handle"
                onMouseDown={handleResizeStart}
            >
                <div className="content-block-resize-grip" />
            </div>
        </div>
    );
}
