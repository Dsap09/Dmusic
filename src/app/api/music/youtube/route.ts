/**
 * YouTube Video ID API Route
 * 
 * Endpoint: POST /api/music/youtube
 * 
 * Menggantikan Laravel backend untuk mendapatkan YouTube video ID
 * dengan caching menggunakan Supabase PostgreSQL.
 * 
 * Flow:
 * 1. Terima request dengan musicbrainz_id, title, artist
 * 2. Cek cache di Supabase berdasarkan musicbrainz_id
 * 3. Cache Hit: Return data dari database
 * 4. Cache Miss: Search YouTube API, simpan ke Supabase, return hasil
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TrackMapping } from '@/lib/supabaseClient';

// YouTube Data API v3 Configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

interface RequestBody {
    musicbrainz_id: string;
    title: string;
    artist: string;
}

interface YouTubeSearchResponse {
    items?: Array<{
        id: {
            videoId: string;
        };
    }>;
}

/**
 * Search for a video on YouTube
 */
async function searchYouTube(query: string): Promise<string | null> {
    if (!YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY is not configured');
    }

    try {
        const params = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            videoCategoryId: '10', // Music category
            maxResults: '1',
            key: YOUTUBE_API_KEY,
        });

        const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params}`);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('YouTube API Error:', response.status, errorData);
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data: YouTubeSearchResponse = await response.json();

        if (data.items && data.items.length > 0) {
            return data.items[0].id.videoId;
        }

        return null;
    } catch (error) {
        console.error('YouTube search error:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body: RequestBody = await request.json();
        const { musicbrainz_id, title, artist } = body;

        // Validasi input
        if (!musicbrainz_id || !title || !artist) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing required fields: musicbrainz_id, title, artist',
                },
                { status: 400 }
            );
        }

        // Step 1: Check cache (Supabase)
        const { data: cachedTrack, error: fetchError } = await supabase
            .from('track_mappings')
            .select('*')
            .eq('musicbrainz_id', musicbrainz_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (expected for cache miss)
            console.error('Supabase fetch error:', fetchError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Database error',
                },
                { status: 500 }
            );
        }

        // Cache HIT - return existing data
        if (cachedTrack) {
            return NextResponse.json({
                success: true,
                youtube_video_id: cachedTrack.youtube_video_id,
                cache_hit: true,
                title: cachedTrack.title,
                artist: cachedTrack.artist,
            });
        }

        // Step 2: Cache MISS - search YouTube API
        const searchQuery = `${title} ${artist} official audio`;
        const youtubeVideoId = await searchYouTube(searchQuery);

        if (!youtubeVideoId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Video tidak ditemukan di YouTube',
                },
                { status: 404 }
            );
        }

        // Step 3: Save to Supabase (cache for future requests)
        const { error: insertError } = await supabase
            .from('track_mappings')
            .insert({
                musicbrainz_id,
                youtube_video_id: youtubeVideoId,
                title,
                artist,
            });

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            // Still return the YouTube video ID even if caching fails
            return NextResponse.json({
                success: true,
                youtube_video_id: youtubeVideoId,
                cache_hit: false,
                title,
                artist,
                warning: 'Failed to cache result',
            });
        }

        // Return the result
        return NextResponse.json({
            success: true,
            youtube_video_id: youtubeVideoId,
            cache_hit: false,
            title,
            artist,
        });
    } catch (error) {
        console.error('API Route error:', error);

        // Provide more specific error messages
        let errorMessage = 'Internal server error';
        let errorDetails = {};

        if (error instanceof Error) {
            errorMessage = error.message;

            // Check for common issues
            if (error.message.includes('YOUTUBE_API_KEY')) {
                errorMessage = 'YouTube API key not configured. Please add YOUTUBE_API_KEY to .env.local';
            } else if (error.message.includes('YouTube API error')) {
                errorMessage = 'YouTube API request failed. Check API key and quota.';
            }

            errorDetails = {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            };
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                message: errorMessage, // Keep for backward compatibility
                details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
            },
            { status: 500 }
        );
    }
}
