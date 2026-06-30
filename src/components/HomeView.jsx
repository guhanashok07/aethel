import React from 'react';

export default function HomeView({ onNavigate }) {
    return (
        <div className="flex-1 relative overflow-hidden bg-[#FAF8F5] flex flex-col justify-center items-center px-6">
            
            {/* Morphing Fluid Auras (Background) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Sage Green Aura */}
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#E2ECE0]/30 blur-[100px] animate-aura-slow"></div>
                {/* Terracotta/Peach Aura */}
                <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#FCECE8]/50 blur-[120px] animate-aura-reverse"></div>
                {/* Ochre Aura */}
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#F9F1E6]/40 blur-[110px] animate-aura-slow"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center gap-12">
                
                {/* Branding */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-6xl md:text-7xl font-serif text-stone-900 tracking-tight">
                        Aethel
                    </h1>
                    <span className="text-xs uppercase tracking-[0.3em] text-stone-400 font-sans font-bold">
                        Personal OS
                    </span>
                </div>

                {/* Main Welcome Greeting */}
                <div className="flex flex-col items-center gap-4">
                    <span className="h-[1px] w-12 bg-stone-300"></span>
                    <h2 className="text-2xl md:text-3xl font-sans font-medium text-stone-700 leading-relaxed max-w-md">
                        Hey GG! What are you working on today?
                    </h2>
                    <span className="h-[1px] w-12 bg-stone-300"></span>
                </div>

                {/* Gateway Nav Buttons */}
                <div className="flex flex-wrap gap-6 justify-center mt-4">
                    <button 
                        onClick={() => onNavigate('board')}
                        className="glass-card px-8 py-3.5 rounded-full text-stone-700 hover:text-stone-950 font-sans font-semibold text-sm flex items-center gap-2"
                    >
                        <i className="fa-solid fa-kanban-board text-[#5c6e4f]"></i> Open Board
                    </button>

                    <button 
                        onClick={() => onNavigate('schedule')}
                        className="glass-card px-8 py-3.5 rounded-full text-stone-700 hover:text-stone-950 font-sans font-semibold text-sm flex items-center gap-2"
                    >
                        <i className="fa-solid fa-calendar-week text-[#a87834]"></i> Open Schedule
                    </button>
                </div>

            </div>
        </div>
    );
}
