/**
 * Single Playlist API Route
 * 
 * Endpoints:
 * - GET /api/playlists/[id] - Get playlist details with tracks
 * - PUT /api/playlists/[id] - Update playlist
 * - DELETE /api/playlists/[id] - Delete playlist
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

        // Get playlist details
        const { data: playlist, error: playlistError } = await supabase
            .from('playlists')
            .select('*')
            .eq('id', playlistId)
            .single();

        if (playlistError || !playlist) {
            return NextResponse.json(
                { success: false, message: 'Playlist not found' },
                { status: 404 }
            );
        }

        // Get playlist tracks
        const { data: tracks, error: tracksError } = await supabase
            .from('playlist_tracks')
            .select('*')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true });

        if (tracksError) {
            console.error('Supabase error:', tracksError);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch tracks' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            playlist: {
                ...playlist,
                tracks: tracks || [],
            },
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

interface PlaylistUpdateData {
    updated_at: string;
    name?: string;
    description?: string | null;
    cover_image?: string | null;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const playlistId = params.id;
        const body = await request.json();
        const { name, description, cover_image } = body;

        const updateData: PlaylistUpdateData = {
            updated_at: new Date().toISOString(),
        };

        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (cover_image !== undefined) updateData.cover_image = cover_image || null;

        const { data: playlist, error } = await supabase
            .from('playlists')
            .update(updateData)
            .eq('id', playlistId)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to update playlist' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            playlist,
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const playlistId = params.id;

        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', playlistId);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to delete playlist' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Playlist deleted successfully',
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
