import React, { useState, useRef, useEffect } from 'react';
import BoardColumn from './BoardColumn';

export default function BoardView({
    tasks = [],
    customBuckets = [],
    notesContent = '',
    onUpdateNotes,
    onAddNewTask,
    onUpdateTaskText,
    onCompleteTask,
    onAddNewSpace,
    onUpdateSpaceTitle,
    onUpdateSpaceIcon,
    onDeleteSpace,
    // Drag-and-drop callbacks
    onDragStartTask,
    onDragEndTask,
    onDragOverColumn,
    onDragLeaveColumn,
    onDropOnColumn,
    onDragBucketStart,
    onDragBucketEnd,
    onDragBucketOver,
    onDragBucketDrop
}) {
    const [showNewSpace, setShowNewSpace] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [showNewFocus, setShowNewFocus] = useState(false);
    const [newFocusName, setNewFocusName] = useState('');

    const editorRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Sync database state to editor DOM without cursor jumps
    useEffect(() => {
        if (editorRef.current) {
            if (editorRef.current.innerHTML !== notesContent && document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = notesContent;
                const text = editorRef.current.textContent || '';
                setIsEmpty(text.trim() === '' && !notesContent.includes('<img') && !notesContent.includes('<li'));
            }
        }
    }, [notesContent]);

    const handleNotebookInput = (e) => {
        const content = e.target.innerHTML;
        const text = e.target.textContent || '';
        setIsEmpty(text.trim() === '' && !content.includes('<img') && !content.includes('<li'));
        onUpdateNotes(content);
    };

    const handleNewSpaceKeyPress = (e) => {
        if (e.key === 'Enter' && newSpaceName.trim()) {
            onAddNewSpace(newSpaceName.trim(), 'spaces');
            setNewSpaceName('');
            setShowNewSpace(false);
        }
    };

    const handleNewFocusKeyPress = (e) => {
        if (e.key === 'Enter' && newFocusName.trim()) {
            onAddNewSpace(newFocusName.trim(), 'focus');
            setNewFocusName('');
            setShowNewFocus(false);
        }
    };

    const handleNotebookKeyDown = (e) => {
        if (e.key === ' ') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.startContainer;
                const textContent = container.textContent || '';
                const offset = range.startOffset;
                const prefix = textContent.slice(0, offset);
                if (prefix === '-' || prefix === '*') {
                    e.preventDefault();
                    document.execCommand('delete', false);
                    document.execCommand('insertUnorderedList', false);
                } else if (prefix === '1.') {
                    e.preventDefault();
                    const newRange = document.createRange();
                    newRange.setStart(container, offset - 2);
                    newRange.setEnd(container, offset);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    document.execCommand('delete', false);
                    document.execCommand('insertOrderedList', false);
                }
            }
        }
    };

    const getTasksForBucket = (bucketId) => {
        return tasks
            .filter((t) => t.bucketId === bucketId && t.status === 'active')
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    };

    // Filter buckets by section
    const focusBuckets = customBuckets.filter(b => b.section === 'focus');
    const spacesBuckets = customBuckets.filter(b => b.section !== 'focus');

    return (
        <main id="board-view-container" className="flex-1 overflow-y-auto scroll-hidden px-8 pt-24 pb-16 flex flex-col gap-12 max-w-[1800px] mx-auto w-full bg-transparent">
            
            {/* Focus Section */}
            <section className="flex flex-col w-full dashboard-section">
                <header className="mb-6 flex justify-between items-end border-b border-stone-200/60 pb-3 group">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <h2 className="font-cormorant font-normal italic text-3xl text-stone-700 tracking-wide select-none lowercase">focus</h2>
                    </div>
                    <button
                        onClick={() => setShowNewFocus(true)}
                        className="text-[10px] font-mono tracking-wider uppercase text-stone-400 hover:text-stone-700 flex items-center gap-1.5 transition-colors duration-200"
                    >
                        <i className="fa-solid fa-plus text-[9px]"></i> new board
                    </button>
                </header>
                <div id="focus-content" className="pb-2 flex flex-col md:flex-row gap-6 w-full items-stretch">
                    <div
                        className="flex-1 flex gap-6 items-start overflow-x-auto pb-4 scroll-hidden"
                        id="focus-boards"
                        onDragOver={onDragBucketOver}
                        onDrop={onDragBucketDrop}
                    >
                        <BoardColumn
                            id="focus"
                            title="Immediate"
                            tasks={getTasksForBucket('focus')}
                            onAddNewTask={onAddNewTask}
                            onDragOverColumn={onDragOverColumn}
                            onDragLeaveColumn={onDragLeaveColumn}
                            onDropOnColumn={onDropOnColumn}
                            onDragStartTask={onDragStartTask}
                            onDragEndTask={onDragEndTask}
                            onUpdateTaskText={onUpdateTaskText}
                            onCompleteTask={onCompleteTask}
                        />
                        {focusBuckets.map((bucket) => (
                            <BoardColumn
                                key={bucket.id}
                                id={bucket.id}
                                title={bucket.title}
                                isCustom={true}
                                icon={bucket.icon}
                                onUpdateIcon={onUpdateSpaceIcon}
                                tasks={getTasksForBucket(bucket.id)}
                                onAddNewTask={onAddNewTask}
                                onUpdateTitle={onUpdateSpaceTitle}
                                onDeleteBucket={onDeleteSpace}
                                onDragOverColumn={onDragOverColumn}
                                onDragLeaveColumn={onDragLeaveColumn}
                                onDropOnColumn={onDropOnColumn}
                                onDragBucketStart={onDragBucketStart}
                                onDragBucketEnd={onDragBucketEnd}
                                onDragStartTask={onDragStartTask}
                                onDragEndTask={onDragEndTask}
                                onUpdateTaskText={onUpdateTaskText}
                                onCompleteTask={onCompleteTask}
                            />
                        ))}
                        {showNewFocus && (
                            <div id="new-focus-container" className="min-w-[280px] w-[280px] pt-1">
                                <input
                                    type="text"
                                    autoFocus
                                    value={newFocusName}
                                    onChange={(e) => setNewFocusName(e.target.value)}
                                    placeholder="Name board..."
                                    className="w-full text-sm border-b border-dashed outline-none py-1 bg-transparent text-stone-800"
                                    onKeyPress={handleNewFocusKeyPress}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setNewFocusName('');
                                            setShowNewFocus(false);
                                        }, 150);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Subtle Partition */}
                    <div className="hidden md:block w-[1px] bg-stone-200/50 self-stretch my-2 shrink-0" />

                    {/* Quick Notes Section (Digital Notebook) */}
                    <div className="w-full md:w-[280px] lg:w-[340px] shrink-0 flex flex-col gap-3.5 bg-transparent p-0">
                        <header className="flex justify-between items-center border-b border-stone-200/50 pb-2">
                            <h3 className="font-cormorant font-normal italic text-lg text-stone-700 tracking-wide select-none lowercase">quick notes</h3>
                        </header>
 
                        {/* Continuous Digital Notebook */}
                        <div className="flex-1 flex flex-col min-h-[300px] overflow-y-auto scroll-hidden select-text">
                            <div
                                ref={editorRef}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={handleNotebookInput}
                                onInput={handleNotebookInput}
                                onKeyDown={handleNotebookKeyDown}
                                placeholder="start typing..."
                                className={`notebook-editable w-full h-full flex-1 bg-transparent text-[13.5px] font-normal leading-relaxed text-stone-700 outline-none select-text ${isEmpty ? 'is-empty' : ''}`}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Spaces Section */}
            <section className="flex flex-col w-full dashboard-section">
                <header className="mb-6 flex justify-between items-end border-b border-stone-200/60 pb-3 group">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <h2 className="font-cormorant font-normal italic text-3xl text-stone-700 tracking-wide select-none lowercase">spaces</h2>
                    </div>
                    <button
                        onClick={() => setShowNewSpace(true)}
                        className="text-[10px] font-mono tracking-wider uppercase text-stone-400 hover:text-stone-700 flex items-center gap-1.5 transition-colors duration-200"
                    >
                        <i className="fa-solid fa-plus text-[9px]"></i> new space
                    </button>
                </header>
                <div id="spaces-content">
                    <div
                        className="flex gap-6 items-start overflow-x-auto pb-4 scroll-hidden"
                        id="custom-boards"
                        onDragOver={onDragBucketOver}
                        onDrop={onDragBucketDrop}
                    >
                        {spacesBuckets.map((bucket) => (
                            <BoardColumn
                                key={bucket.id}
                                id={bucket.id}
                                title={bucket.title}
                                isCustom={true}
                                icon={bucket.icon}
                                onUpdateIcon={onUpdateSpaceIcon}
                                tasks={getTasksForBucket(bucket.id)}
                                onAddNewTask={onAddNewTask}
                                onUpdateTitle={onUpdateSpaceTitle}
                                onDeleteBucket={onDeleteSpace}
                                onDragOverColumn={onDragOverColumn}
                                onDragLeaveColumn={onDragLeaveColumn}
                                onDropOnColumn={onDropOnColumn}
                                onDragBucketStart={onDragBucketStart}
                                onDragBucketEnd={onDragBucketEnd}
                                onDragStartTask={onDragStartTask}
                                onDragEndTask={onDragEndTask}
                                onUpdateTaskText={onUpdateTaskText}
                                onCompleteTask={onCompleteTask}
                            />
                        ))}
                        {showNewSpace && (
                            <div id="new-bucket-container" className="min-w-[280px] w-[280px] pt-1">
                                <input
                                    type="text"
                                    autoFocus
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    placeholder="Name space..."
                                    className="w-full text-sm border-b border-dashed outline-none py-1 bg-transparent text-stone-800"
                                    onKeyPress={handleNewSpaceKeyPress}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setNewSpaceName('');
                                            setShowNewSpace(false);
                                        }, 150);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
