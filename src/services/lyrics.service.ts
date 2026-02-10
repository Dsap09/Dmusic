/**
 * Lyrics Service
 * Fetches and caches song lyrics using Genius API
 */

import { supabase } from '@/lib/supabaseClient';

export interface LyricsResponse {
    success: boolean;
    lyrics?: string;
    message?: string;
    cached?: boolean;
}

interface GeniusSearchResponse {
    response: {
        hits: Array<{
            result: {
                id: number;
                title: string;
                primary_artist: {
                    name: string;
                };
                url: string;
            };
        }>;
    };
}

/**
 * Get lyrics for a track
 * First checks cache, then fetches from Genius API if not cached
 */
export async function getLyrics(
    musicbrainzId: string,
    title: string,
    artist: string
): Promise<LyricsResponse> {
    try {
        // Check cache first
        const { data: cachedLyrics, error: cacheError } = await supabase
            .from('lyrics')
            .select('lyrics_text')
            .eq('musicbrainz_id', musicbrainzId)
            .single();

        if (!cacheError && cachedLyrics?.lyrics_text) {
            return {
                success: true,
                lyrics: cachedLyrics.lyrics_text,
                cached: true,
            };
        }

        // Cache miss - fetch from API
        const searchQuery = `${artist} ${title}`;
        const lyrics = await fetchLyricsFromGenius(searchQuery);

        if (lyrics) {
            // Save to cache
            await supabase
                .from('lyrics')
                .insert({
                    musicbrainz_id: musicbrainzId,
                    title,
                    artist,
                    lyrics_text: lyrics,
                })
                .select()
                .single();

            return {
                success: true,
                lyrics,
                cached: false,
            };
        }

        return {
            success: false,
            message: 'Lyrics not found for this track',
        };
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return {
            success: false,
            message: 'Failed to fetch lyrics',
        };
    }
}

/**
 * Fetch lyrics from Genius API
 * Note: This is a simplified implementation
 * For production, you'd need to implement proper Genius API integration
 * or use a lyrics API service
 */
async function fetchLyricsFromGenius(query: string): Promise<string | null> {
    try {
        // For now, return null as we need Genius API key
        // In production, implement proper Genius API integration

        // Example implementation (requires GENIUS_API_KEY):
        /*
        const GENIUS_API_KEY = process.env.NEXT_PUBLIC_GENIUS_API_KEY;
        if (!GENIUS_API_KEY) {
            throw new Error('Genius API key not configured');
        }

        // Search for song
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${GENIUS_API_KEY}`,
            },
        });

        if (!searchResponse.ok) {
            throw new Error('Genius API search failed');
        }

        const searchData: GeniusSearchResponse = await searchResponse.json();
        
        if (searchData.response.hits.length === 0) {
            return null;
        }

        const songUrl = searchData.response.hits[0].result.url;
        
        // Scrape lyrics from Genius page
        // Note: Genius doesn't provide lyrics via API, need to scrape
        // This would require a backend endpoint to avoid CORS
        const lyricsResponse = await fetch(`/api/lyrics/scrape?url=${encodeURIComponent(songUrl)}`);
        const lyricsData = await lyricsResponse.json();
        
        return lyricsData.lyrics;
        */

        return null;
    } catch (error) {
        console.error('Error fetching from Genius:', error);
        return null;
    }
}

/**
 * Clear lyrics cache for a specific track
 */
export async function clearLyricsCache(musicbrainzId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('lyrics')
            .delete()
            .eq('musicbrainz_id', musicbrainzId);

        return !error;
    } catch (error) {
        console.error('Error clearing lyrics cache:', error);
        return false;
    }
}
