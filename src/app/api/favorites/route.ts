import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/favorites - Get all favorites
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .order('added_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            favorites: data || [],
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch favorites' },
            { status: 500 }
        );
    }
}

// POST /api/favorites - Add to favorites
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { musicbrainz_id, youtube_video_id, title, artist, album, album_art } = body;

        if (!musicbrainz_id || !youtube_video_id || !title || !artist) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('favorites')
            .insert({
                musicbrainz_id,
                youtube_video_id,
                title,
                artist,
                album,
                album_art,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            favorite: data,
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add favorite' },
            { status: 500 }
        );
    }
}

// DELETE /api/favorites - Remove from favorites
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const musicbrainz_id = searchParams.get('musicbrainz_id');

        if (!musicbrainz_id) {
            return NextResponse.json(
                { success: false, error: 'Missing musicbrainz_id' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('musicbrainz_id', musicbrainz_id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove favorite' },
            { status: 500 }
        );
    }
}
