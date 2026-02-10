'use client';

import { X, Music2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useState, useEffect } from 'react';
import { getLyrics } from '@/services/lyrics.service';

export function LyricsPanel() {
    const { currentTrack, showLyrics, toggleLyrics } = usePlayerStore();
    const [lyrics, setLyrics] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLyrics = async () => {
        if (!currentTrack) return;

        setIsLoading(true);
        setError(null);

        const result = await getLyrics(
            currentTrack.musicbrainzId,
            currentTrack.title,
            currentTrack.artist
        );

        if (result.success && result.lyrics) {
            setLyrics(result.lyrics);
        } else {
            setError(result.message || 'Lyrics not found');
            setLyrics(null);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        if (currentTrack && showLyrics) {
            fetchLyrics();
        }
    }, [currentTrack?.musicbrainzId, showLyrics]);

    if (!showLyrics) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-40 glass-effect border-l border-border/50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 className="text-lg font-bold">Lyrics</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLyrics}
                    className="h-8 w-8"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Current Track Info */}
            {currentTrack && (
                <div className="p-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-14 w-14 rounded-md flex-shrink-0"
                            style={{
                                backgroundImage: currentTrack.albumArt
                                    ? `url(${currentTrack.albumArt})`
                                    : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">
                                {currentTrack.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {currentTrack.artist}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lyrics Content */}
            <ScrollArea className="flex-1">
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-sm text-muted-foreground">Loading lyrics...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                <Music2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium mb-2">Lyrics not available</p>
                            <p className="text-xs text-muted-foreground mb-4">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const searchQuery = encodeURIComponent(
                                        `${currentTrack?.artist} ${currentTrack?.title} lyrics`
                                    );
                                    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                                }}
                                className="gap-2"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Search on Google
                            </Button>
                        </div>
                    ) : lyrics ? (
                        <div className="space-y-4">
                            {lyrics.split('\n').map((line, index) => {
                                const isEmpty = line.trim() === '';
                                return (
                                    <p
                                        key={index}
                                        className={`
                                            text-sm leading-relaxed
                                            ${isEmpty ? 'h-4' : ''}
                                            ${line.startsWith('[') && line.endsWith(']')
                                                ? 'text-primary font-semibold text-xs uppercase tracking-wide'
                                                : 'text-foreground/90'
                                            }
                                        `}
                                    >
                                        {isEmpty ? '\u00A0' : line}
                                    </p>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                <Music2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No track selected
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            {lyrics && (
                <div className="p-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                        Lyrics provided by Genius
                    </p>
                </div>
            )}
        </div>
    );
}
