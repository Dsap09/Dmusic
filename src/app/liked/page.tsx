'use client';

import { Heart, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getFavorites, type Favorite } from '@/services/favorites.service';
import { usePlayerStore } from '@/store/usePlayerStore';
import { getYoutubeId } from '@/services/youtube.service';

export default function LikedSongsPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setQueue, play, currentTrack } = usePlayerStore();

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setIsLoading(true);
        const result = await getFavorites();
        if (result.success) {
            setFavorites(result.favorites);
        }
        setIsLoading(false);
    };

    const handlePlay = async (favorite: Favorite, index: number = 0) => {
        const tracks = favorites.map(fav => ({
            musicbrainzId: fav.musicbrainz_id,
            youtubeId: fav.youtube_video_id,
            title: fav.title,
            artist: fav.artist,
            albumArt: fav.album_art,
        }));

        setQueue(tracks, index);
        play();
    };

    const handlePlayAll = () => {
        if (favorites.length === 0) return;
        handlePlay(favorites[0], 0);
    };

    return (
        <div className="container mx-auto px-4 py-6 pb-32">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-6 mb-6">
                    <div className="h-48 w-48 rounded-lg gradient-primary flex items-center justify-center shadow-2xl">
                        <Heart className="h-24 w-24 text-white" fill="white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold mb-2">PLAYLIST</p>
                        <h1 className="text-5xl font-bold mb-4 gradient-text">Liked Songs</h1>
                        <p className="text-sm text-muted-foreground mb-4">
                            {favorites.length} {favorites.length === 1 ? 'song' : 'songs'}
                        </p>
                        {favorites.length > 0 && (
                            <Button
                                size="lg"
                                className="gradient-primary hover:opacity-90 glow-primary text-black font-semibold"
                                onClick={handlePlayAll}
                            >
                                Play All
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton h-20 rounded-lg" />
                    ))}
                </div>
            ) : favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-32 w-32 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                        <Heart className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No liked songs yet</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">
                        Songs you like will appear here. Click the heart icon on any song to add it to your collection.
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                        Browse Music
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {favorites.map((favorite, index) => {
                        const isPlaying = currentTrack?.musicbrainzId === favorite.musicbrainz_id;

                        return (
                            <div
                                key={favorite.id}
                                className={`
                                    group flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer
                                    ${isPlaying ? 'bg-primary/10' : 'hover:bg-muted/50'}
                                `}
                                onClick={() => handlePlay(favorite, index)}
                            >
                                {/* Number / Playing Indicator */}
                                <div className="w-8 text-center flex-shrink-0">
                                    {isPlaying ? (
                                        <div className="playing-indicator flex items-center justify-center gap-0.5">
                                            <div className="bar"></div>
                                            <div className="bar"></div>
                                            <div className="bar"></div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground group-hover:hidden">
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Album Art */}
                                <div
                                    className="h-14 w-14 rounded flex-shrink-0"
                                    style={{
                                        backgroundImage: favorite.album_art
                                            ? `url(${favorite.album_art})`
                                            : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />

                                {/* Track Info */}
                                <div className="min-w-0 flex-1">
                                    <p className={`font-semibold truncate ${isPlaying ? 'text-primary' : ''}`}>
                                        {favorite.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {favorite.artist}
                                    </p>
                                </div>

                                {/* Album */}
                                {favorite.album && (
                                    <div className="hidden md:block min-w-0 flex-1">
                                        <p className="text-sm text-muted-foreground truncate">
                                            {favorite.album}
                                        </p>
                                    </div>
                                )}

                                {/* Date Added */}
                                <div className="hidden lg:block text-sm text-muted-foreground">
                                    {new Date(favorite.added_at).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
