'use client';

import { useState, useEffect } from 'react';
import { Plus, ListPlus, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Track } from '@/store/usePlayerStore';

interface Playlist {
    id: number;
    name: string;
    description?: string;
    created_at: string;
}

interface AddToPlaylistDialogProps {
    track: Track;
    trigger?: React.ReactNode;
}

export function AddToPlaylistDialog({ track, trigger }: AddToPlaylistDialogProps) {
    const [open, setOpen] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [addedToPlaylists, setAddedToPlaylists] = useState<Set<number>>(new Set());

    // Load playlists when dialog opens
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

    const createPlaylist = async () => {
        if (!newPlaylistName.trim()) return;

        setIsCreating(true);
        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPlaylistName.trim() }),
            });

            const data = await response.json();
            if (data.success) {
                setPlaylists([data.playlist, ...playlists]);
                setNewPlaylistName('');
                // Auto-add track to newly created playlist
                await addToPlaylist(data.playlist.id);
            }
        } catch (error) {
            console.error('Failed to create playlist:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const addToPlaylist = async (playlistId: number) => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    musicbrainz_id: track.musicbrainzId,
                    youtube_video_id: track.youtubeId,
                    title: track.title,
                    artist: track.artist,
                    album_art: track.albumArt,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setAddedToPlaylists(new Set([...addedToPlaylists, playlistId]));
                setTimeout(() => {
                    setAddedToPlaylists((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(playlistId);
                        return newSet;
                    });
                }, 2000);
            } else if (response.status === 409) {
                // Already exists - show as added temporarily
                setAddedToPlaylists(new Set([...addedToPlaylists, playlistId]));
                setTimeout(() => {
                    setAddedToPlaylists((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(playlistId);
                        return newSet;
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to add to playlist:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ListPlus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah ke Playlist</DialogTitle>
                    <DialogDescription>
                        {track.title} - {track.artist}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Create New Playlist */}
                    <div className="space-y-2">
                        <Label htmlFor="playlist-name">Buat Playlist Baru</Label>
                        <div className="flex gap-2">
                            <Input
                                id="playlist-name"
                                placeholder="Nama playlist..."
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        createPlaylist();
                                    }
                                }}
                            />
                            <Button
                                onClick={createPlaylist}
                                disabled={!newPlaylistName.trim() || isCreating}
                                size="icon"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Existing Playlists */}
                    <div className="space-y-2">
                        <Label>Pilih Playlist</Label>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : playlists.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Belum ada playlist. Buat yang pertama!
                            </p>
                        ) : (
                            <ScrollArea className="h-48 border rounded-md">
                                <div className="p-2 space-y-1">
                                    {playlists.map((playlist) => (
                                        <Button
                                            key={playlist.id}
                                            variant="ghost"
                                            className="w-full justify-between"
                                            onClick={() => addToPlaylist(playlist.id)}
                                        >
                                            <span className="truncate">{playlist.name}</span>
                                            {addedToPlaylists.has(playlist.id) && (
                                                <Check className="h-4 w-4 text-green-500" />
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
