import React from 'react';

export default function HomeView({ onNavigate }) {
    return (
        <div className="flex-1 relative overflow-hidden bg-transparent flex flex-col justify-between p-8 md:p-16 select-none font-sans">

            {/* Breathing OS Radial Pulse (Background Glows with staggered out-of-phase animations) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Coral Aura — starts immediately */}
                <div className="absolute top-12 left-10 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-rose-200 via-rose-300/60 to-orange-200/50 blur-[110px] animate-breathe-coral" style={{ animationDelay: '0s' }}></div>
                {/* Indigo/Lavender Aura — offset by 5s so it's fading in while coral fades out */}
                <div className="absolute -bottom-20 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-100 via-purple-200/50 to-pink-100 blur-[120px] animate-breathe-indigo" style={{ animationDelay: '-5s' }}></div>
                {/* Mint/Green Aura — offset by 9s */}
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#c9e4de] to-[#dbf3c6]/40 blur-[100px] animate-breathe-mint" style={{ animationDelay: '-9s' }}></div>
                {/* Marigold/Gold Aura — offset by 3s */}
                <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-amber-100 via-orange-200/50 to-rose-200/30 blur-[110px] animate-breathe-gold" style={{ animationDelay: '-3s' }}></div>
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
                    
                    {/* Giant Editorial Serif Title */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-cormorant font-medium tracking-[0.16em] text-stone-900 leading-none select-none uppercase mr-[-0.16em]">
                        Aethel
                    </h1>
                    
                    {/* Flow/Rhythm Subtitle */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-stone-400 font-mono uppercase tracking-[0.45em] mr-[-0.45em] text-[9px] font-bold animate-float-gentle">
                            Personal OS
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
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-300/60 hover:text-stone-400/80 tracking-wider relative cursor-not-allowed py-1 transition-colors duration-300"
                        title="Goals (Coming Soon)"
                    >
                        goals
                    </button>

                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        onClick={() => onNavigate('board')}
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-400 hover:text-stone-900 tracking-wider relative group py-1 transition-colors duration-300"
                    >
                        board
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                    
                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        onClick={() => onNavigate('schedule')}
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-400 hover:text-stone-900 tracking-wider relative group py-1 transition-colors duration-300"
                    >
                        schedule
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full"></span>
                    </button>

                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-300/60 hover:text-stone-400/80 tracking-wider relative cursor-not-allowed py-1 transition-colors duration-300"
                        title="Ideas (Coming Soon)"
                    >
                        ideas
                    </button>

                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-300/60 hover:text-stone-400/80 tracking-wider relative cursor-not-allowed py-1 transition-colors duration-300"
                        title="Notebook (Coming Soon)"
                    >
                        notebook
                    </button>

                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-300/60 hover:text-stone-400/80 tracking-wider relative cursor-not-allowed py-1 transition-colors duration-300"
                        title="Reading (Coming Soon)"
                    >
                        reading
                    </button>

                    <span className="text-stone-300 font-light text-xl select-none font-cormorant">/</span>
                    
                    <button 
                        className="font-cormorant font-normal italic text-2xl md:text-3xl text-stone-300/60 hover:text-stone-400/80 tracking-wider relative cursor-not-allowed py-1 transition-colors duration-300"
                        title="Job Search (Coming Soon)"
                    >
                        job search
                    </button>
                </div>

            </div>

            {/* Bottom Section / System Version & Time-Ring Compass */}
            <div className="relative z-20 flex justify-between items-end w-full max-w-7xl mx-auto text-stone-400 font-mono text-[9px] uppercase tracking-widest font-bold h-20">
                <span className="pb-2">Personal OS v1.0.0</span>

                {/* Slow-Spinning Time-Ring Compass SVG */}
                <div className="opacity-[0.32] select-none pointer-events-none z-30 translate-x-3 translate-y-3">
                    <svg className="w-[88px] h-[88px] animate-spin-slow" viewBox="0 0 100 100">
                        <path id="circlePath" d="M 50,50 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" fill="none" />
                        <text style={{ fontSize: '5.5px', letterSpacing: '0.14em', fill: '#78716c', textTransform: 'uppercase' }}>
                            <textPath href="#circlePath">
                                Aethel • Personal OS • Aethel • Personal OS • Aethel • Personal OS •
                            </textPath>
                        </text>
                    </svg>
                </div>
            </div>

        </div>
    );
}
