import { useState } from 'react';
import BookmarksApp from './BookmarksApp';

const TILES = [
    {
        id: 'bookmarks',
        title: 'Bookmarks',
        description: 'A living map of every link and project you keep coming back to.',
        icon: 'fa-diagram-project',
        span: 'col-span-2 row-span-2',
        available: true
    },
    {
        id: 'snippets',
        title: 'Snippets',
        description: 'Reusable bits of text, code and prompts.',
        icon: 'fa-code',
        span: '',
        available: false
    },
    {
        id: 'contacts',
        title: 'Contacts',
        description: 'People worth remembering.',
        icon: 'fa-address-book',
        span: '',
        available: false
    }
];

export default function VaultView({ bookmarkNodes, onAddBookmark, onUpdateBookmark, onDeleteBookmark }) {
    const [openApp, setOpenApp] = useState('');

    if (openApp === 'bookmarks') {
        return (
            <BookmarksApp
                nodes={bookmarkNodes}
                onAdd={onAddBookmark}
                onUpdate={onUpdateBookmark}
                onDelete={onDeleteBookmark}
                onBack={() => setOpenApp('')}
            />
        );
    }

    return (
        <main className="flex-1 overflow-y-auto scroll-hidden pt-20 px-4 md:px-6 pb-10 bg-transparent text-stone-800 font-sans">
            <div className="max-w-5xl mx-auto flex flex-col gap-7">
                <header className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-stone-400">Aethel OS</span>
                    <h1 className="font-cormorant italic text-4xl md:text-5xl text-stone-850">Vault</h1>
                    <p className="text-sm text-stone-400 max-w-md">
                        The quieter corners of your OS — small tools you reach for, just not every day.
                    </p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] gap-4">
                    {TILES.map((tile) => (
                        <button
                            key={tile.id}
                            onClick={() => tile.available && setOpenApp(tile.id)}
                            disabled={!tile.available}
                            className={`group relative flex flex-col justify-between text-left p-5 rounded-[26px] border transition overflow-hidden ${tile.span} ${
                                tile.available
                                    ? 'bg-white/60 backdrop-blur-xl border-stone-200/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-stone-300/60 cursor-pointer'
                                    : 'bg-stone-50/40 border-stone-200/30 cursor-not-allowed'
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tile.available ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-300'}`}>
                                <i className={`fa-solid ${tile.icon} text-[13px]`}></i>
                            </div>
                            <div>
                                <h3 className={`font-cormorant italic text-2xl ${tile.available ? 'text-stone-850' : 'text-stone-350'}`}>
                                    {tile.title}
                                </h3>
                                <p className={`text-xs mt-1 leading-snug ${tile.available ? 'text-stone-400' : 'text-stone-300'}`}>
                                    {tile.available ? tile.description : 'Coming soon'}
                                </p>
                            </div>
                            {tile.available && (
                                <i className="fa-solid fa-arrow-up-right absolute top-5 right-5 text-stone-300 group-hover:text-stone-600 transition text-xs"></i>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}
