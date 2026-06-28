import React from 'react';

export default function RoutineModal({
    isOpen,
    onClose,
    day,
    checklistDatabase,
    defaultMorningItems,
    onToggleZenItem,
    onToggleSkincareDay
}) {
    if (!isOpen) return null;

    const dateStr = day.toISOString().split('T')[0];
    const items = checklistDatabase[dateStr] || defaultMorningItems;
    const doneCount = items.filter(i => i.done).length;
    const percent = Math.round((doneCount / items.length) * 100);

    // Active Skincare Alternation
    const dayNum = day.getDate();
    const skincareDayText = (dayNum % 2 === 0)
        ? "Vitamin C Serum (Even Day Active)"
        : "Niacinamide / Retinol Alternate (Odd Day Active)";

    return (
        <div id="routine-modal" className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-panel border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 opacity-100" id="routine-modal-panel">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-ochre/10 rounded-lg text-accent-ochre">
                            <i className="ph ph-sun-dim text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-stone-900 font-sans">Morning Routine</h3>
                            <p className="text-xs text-muted">A slow start for high focus</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-muted hover:text-stone-900 transition">
                        <i className="ph ph-x text-lg"></i>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-xs text-muted leading-relaxed font-medium">
                        Suggested window: <span className="text-stone-900 font-semibold">6:00 AM – 7:30 AM</span>. 
                        Complete items at your own pace. Checking these off updates your daily completion score in real-time.
                    </p>

                    {/* Interactive Sub-checklists */}
                    <div className="space-y-2.5">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onToggleZenItem(dateStr, item.id)}
                                className={`p-3 rounded-lg border flex items-center gap-3 transition cursor-pointer select-none shadow-sm ${item.done
                                    ? 'bg-accent-ochre/5 border-accent-ochre/25 text-muted'
                                    : 'bg-canvas border-border text-sand hover:border-accent-ochre/45'
                                }`}
                            >
                                <div className="flex items-center justify-center">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${item.done ? 'bg-accent-ochre border-accent-ochre text-white' : 'border-muted'}`}>
                                        {item.done && <i className="ph ph-check text-xs"></i>}
                                    </div>
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold ${item.done ? 'line-through text-muted/80' : 'text-stone-900'}`}>{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alternative Day Switcher (Vitamin C vs Niacinamide) */}
                    <div className="p-3 bg-canvas border border-border rounded-lg flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-stone-900">Active Skincare Alternation</p>
                            <p className="text-[10px] text-muted font-medium" id="skincare-alt-text">Today: {skincareDayText}</p>
                        </div>
                        <button onClick={onToggleSkincareDay} className="px-2.5 py-1 bg-panel text-xs rounded hover:bg-border transition text-sand hover:text-stone-900 border border-border shadow-sm">
                            Switch Active
                        </button>
                    </div>
                </div>

                <div className="bg-canvas px-6 py-4 flex justify-between items-center border-t border-border/50">
                    <div className="text-[11px] text-muted">
                        Completed: <span className="text-accent-ochre font-bold">{percent}%</span>
                    </div>
                    <button onClick={onClose} className="px-4 py-1.5 bg-accent-ochre text-white rounded text-xs font-semibold hover:opacity-95 transition shadow-sm">
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
}
