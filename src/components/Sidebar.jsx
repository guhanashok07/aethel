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
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const morningItems = checklistDatabase[todayStr] || defaultMorningItems;

    return (
        <aside className="w-full lg:w-96 bg-white/42 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-stone-200/50 p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-30 timetable-scrollbar select-none">
            <div>
                {/* Header Brand */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-white font-serif italic text-base shadow-sm">
                            f
                        </div>
                        <div>
                            <h2 className="text-2xl font-cormorant font-normal italic tracking-wide text-stone-800 leading-none">schedule</h2>
                            <p className="text-[9px] text-stone-400 tracking-[0.2em] uppercase mt-1 font-bold font-mono">intention navigator</p>
                        </div>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-stone-50 text-[10px] text-stone-500 flex items-center gap-1.5 font-bold border border-stone-200/30 font-mono uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-ping"></span>
                        June 2026
                    </div>
                </div>

                {/* Focus Status Card */}
                <div id="zen-focus-card" className="bg-white/70 border border-stone-200/50 rounded-xl p-5 mb-5 relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-stone-100 rounded-full filter blur-xl group-hover:bg-stone-200/50 transition-all"></div>
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <span className="text-[9px] uppercase tracking-[0.15em] text-stone-400 font-bold font-mono">Current Flow State</span>
                        <span id="zen-time-badge" className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600 border border-stone-200/60 font-mono font-medium">
                            {formatHour(activeBlock.startHour)} - {formatHour(activeBlock.endHour)}
                        </span>
                    </div>
                    
                    <h3 id="zen-activity-name" className="text-lg font-cormorant font-normal italic text-stone-800 mb-1 relative z-10">{activeBlock.name}</h3>
                    <p id="zen-subtext" className="text-xs text-stone-400 mb-4 relative z-10 font-sans">{bucketMeta.description}</p>
                    
                    {/* Quick Checklist Tracker inside Zen View */}
                    <div id="zen-checklist" className="space-y-2 mb-4 bg-stone-50/50 p-3 rounded-lg border border-stone-200/30 relative z-10">
                        {activeBlock.bucket === 'routine' ? (
                            morningItems.slice(0, 3).map(item => (
                                <label key={item.id} className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer hover:text-stone-900 transition py-0.5 font-medium">
                                    <input 
                                        type="checkbox" 
                                        checked={item.done} 
                                        onChange={() => onToggleZenItem(item.id)} 
                                        className="rounded bg-white border-stone-300 text-stone-700 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className={item.done ? 'line-through text-stone-400' : 'text-stone-700'}>{item.label}</span>
                                </label>
                            ))
                        ) : (
                            <div className="flex items-center gap-2.5 text-xs text-stone-400 font-medium">
                                <i className="fa-solid fa-circle-notch animate-spin text-[10px]"></i>
                                <span>Primary focus on designated flow state</span>
                            </div>
                        )}
                    </div>

                    {/* Live Timer Progress Bar */}
                    <div className="space-y-1 relative z-10">
                        <div className="flex justify-between text-[10px] text-stone-400 font-mono uppercase font-bold">
                            <span>{minsElapsed}m elapsed</span>
                            <span>{minsLeft}m left</span>
                        </div>
                        <div className="w-full h-1 bg-stone-200/70 rounded-full overflow-hidden">
                            <div 
                                id="zen-progress-bar" 
                                className="h-full transition-all duration-1000" 
                                style={{ width: `${progressPercent}%`, backgroundColor: '#5c6e4f' }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Immediate Next Tasks Card */}
                <div id="startup-checklist-card" className="bg-white/70 border border-stone-200/50 rounded-xl p-5 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4 border-b border-stone-200/40 pb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-cormorant font-normal italic text-stone-700 tracking-wide capitalize">Immediate Tasks</h3>
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
                            className="flex-1 bg-stone-50 border border-stone-200/60 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition"
                        />
                        <button onClick={handleAddMilestone} className="px-3 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors">
                            Add
                        </button>
                    </div>

                    {/* Task List Container */}
                    <div id="startup-tasks-container" className="space-y-2 max-h-40 overflow-y-auto pr-1 timetable-scrollbar">
                        {startupTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between gap-2 p-2 bg-stone-50/30 rounded-lg border border-stone-100 hover:border-stone-200 transition">
                                <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer flex-1 min-w-0 font-medium">
                                    <input 
                                        type="checkbox" 
                                        checked={task.done} 
                                        onChange={() => onToggleStartupTask(task.id)} 
                                        className="rounded bg-white border-stone-300 text-stone-700 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 shrink-0"
                                    />
                                    <span className={`truncate ${task.done ? 'line-through text-stone-400 font-normal' : 'text-stone-700'}`}>{task.label}</span>
                                </label>
                                <button onClick={() => onDeleteStartupTask(task.id)} className="text-stone-400 hover:text-stone-600 transition text-[10px] shrink-0 px-1">
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Allocations (The "Buckets") */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold font-mono">Time Allocation Buckets</h2>
                        <span className="text-[9px] text-stone-400 font-mono font-bold">24 Hours</span>
                    </div>
                    
                    <div className="space-y-2.5" id="allocation-buckets-container">
                        {Object.entries(buckets).map(([key, value]) => {
                            const percentage = ((value.hours / 24) * 100).toFixed(0);
                            return (
                                <div key={key} className="p-3 bg-white/70 border border-stone-200/50 rounded-xl flex items-center justify-between hover:border-stone-300/80 hover:shadow-sm transition duration-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: value.hex }}></span>
                                        <div>
                                            <p className="text-xs font-semibold text-stone-800 transition">{value.name}</p>
                                            <p className="text-[10px] text-stone-400 line-clamp-1 font-medium">{value.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono font-bold text-stone-700">{value.hours} hr</p>
                                        <p className="text-[9px] text-stone-400 font-semibold">{percentage}%</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Customizer Drawer Option & Quick Info */}
            <div className="pt-6 border-t border-stone-200/60">
                <div className="p-3 bg-white/50 border border-stone-200/40 rounded-lg text-xs text-stone-500 leading-relaxed shadow-sm font-medium">
                    <p className="font-semibold text-stone-800 mb-1">💡 Rhythm Principle</p>
                    Your days have a natural ebb and flow. Toggle task blocks or adjust the budget to realign your weekly balance.
                </div>
                <div className="mt-4 flex justify-between items-center text-[10px] text-stone-400 font-bold font-mono">
                    <span>© Flow Systems 2026</span>
                    <span onClick={onResetBudgetDefaultsAndRefresh} className="hover:text-stone-800 cursor-pointer transition underline decoration-dotted">
                        Reset Defaults
                    </span>
                </div>
            </div>
        </aside>
    );
}
