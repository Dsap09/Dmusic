/**
 * Supabase Client Configuration
 * 
 * Inisialisasi Supabase client untuk digunakan di seluruh aplikasi.
 * Menggunakan environment variables untuk URL dan Anon Key.
 */

import { createClient } from '@supabase/supabase-js';

// Validasi environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Buat Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions untuk track_mappings table
export interface TrackMapping {
    id: number;
    musicbrainz_id: string;
    youtube_video_id: string;
    title: string;
    artist: string;
    created_at: string;
}
