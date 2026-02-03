<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YouTubeService
{
    private string $apiKey;
    private string $baseUrl = 'https://www.googleapis.com/youtube/v3';

    public function __construct()
    {
        $this->apiKey = config('services.youtube.api_key');
    }

    /**
     * Search for a video on YouTube
     *
     * @param string $query Search query (e.g., "Song Title Artist Name official audio")
     * @return string|null YouTube video ID or null if not found
     */
    public function searchVideo(string $query): ?string
    {
        try {
            $response = Http::get("{$this->baseUrl}/search", [
                'part' => 'snippet',
                'q' => $query,
                'type' => 'video',
                'videoCategoryId' => '10', // Music category
                'maxResults' => 1,
                'key' => $this->apiKey,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['items'][0]['id']['videoId'])) {
                    return $data['items'][0]['id']['videoId'];
                }
            } else {
                Log::error('YouTube API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('YouTube Service Exception', [
                'message' => $e->getMessage(),
                'query' => $query,
            ]);
            
            return null;
        }
    }
}
