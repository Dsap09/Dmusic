/**
 * Playlists API Route
 * 
 * Endpoints:
 * - GET /api/playlists - Get all playlists
 * - POST /api/playlists - Create new playlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data: playlists, error } = await supabase
            .from('playlists')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch playlists' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            playlists: playlists || [],
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, cover_image } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: 'Playlist name is required' },
                { status: 400 }
            );
        }

        const { data: playlist, error } = await supabase
            .from('playlists')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                cover_image: cover_image || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to create playlist' },
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
