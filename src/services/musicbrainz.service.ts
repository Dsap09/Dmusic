/**
 * MusicBrainz API Service
 * 
 * Handles searching for music tracks using the MusicBrainz API
 * Documentation: https://musicbrainz.org/doc/MusicBrainz_API
 */

export interface MusicBrainzTrack {
  id: string; // MusicBrainz Recording ID
  title: string;
  artist: string;
  releaseDate?: string;
  albumArt?: string;
  score?: number;
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  score: number;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      name: string;
    };
  }>;
  releases?: Array<{
    id: string; // Release ID for Cover Art Archive
    date?: string;
  }>;
}

interface MusicBrainzResponse {
  recordings: MusicBrainzRecording[];
}

/**
 * Delay helper for retry logic
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic for handling rate limits and temporary errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // For 503 (Service Unavailable) or 429 (Too Many Requests), retry
      if (response.status === 503 || response.status === 429) {
        lastError = new Error(`MusicBrainz API error: ${response.status}`);

        // Don't retry on last attempt
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`MusicBrainz API rate limited (${response.status}). Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await delay(waitTime);
          continue;
        }
      }

      // For other server errors, throw immediately
      throw new Error(`MusicBrainz API error: ${response.status}`);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on network errors on last attempt
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`MusicBrainz API request failed. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
    }
  }

  throw lastError || new Error('MusicBrainz API request failed after retries');
}

/**
 * Detect if query has explicit artist search prefix
 * Returns true only if user explicitly indicates artist search
 */
function hasExplicitArtistPrefix(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  // Check for explicit artist search indicators
  const artistPrefixes = [
    'artist:',
    'by ',
    'from ',
  ];

  return artistPrefixes.some(prefix => lowerQuery.startsWith(prefix));
}

/**
 * Build MusicBrainz query string based on search intent
 */
function buildSearchQuery(query: string): string {
  const trimmedQuery = query.trim();

  // Check if user explicitly wants artist search
  const isExplicitArtistSearch = hasExplicitArtistPrefix(trimmedQuery);

  // Remove explicit prefixes if present
  const cleanQuery = trimmedQuery
    .replace(/^artist:\s*/i, '')
    .replace(/^by\s+/i, '')
    .replace(/^from\s+/i, '');

  // If explicit artist search, use artist: prefix only
  if (isExplicitArtistSearch) {
    return `artist:"${cleanQuery}"`;
  }

  // Default: search both recording (song title) and artist
  // This gives best results for most queries
  return `(recording:"${cleanQuery}" OR artist:"${cleanQuery}")`;
}

/**
 * Search for tracks on MusicBrainz
 * @param query Search query (artist name, song title, etc.)
 * @param limit Maximum number of results (default: 20)
 * @returns Array of track results
 */
export async function searchTracks(
  query: string,
  limit: number = 20
): Promise<MusicBrainzTrack[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const searchQuery = buildSearchQuery(query);
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://musicbrainz.org/ws/2/recording?query=${encodedQuery}&limit=${limit}&fmt=json`;

    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Dmusic/1.0.0 (https://github.com/yourusername/dmusic)',
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const data: MusicBrainzResponse = await response.json();

    // Transform MusicBrainz data to our format and fetch album art
    const tracksPromises = data.recordings.map(async (recording) => {
      const artistName =
        recording['artist-credit']?.[0]?.name ||
        recording['artist-credit']?.[0]?.artist?.name ||
        'Unknown Artist';

      const releaseDate = recording.releases?.[0]?.date;
      const releaseId = recording.releases?.[0]?.id;

      // Fetch album art from Cover Art Archive
      let albumArt: string | undefined;
      if (releaseId) {
        try {
          const coverArtUrl = `https://coverartarchive.org/release/${releaseId}/front-250`;
          const coverResponse = await fetch(coverArtUrl, { method: 'HEAD' });
          if (coverResponse.ok) {
            albumArt = coverArtUrl;
          }
        } catch {
          // If cover art not found, use placeholder
          albumArt = undefined;
        }
      }

      return {
        id: recording.id,
        title: recording.title,
        artist: artistName,
        releaseDate,
        albumArt,
        score: recording.score,
      };
    });

    const tracks = await Promise.all(tracksPromises);

    return tracks;
  } catch (error) {
    console.error('Error searching MusicBrainz:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific recording
 * @param recordingId MusicBrainz Recording ID
 */
export async function getRecordingDetails(recordingId: string) {
  try {
    const url = `https://musicbrainz.org/ws/2/recording/${recordingId}?inc=artists+releases&fmt=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Dmusic/1.0.0 (https://github.com/yourusername/dmusic)',
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recording details:', error);
    throw error;
  }
}
