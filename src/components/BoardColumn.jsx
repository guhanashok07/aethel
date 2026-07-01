import React, { useRef, useState } from 'react';
import TaskCard from './TaskCard';

const CURATED_ICONS = [
    'fa-book',
    'fa-laptop',
    'fa-compass',
    'fa-heart',
    'fa-briefcase',
    'fa-gear',
    'fa-mug-hot',
    'fa-lightbulb',
    'fa-star',
    'fa-bullseye',
    'fa-code',
    'fa-dumbbell',
    'fa-wallet',
    'fa-pen-nib',
    'fa-music',
    'fa-umbrella',
    'fa-plane',
    'fa-graduation-cap',
    'fa-calendar',
    'fa-rocket'
];

export default function BoardColumn({
    id,
    title,
    isCustom = false,
    icon = '',
    tasks = [],
    onAddNewTask,
    onUpdateTitle,
    onUpdateIcon,
    onDeleteBucket,
    onDragOverColumn,
    onDragLeaveColumn,
    onDropOnColumn,
    onDragBucketStart,
    onDragBucketEnd,
    // Task card callbacks
    onDragStartTask,
    onDragEndTask,
    onUpdateTaskText,
    onCompleteTask
}) {
    const isCreatingRef = useRef(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    };

    const createTask = (text) => {
        if (isCreatingRef.current) return;
        isCreatingRef.current = true;
        onAddNewTask(text, id);
        setTimeout(() => {
            isCreatingRef.current = false;
        }, 50);
    };

    const handleNewTaskKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const val = e.target.value.trim();
            e.target.value = '';
            createTask(val);
        }
    };

    const handleNewTaskBlur = (e) => {
        if (e.target.value.trim()) {
            const val = e.target.value.trim();
            e.target.value = '';
            createTask(val);
        }
    };

    return (
        <div
            className="flex flex-col min-w-[280px] w-[280px] board-container group/board relative"
            data-bucket={id}
            draggable={isCustom}
            onDragStart={isCustom ? (e) => onDragBucketStart(e, id) : undefined}
            onDragEnd={isCustom ? onDragBucketEnd : undefined}
            onDragOver={(e) => onDragOverColumn(e, id)}
            onDragLeave={onDragLeaveColumn}
            onDrop={(e) => onDropOnColumn(e, id)}
        >
            <div className="flex justify-between items-center mb-4 relative z-40">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isCustom && (
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="w-7 h-7 rounded bg-stone-100/70 hover:bg-stone-200/50 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors duration-200"
                                title="Add/Change icon"
                            >
                                {icon ? (
                                    <i className={`fa-solid ${icon} text-stone-600 text-[11px]`}></i>
                                ) : (
                                    <i className="fa-solid fa-face-smile text-stone-400 text-xs"></i>
                                )}
                            </button>
                            
                            {showIconPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowIconPicker(false)} />
                                    <div className="absolute top-8 left-0 bg-white/95 backdrop-blur-md border border-stone-200 rounded-lg shadow-xl p-2.5 grid grid-cols-5 gap-1.5 z-50 w-44">
                                        {CURATED_ICONS.map((curIcon) => (
                                            <button
                                                key={curIcon}
                                                onClick={() => {
                                                    onUpdateIcon(id, curIcon);
                                                    setShowIconPicker(false);
                                                }}
                                                className={`w-6 h-6 rounded flex items-center justify-center hover:bg-stone-100 transition-colors ${icon === curIcon ? 'bg-stone-100 text-stone-850' : 'text-stone-400 hover:text-stone-600'}`}
                                            >
                                                <i className={`fa-solid ${curIcon} text-[10px]`}></i>
                                            </button>
                                        ))}
                                        {icon && (
                                            <button
                                                onClick={() => {
                                                    onUpdateIcon(id, '');
                                                    setShowIconPicker(false);
                                                }}
                                                className="col-span-5 text-[9px] font-mono uppercase tracking-wider text-stone-400 hover:text-stone-700 text-center py-1 mt-1 border-t border-stone-100"
                                            >
                                                remove icon
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <h3
                        className="text-base font-cormorant font-normal italic flex-1 outline-none text-stone-700 tracking-wide capitalize"
                        contentEditable={isCustom}
                        suppressContentEditableWarning={isCustom}
                        onKeyDown={handleTitleKeyDown}
                        onBlur={(e) => onUpdateTitle(id, e.target.innerText)}
                    >
                        {title}
                    </h3>
                </div>
                {isCustom && (
                    <button
                        onClick={() => onDeleteBucket(id)}
                        className="opacity-0 group-hover/board:opacity-100 text-stone-300 hover:text-red-400 transition-colors duration-200 shrink-0 ml-1"
                    >
                        <i className="fa-solid fa-trash text-[9px]"></i>
                    </button>
                )}
            </div>
            <div className="board-column flex flex-col gap-1.5 min-h-[50px] relative z-10" id={`board-${id}`}>
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={onDragStartTask}
                        onDragEnd={onDragEndTask}
                        onUpdateText={onUpdateTaskText}
                        onComplete={onCompleteTask}
                    />
                ))}
            </div>
            <input
                type="text"
                placeholder="Add task..."
                className="add-task-input mt-2 text-stone-700 relative z-10"
                onKeyPress={handleNewTaskKeyPress}
                onBlur={handleNewTaskBlur}
            />
        </div>
    );
}
