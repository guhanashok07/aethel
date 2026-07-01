import React, { useState } from 'react';
import TimetableGrid from './TimetableGrid';
import EventModal from './EventModal';

export default function ScheduleView({
    buckets,
    startupTasks,
    checklistDatabase,
    defaultMorningItems,
    defaultHabitGroups = [],
    activeBlock,
    currentFloatHour,
    selectedDate,
    currentView,
    dailyScheduleTemplate,
    onToggleZenItem,
    onToggleStartupTask,
    onAddNewStartupTask,
    onDeleteStartupTask,
    onResetBudgetDefaultsAndRefresh,
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
    onAddScheduleBlock, // we'll generalize this in App.jsx
    onUpdateScheduleBlock // we'll add this in App.jsx
}) {
    const [filter, setFilter] = useState('all'); // 'all' | 'block' | 'habit' | 'deadline' | 'meeting'
    const [eventModalState, setEventModalState] = useState({ isOpen: false, initialEvent: null, defaultDate: '' });

    // Handle back/forward navigation based on active view
    const handleNavigate = (direction) => {
        const offset = direction === 'next' ? 1 : -1;
        if (currentView === 'day') {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + offset);
            onChangeWeek(newDate);
        } else if (currentView === 'week') {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + offset * 7);
            onChangeWeek(newDate);
        } else if (currentView === 'month') {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() + offset);
            onChangeWeek(newDate);
        }
    };

    const getHeaderDateText = () => {
        if (currentView === 'day') {
            return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        } else if (currentView === 'week') {
            const weekDays = getWeekDays(selectedDate);
            const start = weekDays[0];
            const end = weekDays[6];
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    };

    // Open event modal for creation
    const handleOpenCreateModal = (dateStr, hour = 9.0) => {
        setEventModalState({
            isOpen: true,
            initialEvent: null,
            defaultDate: dateStr || new Date().toLocaleDateString('sv-SE'),
            defaultStartHour: hour
        });
    };

    // Open event modal for editing
    const handleOpenEditModal = (event) => {
        setEventModalState({
            isOpen: true,
            initialEvent: event,
            defaultDate: event.date
        });
    };

    const handleEventSubmit = (eventData) => {
        if (eventData.id) {
            // Update
            onUpdateScheduleBlock(eventData);
        } else {
            // Create
            onAddScheduleBlock(eventData);
        }
    };

    const activeDateStr = selectedDate.toLocaleDateString('sv-SE');

    return (
        <div id="schedule-view-container" className="flex-1 flex flex-col overflow-hidden bg-transparent text-stone-700 font-sans h-full relative pt-20 max-w-[1400px] mx-auto w-full px-8 pb-10 select-none">
            {/* Top Toolbar */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/50 pb-5 mb-6">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400">Schedule</span>
                    <div className="flex items-center gap-4">
                        <h2 className="font-cormorant font-normal italic text-3xl text-stone-800 lowercase">
                            {getHeaderDateText()}
                        </h2>
                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/40 p-0.5 rounded-lg text-[10px] font-mono tracking-wider uppercase text-stone-400">
                            <button onClick={() => handleNavigate('prev')} className="px-2 py-0.5 hover:text-stone-700 transition"><i className="fa-solid fa-chevron-left"></i></button>
                            <button onClick={onGoToToday} className="px-2 py-0.5 hover:text-stone-700 transition">Today</button>
                            <button onClick={() => handleNavigate('next')} className="px-2 py-0.5 hover:text-stone-700 transition"><i className="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                    {/* View switcher Day / Week / Month */}
                    <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/40 p-0.5 rounded-lg text-[10px] font-mono tracking-wider uppercase">
                        <button
                            onClick={() => setView('day')}
                            className={`px-3 py-1 rounded-md transition-all ${currentView === 'day' ? 'bg-white text-stone-850 shadow-sm border border-stone-200/10 font-medium' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                            day
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-3 py-1 rounded-md transition-all ${currentView === 'week' ? 'bg-white text-stone-850 shadow-sm border border-stone-200/10 font-medium' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                            week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={`px-3 py-1 rounded-md transition-all ${currentView === 'month' ? 'bg-white text-stone-850 shadow-sm border border-stone-200/10 font-medium' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                            month
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter Toggle Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-2 scroll-hidden select-none">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 border text-[10px] font-mono tracking-wider uppercase rounded-full transition-all ${filter === 'all' ? 'bg-stone-700 text-white border-stone-700 font-medium' : 'border-stone-200/60 text-stone-450 hover:border-stone-300 hover:text-stone-700 bg-white/40'}`}
                >
                    all
                </button>
                <button
                    onClick={() => setFilter('block')}
                    className={`px-3 py-1 border text-[10px] font-mono tracking-wider uppercase rounded-full transition-all ${filter === 'block' ? 'bg-rose-100/50 text-rose-700 border-rose-200/60 font-medium' : 'border-stone-200/60 text-stone-450 hover:border-stone-300 hover:text-stone-700 bg-white/40'}`}
                >
                    time blocks
                </button>
                <button
                    onClick={() => setFilter('meeting')}
                    className={`px-3 py-1 border text-[10px] font-mono tracking-wider uppercase rounded-full transition-all ${filter === 'meeting' ? 'bg-indigo-100/50 text-indigo-700 border-indigo-200/60 font-medium' : 'border-stone-200/60 text-stone-450 hover:border-stone-300 hover:text-stone-700 bg-white/40'}`}
                >
                    meetings
                </button>
                <button
                    onClick={() => setFilter('deadline')}
                    className={`px-3 py-1 border text-[10px] font-mono tracking-wider uppercase rounded-full transition-all ${filter === 'deadline' ? 'bg-red-50 text-red-600 border-red-200/60 font-medium' : 'border-stone-200/60 text-stone-450 hover:border-stone-300 hover:text-stone-700 bg-white/40'}`}
                >
                    deadlines
                </button>
                <button
                    onClick={() => setFilter('habit')}
                    className={`px-3 py-1 border text-[10px] font-mono tracking-wider uppercase rounded-full transition-all ${filter === 'habit' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200/60 font-medium' : 'border-stone-200/60 text-stone-450 hover:border-stone-300 hover:text-stone-700 bg-white/40'}`}
                >
                    habits
                </button>
            </div>

            {/* Timetable Grid View Port */}
            <div className="flex-1 min-w-0 overflow-hidden relative">
                <TimetableGrid
                    selectedDate={selectedDate}
                    currentView={currentView}
                    filter={filter}
                    buckets={buckets}
                    checklistDatabase={checklistDatabase}
                    defaultMorningItems={defaultMorningItems}
                    defaultHabitGroups={defaultHabitGroups}
                    dailyScheduleTemplate={dailyScheduleTemplate}
                    currentFloatHour={currentFloatHour}
                    getWeekDays={getWeekDays}
                    formatHour={formatHour}
                    onOpenCreateModal={handleOpenCreateModal}
                    onOpenEditModal={handleOpenEditModal}
                    onMoveScheduleBlock={onMoveScheduleBlock}
                    onResizeScheduleBlock={onResizeScheduleBlock}
                    onDeleteScheduleBlock={onDeleteScheduleBlock}
                    onToggleZenItem={onToggleZenItem}
                />
            </div>

            {/* Event Add/Edit Modal */}
            <EventModal
                isOpen={eventModalState.isOpen}
                onClose={() => setEventModalState({ isOpen: false, initialEvent: null, defaultDate: '' })}
                onSubmit={handleEventSubmit}
                onDelete={(eventId, mode) => onDeleteScheduleBlock(eventId, mode, eventModalState.defaultDate)}
                initialEvent={eventModalState.initialEvent}
                defaultDate={eventModalState.defaultDate}
            />
        </div>
    );
}
