import React, { useState, useEffect } from 'react';

export default function HomeView({ onNavigate }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(null); // 'board' | 'schedule' | null

    // Track mouse position for dynamic spotlight interaction
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: e.clientX,
                y: e.clientY
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="flex-1 relative overflow-hidden bg-white flex flex-col justify-between p-8 md:p-16 select-none font-sans">
            
            {/* SVG Noise/Grain Texture Overlay (Signature Awwwards Effect) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.035] z-40 mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>

            {/* Interactive Mouse Cursor Spotlight Aura */}
            <div 
                className="absolute pointer-events-none rounded-full w-[350px] h-[350px] bg-gradient-to-r from-amber-200/10 via-rose-300/10 to-indigo-300/10 blur-[80px] z-10 transition-transform duration-500 ease-out hidden md:block"
                style={{
                    transform: `translate(${mousePos.x - 175}px, ${mousePos.y - 175}px)`,
                }}
            />

            {/* Floating Morphing Auras (Heavy visible colors, slow-moving) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Coral Aura */}
                <div className="absolute top-12 left-10 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-rose-200 via-rose-300/60 to-orange-200/50 opacity-70 blur-[120px] animate-aura-slow"></div>
                {/* Indigo/Lavender Aura */}
                <div className="absolute -bottom-20 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-100 via-purple-200/50 to-pink-100 opacity-60 blur-[130px] animate-aura-reverse"></div>
                {/* Mint/Green Aura */}
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#c9e4de] to-[#dbf3c6]/40 opacity-50 blur-[110px] animate-aura-slow"></div>
                {/* Marigold/Gold Aura */}
                <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-amber-100 via-orange-200/50 to-rose-200/30 opacity-60 blur-[120px] animate-aura-reverse"></div>
            </div>

            {/* Top Bar / Metadata */}
            <div className="relative z-20 flex justify-between items-center w-full max-w-7xl mx-auto text-stone-400 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c6e4f] animate-pulse"></span>
                    <span>System Active</span>
                </div>
                <div>
                    <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Center Body Layout */}
            <div className="relative z-20 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center items-center my-8">
                
                {/* Gigantic Premium Typography Headers */}
                <div className="flex flex-col items-center text-center gap-6 mb-16">
                    {/* Editorial Spaced Title */}
                    <h1 className="text-7xl sm:text-8xl md:text-9xl font-syne font-extrabold tracking-tight text-stone-900 leading-none select-none uppercase">
                        Aethel
                    </h1>
                    
                    {/* Flow/Rhythm Subtitle */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-stone-400 font-mono uppercase tracking-[0.25em] text-[10px] font-bold">
                            Personal Operating Environment
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-cormorant italic text-stone-600 leading-relaxed max-w-xl">
                            Hey GG! What are you working on today?
                        </h2>
                    </div>
                </div>

                {/* Gateway Panels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl items-stretch px-4">
                    
                    {/* Board Gateway Card */}
                    <div 
                        onClick={() => onNavigate('board')}
                        onMouseEnter={() => setIsHovered('board')}
                        onMouseLeave={() => setIsHovered(null)}
                        className={`glass-card rounded-3xl p-8 flex flex-col justify-between gap-8 border border-white/80 cursor-pointer group relative overflow-hidden h-72 transition-all duration-500 ${isHovered === 'schedule' ? 'opacity-30 scale-[0.98] blur-[1px]' : 'opacity-100'}`}
                    >
                        {/* Hover Local Aura Spotlight */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-200/20 to-orange-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                        
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200/40 flex items-center justify-center text-stone-700 shadow-sm group-hover:scale-110 group-hover:border-rose-200 transition-all duration-300">
                                <i className="fa-solid fa-kanban-board text-lg text-rose-500/80"></i>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 bg-stone-100/50 px-2.5 py-1 rounded-full font-bold">
                                Module 01
                            </span>
                        </div>

                        {/* Minimal Interactive Wireframe Preview inside Card */}
                        <div className="relative z-10 w-full h-16 bg-white/40 border border-stone-200/30 rounded-xl p-2.5 flex gap-2 overflow-hidden shadow-inner group-hover:border-stone-200/60 transition-colors">
                            <div className="flex-1 flex flex-col gap-1.5 opacity-80">
                                <span className="w-6 h-1.5 bg-stone-300/60 rounded"></span>
                                <span className="w-full h-5 bg-white/80 border border-stone-200/40 rounded shadow-sm"></span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <span className="w-8 h-1.5 bg-rose-400/40 rounded"></span>
                                <span className="w-full h-5 bg-white border border-rose-200/40 rounded shadow-sm flex items-center px-1"><span className="w-1 h-1 rounded-full bg-rose-400"></span></span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5 opacity-40">
                                <span className="w-5 h-1.5 bg-stone-300/60 rounded"></span>
                                <span className="w-full h-5 bg-white/80 border border-stone-200/40 rounded shadow-sm"></span>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col gap-1.5">
                            <h3 className="text-xl font-syne font-bold text-stone-800 flex items-center gap-1.5">
                                Intention Board <i className="fa-solid fa-arrow-right text-xs text-stone-400 group-hover:translate-x-1.5 transition-transform duration-300"></i>
                            </h3>
                            <p className="text-xs text-stone-400 font-medium leading-relaxed max-w-xs">
                                Focus sprints, backlog spaces, and task pipelines mapped clean.
                            </p>
                        </div>
                    </div>

                    {/* Schedule Gateway Card */}
                    <div 
                        onClick={() => onNavigate('schedule')}
                        onMouseEnter={() => setIsHovered('schedule')}
                        onMouseLeave={() => setIsHovered(null)}
                        className={`glass-card rounded-3xl p-8 flex flex-col justify-between gap-8 border border-white/80 cursor-pointer group relative overflow-hidden h-72 transition-all duration-500 ${isHovered === 'board' ? 'opacity-30 scale-[0.98] blur-[1px]' : 'opacity-100'}`}
                    >
                        {/* Hover Local Aura Spotlight */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200/20 to-teal-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                        
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200/40 flex items-center justify-center text-stone-700 shadow-sm group-hover:scale-110 group-hover:border-indigo-200 transition-all duration-300">
                                <i className="fa-solid fa-calendar-week text-lg text-indigo-500/80"></i>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 bg-stone-100/50 px-2.5 py-1 rounded-full font-bold">
                                Module 02
                            </span>
                        </div>

                        {/* Minimal Interactive Timetable Preview inside Card */}
                        <div className="relative z-10 w-full h-16 bg-white/40 border border-stone-200/30 rounded-xl p-2.5 flex flex-col gap-1.5 justify-center overflow-hidden shadow-inner group-hover:border-stone-200/60 transition-colors">
                            <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-mono text-stone-400 w-8">08:00</span>
                                <div className="flex-1 h-3.5 bg-gradient-to-r from-indigo-400/20 to-indigo-500/25 border border-indigo-200/30 rounded flex items-center px-1.5"><span className="w-12 h-1 bg-indigo-400/50 rounded"></span></div>
                            </div>
                            <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-mono text-stone-400 w-8">12:00</span>
                                <div className="flex-1 h-3.5 bg-gradient-to-r from-amber-400/20 to-amber-500/25 border border-amber-200/30 rounded flex items-center px-1.5"><span className="w-8 h-1 bg-amber-400/50 rounded"></span></div>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col gap-1.5">
                            <h3 className="text-xl font-syne font-bold text-stone-800 flex items-center gap-1.5">
                                Intention Timetable <i className="fa-solid fa-arrow-right text-xs text-stone-400 group-hover:translate-x-1.5 transition-transform duration-300"></i>
                            </h3>
                            <p className="text-xs text-stone-400 font-medium leading-relaxed max-w-xs">
                                Dynamic budget slices and live marker tracking for your daily flow.
                            </p>
                        </div>
                    </div>

                </div>

            </div>

            {/* Bottom Section / System Version */}
            <div className="relative z-20 flex justify-between items-center w-full max-w-7xl mx-auto text-stone-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                <span>Personal OS v1.0.0</span>
                <span className="text-stone-300">Aethel Studio</span>
            </div>

        </div>
    );
}
