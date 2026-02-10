/**
 * Favorites Service
 * Manages user's favorite/liked songs with Supabase
 */

import { supabase } from '@/lib/supabaseClient';
import type { Track } from '@/store/usePlayerStore';

export interface Favorite {
    id: number;
    musicbrainz_id: string;
    youtube_video_id: string;
    title: string;
    artist: string;
    album?: string;
    album_art?: string;
    added_at: string;
}

/**
 * Get all favorite songs
 */
export async function getFavorites(): Promise<{ success: boolean; favorites: Favorite[] }> {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .order('added_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            favorites: data || [],
        };
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return {
            success: false,
            favorites: [],
        };
    }
}

/**
 * Check if a track is favorited
 */
export async function isFavorite(musicbrainzId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('musicbrainz_id', musicbrainzId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

        return !!data;
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}

/**
 * Add a track to favorites
 */
export async function addFavorite(track: Track): Promise<{ success: boolean }> {
    try {
        const { error } = await supabase
            .from('favorites')
            .insert({
                musicbrainz_id: track.musicbrainzId,
                youtube_video_id: track.youtubeId,
                title: track.title,
                artist: track.artist,
                album: track.album,
                album_art: track.albumArt,
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error adding favorite:', error);
        return { success: false };
    }
}

/**
 * Remove a track from favorites
 */
export async function removeFavorite(musicbrainzId: string): Promise<{ success: boolean }> {
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('musicbrainz_id', musicbrainzId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error removing favorite:', error);
        return { success: false };
    }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(track: Track): Promise<{ success: boolean; isFavorited: boolean }> {
    const favorited = await isFavorite(track.musicbrainzId);

    if (favorited) {
        const result = await removeFavorite(track.musicbrainzId);
        return { ...result, isFavorited: false };
    } else {
        const result = await addFavorite(track);
        return { ...result, isFavorited: true };
    }
}
