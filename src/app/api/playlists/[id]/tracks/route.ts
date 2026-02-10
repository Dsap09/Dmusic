/**
 * Playlist Tracks API Route
 * 
 * Endpoints:
 * - GET /api/playlists/[id]/tracks - Get all tracks in playlist
 * - POST /api/playlists/[id]/tracks - Add track to playlist
 * - DELETE /api/playlists/[id]/tracks/[trackId] - Remove track from playlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RouteParams {
    params: {
        id: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const playlistId = params.id;

        const { data: tracks, error } = await supabase
            .from('playlist_tracks')
            .select('*')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch tracks' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tracks: tracks || [],
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const playlistId = params.id;
        const body = await request.json();
        const { musicbrainz_id, youtube_video_id, title, artist, album_art } = body;

        if (!musicbrainz_id || !youtube_video_id || !title || !artist) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get current max position
        const { data: maxPositionData } = await supabase
            .from('playlist_tracks')
            .select('position')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const nextPosition = maxPositionData ? maxPositionData.position + 1 : 0;

        // Insert track
        const { data: track, error } = await supabase
            .from('playlist_tracks')
            .insert({
                playlist_id: playlistId,
                musicbrainz_id,
                youtube_video_id,
                title,
                artist,
                album_art: album_art || null,
                position: nextPosition,
            })
            .select()
            .single();

        if (error) {
            // Check if it's a duplicate
            if (error.code === '23505') {
                return NextResponse.json(
                    { success: false, message: 'Track already exists in playlist' },
                    { status: 409 }
                );
            }

            console.error('Supabase error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to add track' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            track,
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
