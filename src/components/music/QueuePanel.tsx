'use client';

import { X, GripVertical, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useState } from 'react';

export function QueuePanel() {
    const {
        queue,
        currentIndex,
        currentTrack,
        showQueue,
        toggleQueue,
        removeFromQueue,
        playNext,
        playPrevious,
    } = usePlayerStore();

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    if (!showQueue) return null;

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        // Reorder logic would go here
        // For now, we'll keep it simple
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handlePlayTrack = (index: number) => {
        // Navigate to track in queue
        const diff = index - currentIndex;
        if (diff > 0) {
            // Go forward
            for (let i = 0; i < diff; i++) {
                playNext();
            }
        } else if (diff < 0) {
            // Go backward
            for (let i = 0; i < Math.abs(diff); i++) {
                playPrevious();
            }
        }
    };

    const handleRemoveTrack = (index: number) => {
        removeFromQueue(index);
    };

    return (
        <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-40 glass-effect border-l border-border/50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 className="text-lg font-bold">Queue</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleQueue}
                    className="h-8 w-8"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Now Playing */}
            {currentTrack && (
                <div className="p-4 border-b border-border/50 bg-primary/5">
                    <p className="text-xs text-muted-foreground mb-2">Now Playing</p>
                    <div className="flex items-center gap-3">
                        <div
                            className="h-12 w-12 rounded-md flex-shrink-0"
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
                        <div className="playing-indicator flex items-center gap-0.5">
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Queue List */}
            <ScrollArea className="flex-1">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                            <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">Queue is empty</p>
                        <p className="text-xs text-muted-foreground">
                            Add songs to start listening
                        </p>
                    </div>
                ) : (
                    <div className="p-2">
                        {queue.map((track, index) => {
                            const isCurrentTrack = index === currentIndex;
                            const isUpcoming = index > currentIndex;
                            const isPast = index < currentIndex;

                            return (
                                <div
                                    key={`${track.musicbrainzId}-${index}`}
                                    draggable={!isCurrentTrack}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`
                                        group flex items-center gap-3 p-2 rounded-lg transition-all
                                        ${isCurrentTrack ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
                                        ${isPast ? 'opacity-50' : ''}
                                        ${draggedIndex === index ? 'opacity-50' : ''}
                                        cursor-pointer
                                    `}
                                    onClick={() => !isCurrentTrack && handlePlayTrack(index)}
                                >
                                    {/* Drag Handle */}
                                    {!isCurrentTrack && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Track Number or Playing Indicator */}
                                    <div className="w-6 text-center flex-shrink-0">
                                        {isCurrentTrack ? (
                                            <div className="playing-indicator flex items-center justify-center gap-0.5 scale-75">
                                                <div className="bar"></div>
                                                <div className="bar"></div>
                                                <div className="bar"></div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Album Art */}
                                    <div
                                        className="h-10 w-10 rounded flex-shrink-0"
                                        style={{
                                            backgroundImage: track.albumArt
                                                ? `url(${track.albumArt})`
                                                : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />

                                    {/* Track Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm truncate ${isCurrentTrack ? 'text-primary font-semibold' : ''}`}>
                                            {track.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {track.artist}
                                        </p>
                                    </div>

                                    {/* Remove Button */}
                                    {!isCurrentTrack && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTrack(index);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Footer */}
            {queue.length > 0 && (
                <div className="p-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                        {queue.length} {queue.length === 1 ? 'song' : 'songs'} in queue
                    </p>
                </div>
            )}
        </div>
    );
}
