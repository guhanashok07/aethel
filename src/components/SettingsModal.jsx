import React, { useRef } from 'react';

const WALLPAPER_PRESETS = [
    {
        id: 'none',
        name: 'Classic White',
        value: '',
        thumbnail: 'bg-white border border-stone-200'
    },
    {
        id: 'dawn',
        name: 'Warm Dawn',
        value: 'linear-gradient(135deg, #fdfbf7 0%, #fee2e2 50%, #fef3c7 100%)',
        thumbnail: 'bg-gradient-to-br from-orange-50 via-rose-100 to-amber-100'
    },
    {
        id: 'mist',
        name: 'Dark Mist',
        value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        thumbnail: 'bg-gradient-to-br from-slate-700 to-slate-900'
    },
    {
        id: 'forest',
        name: 'Foggy Forest',
        value: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80)',
        thumbnail: 'bg-[url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=120&q=80)] bg-cover bg-center'
    },
    {
        id: 'dunes',
        name: 'Desert Dunes',
        value: 'url(https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80)',
        thumbnail: 'bg-[url(https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=120&q=80)] bg-cover bg-center'
    },
    {
        id: 'stars',
        name: 'Celestial Night',
        value: 'url(https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1920&q=80)',
        thumbnail: 'bg-[url(https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=120&q=80)] bg-cover bg-center'
    }
];

export default function SettingsModal({ isOpen, onClose, currentWallpaper, onSelectWallpaper }) {
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onSelectWallpaper(`url(${reader.result})`);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        const url = e.target.elements.wallpaperUrl.value.trim();
        if (url) {
            onSelectWallpaper(`url(${url})`);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-stone-900/15 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-lg bg-white/75 backdrop-blur-2xl border border-stone-200/50 rounded-[32px] shadow-2xl overflow-hidden flex flex-col p-6 md:p-8 animate-page-fade">
                <header className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200/40">
                    <div>
                        <h2 className="font-cormorant italic text-3xl text-stone-900 lowercase">Settings</h2>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Workspace Customization</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition flex items-center justify-center border border-stone-200/30"
                    >
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </header>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">Choose Background</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {WALLPAPER_PRESETS.map((preset) => {
                                const active = currentWallpaper === preset.value;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => onSelectWallpaper(preset.value)}
                                        className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border transition-all ${active ? 'bg-stone-50/50 border-stone-400 shadow-sm' : 'border-stone-200/45 hover:border-stone-300 hover:bg-white/40'}`}
                                    >
                                        <div className={`w-full aspect-[16/10] rounded-xl overflow-hidden ${preset.thumbnail}`} />
                                        <span className="text-[11px] font-medium text-stone-600 group-hover:text-stone-800">{preset.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-t border-stone-200/40 pt-5">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">Custom Wallpaper</h3>
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="h-9 px-4 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-mono uppercase tracking-wider transition flex items-center gap-2"
                            >
                                <i className="fa-solid fa-upload"></i> Upload Image
                            </button>
                            <input 
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            
                            <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2 min-w-[200px]">
                                <input
                                    name="wallpaperUrl"
                                    type="url"
                                    placeholder="Paste image URL..."
                                    className="flex-1 h-9 rounded-full bg-stone-50/80 border border-stone-200/50 px-4 text-xs outline-none focus:border-stone-300"
                                />
                                <button
                                    type="submit"
                                    className="h-9 w-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200/50 text-stone-700 transition flex items-center justify-center"
                                >
                                    <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
