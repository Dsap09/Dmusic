'use client';

import { usePlayerStore, type Track } from '@/store/usePlayerStore';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Clock } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface RecentlyPlayedProps {
    onPlayTrack: (track: Track) => void;
}

export function RecentlyPlayed({ onPlayTrack }: RecentlyPlayedProps) {
    const { recentlyPlayed, currentTrack } = usePlayerStore();

    if (recentlyPlayed.length === 0) {
        return null;
    }

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">Terakhir Diputar</h2>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 sm:gap-4 pb-2">
                    {recentlyPlayed.map((track) => (
                        <Card
                            key={track.musicbrainzId}
                            className={`group relative overflow-hidden cursor-pointer hover-lift bg-card/50 backdrop-blur-sm border-border/50 transition-all active:scale-95 flex-shrink-0 w-36 sm:w-44 ${currentTrack?.musicbrainzId === track.musicbrainzId
                                    ? 'ring-2 ring-primary'
                                    : ''
                                }`}
                            onClick={() => onPlayTrack(track)}
                        >
                            <CardContent className="p-2 sm:p-3">
                                {/* Album Art */}
                                <div className="relative aspect-square mb-2 rounded-lg overflow-hidden">
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: track.albumArt
                                                ? `url(${track.albumArt})`
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div
                                            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${currentTrack?.musicbrainzId === track.musicbrainzId
                                                    ? 'bg-primary scale-110'
                                                    : 'bg-white/90 group-hover:scale-110'
                                                }`}
                                        >
                                            <Play
                                                className={`h-4 w-4 sm:h-5 sm:w-5 ml-0.5 ${currentTrack?.musicbrainzId === track.musicbrainzId
                                                        ? 'text-primary-foreground'
                                                        : 'text-black'
                                                    }`}
                                                fill="currentColor"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Track Info */}
                                <div className="space-y-0.5">
                                    <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                        {track.title}
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                                        {track.artist}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
