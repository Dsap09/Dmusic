'use client';

import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Heart, Shuffle, Repeat, Repeat1, List, Mic2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useState, useEffect } from 'react';
import { isFavorite, toggleFavorite } from '@/services/favorites.service';

export function PlayerControls() {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        currentIndex,
        shuffle,
        repeat,
        togglePlayPause,
        seekTo,
        setVolume,
        toggleMute,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        toggleQueue,
        toggleLyrics,
    } = usePlayerStore();

    const [isFavorited, setIsFavorited] = useState(false);
    const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);

    const checkFavoriteStatus = async () => {
        if (currentTrack) {
            setIsCheckingFavorite(true);
            const favorited = await isFavorite(currentTrack.musicbrainzId);
            setIsFavorited(favorited);
            setIsCheckingFavorite(false);
        }
    };

    // Check if current track is favorited
    useEffect(() => {
        checkFavoriteStatus();
    }, [currentTrack]);

    // Format time in MM:SS
    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle progress change
    const handleProgressChange = (value: number[]) => {
        seekTo(value[0]);
    };

    // Handle volume change
    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0]);
    };

    // Handle favorite toggle
    const handleFavoriteToggle = async () => {
        if (!currentTrack || isCheckingFavorite) return;

        setIsCheckingFavorite(true);
        const result = await toggleFavorite(currentTrack);
        if (result.success) {
            setIsFavorited(result.isFavorited);
        }
        setIsCheckingFavorite(false);
    };

    if (!currentTrack) {
        return null;
    }

    const canGoNext = repeat !== 'off' || currentIndex < queue.length - 1;
    const canGoPrevious = currentIndex > 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50">
            <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-3">
                {/* Progress Bar */}
                <div className="mb-2 sm:mb-3">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleProgressChange}
                        className="cursor-pointer hover-glow"
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden">
                    {/* Track Info + Play Button */}
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="h-12 w-12 rounded-lg flex-shrink-0 hover-scale cursor-pointer"
                            style={{
                                backgroundImage: currentTrack.albumArt
                                    ? `url(${currentTrack.albumArt})`
                                    : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs truncate">
                                {currentTrack.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {currentTrack.artist}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={handleFavoriteToggle}
                            disabled={isCheckingFavorite}
                        >
                            <Heart
                                className={`h-4 w-4 transition-all ${isFavorited ? 'fill-primary text-primary' : ''}`}
                            />
                        </Button>
                        <Button
                            variant="default"
                            size="icon"
                            className="h-10 w-10 rounded-full gradient-primary hover:opacity-90 flex-shrink-0 glow-primary"
                            onClick={togglePlayPause}
                        >
                            {isPlaying ? (
                                <Pause className="h-4 w-4 text-black" fill="currentColor" />
                            ) : (
                                <Play className="h-4 w-4 ml-0.5 text-black" fill="currentColor" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:grid grid-cols-3 items-center gap-4">
                    {/* Left: Track Info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="h-14 w-14 rounded-lg flex-shrink-0 hover-scale cursor-pointer"
                            style={{
                                backgroundImage: currentTrack.albumArt
                                    ? `url(${currentTrack.albumArt})`
                                    : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate hover:underline cursor-pointer">
                                {currentTrack.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">
                                {currentTrack.artist}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={handleFavoriteToggle}
                            disabled={isCheckingFavorite}
                        >
                            <Heart
                                className={`h-4 w-4 transition-all ${isFavorited ? 'fill-primary text-primary scale-110' : ''}`}
                            />
                        </Button>
                    </div>

                    {/* Center: Playback Controls */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            {/* Shuffle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
                                onClick={toggleShuffle}
                                title={shuffle ? 'Shuffle on' : 'Shuffle off'}
                            >
                                <Shuffle className="h-4 w-4" />
                            </Button>

                            {/* Previous */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={playPrevious}
                                disabled={!canGoPrevious}
                                title="Previous track"
                            >
                                <SkipBack className="h-5 w-5" />
                            </Button>

                            {/* Play/Pause */}
                            <Button
                                variant="default"
                                size="icon"
                                className="h-11 w-11 rounded-full gradient-primary hover:opacity-90 glow-primary transition-all hover-scale"
                                onClick={togglePlayPause}
                            >
                                {isPlaying ? (
                                    <Pause className="h-5 w-5 text-black" fill="currentColor" />
                                ) : (
                                    <Play className="h-5 w-5 ml-0.5 text-black" fill="currentColor" />
                                )}
                            </Button>

                            {/* Next */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={playNext}
                                disabled={!canGoNext}
                                title="Next track"
                            >
                                <SkipForward className="h-5 w-5" />
                            </Button>

                            {/* Repeat */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
                                onClick={toggleRepeat}
                                title={`Repeat: ${repeat}`}
                            >
                                {repeat === 'one' ? (
                                    <Repeat1 className="h-4 w-4" />
                                ) : (
                                    <Repeat className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right: Volume + Extra Controls */}
                    <div className="flex items-center gap-2 justify-end">
                        {/* Lyrics */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleLyrics}
                            title="Show lyrics"
                        >
                            <Mic2 className="h-4 w-4" />
                        </Button>

                        {/* Queue */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleQueue}
                            title="Show queue"
                        >
                            <List className="h-4 w-4" />
                        </Button>

                        {/* Volume */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleMute}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="h-4 w-4" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            className="w-24 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
