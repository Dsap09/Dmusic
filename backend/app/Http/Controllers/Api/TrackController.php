<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TrackController extends Controller
{
    private $youtubeService;

    public function __construct(\App\Services\YouTubeService $youtubeService)
    {
        $this->youtubeService = $youtubeService;
    }

    /**
     * Get YouTube video ID for a track (with caching)
     * 
     * Cache Hit: Return existing youtube_video_id from database
     * Cache Miss: Search YouTube API, save to database, then return
     */
    public function getYoutubeId(Request $request)
    {
        // Validasi input
        $validated = $request->validate([
            'musicbrainz_id' => 'required|string',
            'title' => 'required|string',
            'artist' => 'required|string',
        ]);

        $musicbrainzId = $validated['musicbrainz_id'];
        $title = $validated['title'];
        $artist = $validated['artist'];

        // Step 1: Check cache (database)
        $trackMapping = \App\Models\TrackMapping::where('musicbrainz_id', $musicbrainzId)->first();

        if ($trackMapping) {
            // Cache HIT - return existing data
            return response()->json([
                'success' => true,
                'youtube_video_id' => $trackMapping->youtube_video_id,
                'cache_hit' => true,
                'title' => $trackMapping->title,
                'artist' => $trackMapping->artist,
            ]);
        }

        // Step 2: Cache MISS - search YouTube API
        $searchQuery = "{$title} {$artist} official audio";
        $youtubeVideoId = $this->youtubeService->searchVideo($searchQuery);

        if (!$youtubeVideoId) {
            return response()->json([
                'success' => false,
                'message' => 'Video tidak ditemukan di YouTube',
            ], 404);
        }

        // Step 3: Save to database (cache for future requests)
        $trackMapping = \App\Models\TrackMapping::create([
            'musicbrainz_id' => $musicbrainzId,
            'youtube_video_id' => $youtubeVideoId,
            'title' => $title,
            'artist' => $artist,
        ]);

        // Return the result
        return response()->json([
            'success' => true,
            'youtube_video_id' => $youtubeVideoId,
            'cache_hit' => false,
            'title' => $title,
            'artist' => $artist,
        ]);
    }
}
