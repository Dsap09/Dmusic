'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { TrackCard } from './TrackCard';
import type { MusicBrainzTrack } from '@/services/musicbrainz.service';

interface TrackGridProps {
    tracks: MusicBrainzTrack[];
    onPlayTrack: (track: MusicBrainzTrack, index: number) => void;
    currentTrackId?: string;
    isLoading?: boolean;
}

export function TrackGrid({
    tracks,
    onPlayTrack,
    currentTrackId,
    isLoading = false
}: TrackGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm sm:text-base text-muted-foreground">Mencari musik...</p>
                </div>
            </div>
        );
    }

    if (tracks.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 px-4">
                <div className="text-center space-y-2">
                    <p className="text-lg sm:text-xl font-semibold text-muted-foreground">
                        Belum ada hasil pencarian
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70">
                        Coba cari lagu, artis, atau album favorit kamu
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 p-4 sm:p-6">
                {tracks.map((track, index) => (
                    <TrackCard
                        key={track.id}
                        track={track}
                        onPlay={() => onPlayTrack(track, index)}
                        isPlaying={currentTrackId === track.id}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}
