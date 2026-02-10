-- ============================================
-- Dmusic - Supabase Database Schema
-- Enhanced with Spotify-like Features
-- ============================================

-- ============================================
-- Track Mappings (Cache)
-- ============================================
-- Tabel untuk menyimpan mapping MusicBrainz ID ke YouTube Video ID
-- Digunakan sebagai cache untuk menghindari pemanggilan YouTube API berulang kali

CREATE TABLE track_mappings (
  id BIGSERIAL PRIMARY KEY,
  musicbrainz_id TEXT UNIQUE NOT NULL,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  album_art TEXT,
  duration INT, -- in seconds
  release_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk mempercepat pencarian
CREATE INDEX idx_track_mappings_musicbrainz_id ON track_mappings(musicbrainz_id);
CREATE INDEX idx_track_mappings_artist ON track_mappings(artist);
CREATE INDEX idx_track_mappings_title ON track_mappings(title);

COMMENT ON TABLE track_mappings IS 'Cache mapping dari MusicBrainz Recording ID ke YouTube Video ID';
COMMENT ON COLUMN track_mappings.musicbrainz_id IS 'MusicBrainz Recording ID (unique identifier)';
COMMENT ON COLUMN track_mappings.youtube_video_id IS 'YouTube Video ID hasil pencarian';
COMMENT ON COLUMN track_mappings.title IS 'Judul lagu';
COMMENT ON COLUMN track_mappings.artist IS 'Nama artis';
COMMENT ON COLUMN track_mappings.album IS 'Nama album';
COMMENT ON COLUMN track_mappings.album_art IS 'URL album art';
COMMENT ON COLUMN track_mappings.duration IS 'Durasi lagu dalam detik';

-- ============================================
-- Playlist Management Tables
-- ============================================

-- Tabel untuk menyimpan playlist
CREATE TABLE playlists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT false,
  play_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk menyimpan tracks dalam playlist
CREATE TABLE playlist_tracks (
  id BIGSERIAL PRIMARY KEY,
  playlist_id BIGINT REFERENCES playlists(id) ON DELETE CASCADE,
  musicbrainz_id TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_art TEXT,
  position INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, musicbrainz_id)
);

-- Indexes untuk playlist_tracks
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);

COMMENT ON TABLE playlists IS 'Daftar playlist yang dibuat user';
COMMENT ON TABLE playlist_tracks IS 'Tracks yang ada dalam setiap playlist';

-- ============================================
-- Favorites / Liked Songs
-- ============================================

CREATE TABLE favorites (
  id BIGSERIAL PRIMARY KEY,
  musicbrainz_id TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  album_art TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(musicbrainz_id)
);

CREATE INDEX idx_favorites_musicbrainz_id ON favorites(musicbrainz_id);
CREATE INDEX idx_favorites_added_at ON favorites(added_at DESC);

COMMENT ON TABLE favorites IS 'Daftar lagu favorit/liked songs user';

-- ============================================
-- Listening History & Analytics
-- ============================================

CREATE TABLE listening_history (
  id BIGSERIAL PRIMARY KEY,
  musicbrainz_id TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  album_art TEXT,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_played INT, -- seconds actually played
  completed BOOLEAN DEFAULT false, -- true if played > 80%
  skipped BOOLEAN DEFAULT false
);

CREATE INDEX idx_listening_history_played_at ON listening_history(played_at DESC);
CREATE INDEX idx_listening_history_musicbrainz_id ON listening_history(musicbrainz_id);
CREATE INDEX idx_listening_history_artist ON listening_history(artist);

COMMENT ON TABLE listening_history IS 'Riwayat mendengarkan musik dengan detail analytics';
COMMENT ON COLUMN listening_history.duration_played IS 'Durasi yang benar-benar didengarkan dalam detik';
COMMENT ON COLUMN listening_history.completed IS 'True jika lagu didengarkan lebih dari 80%';

-- ============================================
-- Lyrics Cache
-- ============================================

CREATE TABLE lyrics (
  id BIGSERIAL PRIMARY KEY,
  musicbrainz_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics_text TEXT,
  synced_lyrics JSONB, -- for time-synced lyrics
  source TEXT, -- API source
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lyrics_musicbrainz_id ON lyrics(musicbrainz_id);

COMMENT ON TABLE lyrics IS 'Cache lirik lagu';
COMMENT ON COLUMN lyrics.synced_lyrics IS 'Lirik dengan timestamp untuk sinkronisasi (format JSON)';

-- ============================================
-- User Preferences
-- ============================================

CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  preference_key TEXT UNIQUE NOT NULL,
  preference_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_key ON user_preferences(preference_key);

COMMENT ON TABLE user_preferences IS 'Preferensi user (theme, volume, playback settings, dll)';

-- Insert default preferences
INSERT INTO user_preferences (preference_key, preference_value) VALUES
  ('theme', '"dark"'),
  ('volume', '100'),
  ('shuffle', 'false'),
  ('repeat', '"off"'),
  ('crossfade', '0'),
  ('equalizer', '"default"')
ON CONFLICT (preference_key) DO NOTHING;

-- ============================================
-- Artists Cache
-- ============================================

CREATE TABLE artists (
  id BIGSERIAL PRIMARY KEY,
  musicbrainz_artist_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  bio TEXT,
  genres TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artists_musicbrainz_id ON artists(musicbrainz_artist_id);
CREATE INDEX idx_artists_name ON artists(name);

COMMENT ON TABLE artists IS 'Cache informasi artis dari MusicBrainz';

-- ============================================
-- Albums Cache
-- ============================================

CREATE TABLE albums (
  id BIGSERIAL PRIMARY KEY,
  musicbrainz_album_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_art TEXT,
  release_date DATE,
  total_tracks INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_albums_musicbrainz_id ON albums(musicbrainz_album_id);
CREATE INDEX idx_albums_artist ON albums(artist);

COMMENT ON TABLE albums IS 'Cache informasi album dari MusicBrainz';

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Untuk development, allow all operations tanpa autentikasi
-- Di production, ganti dengan policies yang proper sesuai user authentication

ALTER TABLE track_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on track_mappings" ON track_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on playlists" ON playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on playlist_tracks" ON playlist_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on favorites" ON favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on listening_history" ON listening_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lyrics" ON lyrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on artists" ON artists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on albums" ON albums FOR ALL USING (true) WITH CHECK (true);
