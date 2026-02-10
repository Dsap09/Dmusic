'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Handle input change with debounce
    const handleInputChange = (value: string) => {
        setQuery(value);

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Only search if query has at least 2 characters
        if (value.trim().length >= 2) {
            // Set new timer - wait 800ms after user stops typing
            debounceTimerRef.current = setTimeout(() => {
                onSearch(value.trim());
            }, 800);
        }
    };

    // Handle Enter key press
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim().length >= 2) {
            // Clear debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            // Search immediately
            onSearch(query.trim());
        }
    };

    return (
        <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Cari lagu, artis..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="pl-10 sm:pl-12 pr-4 h-10 sm:h-12 text-sm sm:text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
            />
            {isLoading && (
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            {!isLoading && query.length > 0 && query.length < 2 && (
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-muted-foreground">Min 2 karakter</span>
                </div>
            )}
        </div>
    );
}
