/**
 * YouTube Service (via Next.js API Route)
 * 
 * This service communicates with our Next.js API Route to get YouTube video IDs
 * The API Route implements a smart caching system using Supabase PostgreSQL
 */

import axios from 'axios';

export interface GetYoutubeIdRequest {
    musicbrainz_id: string;
    title: string;
    artist: string;
}

export interface GetYoutubeIdResponse {
    success: boolean;
    youtube_video_id?: string;
    cache_hit?: boolean;
    title?: string;
    artist?: string;
    message?: string;
    warning?: string;
}

/**
 * Get YouTube video ID for a track
 * 
 * This calls the Next.js API Route which:
 * 1. Checks the Supabase database cache first (cache hit)
 * 2. If not found, searches YouTube API and saves to cache (cache miss)
 * 
 * @param musicbrainzId MusicBrainz Recording ID
 * @param title Track title
 * @param artist Artist name
 * @returns YouTube video ID and cache status
 */
export async function getYoutubeId(
    musicbrainzId: string,
    title: string,
    artist: string
): Promise<GetYoutubeIdResponse> {
    try {
        const response = await axios.post<GetYoutubeIdResponse>(
            '/api/music/youtube',
            {
                musicbrainz_id: musicbrainzId,
                title,
                artist,
            }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Build a more informative error message
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                track: `${artist} - ${title}`,
            };

            // Only log if there's actual error data
            if (error.response?.status !== 404) {
                console.warn('Failed to fetch YouTube ID:', errorDetails);
            }

            return {
                success: false,
                message: error.response?.data?.message ||
                    error.response?.data?.error ||
                    `Failed to find YouTube video for "${artist} - ${title}"`,
            };
        }

        // For non-axios errors
        console.error('Unexpected error fetching YouTube ID:', error);
        throw error;
    }
}

