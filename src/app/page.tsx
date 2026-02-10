'use client';

import { useState, useEffect } from 'react';
import { Music2 } from 'lucide-react';
import { SearchBar } from '@/components/music/SearchBar';
import { TrackGrid } from '@/components/music/TrackGrid';
import { YouTubePlayer } from '@/components/music/YouTubePlayer';
import { PlayerControls } from '@/components/music/PlayerControls';
import { RecentlyPlayed } from '@/components/music/RecentlyPlayed';
import { PlaylistSidebar } from '@/components/music/PlaylistSidebar';
import { QueuePanel } from '@/components/music/QueuePanel';
import { LyricsPanel } from '@/components/music/LyricsPanel';
import { KeyboardShortcutsHelp } from '@/components/music/KeyboardShortcutsHelp';
import { searchTracks, type MusicBrainzTrack } from '@/services/musicbrainz.service';
import { getYoutubeId } from '@/services/youtube.service';
import { usePlayerStore, type Track } from '@/store/usePlayerStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
  const [tracks, setTracks] = useState<MusicBrainzTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const { setQueue, currentTrack, loadRecentlyPlayed } = usePlayerStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Load recently played on mount
  useEffect(() => {
    loadRecentlyPlayed();
  }, [loadRecentlyPlayed]);

  // Handle search
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchTracks(query, 20);
      setTracks(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle track play - auto-populate queue with all search results
  const handlePlayTrack = async (track: MusicBrainzTrack, index: number) => {
    setIsLoadingVideo(true);
    try {
      // Get YouTube IDs for all tracks in parallel
      const trackPromises = tracks.map(async (t) => {
        const response = await getYoutubeId(t.id, t.title, t.artist);

        if (response.success && response.youtube_video_id) {
          return {
            musicbrainzId: t.id,
            youtubeId: response.youtube_video_id,
            title: t.title,
            artist: t.artist,
            albumArt: t.albumArt,
          } as Track;
        }
        return null;
      });

      const resolvedTracks = await Promise.all(trackPromises);
      const validTracks = resolvedTracks.filter((t): t is Track => t !== null);

      if (validTracks.length > 0) {
        // Set queue with all valid tracks, starting from clicked track
        setQueue(validTracks, index);

        console.log(`✅ Queue populated with ${validTracks.length} tracks`);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Handle play from recently played - set queue with single track
  const handlePlayRecentlyPlayed = (track: Track) => {
    setQueue([track], 0);
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Logo and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg glow-primary">
                <Music2 className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Dmusic</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Streaming Musik Gratis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <KeyboardShortcutsHelp />
              <PlaylistSidebar />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex justify-center">
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-32 sm:pb-32">
        {isLoadingVideo && (
          <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-50 bg-card border border-border rounded-lg px-3 sm:px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs sm:text-sm">Memuat audio...</span>
            </div>
          </div>
        )}

        {/* Recently Played Section */}
        <RecentlyPlayed onPlayTrack={handlePlayRecentlyPlayed} />

        <TrackGrid
          tracks={tracks}
          onPlayTrack={handlePlayTrack}
          currentTrackId={currentTrack?.musicbrainzId}
          isLoading={isSearching}
        />
      </main>

      {/* Hidden YouTube Player */}
      <YouTubePlayer />

      {/* Player Controls */}
      <PlayerControls />

      {/* Queue Panel */}
      <QueuePanel />

      {/* Lyrics Panel */}
      <LyricsPanel />
    </div>
  );
}
