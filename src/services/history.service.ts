/**
 * Listening History Service
 * Tracks user's listening history and analytics
 */

import { supabase } from '@/lib/supabaseClient';
import type { Track } from '@/store/usePlayerStore';

export interface HistoryEntry {
    id: number;
    musicbrainz_id: string;
    youtube_video_id: string;
    title: string;
    artist: string;
    album?: string;
    album_art?: string;
    played_at: string;
    duration_played?: number;
    completed: boolean;
    skipped: boolean;
}

export interface TopTrack {
    musicbrainz_id: string;
    youtube_video_id: string;
    title: string;
    artist: string;
    album?: string;
    album_art?: string;
    play_count: number;
    total_duration: number;
}

export interface TopArtist {
    artist: string;
    play_count: number;
    total_duration: number;
}

/**
 * Add a listening history entry
 */
export async function addHistoryEntry(
    track: Track,
    durationPlayed: number,
    totalDuration: number,
    skipped: boolean = false
): Promise<{ success: boolean }> {
    try {
        const completed = durationPlayed / totalDuration > 0.8;

        const { error } = await supabase
            .from('listening_history')
            .insert({
                musicbrainz_id: track.musicbrainzId,
                youtube_video_id: track.youtubeId,
                title: track.title,
                artist: track.artist,
                album: track.album,
                album_art: track.albumArt,
                duration_played: Math.floor(durationPlayed),
                completed,
                skipped,
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error adding history entry:', error);
        return { success: false };
    }
}

/**
 * Get recent listening history
 */
export async function getRecentHistory(limit: number = 50): Promise<{ success: boolean; history: HistoryEntry[] }> {
    try {
        const { data, error } = await supabase
            .from('listening_history')
            .select('*')
            .order('played_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return {
            success: true,
            history: data || [],
        };
    } catch (error) {
        console.error('Error fetching history:', error);
        return {
            success: false,
            history: [],
        };
    }
}

/**
 * Get top tracks by play count
 */
export async function getTopTracks(
    limit: number = 10,
    timeRange: 'week' | 'month' | 'all' = 'all'
): Promise<{ success: boolean; tracks: TopTrack[] }> {
    try {
        let query = supabase
            .from('listening_history')
            .select('musicbrainz_id, youtube_video_id, title, artist, album, album_art');

        // Apply time filter
        if (timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('played_at', weekAgo.toISOString());
        } else if (timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.gte('played_at', monthAgo.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Group by track and count plays
        const trackMap = new Map<string, TopTrack>();

        data?.forEach((entry: any) => {
            const existing = trackMap.get(entry.musicbrainz_id);
            if (existing) {
                existing.play_count++;
                existing.total_duration += entry.duration_played || 0;
            } else {
                trackMap.set(entry.musicbrainz_id, {
                    musicbrainz_id: entry.musicbrainz_id,
                    youtube_video_id: entry.youtube_video_id,
                    title: entry.title,
                    artist: entry.artist,
                    album: entry.album,
                    album_art: entry.album_art,
                    play_count: 1,
                    total_duration: entry.duration_played || 0,
                });
            }
        });

        // Sort by play count and limit
        const tracks = Array.from(trackMap.values())
            .sort((a, b) => b.play_count - a.play_count)
            .slice(0, limit);

        return {
            success: true,
            tracks,
        };
    } catch (error) {
        console.error('Error fetching top tracks:', error);
        return {
            success: false,
            tracks: [],
        };
    }
}

/**
 * Get top artists by play count
 */
export async function getTopArtists(
    limit: number = 10,
    timeRange: 'week' | 'month' | 'all' = 'all'
): Promise<{ success: boolean; artists: TopArtist[] }> {
    try {
        let query = supabase
            .from('listening_history')
            .select('artist, duration_played');

        // Apply time filter
        if (timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('played_at', weekAgo.toISOString());
        } else if (timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.gte('played_at', monthAgo.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Group by artist and count plays
        const artistMap = new Map<string, TopArtist>();

        data?.forEach((entry: any) => {
            const existing = artistMap.get(entry.artist);
            if (existing) {
                existing.play_count++;
                existing.total_duration += entry.duration_played || 0;
            } else {
                artistMap.set(entry.artist, {
                    artist: entry.artist,
                    play_count: 1,
                    total_duration: entry.duration_played || 0,
                });
            }
        });

        // Sort by play count and limit
        const artists = Array.from(artistMap.values())
            .sort((a, b) => b.play_count - a.play_count)
            .slice(0, limit);

        return {
            success: true,
            artists,
        };
    } catch (error) {
        console.error('Error fetching top artists:', error);
        return {
            success: false,
            artists: [],
        };
    }
}

/**
 * Get total listening time
 */
export async function getTotalListeningTime(
    timeRange: 'week' | 'month' | 'all' = 'all'
): Promise<{ success: boolean; totalSeconds: number }> {
    try {
        let query = supabase
            .from('listening_history')
            .select('duration_played');

        // Apply time filter
        if (timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('played_at', weekAgo.toISOString());
        } else if (timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.gte('played_at', monthAgo.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        const totalSeconds = data?.reduce((sum: number, entry: any) => sum + (entry.duration_played || 0), 0) || 0;

        return {
            success: true,
            totalSeconds,
        };
    } catch (error) {
        console.error('Error fetching total listening time:', error);
        return {
            success: false,
            totalSeconds: 0,
        };
    }
}
