import React, { useMemo, useState } from 'react';

export default function HomeView({
    onNavigate,
    activeBlock,
    tasksCount,
    buckets,
    entities,
    saveEntity
}) {
    const todayStr = new Date(2026, 5, 16).toISOString().split('T')[0];

    // Find or initialize daily intention entity
    const intentionEntity = useMemo(() => {
        return entities.find(e => e.type === 'journal' && e.id === `intention-${todayStr}`);
    }, [entities, todayStr]);

    const [intentionInput, setIntentionInput] = useState(intentionEntity?.properties?.text || '');
    const [isEditingIntention, setIsEditingIntention] = useState(false);

    // Save daily intention to database
    const handleSaveIntention = () => {
        const entityId = `intention-${todayStr}`;
        saveEntity({
            id: entityId,
            type: 'journal',
            title: `Intention for ${todayStr}`,
            content: '',
            createdAt: intentionEntity?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            properties: { text: intentionInput }
        });
        setIsEditingIntention(false);
    };

    // Calculate schedule summary
    const totalScheduledHours = useMemo(() => {
        return Object.values(buckets).reduce((sum, b) => sum + (b.hours || 0), 0);
    }, [buckets]);

    return (
        <div className="flex-1 relative overflow-hidden bg-[#FAF8F5] flex flex-col justify-between p-12">
            
            {/* Morphing Fluid Auras (Background) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Sage Green Aura */}
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#E2ECE0]/40 blur-[80px] animate-aura-slow"></div>
                {/* Terracotta/Peach Aura */}
                <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#FCECE8]/60 blur-[100px] animate-aura-reverse"></div>
                {/* Ochre Aura */}
                <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-[#F9F1E6]/40 blur-[90px] animate-aura-slow"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col justify-between gap-12">
                
                {/* Editorial Hero Branding */}
                <header className="flex flex-col gap-2 mt-8">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-8 bg-stone-300"></span>
                        <span className="text-xs uppercase tracking-[0.2em] text-stone-400 font-sans font-bold">Personal Space OS</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-serif text-stone-900 leading-tight">
                        Aethel
                    </h1>
                    <p className="text-stone-500 font-medium font-sans max-w-md text-sm md:text-base -mt-1 leading-relaxed">
                        A minimal environment crafted to organize your time, balance your weekly rhythm, and navigate your intentions.
                    </p>
                </header>

                {/* Central Row: Focus Telemetry + Intention Logger */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    
                    {/* Live Rhythm Status Widget */}
                    <div className="glass-card rounded-2xl p-8 flex flex-col justify-between border border-white/60">
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center border-b border-stone-200/60 pb-4">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">Current Flow State</span>
                                <span className="flex items-center gap-1.5 text-xs text-[#5c6e4f] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c6e4f] animate-pulse"></span> Active
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <h3 className="text-2xl font-serif text-stone-800">
                                    {activeBlock?.name || "Deep Sleep"}
                                </h3>
                                <p className="text-xs text-stone-400 font-medium">
                                    Allocated under <span className="text-stone-600 font-bold">{buckets[activeBlock?.bucket]?.name || "Sleep"}</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-2.5">
                            <div className="flex justify-between text-[11px] text-stone-400 font-sans font-bold">
                                <span>Rhythm Budget Tracker</span>
                                <span>{totalScheduledHours.toFixed(1)} / 24h allocated</span>
                            </div>
                            <div className="w-full h-1 bg-stone-200/60 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-stone-400 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (totalScheduledHours / 24) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Intention Check-In Widget */}
                    <div className="glass-card rounded-2xl p-8 flex flex-col justify-between border border-white/60">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center border-b border-stone-200/60 pb-4">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">Daily Intention</span>
                                <button 
                                    onClick={() => {
                                        if (isEditingIntention) handleSaveIntention();
                                        else setIsEditingIntention(true);
                                    }}
                                    className="text-xs text-stone-500 hover:text-stone-800 font-semibold transition"
                                >
                                    {isEditingIntention ? "Save" : (intentionEntity?.properties?.text ? "Edit" : "Set")}
                                </button>
                            </div>

                            {isEditingIntention ? (
                                <textarea
                                    value={intentionInput}
                                    onChange={(e) => setIntentionInput(e.target.value)}
                                    placeholder="What is your central intention for today?"
                                    className="w-full h-24 bg-canvas/30 border border-stone-200 rounded-lg p-3 text-sm text-stone-800 placeholder-stone-400 outline-none resize-none font-sans"
                                    maxLength={160}
                                    autoFocus
                                />
                            ) : (
                                <p className="text-stone-700 italic text-sm md:text-base leading-relaxed py-2">
                                    {intentionEntity?.properties?.text || "“Set a daily intention to align your focus and anchor your routine.”"}
                                </p>
                            )}
                        </div>

                        <div className="text-[10px] text-stone-400 font-mono mt-4">
                            Last Updated: {intentionEntity ? new Date(intentionEntity.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not set"}
                        </div>
                    </div>
                </div>

                {/* Gateway Cards (Navigation Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    
                    {/* Board Card */}
                    <div 
                        onClick={() => onNavigate('board')}
                        className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 cursor-pointer border border-white/60 group"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#E2ECE0]/60 group-hover:text-[#5c6e4f] transition-all">
                                <i className="fa-solid fa-kanban-board text-lg"></i>
                            </div>
                            <span className="text-[10px] font-sans font-bold bg-[#E2ECE0]/50 text-[#5c6e4f] px-2 py-0.5 rounded-full">
                                {tasksCount} Tasks
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-serif text-stone-800 group-hover:text-stone-950 transition-colors">Kanban Board</h3>
                            <p className="text-xs text-stone-400 font-medium leading-normal">
                                Manage focus tasks and project backlogs in customizable spaces.
                            </p>
                        </div>
                    </div>

                    {/* Schedule Card */}
                    <div 
                        onClick={() => onNavigate('schedule')}
                        className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 cursor-pointer border border-white/60 group"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#F9F1E6]/60 group-hover:text-[#a87834] transition-all">
                                <i className="fa-solid fa-calendar-week text-lg"></i>
                            </div>
                            <span className="text-[10px] font-sans font-bold bg-[#F9F1E6]/50 text-[#a87834] px-2 py-0.5 rounded-full">
                                Timetable
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-serif text-stone-800 group-hover:text-stone-950 transition-colors">Daily Schedule</h3>
                            <p className="text-xs text-stone-400 font-medium leading-normal">
                                Adjust your budget and track blocks under the rhythm principle.
                            </p>
                        </div>
                    </div>

                    {/* Journal Card (Future Placeholder) */}
                    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 opacity-60 border border-white/60 cursor-not-allowed">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                                <i className="fa-solid fa-book-bookmark text-lg"></i>
                            </div>
                            <span className="text-[10px] font-sans font-bold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                                Soon
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-serif text-stone-600">Journal & Docs</h3>
                            <p className="text-xs text-stone-400 font-medium leading-normal">
                                Record daily logs and organize rich-text information blocks.
                            </p>
                        </div>
                    </div>

                    {/* Reader Card (Future Placeholder) */}
                    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 opacity-60 border border-white/60 cursor-not-allowed">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                                <i className="fa-solid fa-newspaper text-lg"></i>
                            </div>
                            <span className="text-[10px] font-sans font-bold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                                Soon
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-serif text-stone-600">Reader Feed</h3>
                            <p className="text-xs text-stone-400 font-medium leading-normal">
                                Aggregate saved newsletters and articles into a distraction-free reader.
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
