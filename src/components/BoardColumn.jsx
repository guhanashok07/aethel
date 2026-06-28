import React, { useRef } from 'react';
import TaskCard from './TaskCard';

export default function BoardColumn({
    id,
    title,
    isCustom = false,
    tasks = [],
    onAddNewTask,
    onUpdateTitle,
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
            className="flex flex-col min-w-[280px] w-[280px] board-container group/board"
            data-bucket={id}
            draggable={isCustom}
            onDragStart={isCustom ? (e) => onDragBucketStart(e, id) : undefined}
            onDragEnd={isCustom ? onDragBucketEnd : undefined}
            onDragOver={(e) => onDragOverColumn(e, id)}
            onDragLeave={onDragLeaveColumn}
            onDrop={(e) => onDropOnColumn(e, id)}
        >
            <div className="flex justify-between items-center mb-3">
                <h3
                    className="text-sm font-semibold flex-1 outline-none text-stone-800"
                    contentEditable={isCustom}
                    suppressContentEditableWarning={isCustom}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={(e) => onUpdateTitle(id, e.target.innerText)}
                >
                    {title}
                </h3>
                {isCustom && (
                    <button
                        onClick={() => onDeleteBucket(id)}
                        className="opacity-0 group-hover/board:opacity-100 text-gray-300 hover:text-red-400 transition"
                    >
                        <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>
                )}
            </div>
            <div className="board-column flex flex-col gap-1.5 min-h-[50px]" id={`board-${id}`}>
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
                className="add-task-input mt-2 text-stone-700"
                onKeyPress={handleNewTaskKeyPress}
                onBlur={handleNewTaskBlur}
            />
        </div>
    );
}
