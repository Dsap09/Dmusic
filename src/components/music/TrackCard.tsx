'use client';

import { useState, useEffect } from 'react';
import { Play, ListPlus, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { getYoutubeId } from '@/services/youtube.service';
import { isFavorite, toggleFavorite } from '@/services/favorites.service';
import type { MusicBrainzTrack } from '@/services/musicbrainz.service';
import type { Track } from '@/store/usePlayerStore';

interface TrackCardProps {
    track: MusicBrainzTrack;
    onPlay: (track: MusicBrainzTrack) => void;
    isPlaying?: boolean;
}

export function TrackCard({ track, onPlay, isPlaying = false }: TrackCardProps) {
    const [youtubeId, setYoutubeId] = useState<string | null>(null);
    const [isLoadingYoutubeId, setIsLoadingYoutubeId] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);

    // Check if track is favorited on mount
    useEffect(() => {
        isFavorite(track.id).then(setIsFavorited);
    }, [track.id]);

    // Fetch YouTube ID when Add to Playlist is clicked
    const handleAddToPlaylist = async () => {
        if (youtubeId) return; // Already fetched

        setIsLoadingYoutubeId(true);
        try {
            const response = await getYoutubeId(track.id, track.title, track.artist);
            if (response.success && response.youtube_video_id) {
                setYoutubeId(response.youtube_video_id);
            }
        } catch (error) {
            console.error('Failed to get YouTube ID:', error);
        } finally {
            setIsLoadingYoutubeId(false);
        }
    };

    // Handle favorite toggle
    const handleFavoriteToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCheckingFavorite || !youtubeId) {
            // Need YouTube ID first
            if (!youtubeId) {
                await handleAddToPlaylist();
            }
            return;
        }

        setIsCheckingFavorite(true);
        const trackData: Track = {
            musicbrainzId: track.id,
            youtubeId: youtubeId!,
            title: track.title,
            artist: track.artist,
            albumArt: track.albumArt,
        };

        const result = await toggleFavorite(trackData);
        if (result.success) {
            setIsFavorited(result.isFavorited);
        }
        setIsCheckingFavorite(false);
    };

    // Convert to Track format for AddToPlaylistDialog
    const trackForPlaylist: Track | null = youtubeId ? {
        musicbrainzId: track.id,
        youtubeId: youtubeId,
        title: track.title,
        artist: track.artist,
        albumArt: track.albumArt,
    } : null;

    return (
        <Card
            className="group relative overflow-hidden cursor-pointer card-hover bg-card/50 backdrop-blur-sm border-border/50 transition-all"
        >
            <CardContent className="p-2 sm:p-4">
                {/* Album Art */}
                <div
                    className="relative aspect-square mb-2 sm:mb-4 rounded-lg overflow-hidden"
                    onClick={() => onPlay(track)}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: track.albumArt
                                ? `url(${track.albumArt})`
                                : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                        <div className={`h-10 w-10 sm:h-14 sm:w-14 rounded-full flex items-center justify-center transition-all ${isPlaying
                            ? 'gradient-primary scale-110 glow-primary'
                            : 'bg-white/90 group-hover:scale-110'
                            }`}>
                            <Play className={`h-4 w-4 sm:h-6 sm:w-6 ml-0.5 sm:ml-1 ${isPlaying ? 'text-black' : 'text-black'}`} fill="currentColor" />
                        </div>
                    </div>

                    {/* Favorite Button - Top Right */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm"
                            onClick={handleFavoriteToggle}
                            disabled={isCheckingFavorite}
                        >
                            <Heart
                                className={`h-4 w-4 transition-all ${isFavorited ? 'fill-primary text-primary scale-110' : 'text-white'}`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Track Info */}
                <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-xs sm:text-base line-clamp-1 group-hover:text-primary transition-colors flex-1">
                            {track.title}
                        </h3>
                        {/* Add to Playlist Button - Always visible on hover */}
                        {trackForPlaylist ? (
                            <AddToPlaylistDialog
                                track={trackForPlaylist}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ListPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                }
                            />
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToPlaylist();
                                }}
                                disabled={isLoadingYoutubeId}
                            >
                                {isLoadingYoutubeId ? (
                                    <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ListPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-1">
                        {track.artist}
                    </p>
                    {track.releaseDate && (
                        <p className="text-[9px] sm:text-xs text-muted-foreground/70">
                            {new Date(track.releaseDate).getFullYear()}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
