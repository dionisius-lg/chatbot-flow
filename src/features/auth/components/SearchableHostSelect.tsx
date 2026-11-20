import { useState, useRef, useEffect, useMemo } from 'react';

interface SearchableHostSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export default function SearchableHostSelect({
    options,
    value,
    onChange,
    loading = false,
    disabled = false,
    placeholder = 'Select server host',
}: SearchableHostSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sort options alphabetically (A-Z) and filter by search query (case-insensitive)
    const filteredOptions = useMemo(() => {
        const sorted = [...options].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }),
        );
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return sorted;
        }
        return sorted.filter((host) => host.toLowerCase().includes(query));
    }, [options, searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 10);
        }
    }, [isOpen]);

    const handleSelect = (host: string) => {
        onChange(host);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className='relative w-full' ref={containerRef}>
            {/* ─── Trigger Button ─────────────────────────────────────────────── */}
            <button
                type='button'
                disabled={disabled || loading}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup='listbox'
                className={`w-full pl-10 pr-9 py-2.5 bg-gray-50/60 border rounded-xl text-sm text-left outline-none transition flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOpen
                        ? 'bg-white border-indigo-600 ring-3 ring-indigo-500/10'
                        : 'border-gray-200 hover:border-gray-300'
                }`}
            >
                {/* Server Icon */}
                <span className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400'>
                    <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth='2'
                        aria-hidden='true'
                    >
                        <rect width='20' height='8' x='2' y='2' rx='2' />
                        <rect width='20' height='8' x='2' y='14' rx='2' />
                        <line x1='6' x2='6.01' y1='6' y2='6' />
                        <line x1='6' x2='6.01' y1='18' y2='18' />
                    </svg>
                </span>

                {/* Selected Value or Placeholder */}
                <span className={`truncate block min-w-0 flex-1 ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {loading ? 'Loading server hosts...' : value || placeholder}
                </span>

                {/* Chevron Arrow */}
                <span className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400'>
                    <svg
                        className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth='2'
                        aria-hidden='true'
                    >
                        <path strokeLinecap='round' strokeLinejoin='round' d='m6 9 6 6 6-6' />
                    </svg>
                </span>
            </button>

            {/* ─── Dropdown Panel ─────────────────────────────────────────────── */}
            {isOpen && (
                <div className='absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden'>
                    {/* Pinned Search Input Header */}
                    <div className='p-2 border-b border-gray-100 bg-gray-50/50'>
                        <div className='relative'>
                            <span className='absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400'>
                                <svg
                                    className='w-3.5 h-3.5'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    aria-hidden='true'
                                >
                                    <circle cx='11' cy='11' r='8' />
                                    <path d='m21 21-4.3-4.3' />
                                </svg>
                            </span>
                            <input
                                ref={searchInputRef}
                                type='text'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsOpen(false);
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (filteredOptions.length > 0) {
                                            handleSelect(filteredOptions[0]);
                                        }
                                    }
                                }}
                                placeholder='Search server host...'
                                className='w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition'
                            />
                            {searchQuery && (
                                <button
                                    type='button'
                                    onClick={() => setSearchQuery('')}
                                    className='absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer'
                                    title='Clear search'
                                >
                                    <svg
                                        className='w-3.5 h-3.5'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    >
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M18 6 6 18M6 6l12 12' />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Options List */}
                    <ul
                        role='listbox'
                        className='max-h-48 sm:max-h-56 overflow-y-auto overscroll-contain divide-y divide-gray-50 py-1'
                    >
                        {options.length === 0 ? (
                            <li className='px-3.5 py-4 text-xs text-center text-gray-400 select-none'>
                                No server host options available
                            </li>
                        ) : filteredOptions.length === 0 ? (
                            <li className='px-3.5 py-4 text-xs text-center text-gray-400 select-none'>
                                No matching server host found
                            </li>
                        ) : (
                            filteredOptions.map((host) => {
                                const isSelected = host === value;
                                return (
                                    <li key={host} role='option' aria-selected={isSelected}>
                                        <button
                                            type='button'
                                            onClick={() => handleSelect(host)}
                                            className={`w-full px-3.5 py-2 text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-indigo-50/80 text-indigo-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className='truncate min-w-0 flex-1'>{host}</span>
                                            {isSelected && (
                                                <svg
                                                    className='w-4 h-4 text-indigo-600 shrink-0'
                                                    fill='none'
                                                    viewBox='0 0 24 24'
                                                    stroke='currentColor'
                                                    strokeWidth='2.5'
                                                    aria-hidden='true'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        d='M20 6 9 17l-5-5'
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
