import React from 'react';

export default function TimetableGrid({
    selectedDate,
    currentView,
    buckets = {},
    checklistDatabase = {},
    defaultMorningItems = [],
    dailyScheduleTemplate = [],
    currentFloatHour = 0,
    onChangeWeek,
    onGoToToday,
    onOpenRoutineModal,
    onOpenBudgetModal,
    onShowGenericBlockDetails,
    getWeekDays,
    formatHour,
    setView,
    onMoveScheduleBlock,
    onResizeScheduleBlock,
    onDeleteScheduleBlock,
    onAddScheduleBlock
}) {
    const [resizing, setResizing] = React.useState(null);
    const [contextMenu, setContextMenu] = React.useState(null);
    const [addBlockState, setAddBlockState] = React.useState({ isOpen: false, name: '', bucket: 'work' });

    const weekDays = getWeekDays(selectedDate);
    const lastDay = weekDays[6];
    
    const rangeText = currentView === 'day'
        ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        
    const targetDays = currentView === 'day' ? [new Date(selectedDate)] : weekDays;

    // ==========================================
    // Drag and Drop (Move) Handlers
    // ==========================================
    const handleDragStart = (e, block) => {
        e.dataTransfer.setData('text/plain', block.id);
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        e.dataTransfer.setData('offsetX', offsetX.toString());
        e.currentTarget.classList.add('opacity-40');
    };

    const handleVerticalDragStart = (e, block) => {
        e.dataTransfer.setData('text/plain', block.id);
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('offsetY', offsetY.toString());
        e.currentTarget.classList.add('opacity-40');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('opacity-40');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, day) => {
        e.preventDefault();
        const blockId = e.dataTransfer.getData('text/plain');
        const offsetX = parseFloat(e.dataTransfer.getData('offsetX') || '0');
        
        const container = document.getElementById('timetable-canvas');
        if (!container) return;

        const gridLeft = container.getBoundingClientRect().left + 112;
        const dropX = e.clientX - gridLeft - offsetX;
        
        const hour = dropX / 80;
        let snappedStart = Math.round(hour * 4) / 4 + 2; // offset by 2h
        snappedStart = Math.max(2.0, Math.min(25.75, snappedStart));

        const block = dailyScheduleTemplate.find(b => b.id === blockId);
        if (block) {
            const duration = block.endHour - block.startHour;
            const newEnd = Math.min(26.0, snappedStart + duration);
            const newStart = Math.max(2.0, newEnd - duration);
            onMoveScheduleBlock(blockId, newStart, newEnd);
        }
    };

    const handleVerticalDrop = (e, day) => {
        e.preventDefault();
        const blockId = e.dataTransfer.getData('text/plain');
        const offsetY = parseFloat(e.dataTransfer.getData('offsetY') || '0');
        
        const container = document.getElementById('vertical-canvas');
        if (!container) return;

        const dropY = e.clientY - container.getBoundingClientRect().top - offsetY;
        const hourOffset = dropY / 60;
        let snappedStart = Math.round(hourOffset * 4) / 4 + 2; // offset by 2h
        snappedStart = Math.max(2.0, Math.min(25.75, snappedStart));

        const block = dailyScheduleTemplate.find(b => b.id === blockId);
        if (block) {
            const duration = block.endHour - block.startHour;
            const newEnd = Math.min(26.0, snappedStart + duration);
            const newStart = Math.max(2.0, newEnd - duration);
            onMoveScheduleBlock(blockId, newStart, newEnd);
        }
    };

    // ==========================================
    // Resize Handlers
    // ==========================================
    const handleResizeStart = (e, block, edge) => {
        e.stopPropagation();
        e.preventDefault();
        setResizing({
            blockId: block.id,
            edge,
            initialStart: block.startHour,
            initialEnd: block.endHour,
            startX: e.clientX,
            isVertical: false
        });
    };

    const handleVerticalResizeStart = (e, block, edge) => {
        e.stopPropagation();
        e.preventDefault();
        setResizing({
            blockId: block.id,
            edge,
            initialStart: block.startHour,
            initialEnd: block.endHour,
            startY: e.clientY,
            isVertical: true
        });
    };

    React.useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e) => {
            if (resizing.isVertical) {
                const container = document.getElementById('vertical-canvas');
                if (!container) return;

                const mouseY = e.clientY - container.getBoundingClientRect().top;
                const hour = mouseY / 60;
                let snappedHour = Math.round(hour * 4) / 4 + 2;
                snappedHour = Math.max(2.0, Math.min(26.0, snappedHour));

                if (resizing.edge === 'top') {
                    const newStart = Math.min(resizing.initialEnd - 0.25, snappedHour);
                    onResizeScheduleBlock(resizing.blockId, newStart, resizing.initialEnd);
                } else {
                    const newEnd = Math.max(resizing.initialStart + 0.25, snappedHour);
                    onResizeScheduleBlock(resizing.blockId, resizing.initialStart, newEnd);
                }
            } else {
                const container = document.getElementById('timetable-canvas');
                if (!container) return;

                const gridLeft = container.getBoundingClientRect().left + 112;
                const mouseX = e.clientX - gridLeft;
                const hour = mouseX / 80;
                let snappedHour = Math.round(hour * 4) / 4 + 2;
                snappedHour = Math.max(2.0, Math.min(26.0, snappedHour));

                if (resizing.edge === 'left') {
                    const newStart = Math.min(resizing.initialEnd - 0.25, snappedHour);
                    onResizeScheduleBlock(resizing.blockId, newStart, resizing.initialEnd);
                } else {
                    const newEnd = Math.max(resizing.initialStart + 0.25, snappedHour);
                    onResizeScheduleBlock(resizing.blockId, resizing.initialStart, newEnd);
                }
            }
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, onResizeScheduleBlock]);

    // Auto-scroll views to 6 AM (4 hours from 2 AM start) on view switch
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (currentView === 'week') {
                const container = document.getElementById('timetable-scroll-container');
                if (container) {
                    container.scrollLeft = 320;
                }
            } else if (currentView === 'day') {
                const container = document.getElementById('vertical-scroll-container');
                if (container) {
                    container.scrollTop = 240;
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [currentView]);

    // ==========================================
    // Context Menu Handlers
    // ==========================================
    const handleContextMenu = (e, block) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            blockId: block.id
        });
    };

    // ==========================================
    // Add Block Handlers
    // ==========================================
    const handleAddBlockSubmit = () => {
        if (addBlockState.name.trim()) {
            onAddScheduleBlock(addBlockState.name.trim(), addBlockState.bucket);
            setAddBlockState({ isOpen: false, name: '', bucket: 'work' });
        }
    };
    
    // Sticky hours timeline headers (2 to 26)
    const renderHourHeaders = () => {
        const headers = [];
        for (let h = 2; h < 26; h++) {
            let displayHour = h >= 24 ? h - 24 : h;
            let suffix = displayHour >= 12 ? 'PM' : 'AM';
            let TwelveHour = displayHour;
            if (TwelveHour === 0) TwelveHour = 12;
            if (TwelveHour > 12) TwelveHour = TwelveHour - 12;
            headers.push(
                <div 
                    key={h}
                    className="absolute text-[9px] text-muted/80 font-mono pointer-events-none font-bold h-full flex flex-col justify-between pt-1.5 pb-1"
                    style={{ left: `${(h - 2) * 80}px`, width: '80px' }}
                >
                    {/* Small clean top tick instead of full-height line */}
                    <div className="border-l border-border/40 h-2 self-start"></div>
                    <span className="pl-2 self-start tracking-tight">{TwelveHour} {suffix}</span>
                </div>
            );
        }
        return headers;
    };

    // Render vertical background elements (like twilight shading) without the vertical lines
    const renderHourBackgrounds = () => {
        const gridLines = [];
        for (let h = 2; h < 26; h++) {
            if (h < 6 || h >= 22) {
                gridLines.push(
                    <div 
                        key={`twilight-${h}`}
                        className="absolute top-0 bottom-0 bg-[#f3ede4]/15 pointer-events-none"
                        style={{ left: `${(h - 2) * 80}px`, width: '80px' }}
                    ></div>
                );
            }
        }
        return gridLines;
    };

    // Check if showing June 16, 2026
    const containsToday = targetDays.some(day => day.getFullYear() === 2026 && day.getMonth() === 5 && day.getDate() === 16);
    const isToday = selectedDate.getFullYear() === 2026 && selectedDate.getMonth() === 5 && selectedDate.getDate() === 16;
    
    let gridFloatHour = currentFloatHour;
    if (gridFloatHour < 2.0) {
        gridFloatHour += 24.0;
    }
    const liveTimeMarkerX = 112 + ((gridFloatHour - 2) * 80);

    return (
        <main className="flex-1 flex flex-col h-full bg-canvas overflow-hidden select-none">
            {/* Header Ribbon: Date Controls, Today, View Toggle and Budget reallocator */}
            <header className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 z-20 bg-canvas/85 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => onChangeWeek(-1)} className="p-1.5 rounded hover:bg-panel border border-transparent hover:border-border text-muted hover:text-stone-900 transition">
                        <i className="ph ph-caret-left text-lg"></i>
                    </button>
                    <div className="text-[15px] lg:text-lg font-semibold text-stone-900 tracking-wide font-sans whitespace-nowrap">
                        {rangeText}
                    </div>
                    <button onClick={() => onChangeWeek(1)} className="p-1.5 rounded hover:bg-panel border border-transparent hover:border-border text-muted hover:text-stone-900 transition">
                        <i className="ph ph-caret-right text-lg"></i>
                    </button>
                    <button onClick={onGoToToday} className="px-3 py-1 bg-panel text-sand rounded text-xs font-semibold hover:bg-border transition border border-border/40 hover:text-stone-900 shadow-sm">
                        Go to June 16 (Today)
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex bg-panel p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => setView('week')} 
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${currentView === 'week' ? 'bg-canvas text-stone-950 shadow-sm' : 'text-muted hover:text-sand'}`}
                        >
                            Week
                        </button>
                        <button 
                            onClick={() => setView('day')} 
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${currentView === 'day' ? 'bg-canvas text-stone-950 shadow-sm' : 'text-muted hover:text-sand'}`}
                        >
                            Day
                        </button>
                    </div>
                    
                    {/* Add Block Button */}
                    <button 
                        onClick={() => setAddBlockState(prev => ({ ...prev, isOpen: !prev.isOpen }))} 
                        className="px-3 py-1.5 bg-accent-sage text-white rounded text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
                    >
                        <i className="ph ph-plus"></i>
                        Add Block
                    </button>

                    {/* Adjust Budget Button */}
                    <button onClick={onOpenBudgetModal} className="px-3 py-1.5 bg-accent-terracotta text-white rounded text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm">
                        <i className="ph ph-sliders-horizontal"></i>
                        Adjust Budget
                    </button>
                </div>
            </header>

            {currentView === 'week' ? (
                /* The Horizontal Scroll View Container (Week View) */
                <div className="flex-1 overflow-auto relative timetable-scrollbar" id="timetable-scroll-container">
                    {/* Fixed Width canvas layout */}
                    <div className="w-[2032px] h-full flex flex-col relative" id="timetable-canvas">
                        
                        {/* Sticky Horizontal Hour ribbon */}
                        <div className="flex border-b border-border/30 sticky top-0 bg-canvas/95 backdrop-blur-md z-20 shadow-sm h-12">
                            <div className="sticky left-0 w-28 shrink-0 border-r border-border/40 bg-panel flex items-center justify-center text-[10px] font-bold text-muted uppercase tracking-widest z-30">
                                Timeline
                            </div>
                            <div className="flex-1 relative">
                                {renderHourHeaders()}
                            </div>
                        </div>

                        {/* Scrollable body: Days stack as rows */}
                        <div className="flex-1 relative">
                            {renderHourBackgrounds()}

                            <div className="absolute inset-0 z-10 flex flex-col" id="day-rows-container">
                                {targetDays.map((day) => {
                                    const isToday = day.getFullYear() === 2026 && day.getMonth() === 5 && day.getDate() === 16;
                                    return (
                                        <div 
                                            key={day.toISOString()} 
                                            className={`relative w-full h-28 border-b border-border/20 flex items-center ${isToday ? 'bg-panel/25' : ''}`}
                                        >
                                            {/* Sticky Left Day Column */}
                                            <div className="sticky left-0 h-full w-28 shrink-0 bg-panel/95 backdrop-blur-md z-25 border-r border-border/40 flex flex-col items-center justify-center shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                                                <span className={`text-[10px] uppercase tracking-wider ${isToday ? 'text-accent-terracotta font-bold' : 'text-muted font-semibold'}`}>
                                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </span>
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 ${isToday ? 'bg-accent-terracotta text-white' : 'text-stone-900'}`}>
                                                    {day.getDate()}
                                                </span>
                                            </div>

                                            {/* Scheduled Blocks */}
                                            <div 
                                                className="absolute left-28 right-0 top-0 bottom-0"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day)}
                                            >
                                                {!(day.getDay() === 0 || day.getDay() === 6) && dailyScheduleTemplate.map((block) => {
                                                    const durationHours = block.endHour - block.startHour;
                                                    const meta = buckets[block.bucket] || {};
                                                    
                                                    let completionIndicator = null;
                                                    if (block.bucket === 'morning') {
                                                        const dateStr = day.toISOString().split('T')[0];
                                                        const items = checklistDatabase[dateStr] || defaultMorningItems;
                                                        const doneCount = items.filter(i => i.done).length;
                                                        const percent = Math.round((doneCount / items.length) * 100);
                                                        completionIndicator = (
                                                            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-accent-ochre font-bold">
                                                                <i className="ph ph-check-circle-bold text-xs"></i>
                                                                <span>{percent}% done</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={block.id}
                                                            draggable={true}
                                                            onDragStart={(e) => handleDragStart(e, block)}
                                                            onDragEnd={handleDragEnd}
                                                            onContextMenu={(e) => handleContextMenu(e, block)}
                                                            onClick={() => {
                                                                if (block.bucket === 'morning') {
                                                                    onOpenRoutineModal(day);
                                                                } else {
                                                                    onShowGenericBlockDetails(block, day);
                                                                }
                                                            }}
                                                            className="absolute top-2.5 bottom-2.5 rounded-lg pl-3 pr-2.5 py-2 flex flex-col justify-between border cursor-pointer overflow-hidden transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md hover:z-30 hover:!w-max hover:max-w-[280px] hover:min-w-[150px] hover:bg-canvas shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                                                            style={{
                                                                left: `${(block.startHour - 2) * 80 + 4}px`,
                                                                width: `${durationHours * 80 - 6}px`,
                                                                backgroundColor: `${meta.hex}0d`,
                                                                borderColor: `${meta.hex}25`,
                                                                borderLeft: `4px solid ${meta.hex}`
                                                            }}
                                                        >
                                                            {/* Resize handles */}
                                                            <div 
                                                                className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-stone-500/20 z-20"
                                                                onMouseDown={(e) => handleResizeStart(e, block, 'left')}
                                                            ></div>
                                                            <div 
                                                                className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-stone-500/20 z-20"
                                                                onMouseDown={(e) => handleResizeStart(e, block, 'right')}
                                                            ></div>

                                                            <div className="flex-1 overflow-hidden pointer-events-none">
                                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                                    <span className="text-[9px] font-mono tracking-tight text-muted group-hover:text-stone-900 transition font-bold whitespace-nowrap">
                                                                        {formatHour(block.startHour)} - {formatHour(block.endHour)}
                                                                    </span>
                                                                 </div>
                                                                <h4 className="text-xs font-medium text-stone-900 group-hover:text-accent-terracotta transition leading-tight truncate group-hover:whitespace-normal group-hover:overflow-visible font-sans">
                                                                    {block.name}
                                                                </h4>
                                                                {completionIndicator}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Current Time Indicator Line */}
                            <div 
                                id="current-time-marker" 
                                className="absolute top-0 bottom-0 w-0.5 border-l-2 border-accent-terracotta z-15 pointer-events-none flex-col items-center transition-all duration-300"
                                style={{
                                    left: `${liveTimeMarkerX}px`,
                                    display: containsToday ? 'flex' : 'none'
                                }}
                            >
                                <span className="w-2.5 h-2.5 rounded-full bg-accent-terracotta -mt-1 shadow-sm"></span>
                                <div className="bg-accent-terracotta text-white text-[9px] px-1.5 rounded mt-1 font-bold leading-none py-0.5 shadow-md whitespace-nowrap">LIVE TIME</div>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                /* The Vertical Scroll View Container (Day View) */
                <div className="flex-1 flex overflow-hidden bg-canvas">
                    {/* Time labels column on left */}
                    <div className="w-20 shrink-0 border-r border-border/40 bg-panel flex flex-col relative z-20 overflow-hidden" style={{ height: '1440px' }}>
                        {Array.from({ length: 24 }).map((_, i) => {
                            const h = i + 2;
                            let displayHour = h >= 24 ? h - 24 : h;
                            const suffix = displayHour >= 12 ? 'PM' : 'AM';
                            let TwelveHour = displayHour;
                            if (TwelveHour === 0) TwelveHour = 12;
                            if (TwelveHour > 12) TwelveHour = TwelveHour - 12;
                            return (
                                <div 
                                    key={h} 
                                    className="absolute text-[9px] text-muted/80 font-mono font-bold w-full text-right pr-3 flex items-center justify-end border-b border-border/10"
                                    style={{ top: `${(h - 2) * 60}px`, height: '60px' }}
                                >
                                    {TwelveHour} {suffix}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid Canvas on right */}
                    <div className="flex-1 overflow-y-auto relative timetable-scrollbar" id="vertical-scroll-container">
                        <div className="h-[1440px] relative w-full bg-canvas" id="vertical-canvas">
                            {/* Horizontal background lines */}
                            {Array.from({ length: 24 }).map((_, i) => {
                                const h = i + 2;
                                return (
                                    <div 
                                        key={h}
                                        className="absolute left-0 right-0 border-b border-border/20 pointer-events-none"
                                        style={{ top: `${(h - 2) * 60}px`, height: '60px' }}
                                    ></div>
                                );
                            })}

                            {/* Shading for night hours */}
                            {Array.from({ length: 24 }).map((_, i) => {
                                const h = i + 2;
                                if (h < 6 || h >= 22) {
                                    return (
                                        <div 
                                            key={`v-twilight-${h}`}
                                            className="absolute left-0 right-0 bg-[#f3ede4]/15 pointer-events-none"
                                            style={{ top: `${(h - 2) * 60}px`, height: '60px' }}
                                        ></div>
                                    );
                                }
                                return null;
                            })}

                            {/* Column area for selected day blocks */}
                            <div 
                                className="absolute inset-0 pl-4 pr-12"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleVerticalDrop(e, selectedDate)}
                            >
                                {!(selectedDate.getDay() === 0 || selectedDate.getDay() === 6) && dailyScheduleTemplate.map((block) => {
                                    const durationHours = block.endHour - block.startHour;
                                    const meta = buckets[block.bucket] || {};
                                    
                                    let completionIndicator = null;
                                    if (block.bucket === 'morning') {
                                        const dateStr = selectedDate.toISOString().split('T')[0];
                                        const items = checklistDatabase[dateStr] || defaultMorningItems;
                                        const doneCount = items.filter(i => i.done).length;
                                        const percent = Math.round((doneCount / items.length) * 100);
                                        completionIndicator = (
                                            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-accent-ochre font-bold">
                                                <i className="ph ph-check-circle-bold text-xs"></i>
                                                <span>{percent}% done</span>
                                            </div>
                                        );
                                    }

                                    const isVeryShort = durationHours <= 0.5;
                                    const isShort = durationHours < 1.0;

                                    return (
                                        <div
                                            key={block.id}
                                            draggable={true}
                                            onDragStart={(e) => handleVerticalDragStart(e, block)}
                                            onDragEnd={handleDragEnd}
                                            onContextMenu={(e) => handleContextMenu(e, block)}
                                            onClick={() => {
                                                if (block.bucket === 'morning') {
                                                    onOpenRoutineModal(selectedDate);
                                                } else {
                                                    onShowGenericBlockDetails(block, selectedDate);
                                                }
                                            }}
                                            className={`absolute left-4 right-12 rounded-lg pl-3 pr-2.5 ${isVeryShort ? 'py-0.5' : isShort ? 'py-1' : 'py-2.5'} flex flex-col justify-between border cursor-pointer overflow-hidden transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md hover:z-30 hover:!h-auto hover:min-h-[60px] hover:bg-canvas shadow-[0_2px_8px_rgba(0,0,0,0.02)]`}
                                            style={{
                                                top: `${(block.startHour - 2) * 60 + 4}px`,
                                                height: `${durationHours * 60 - 8}px`,
                                                backgroundColor: `${meta.hex}0d`,
                                                borderColor: `${meta.hex}25`,
                                                borderLeft: `4px solid ${meta.hex}`
                                            }}
                                        >
                                            {/* Vertical Resize Handles (Top / Bottom) */}
                                            <div 
                                                className="absolute left-0 right-0 top-0 h-2 cursor-row-resize hover:bg-stone-500/20 z-20"
                                                onMouseDown={(e) => handleVerticalResizeStart(e, block, 'top')}
                                            ></div>
                                            <div 
                                                className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-stone-500/20 z-20"
                                                onMouseDown={(e) => handleVerticalResizeStart(e, block, 'bottom')}
                                            ></div>

                                            <div className={`flex-1 overflow-hidden pointer-events-none flex ${isVeryShort ? 'flex-row items-center gap-2 group-hover:flex-col group-hover:items-start group-hover:justify-between' : 'flex-col justify-between'} h-full`}>
                                                {isVeryShort ? (
                                                    <>
                                                        <div className="flex items-center gap-2 group-hover:hidden">
                                                            <span className="text-[8px] font-mono tracking-tight text-muted font-bold shrink-0">
                                                                {formatHour(block.startHour)}
                                                            </span>
                                                            <h4 className="text-[10px] font-semibold text-stone-900 truncate font-sans">
                                                                {block.name}
                                                            </h4>
                                                        </div>
                                                        <div className="hidden group-hover:block w-full">
                                                            <span className="text-[9px] font-mono tracking-tight text-muted group-hover:text-stone-900 transition font-bold whitespace-nowrap">
                                                                {formatHour(block.startHour)} - {formatHour(block.endHour)}
                                                            </span>
                                                            <h4 className="text-xs font-semibold text-stone-900 group-hover:text-accent-terracotta transition leading-tight truncate group-hover:whitespace-normal group-hover:overflow-visible font-sans mt-0.5">
                                                                {block.name}
                                                            </h4>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <span className="text-[9px] font-mono tracking-tight text-muted group-hover:text-stone-900 transition font-bold whitespace-nowrap">
                                                                {formatHour(block.startHour)} - {formatHour(block.endHour)}
                                                            </span>
                                                             <h4 className="text-xs font-semibold text-stone-900 group-hover:text-accent-terracotta transition leading-tight truncate group-hover:whitespace-normal group-hover:overflow-visible font-sans mt-0.5">
                                                                {block.name}
                                                            </h4>
                                                        </div>
                                                        {completionIndicator}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Vertical Live Time Marker */}
                                {isToday && (
                                    <div 
                                        className="absolute left-0 right-0 border-t-2 border-accent-terracotta z-15 pointer-events-none flex items-center transition-all duration-300"
                                        style={{
                                            top: `${(gridFloatHour - 2) * 60}px`,
                                        }}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-accent-terracotta -ml-1"></span>
                                        <div className="bg-accent-terracotta text-white text-[9px] px-1.5 rounded ml-2 font-bold leading-none py-0.5 shadow-md whitespace-nowrap">LIVE TIME</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu Overlay */}
            {contextMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setContextMenu(null)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                    ></div>
                    <div
                        className="fixed bg-[#f6f2eb] border border-[#e6ded4] rounded-lg shadow-xl py-1 z-50 text-[11px] w-32 font-sans select-none animate-in fade-in duration-100"
                        style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                    >
                        <div className="px-2.5 py-1 text-[9px] text-stone-500 font-bold uppercase tracking-wider border-b border-[#e6ded4]/40">
                            Block Action
                        </div>
                        <button
                            onClick={() => {
                                onDeleteScheduleBlock(contextMenu.blockId);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-2.5 py-2 hover:bg-red-50 text-accent-terracotta font-semibold flex items-center gap-1.5 transition"
                        >
                            <i className="ph ph-trash-bold text-xs"></i> Delete Block
                        </button>
                    </div>
                </>
            )}

            {/* Add Block Overlay Modal */}
            {addBlockState.isOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#f6f2eb] border border-[#e6ded4] w-full max-w-sm rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 font-sans text-stone-850">
                        <div className="flex justify-between items-center pb-2 border-b border-[#e6ded4]">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Add Timetable Block</h3>
                            <button 
                                onClick={() => setAddBlockState({ isOpen: false, name: '', bucket: 'work' })} 
                                className="text-muted hover:text-stone-900 transition"
                            >
                                <i className="ph ph-x text-lg"></i>
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-stone-600 font-bold uppercase">Block Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Focus Depth, Work out, Prep"
                                    value={addBlockState.name}
                                    onChange={(e) => setAddBlockState(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-canvas border border-[#e6ded4] rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-accent-sage transition"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-stone-600 font-bold uppercase">Time Bucket</label>
                                <select
                                    value={addBlockState.bucket}
                                    onChange={(e) => setAddBlockState(prev => ({ ...prev, bucket: e.target.value }))}
                                    className="bg-canvas border border-[#e6ded4] rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-accent-sage transition"
                                >
                                    {Object.entries(buckets).map(([key, val]) => (
                                        <option key={key} value={key}>{val.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#e6ded4]/40">
                            <button 
                                onClick={() => setAddBlockState({ isOpen: false, name: '', bucket: 'work' })} 
                                className="px-3 py-1.5 bg-canvas hover:bg-panel text-xs rounded border border-[#e6ded4] text-stone-850 transition font-semibold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddBlockSubmit} 
                                className="px-4 py-1.5 bg-accent-sage text-white rounded text-xs font-semibold hover:opacity-95 transition"
                            >
                                Add Block
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
