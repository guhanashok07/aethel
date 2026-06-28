import React from 'react';
import Sidebar from './Sidebar';
import TimetableGrid from './TimetableGrid';

export default function ScheduleView({
    buckets,
    startupTasks,
    checklistDatabase,
    defaultMorningItems,
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
    onAddScheduleBlock
}) {
    const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true);

    return (
        <div id="schedule-view-container" className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-canvas text-sand font-sans h-full relative">
            {/* Sidebar container with width transition */}
            <div 
                className={`transition-all duration-300 ease-in-out flex shrink-0 ${isSidebarExpanded ? 'w-full lg:w-96 border-r border-border' : 'w-0 overflow-hidden border-r-0'}`}
            >
                <div className="w-full lg:w-96 h-full flex flex-col">
                    <Sidebar
                        buckets={buckets}
                        startupTasks={startupTasks}
                        checklistDatabase={checklistDatabase}
                        defaultMorningItems={defaultMorningItems}
                        activeBlock={activeBlock}
                        currentFloatHour={currentFloatHour}
                        onToggleZenItem={onToggleZenItem}
                        onToggleStartupTask={onToggleStartupTask}
                        onAddNewStartupTask={onAddNewStartupTask}
                        onDeleteStartupTask={onDeleteStartupTask}
                        onResetBudgetDefaultsAndRefresh={onResetBudgetDefaultsAndRefresh}
                        formatHour={formatHour}
                    />
                </div>
            </div>

            {/* Expand / Collapse floating edge button */}
            <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-40 w-6 h-12 bg-panel hover:bg-canvas border border-border flex items-center justify-center rounded-r-lg shadow-md cursor-pointer transition-all duration-300 hover:text-stone-900 text-muted`}
                style={{
                    left: isSidebarExpanded ? '384px' : '0px',
                }}
            >
                <i className={`ph ${isSidebarExpanded ? 'ph-caret-left-bold' : 'ph-caret-right-bold'} text-xs`}></i>
            </button>

            {/* Timetable grid area */}
            <div className="flex-1 min-w-0 h-full">
                <TimetableGrid
                    selectedDate={selectedDate}
                    currentView={currentView}
                    buckets={buckets}
                    checklistDatabase={checklistDatabase}
                    defaultMorningItems={defaultMorningItems}
                    dailyScheduleTemplate={dailyScheduleTemplate}
                    currentFloatHour={currentFloatHour}
                    onChangeWeek={onChangeWeek}
                    onGoToToday={onGoToToday}
                    onOpenRoutineModal={onOpenRoutineModal}
                    onOpenBudgetModal={onOpenBudgetModal}
                    onShowGenericBlockDetails={onShowGenericBlockDetails}
                    getWeekDays={getWeekDays}
                    formatHour={formatHour}
                    setView={setView}
                    onMoveScheduleBlock={onMoveScheduleBlock}
                    onResizeScheduleBlock={onResizeScheduleBlock}
                    onDeleteScheduleBlock={onDeleteScheduleBlock}
                    onAddScheduleBlock={onAddScheduleBlock}
                />
            </div>
        </div>
    );
}
