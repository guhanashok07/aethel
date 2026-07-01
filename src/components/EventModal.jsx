import React, { useState, useEffect } from 'react';

const EVENT_TYPES = [
    { value: 'block', label: 'Time Block' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'deadline', label: 'Deadline' }
];

const BUCKETS = [
    { value: 'work', label: 'Work', color: 'bg-rose-100/50 text-rose-700 border-rose-200/60' },
    { value: 'health', label: 'Health', color: 'bg-emerald-100/50 text-emerald-700 border-emerald-200/60' },
    { value: 'routine', label: 'Routine', color: 'bg-amber-100/50 text-amber-700 border-amber-200/60' },
    { value: 'personal', label: 'Personal', color: 'bg-indigo-100/50 text-indigo-700 border-indigo-200/60' }
];

export default function EventModal({ isOpen, onClose, onSubmit, onDelete, initialEvent = null, defaultDate = '' }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('block');
    const [date, setDate] = useState('');
    const [startHour, setStartHour] = useState(9.0);
    const [endHour, setEndHour] = useState(10.0);
    const [bucket, setBucket] = useState('work');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (initialEvent) {
            setName(initialEvent.name || '');
            setType(initialEvent.type || 'block');
            setDate(initialEvent.date || defaultDate);
            setStartHour(initialEvent.startHour ?? 9.0);
            setEndHour(initialEvent.endHour ?? 10.0);
            setBucket(initialEvent.bucket || 'work');
        } else {
            setName('');
            setType('block');
            setDate(defaultDate);
            setStartHour(9.0);
            setEndHour(10.0);
            setBucket('work');
        }
        setShowDeleteConfirm(false);
    }, [initialEvent, defaultDate, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !date) return;
        onSubmit({
            id: initialEvent?.id,
            name: name.trim(),
            type,
            date,
            startHour: parseFloat(startHour),
            endHour: type === 'block' ? parseFloat(endHour) : parseFloat(startHour) + 0.5,
            bucket
        });
        onClose();
    };

    // Helper to generate hours option list
    const getHoursOptions = () => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hourVal = h + m / 60;
                let displayH = h % 12 === 0 ? 12 : h % 12;
                let displayM = m === 0 ? '00' : '30';
                let ampm = h >= 12 ? 'PM' : 'AM';
                options.push({ value: hourVal, label: `${displayH}:${displayM} ${ampm}` });
            }
        }
        return options;
    };

    const hoursOptions = getHoursOptions();

    return (
        <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-page-fade">
            <div className="bg-white/95 backdrop-blur-xl border border-stone-200/50 rounded-2xl shadow-xl max-w-md w-full overflow-hidden select-none">
                <header className="flex justify-between items-center px-6 py-4 border-b border-stone-200/40">
                    <h3 className="text-base font-cormorant font-normal italic tracking-wide text-stone-850">
                        {showDeleteConfirm ? 'delete options' : (initialEvent ? 'edit event' : 'new event')}
                    </h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition">
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </header>

                {showDeleteConfirm ? (
                    <div className="p-6 flex flex-col gap-4 animate-page-fade">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Delete Recurring Event</p>
                        <p className="text-xs text-stone-600 leading-relaxed font-sans">
                            This is a recurring template event. Would you like to delete only this specific occurrence, or all events in the series?
                        </p>
                        <div className="flex flex-col gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(initialEvent.id, 'only-this');
                                    onClose();
                                }}
                                className="w-full py-2.5 bg-stone-50 border border-stone-200/60 hover:bg-stone-100 transition rounded-xl text-[10px] font-mono tracking-wider uppercase text-stone-700 text-center font-medium"
                            >
                                Delete this occurrence only
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(initialEvent.id, 'all');
                                    onClose();
                                }}
                                className="w-full py-2.5 bg-red-50 border border-red-250/30 hover:bg-red-100/50 transition rounded-xl text-[10px] font-mono tracking-wider uppercase text-red-500 text-center font-bold"
                            >
                                Delete all occurrences
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="text-[10px] font-mono tracking-wider uppercase text-stone-400 hover:text-stone-600 transition mt-4 self-center"
                        >
                            Back to editing
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                        {/* Event Name */}
                        <div className="flex flex-col gap-1.5">
                            <input
                                type="text"
                                required
                                placeholder="Event description..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-lg font-cormorant font-normal italic tracking-wide bg-transparent outline-none border-b border-stone-200/50 pb-1 text-stone-800 placeholder-stone-400 focus:border-stone-400 transition"
                            />
                        </div>

                        {/* Segmented Type Toggle */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono tracking-wider uppercase text-stone-450">Type</label>
                            <div className="grid grid-cols-3 bg-stone-50 border border-stone-200/40 rounded-lg p-0.5">
                                {EVENT_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setType(t.value)}
                                        className={`py-1 text-[10px] font-mono tracking-wider uppercase rounded-md transition-all ${type === t.value ? 'bg-white text-stone-800 shadow-sm border border-stone-200/10' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Selector */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono tracking-wider uppercase text-stone-450">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-stone-50/50 border border-stone-200/40 rounded-lg px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-stone-300 transition"
                            />
                        </div>

                        {/* Time Selector */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-mono tracking-wider uppercase text-stone-450">
                                    {type === 'deadline' ? 'Due Time' : 'Start Time'}
                                </label>
                                <select
                                    value={startHour}
                                    onChange={(e) => setStartHour(parseFloat(e.target.value))}
                                    className="bg-stone-50/50 border border-stone-200/40 rounded-lg px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-stone-300 transition appearance-none cursor-pointer"
                                >
                                    {hoursOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {type === 'block' && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-mono tracking-wider uppercase text-stone-450">End Time</label>
                                    <select
                                        value={endHour}
                                        onChange={(e) => setEndHour(parseFloat(e.target.value))}
                                        className="bg-stone-50/50 border border-stone-200/40 rounded-lg px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-stone-300 transition appearance-none cursor-pointer"
                                    >
                                        {hoursOptions.filter(o => o.value > startHour).map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Category Selector Pills */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono tracking-wider uppercase text-stone-450">Space / Bucket</label>
                            <div className="flex gap-2 flex-wrap">
                                {BUCKETS.map((b) => (
                                    <button
                                        key={b.value}
                                        type="button"
                                        onClick={() => setBucket(b.value)}
                                        className={`px-3 py-1 border text-[10px] font-mono tracking-wider uppercase rounded-full transition-all ${bucket === b.value ? `${b.color} font-medium` : 'border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300'}`}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center gap-3 mt-3 border-t border-stone-200/40 pt-4">
                            {initialEvent ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (initialEvent.date) {
                                            // Already a specific date block, delete directly
                                            if (confirm("Delete event permanently?")) {
                                                onDelete(initialEvent.id, 'all');
                                                onClose();
                                            }
                                        } else {
                                            // Recurring template block, show confirm options
                                            setShowDeleteConfirm(true);
                                        }
                                    }}
                                    className="text-[10px] font-mono tracking-wider uppercase text-red-400 hover:text-red-600 transition flex items-center gap-1"
                                >
                                    <i className="fa-solid fa-trash-can"></i> Delete
                                </button>
                            ) : <div />}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-1.5 text-[10px] font-mono tracking-wider uppercase border border-stone-200 text-stone-400 rounded-lg hover:text-stone-600 hover:border-stone-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 text-[10px] font-mono tracking-wider uppercase bg-stone-700 text-white rounded-lg hover:bg-stone-850 transition"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
