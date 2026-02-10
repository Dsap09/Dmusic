'use client';

import { useState, useEffect } from 'react';
import { ListMusic, Play, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerStore, type Track } from '@/store/usePlayerStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

interface Playlist {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    tracks?: PlaylistTrack[];
}

interface PlaylistTrack {
    id: number;
    musicbrainz_id: string;
    youtube_video_id: string;
    title: string;
    artist: string;
    album_art?: string;
    position: number;
}

export function PlaylistSidebar() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const { setQueue, currentTrack } = usePlayerStore();

    // Load playlists when sidebar opens
    useEffect(() => {
        if (open) {
            loadPlaylists();
        }
    }, [open]);

    const loadPlaylists = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/playlists');
            const data = await response.json();
            if (data.success) {
                setPlaylists(data.playlists);
            }
        } catch (error) {
            console.error('Failed to load playlists:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPlaylistTracks = async (playlistId: number) => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`);
            const data = await response.json();
            if (data.success) {
                setSelectedPlaylist(data.playlist);
            }
        } catch (error) {
            console.error('Failed to load playlist tracks:', error);
        }
    };

    const playPlaylist = (playlist: Playlist) => {
        if (!playlist.tracks || playlist.tracks.length === 0) return;

        const tracks: Track[] = playlist.tracks.map((t) => ({
            musicbrainzId: t.musicbrainz_id,
            youtubeId: t.youtube_video_id,
            title: t.title,
            artist: t.artist,
            albumArt: t.album_art,
        }));

        setQueue(tracks, 0);
        setOpen(false);
    };

    const deletePlaylist = async (playlistId: number) => {
        if (!confirm('Hapus playlist ini?')) return;

        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setPlaylists(playlists.filter((p) => p.id !== playlistId));
                if (selectedPlaylist?.id === playlistId) {
                    setSelectedPlaylist(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete playlist:', error);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ListMusic className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 sm:w-96">
                <SheetHeader>
                    <SheetTitle>Playlist Saya</SheetTitle>
                    <SheetDescription>
                        {playlists.length} playlist tersimpan
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : selectedPlaylist ? (
                        // Show playlist tracks
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPlaylist(null)}
                                >
                                    ← Kembali
                                </Button>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-1">{selectedPlaylist.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {selectedPlaylist.tracks?.length || 0} lagu
                                </p>

                                {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
                                    <Button
                                        onClick={() => playPlaylist(selectedPlaylist)}
                                        className="w-full mb-4"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Putar Semua
                                    </Button>
                                )}
                            </div>

                            <ScrollArea className="h-[calc(100vh-300px)]">
                                <div className="space-y-2">
                                    {selectedPlaylist.tracks?.map((track) => (
                                        <div
                                            key={track.id}
                                            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${currentTrack?.musicbrainzId === track.musicbrainz_id
                                                    ? 'bg-accent border-primary'
                                                    : ''
                                                }`}
                                            onClick={() => {
                                                const tracks: Track[] = selectedPlaylist.tracks!.map((t) => ({
                                                    musicbrainzId: t.musicbrainz_id,
                                                    youtubeId: t.youtube_video_id,
                                                    title: t.title,
                                                    artist: t.artist,
                                                    albumArt: t.album_art,
                                                }));
                                                const index = selectedPlaylist.tracks!.findIndex(
                                                    (t) => t.id === track.id
                                                );
                                                setQueue(tracks, index);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-10 w-10 rounded flex-shrink-0"
                                                    style={{
                                                        backgroundImage: track.album_art
                                                            ? `url(${track.album_art})`
                                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{track.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {track.artist}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        // Show playlists list
                        <ScrollArea className="h-[calc(100vh-200px)]">
                            {playlists.length === 0 ? (
                                <div className="text-center py-12">
                                    <ListMusic className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada playlist. Buat playlist pertama kamu!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {playlists.map((playlist) => (
                                        <div
                                            key={playlist.id}
                                            className="p-4 rounded-lg border hover:bg-accent transition-colors group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => loadPlaylistTracks(playlist.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{playlist.name}</h3>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    {playlist.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {playlist.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => deletePlaylist(playlist.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
