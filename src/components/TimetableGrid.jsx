import React, { useRef, useEffect, useState } from 'react';


const CATEGORY_COLORS = {
    work: { border: 'border-rose-200/50', bg: 'bg-rose-50/20', text: 'text-rose-700', labelBg: 'bg-rose-100/50' },
    health: { border: 'border-emerald-200/50', bg: 'bg-emerald-50/20', text: 'text-emerald-700', labelBg: 'bg-emerald-100/50' },
    routine: { border: 'border-amber-200/50', bg: 'bg-amber-50/20', text: 'text-amber-700', labelBg: 'bg-amber-100/50' },
    personal: { border: 'border-indigo-200/50', bg: 'bg-indigo-50/20', text: 'text-indigo-700', labelBg: 'bg-indigo-100/50' },
    sleep: { border: 'border-stone-300/40', bg: 'bg-stone-100/30', text: 'text-stone-500', labelBg: 'bg-stone-250/50' }
};

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];

// ──────────────────────────────────────────────
// Habits Widget — grouped accordion
// ──────────────────────────────────────────────
function HabitsWidget({ habitGroups, onToggleItem }) {
    const [openGroups, setOpenGroups] = useState({});

    // Default all groups to open when they first arrive
    useEffect(() => {
        if (habitGroups.length === 0) return;
        setOpenGroups(prev => {
            const next = { ...prev };
            habitGroups.forEach(g => {
                if (!(g.id in next)) next[g.id] = true;
            });
            return next;
        });
    }, [habitGroups.length]);

    const toggleGroup = (id) =>
        setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

    const totalDone = habitGroups.reduce((acc, g) => acc + g.items.filter(i => i.done).length, 0);
    const totalItems = habitGroups.reduce((acc, g) => acc + g.items.length, 0);

    if (habitGroups.length === 0) return null;

    return (
        <div className="border border-stone-200/40 bg-white/42 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-3">
            {/* Widget header */}
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400">Habits</h3>
                <span className="text-[9px] font-mono text-stone-500 bg-stone-100/70 px-2 py-0.5 rounded-full">
                    {totalDone}/{totalItems}
                </span>
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-2">
                {habitGroups.map(group => {
                    const done = group.items.filter(i => i.done).length;
                    const isOpen = openGroups[group.id] !== false;
                    const allDone = done === group.items.length;

                    return (
                        <div key={group.id} className="flex flex-col gap-0">
                            {/* Section header */}
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className="flex items-center justify-between w-full py-1.5 text-left group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px]">{group.icon}</span>
                                    <span className={`text-[10px] font-mono uppercase tracking-wider font-medium transition-colors ${allDone ? 'text-stone-400' : 'text-stone-600'}`}>
                                        {group.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full transition-colors ${allDone ? 'bg-emerald-100/60 text-emerald-600' : 'bg-stone-100/70 text-stone-400'}`}>
                                        {done}/{group.items.length}
                                    </span>
                                    <i className={`fa-solid fa-chevron-down text-[8px] text-stone-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
                                </div>
                            </button>

                            {/* Items */}
                            {isOpen && (
                                <div className="flex flex-col gap-1.5 pl-4 pb-1.5 border-l border-stone-100 ml-1.5">
                                    {group.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-2.5">
                                            <button
                                                onClick={() => onToggleItem(item.id)}
                                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${item.done ? 'bg-stone-600 border-stone-600 text-white' : 'border-stone-300 bg-white hover:border-stone-400'}`}
                                            >
                                                {item.done && <i className="fa-solid fa-check text-[7px]"></i>}
                                            </button>
                                            <span className={`text-[11px] font-sans leading-snug transition-colors ${item.done ? 'line-through text-stone-350' : 'text-stone-650'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function TimetableGrid({
    selectedDate,
    currentView,
    filter = 'all',
    checklistDatabase = {},
    defaultMorningItems = [],
    defaultHabitGroups = [],
    dailyScheduleTemplate = [],
    currentFloatHour = 0,
    getWeekDays,
    formatHour,
    onOpenCreateModal,
    onOpenEditModal,
    onMoveScheduleBlock,
    onToggleZenItem
}) {
    const activeDateStr = selectedDate.toLocaleDateString('sv-SE');
    const weekDays = getWeekDays(selectedDate);
    const timelineContainerRef = useRef(null);
    const weekTimelineRef = useRef(null);

    const getHourOffset = (h) => {
        return h >= 6 ? h - 6 : h + 18;
    };

    // Auto-scroll timeline to current time on load (centered 2 hours before)
    useEffect(() => {
        const ROW_HEIGHT = 68;
        const targetHour = currentFloatHour > 0 ? Math.max(0, currentFloatHour - 2) : 8;
        const targetScrollTop = getHourOffset(targetHour) * ROW_HEIGHT;

        if (currentView === 'day' && timelineContainerRef.current) {
            timelineContainerRef.current.scrollTop = targetScrollTop;
        } else if (currentView === 'week' && weekTimelineRef.current) {
            weekTimelineRef.current.scrollTop = targetScrollTop;
        }
    }, [currentView, currentFloatHour]);

    const formatHourLabel = (h) => {
        const suffix = h >= 12 ? 'PM' : 'AM';
        let display = h % 12;
        if (display === 0) display = 12;
        return `${display}:00 ${suffix}`;
    };

    // Filter events based on active category toggle and selected date
    const getEventsForDate = (dateStr) => {
        const specific = dailyScheduleTemplate.filter(e => e.date === dateStr);
        const templates = dailyScheduleTemplate.filter(e => !e.date);

        // Filter out templates that have a specific override marked as 'cancelled'
        const cancelledIds = specific.filter(e => e.status === 'cancelled').map(e => e.templateId);
        const activeTemplates = templates.filter(e => !cancelledIds.includes(e.id));
        const activeSpecific = specific.filter(e => e.status !== 'cancelled');

        const merged = [...activeSpecific, ...activeTemplates];

        return merged.filter(e => {
            if (filter === 'all') return true;
            return e.type === filter;
        }).sort((a, b) => a.startHour - b.startHour);
    };

    const handleDragStart = (e, eventId) => {
        e.dataTransfer.setData('text/plain', eventId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDropOnDay = (e, targetDateStr) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData('text/plain');
        const block = dailyScheduleTemplate.find(b => b.id === eventId);
        if (block && onMoveScheduleBlock) {
            onMoveScheduleBlock(eventId, block.startHour, block.endHour, targetDateStr);
        }
    };

    // 1. DAY VIEW
    // ==========================================
    const renderDayView = () => {
        const dayEvents = getEventsForDate(activeDateStr);
        const rawChecklist = checklistDatabase[activeDateStr] || defaultMorningItems;

        // Build groups: merge done state from checklist database into defaultHabitGroups
        const habitGroups = defaultHabitGroups.map(group => ({
            ...group,
            items: group.items.map(item => {
                const dbItem = rawChecklist.find(i => i.id === item.id);
                return dbItem ? { ...item, done: dbItem.done } : item;
            })
        }));

        const deadlines = dayEvents.filter(e => e.type === 'deadline');
        const activeTimeBlocks = dayEvents.filter(e => e.type !== 'deadline');
        const isToday = activeDateStr === new Date().toLocaleDateString('sv-SE');

        const ROW_HEIGHT = 68; // pixels per hour block

        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden animate-page-fade">
                {/* Left side: Widgets (Habits & Deadlines) */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto scroll-hidden pr-1 pb-12 select-none">
                    
                    {/* Widget A: Habits — Grouped Accordion */}
                    {(filter === 'all' || filter === 'habit') && (
                        <HabitsWidget
                            habitGroups={habitGroups}
                            onToggleItem={(id) => onToggleZenItem(activeDateStr, id)}
                        />
                    )}

                    {/* Widget B: Today's Deadlines */}
                    {(filter === 'all' || filter === 'deadline') && (
                        <div className="border border-stone-200/40 bg-white/42 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400">Deadlines</h3>
                                <span className="text-[9px] font-mono text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100/50 uppercase font-bold">Alert</span>
                            </div>
                            {deadlines.length === 0 ? (
                                <p className="text-[10px] font-mono text-stone-400 italic">No deadlines due today.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {deadlines.map(ev => {
                                        const theme = CATEGORY_COLORS[ev.bucket] || CATEGORY_COLORS.work;
                                        return (
                                            <div
                                                key={ev.id}
                                                onClick={() => onOpenEditModal(ev)}
                                                className="group relative p-3 border-l-[3px] border-l-red-400 border border-stone-200/40 bg-white/90 rounded-r-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col gap-1"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[9px] font-mono tracking-wider uppercase text-red-500 font-bold">
                                                        due {formatHour(ev.startHour)}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-sans font-medium text-stone-850">
                                                    {ev.name}
                                                </h4>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side: 24-Hour Plotted Scrollable Timeline */}
                <div className="lg:col-span-8 h-full flex flex-col overflow-hidden pb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400">Timeline</h3>
                        <button
                            onClick={() => onOpenCreateModal(activeDateStr)}
                            className="text-[10px] font-mono tracking-wider uppercase text-stone-400 hover:text-stone-750 transition flex items-center gap-1 bg-white/40 border border-stone-200/40 px-2.5 py-1 rounded-lg"
                        >
                            <i className="fa-solid fa-plus text-[9px]"></i> Add Event
                        </button>
                    </div>

                    {/* Timeline grid content */}
                    <div 
                        ref={timelineContainerRef}
                        className="flex-1 overflow-y-auto border border-stone-200/42 bg-white/42 backdrop-blur-md rounded-2xl p-5 scroll-hidden relative select-none"
                    >
                        {/* Interactive Plotted Area */}
                        <div className="relative w-full h-[1632px]">
                            {/* Grid Hour Labels (No horizontal lines) */}
                            {HOURS.map((h, i) => (
                                <div 
                                    key={h} 
                                    className="absolute left-0 right-0 flex justify-between select-none pointer-events-none"
                                    style={{ 
                                        top: `${i * ROW_HEIGHT}px`, 
                                        height: `${ROW_HEIGHT}px` 
                                    }}
                                >
                                    {/* Hour label */}
                                    <span className="text-[10px] font-mono text-stone-400/85 -mt-2 bg-transparent pr-2 select-none w-[64px] text-right">
                                        {formatHourLabel(h)}
                                    </span>
                                </div>
                            ))}

                            {/* Clickable Area helper columns */}
                            <div className="absolute left-[80px] right-0 top-0 bottom-0 z-0">
                                {HOURS.map((h, i) => (
                                    <div 
                                        key={h}
                                        onClick={() => onOpenCreateModal(activeDateStr, h)}
                                        className="absolute left-0 right-0 hover:bg-stone-50/10 cursor-cell transition-all"
                                        style={{ 
                                            top: `${i * ROW_HEIGHT}px`, 
                                            height: `${ROW_HEIGHT}px` 
                                        }}
                                        title={`Click to add block at ${formatHourLabel(h)}`}
                                    />
                                ))}
                            </div>

                            {/* Plotted Events (Absolute positioned inside the grid) */}
                            <div className="absolute left-[80px] right-0 top-0 bottom-0 pointer-events-none z-10">
                                {activeTimeBlocks.map(ev => {
                                    const theme = CATEGORY_COLORS[ev.bucket] || CATEGORY_COLORS.work;
                                    const top = getHourOffset(ev.startHour) * ROW_HEIGHT;
                                    const height = Math.max((getHourOffset(ev.endHour) - getHourOffset(ev.startHour)) * ROW_HEIGHT, 40); // minimum height

                                    return (
                                        <div
                                            key={ev.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenEditModal(ev);
                                            }}
                                            className={`absolute left-1 right-1 border-l-2 p-2 ${theme.border} ${theme.bg} rounded-lg shadow-sm hover:shadow-md cursor-pointer pointer-events-auto transition-all flex flex-col justify-center gap-0.5 overflow-hidden`}
                                            style={{ 
                                                top: `${top}px`, 
                                                height: `${height}px` 
                                            }}
                                        >
                                            <h4 className="text-[12px] font-sans font-normal text-stone-850 truncate">
                                                {ev.name}
                                            </h4>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Current Time Indicator Line */}
                            {isToday && (
                                <div
                                    className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                                    style={{ top: `${getHourOffset(currentFloatHour) * ROW_HEIGHT}px` }}
                                >
                                    {/* Time label in the hour column */}
                                    <span className="w-[80px] shrink-0 text-[8px] font-mono text-rose-500 pr-2 text-right select-none">
                                        {formatHour(currentFloatHour)}
                                    </span>
                                    {/* Red line in the events area only */}
                                    <span className="flex-1 border-t-2 border-rose-500/85" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 2. WEEK VIEW
    // ==========================================
    const renderWeekView = () => {
        const ROW_HEIGHT = 68;
        const isWeekOfToday = weekDays.some(day => day.toLocaleDateString('sv-SE') === new Date().toLocaleDateString('sv-SE'));

        return (
            <div className="flex flex-col h-full overflow-hidden animate-page-fade">
                {/* Header row: Day names and dates (padded with 80px for alignment) */}
                <div className="flex pl-[80px] border-b border-stone-200/40 pb-3 mb-3 select-none">
                    {weekDays.map((day) => {
                        const dateStr = day.toLocaleDateString('sv-SE');
                        const isToday = dateStr === new Date().toLocaleDateString('sv-SE');
                        return (
                            <div key={dateStr} className="flex-1 text-center flex flex-col items-center justify-center py-1">
                                <span className={`text-[10px] font-mono tracking-wider uppercase ${isToday ? 'text-rose-500 font-bold' : 'text-stone-400'}`}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className={`text-base font-cormorant font-normal italic mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white shadow-sm font-semibold' : 'text-stone-750'}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* 24-Hour Scrollable Week Grid */}
                <div 
                    ref={weekTimelineRef}
                    className="flex-1 overflow-y-auto border border-stone-200/42 bg-white/42 backdrop-blur-md rounded-2xl p-4 scroll-hidden relative select-none"
                >
                    <div className="relative w-full h-[1632px] flex">
                        {/* Left Hour labels column (expanded to 80px width, padding on right) */}
                        <div className="w-[80px] shrink-0 relative select-none pointer-events-none pr-4">
                            {HOURS.map((h, i) => (
                                <span 
                                    key={h} 
                                    className="absolute right-4 text-[10px] font-mono text-stone-400/80 -mt-2 bg-transparent pr-1 select-none w-[64px] text-right"
                                    style={{ top: `${i * ROW_HEIGHT}px` }}
                                >
                                    {formatHourLabel(h)}
                                </span>
                            ))}
                        </div>

                        {/* 7 Columns Track Grid (No horizontal grid lines) */}
                        <div className="flex-grow flex relative">
                            {/* Columns */}
                            {weekDays.map((day) => {
                                const dateStr = day.toLocaleDateString('sv-SE');
                                const dayEvents = getEventsForDate(dateStr).filter(e => e.type !== 'deadline');
                                const isToday = dateStr === new Date().toLocaleDateString('sv-SE');

                                return (
                                    <div 
                                        key={dateStr}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropOnDay(e, dateStr)}
                                        className={`flex-1 h-full relative border-r border-stone-200/20 last:border-r-0 transition-all ${isToday ? 'bg-rose-50/5' : ''}`}
                                    >
                                        {/* Click-to-add empty block triggers */}
                                        {HOURS.map((h, i) => (
                                            <div 
                                                key={h}
                                                onClick={() => onOpenCreateModal(dateStr, h)}
                                                className="absolute left-0 right-0 hover:bg-stone-50/10 cursor-cell transition-all"
                                                style={{ 
                                                    top: `${i * ROW_HEIGHT}px`, 
                                                    height: `${ROW_HEIGHT}px` 
                                                }}
                                            />
                                        ))}

                                        {/* Plotted events inside this day column */}
                                        {dayEvents.map(ev => {
                                            const theme = CATEGORY_COLORS[ev.bucket] || CATEGORY_COLORS.work;
                                            const top = getHourOffset(ev.startHour) * ROW_HEIGHT;
                                            const height = Math.max((getHourOffset(ev.endHour) - getHourOffset(ev.startHour)) * ROW_HEIGHT, 40);

                                            return (
                                                <div
                                                    key={ev.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, ev.id)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenEditModal(ev);
                                                    }}
                                                    className={`absolute left-0.5 right-0.5 border-l-2 p-1.5 ${theme.border} ${theme.bg} rounded-lg shadow-sm hover:shadow-md cursor-pointer pointer-events-auto transition-all flex flex-col justify-center gap-0.5 overflow-hidden z-10`}
                                                    style={{ 
                                                        top: `${top}px`, 
                                                        height: `${height}px` 
                                                    }}
                                                >
                                                    <h4 className="text-[10px] font-sans font-medium text-stone-850 truncate leading-normal">
                                                        {ev.name}
                                                    </h4>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}

                            {/* Current Time indicator line fully spanning all 7 columns */}
                            {isWeekOfToday && (
                                <div
                                    className="absolute right-0 flex items-center pointer-events-none z-20"
                                    style={{ top: `${getHourOffset(currentFloatHour) * ROW_HEIGHT}px`, left: '-80px' }}
                                >
                                    {/* Time label in the hour column */}
                                    <span className="w-[80px] shrink-0 text-[8px] font-mono text-rose-500 pr-2 text-right select-none">
                                        {formatHour(currentFloatHour)}
                                    </span>
                                    {/* Red line in the events area only */}
                                    <span className="flex-1 border-t-2 border-rose-500/85" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 3. MONTH VIEW
    // ==========================================
    const renderMonthView = () => {
        // Compute 35 grid days starting from the beginning of the month's week
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Start date of the grid (Sunday before first day)
        const gridStart = new Date(firstDay);
        gridStart.setDate(1 - firstDay.getDay());

        const days = [];
        for (let i = 0; i < 35; i++) {
            const d = new Date(gridStart);
            d.setDate(gridStart.getDate() + i);
            days.push(d);
        }

        return (
            <div className="flex flex-col h-full border border-stone-200/50 rounded-2xl overflow-hidden bg-white/40 backdrop-blur-md animate-page-fade select-none">
                {/* Days of Week Headers */}
                <div className="grid grid-cols-7 border-b border-stone-200/50 bg-stone-50/50 py-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <span key={d} className="text-[9px] font-mono tracking-wider uppercase text-stone-400 text-center font-medium">
                            {d}
                        </span>
                    ))}
                </div>

                {/* Day Grid cells */}
                <div className="grid grid-cols-7 flex-1">
                    {days.map((day, idx) => {
                        const dateStr = day.toLocaleDateString('sv-SE');
                        const dayEvents = getEventsForDate(dateStr);
                        const isCurrentMonth = day.getMonth() === month;
                        const isToday = dateStr === new Date().toLocaleDateString('sv-SE');

                        // Group dot colors
                        const hasBlocks = dayEvents.some(e => e.type === 'block');
                        const hasMeetings = dayEvents.some(e => e.type === 'meeting');
                        const hasDeadlines = dayEvents.some(e => e.type === 'deadline');

                        return (
                            <div
                                key={idx}
                                className={`border-b border-r border-stone-200/40 p-2 flex flex-col justify-between hover:bg-stone-50/40 transition duration-150 relative ${isCurrentMonth ? 'text-stone-700' : 'text-stone-300'} ${isToday ? 'bg-stone-50/30' : ''}`}
                                style={{ minHeight: '80px' }}
                            >
                                <span className={`text-[10px] font-mono ${isToday ? 'bg-stone-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold' : ''}`}>
                                    {day.getDate()}
                                </span>

                                {/* Mini Dot Badges */}
                                <div className="flex gap-1 justify-center mt-1.5 h-1.5">
                                    {hasBlocks && <span className="w-1 h-1 rounded-full bg-rose-400" title="Time Block" />}
                                    {hasMeetings && <span className="w-1 h-1 rounded-full bg-indigo-400" title="Meeting" />}
                                    {hasDeadlines && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" title="Deadline" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render corresponding view
    switch (currentView) {
        case 'week':
            return renderWeekView();
        case 'month':
            return renderMonthView();
        case 'day':
        default:
            return renderDayView();
    }
}
