import React, { useState } from 'react';
import BoardColumn from './BoardColumn';

export default function BoardView({
    tasks = [],
    customBuckets = [],
    onAddNewTask,
    onUpdateTaskText,
    onCompleteTask,
    onAddNewSpace,
    onUpdateSpaceTitle,
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

    const getTasksForBucket = (bucketId) => {
        return tasks
            .filter((t) => t.bucketId === bucketId && t.status === 'active')
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    };

    // Filter buckets by section
    const focusBuckets = customBuckets.filter(b => b.section === 'focus');
    const spacesBuckets = customBuckets.filter(b => b.section !== 'focus');

    return (
        <main id="board-view-container" class="flex-1 overflow-y-auto px-8 pt-10 pb-16 flex flex-col gap-12 max-w-[1800px] mx-auto w-full">
            
            {/* Focus Section */}
            <section class="flex flex-col w-full dashboard-section">
                <header class="mb-4 flex justify-between items-end border-b border-gray-200/60 pb-2 group">
                    <div class="flex items-center gap-2 cursor-pointer">
                        <h2 class="text-xs font-bold tracking-widest text-gray-500 uppercase">Focus</h2>
                    </div>
                    <button
                        onClick={() => setShowNewFocus(true)}
                        class="text-xs font-medium text-gray-500 hover:text-dark-text flex items-center gap-1.5 transition"
                    >
                        <i class="fa-solid fa-plus text-[10px]"></i> New Board
                    </button>
                </header>
                <div id="focus-content" class="pb-2">
                    <div
                        class="flex gap-6 items-start overflow-x-auto pb-4 scroll-hidden-until-hover"
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
                            <div id="new-focus-container" class="min-w-[280px] w-[280px] pt-1">
                                <input
                                    type="text"
                                    autoFocus
                                    value={newFocusName}
                                    onChange={(e) => setNewFocusName(e.target.value)}
                                    placeholder="Name board..."
                                    class="w-full text-sm border-b border-dashed outline-none py-1 bg-transparent text-stone-800"
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
                </div>
            </section>

            {/* Spaces Section */}
            <section class="flex flex-col w-full dashboard-section">
                <header class="mb-4 flex justify-between items-end border-b border-gray-200/60 pb-2 group">
                    <div class="flex items-center gap-2 cursor-pointer">
                        <h2 class="text-xs font-bold tracking-widest text-gray-500 uppercase">Spaces</h2>
                    </div>
                    <button
                        onClick={() => setShowNewSpace(true)}
                        class="text-xs font-medium text-gray-500 hover:text-dark-text flex items-center gap-1.5 transition"
                    >
                        <i class="fa-solid fa-plus text-[10px]"></i> New Space
                    </button>
                </header>
                <div id="spaces-content">
                    <div
                        class="flex gap-6 items-start overflow-x-auto pb-4 scroll-hidden-until-hover"
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
                            <div id="new-bucket-container" class="min-w-[280px] w-[280px] pt-1">
                                <input
                                    type="text"
                                    autoFocus
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    placeholder="Name space..."
                                    class="w-full text-sm border-b border-dashed outline-none py-1 bg-transparent text-stone-800"
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
