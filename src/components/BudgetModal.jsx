import React, { useState, useEffect } from 'react';

export default function BudgetModal({ isOpen, onClose, buckets, onSaveBudget, onResetBudget }) {
    const [localBuckets, setLocalBuckets] = useState({});
    
    // Sync local state when modal opens or buckets change
    useEffect(() => {
        if (isOpen && buckets) {
            setLocalBuckets(JSON.parse(JSON.stringify(buckets)));
        }
    }, [isOpen, buckets]);

    if (!isOpen) return null;

    const handleSliderChange = (key, val) => {
        setLocalBuckets(prev => {
            const next = { ...prev };
            next[key].hours = parseFloat(val);
            return next;
        });
    };

    // Calculate sum
    const totalHours = Object.values(localBuckets).reduce((sum, b) => sum + (b.hours || 0), 0);
    const isValid = parseFloat(totalHours.toFixed(1)) === 24.0;

    const handleApply = () => {
        if (isValid) {
            onSaveBudget(localBuckets);
            onClose();
        }
    };

    const handleReset = () => {
        const resetData = onResetBudget();
        setLocalBuckets(resetData);
    };

    return (
        <div id="budget-modal" className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-panel border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-sage/10 rounded-lg text-accent-sage">
                            <i className="ph ph-chart-pie-slice text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-stone-900 font-sans">Rebalance Day Budget</h3>
                            <p className="text-xs text-muted">Distribute your 24-hour cycle to prevent burnout</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-muted hover:text-stone-900 transition">
                        <i className="ph ph-x text-lg"></i>
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto timetable-scrollbar">
                    {Object.entries(localBuckets).map(([key, value]) => (
                        <div key={key} className="p-3 bg-canvas/40 border border-border rounded-lg space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-stone-900">{value.name}</span>
                                <span className="font-mono text-accent-ochre font-bold">{parseFloat(value.hours).toFixed(1)} hours</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="12"
                                step="0.5"
                                value={value.hours}
                                onChange={(e) => handleSliderChange(key, e.target.value)}
                                className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent-ochre"
                            />
                        </div>
                    ))}
                </div>

                <div className="bg-canvas px-6 py-4 flex justify-between items-center border-t border-border/50">
                    <div className={`text-[11px] font-bold ${isValid ? 'text-accent-sage' : 'text-accent-terracotta'}`}>
                        Total Allocated: {totalHours.toFixed(1)}h / 24h
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 bg-canvas hover:bg-panel text-xs rounded border border-border text-stone-800 transition font-semibold shadow-sm"
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!isValid}
                            className={`px-4 py-1.5 bg-accent-sage text-white rounded text-xs font-semibold hover:opacity-95 transition shadow-sm ${!isValid ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            Apply Rhythm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
