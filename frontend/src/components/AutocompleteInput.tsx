import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface Props {
    value: string;
    onChange: (val: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    options: string[];
    placeholder?: string;
    className?: string;
}

export function AutocompleteInput({ value, onChange, onKeyDown, options, placeholder, className }: Props) {
    const [focused, setFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(o => 
        o.toLowerCase().includes(value.toLowerCase()) && o !== value
    ).slice(0, 8); // show max 8 suggestions

    useEffect(() => {
        setSelectedIndex(0);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (focused && filteredOptions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
                return;
            }
            if (e.key === 'Tab' || e.key === 'Enter') {
                if (filteredOptions[selectedIndex]) {
                    e.preventDefault();
                    onChange(filteredOptions[selectedIndex]);
                    setFocused(false);
                    return;
                }
            }
            if (e.key === 'Escape') {
                setFocused(false);
                return;
            }
        }
        if (onKeyDown) onKeyDown(e);
    };

    return (
        <div className="relative flex-1" ref={containerRef}>
            <input 
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setFocused(true);
                }}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={clsx(className, "w-full")}
            />
            {focused && filteredOptions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-panel border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                    {filteredOptions.map((opt, idx) => (
                        <div 
                            key={opt} 
                            className={clsx(
                                "px-3 py-1.5 text-sm cursor-pointer truncate",
                                idx === selectedIndex ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-textMain hover:bg-bg'
                            )}
                            onMouseDown={(e) => {
                                e.preventDefault(); // prevent blur
                                onChange(opt);
                                setFocused(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
