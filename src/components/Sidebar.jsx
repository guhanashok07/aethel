import React, { useState } from 'react';

export default function Sidebar({
    buckets = {},
    startupTasks = [],
    checklistDatabase = {},
    defaultMorningItems = [],
    activeBlock = {},
    currentFloatHour = 0,
    onToggleZenItem,
    onToggleStartupTask,
    onAddNewStartupTask,
    onDeleteStartupTask,
    onResetBudgetDefaultsAndRefresh,
    formatHour
}) {
    const [newMilestoneText, setNewMilestoneText] = useState('');

    const handleAddMilestone = () => {
        if (newMilestoneText.trim()) {
            onAddNewStartupTask(newMilestoneText.trim());
            setNewMilestoneText('');
        }
    };

    // Calculate Active Block progress metrics
    const bucketMeta = buckets[activeBlock.bucket] || {};
    const totalDuration = activeBlock.endHour - activeBlock.startHour;
    const elapsed = currentFloatHour - activeBlock.startHour;
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    const minsElapsed = Math.round(elapsed * 60);
    const minsLeft = Math.round((totalDuration - elapsed) * 60);

    // Morning Routine items
    const todayStr = new Date(2026, 5, 16).toISOString().split('T')[0];
    const morningItems = checklistDatabase[todayStr] || defaultMorningItems;

    const startupDoneCount = startupTasks.filter(t => t.done).length;

    return (
        <aside className="w-full lg:w-96 bg-panel border-b lg:border-b-0 lg:border-r border-border p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-30 timetable-scrollbar select-none">
            <div>
                {/* Header Brand */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-terracotta flex items-center justify-center text-canvas font-bold text-sm shadow-sm">
                            F
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 leading-none font-sans">Schedule</h2>
                            <p className="text-[10px] text-muted tracking-widest uppercase mt-1 font-semibold">Intention Navigator</p>
                        </div>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-border/50 text-[11px] text-muted flex items-center gap-1.5 font-medium border border-border/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-sage animate-ping"></span>
                        June 2026
                    </div>
                </div>

                {/* Focus Status Card */}
                <div id="zen-focus-card" className="bg-canvas border border-border/70 rounded-xl p-5 mb-5 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-ochre/5 rounded-full filter blur-xl group-hover:bg-accent-ochre/10 transition-all"></div>
                    
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Current Flow State</span>
                        <span id="zen-time-badge" className="px-2 py-0.5 rounded-full text-[10px] bg-accent-ochre/10 text-accent-ochre border border-accent-ochre/25 font-mono font-medium">
                            {formatHour(activeBlock.startHour)} - {formatHour(activeBlock.endHour)}
                        </span>
                    </div>
                    
                    <h3 id="zen-activity-name" className="text-xl font-medium text-stone-900 mb-1 font-sans">{activeBlock.name}</h3>
                    <p id="zen-subtext" className="text-xs text-muted mb-4">{bucketMeta.description}</p>
                    
                    {/* Quick Checklist Tracker inside Zen View */}
                    <div id="zen-checklist" className="space-y-2 mb-4 bg-panel/50 p-3 rounded-lg border border-border/30">
                        {activeBlock.bucket === 'morning' ? (
                            morningItems.slice(0, 3).map(item => (
                                <label key={item.id} className="flex items-center gap-2.5 text-xs text-sand/90 cursor-pointer hover:text-stone-900 transition py-0.5 font-medium">
                                    <input 
                                        type="checkbox" 
                                        checked={item.done} 
                                        onChange={() => onToggleZenItem(item.id)} 
                                        className="rounded bg-canvas border-border text-accent-ochre focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className={item.done ? 'line-through text-muted' : 'text-stone-900'}>{item.label}</span>
                                </label>
                            ))
                        ) : (
                            <div className="flex items-center gap-2.5 text-xs text-muted font-medium">
                                <i className="ph ph-circle-dashed animate-spin text-sm"></i>
                                <span>Primary focus on designated flow state</span>
                            </div>
                        )}
                    </div>

                    {/* Live Timer Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted font-medium">
                            <span>{minsElapsed}m elapsed</span>
                            <span>{minsLeft}m left</span>
                        </div>
                        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                            <div 
                                id="zen-progress-bar" 
                                className="h-full transition-all duration-1000" 
                                style={{ width: `${progressPercent}%`, backgroundColor: bucketMeta.hex }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Immediate Next Tasks Card */}
                <div id="startup-checklist-card" className="bg-canvas border border-border/70 rounded-xl p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent-terracotta"></span>
                            <h3 className="text-lg font-medium text-stone-900 font-sans">Immediate Next Tasks</h3>
                        </div>
                    </div>
                    
                    {/* Quick Add Input */}
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            value={newMilestoneText}
                            onChange={(e) => setNewMilestoneText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddMilestone()}
                            placeholder="Next task..." 
                            className="flex-1 bg-panel border border-border rounded-lg px-2.5 py-1 text-xs text-stone-900 placeholder:text-muted/60 focus:outline-none focus:border-accent-terracotta transition"
                        />
                        <button onClick={handleAddMilestone} className="px-2.5 py-1 bg-accent-terracotta text-white rounded-lg text-xs font-semibold hover:opacity-90 transition">
                            Add
                        </button>
                    </div>

                    {/* Task List Container */}
                    <div id="startup-tasks-container" className="space-y-2 max-h-40 overflow-y-auto pr-1 timetable-scrollbar">
                        {startupTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between gap-2 p-2 bg-panel/35 rounded-lg border border-border/30 hover:border-border transition">
                                <label className="flex items-center gap-2.5 text-xs text-sand/90 cursor-pointer flex-1 min-w-0 font-medium">
                                    <input 
                                        type="checkbox" 
                                        checked={task.done} 
                                        onChange={() => onToggleStartupTask(task.id)} 
                                        className="rounded bg-canvas border-border text-accent-terracotta focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 shrink-0"
                                    />
                                    <span className={`truncate ${task.done ? 'line-through text-muted font-normal' : 'text-stone-900'}`}>{task.label}</span>
                                </label>
                                <button onClick={() => onDeleteStartupTask(task.id)} className="text-muted hover:text-accent-terracotta transition text-xs shrink-0 px-1">
                                    <i className="ph ph-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Allocations (The "Buckets") */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs uppercase tracking-widest text-muted font-bold">Time Allocation Buckets</h2>
                        <span className="text-xs text-muted font-mono font-semibold font-bold">24 Hours / Day</span>
                    </div>
                    
                    <div className="space-y-2.5" id="allocation-buckets-container">
                        {Object.entries(buckets).map(([key, value]) => {
                            const percentage = ((value.hours / 24) * 100).toFixed(0);
                            return (
                                <div key={key} className="p-3 bg-canvas border border-border/80 rounded-xl flex items-center justify-between hover:border-muted/50 hover:shadow-sm transition duration-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: value.hex }}></span>
                                        <div>
                                            <p className="text-xs font-semibold text-stone-900 group-hover:text-accent-terracotta transition">{value.name}</p>
                                            <p className="text-[10px] text-muted line-clamp-1 font-medium">{value.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono font-bold text-stone-800">{value.hours} hr</p>
                                        <p className="text-[9px] text-muted font-semibold">{percentage}%</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Customizer Drawer Option & Quick Info */}
            <div className="pt-6 border-t border-border/60">
                <div className="p-3 bg-canvas border border-border rounded-lg text-xs text-muted leading-relaxed shadow-sm font-medium">
                    <p className="font-semibold text-stone-900 mb-1">💡 Rhythm Principle</p>
                    Your days have a natural ebb and flow. Toggle task blocks or adjust the budget to realign your weekly balance.
                </div>
                <div className="mt-4 flex justify-between items-center text-[11px] text-muted font-medium">
                    <span>© Flow Systems 2026</span>
                    <span onClick={onResetBudgetDefaultsAndRefresh} className="hover:text-stone-900 cursor-pointer transition underline decoration-dotted font-medium">
                        Reset Defaults
                    </span>
                </div>
            </div>
        </aside>
    );
}
