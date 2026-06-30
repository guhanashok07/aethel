import React, { useState, useEffect } from 'react';

export default function HomeView({ onNavigate }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
            
            {/* SVG Noise/Grain Texture Overlay */}
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
                className="absolute pointer-events-none rounded-full w-[350px] h-[350px] bg-gradient-to-r from-amber-200/10 via-rose-300/10 to-indigo-300/10 blur-[85px] z-10 transition-transform duration-500 ease-out hidden md:block"
                style={{
                    transform: `translate(${mousePos.x - 175}px, ${mousePos.y - 175}px)`,
                }}
            />

            {/* Floating Morphing Auras (Vibrant, floating, clearly visible movement) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Coral Aura */}
                <div className="absolute top-12 left-10 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-rose-200 via-rose-300/60 to-orange-200/50 opacity-80 blur-[110px] animate-aura-slow"></div>
                {/* Indigo/Lavender Aura */}
                <div className="absolute -bottom-20 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-100 via-purple-200/50 to-pink-100 opacity-70 blur-[120px] animate-aura-reverse"></div>
                {/* Mint/Green Aura */}
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#c9e4de] to-[#dbf3c6]/40 opacity-60 blur-[100px] animate-aura-slow"></div>
                {/* Marigold/Gold Aura */}
                <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-amber-100 via-orange-200/50 to-rose-200/30 opacity-70 blur-[110px] animate-aura-reverse"></div>
            </div>

            {/* Top Bar / Metadata */}
            <div className="relative z-20 flex justify-between items-center w-full max-w-7xl mx-auto text-stone-400 font-mono text-[9px] uppercase tracking-[0.25em] font-bold">
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
                
                {/* Typography Headers */}
                <div className="flex flex-col items-center text-center gap-8 mb-12">
                    
                    {/* Editorial Spaced Serif Title */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-cormorant font-light tracking-[0.35em] text-stone-900 leading-none select-none uppercase mr-[-0.35em]">
                        Aethel
                    </h1>
                    
                    {/* Flow/Rhythm Subtitle */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-stone-400 font-mono uppercase tracking-[0.3em] text-[9px] font-bold">
                            Personal Operating Environment
                        </span>
                        
                        {/* Divider Line */}
                        <span className="h-[1px] w-8 bg-stone-300/80 my-1"></span>
                        
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-cormorant font-normal italic text-stone-600 leading-relaxed max-w-xl">
                            Hey GG! What are you working on today?
                        </h2>
                    </div>
                </div>

                {/* Lowercase Typography Link Gateways */}
                <div className="flex items-center gap-8 mt-6">
                    <button 
                        onClick={() => onNavigate('board')}
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-400 hover:text-stone-900 tracking-wider transition-all duration-300 relative group py-1"
                    >
                        board
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                    
                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        onClick={() => onNavigate('schedule')}
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-400 hover:text-stone-900 tracking-wider transition-all duration-300 relative group py-1"
                    >
                        schedule
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full"></span>
                    </button>
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
