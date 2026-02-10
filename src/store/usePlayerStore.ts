/**
 * Global Player State Management with Zustand
 * 
 * This store manages the state of the music player across the entire application
 * Including queue management and recently played tracking
 */

import { create } from 'zustand';
import type YouTube from 'react-youtube';

export interface Track {
    musicbrainzId: string;
    youtubeId: string;
    title: string;
    artist: string;
    album?: string;
    albumArt?: string;
    duration?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
    // Current track
    currentTrack: Track | null;

    // Queue management
    queue: Track[];
    originalQueue: Track[]; // for shuffle
    currentIndex: number;

    // Recently played (loaded from LocalStorage)
    recentlyPlayed: Track[];

    // Player state
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;

    // Playback modes
    shuffle: boolean;
    repeat: RepeatMode;

    // YouTube player instance
    playerInstance: YouTube | null;

    // UI state
    showQueue: boolean;
    showLyrics: boolean;

    // Actions
    setTrack: (track: Track) => void;
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    setPlayerInstance: (player: YouTube | null) => void;
    seekTo: (time: number) => void;
    reset: () => void;

    // Queue actions
    setQueue: (tracks: Track[], startIndex?: number) => void;
    playNext: () => void;
    playPrevious: () => void;
    addToQueue: (track: Track) => void;
    addNext: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    clearQueue: () => void;

    // Playback mode actions
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    setRepeat: (mode: RepeatMode) => void;

    // UI actions
    toggleQueue: () => void;
    toggleLyrics: () => void;

    // Recently played actions
    addToRecentlyPlayed: (track: Track) => void;
    loadRecentlyPlayed: () => void;
}

// LocalStorage key for recently played
const RECENTLY_PLAYED_KEY = 'dmusic_recently_played';
const MAX_RECENTLY_PLAYED = 10;

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial state
    currentTrack: null,
    queue: [],
    originalQueue: [],
    currentIndex: -1,
    recentlyPlayed: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
    shuffle: false,
    repeat: 'off',
    playerInstance: null,
    showQueue: false,
    showLyrics: false,

    // Actions
    setTrack: (track) => {
        const { addToRecentlyPlayed } = get();
        set({
            currentTrack: track,
            isPlaying: true,
            currentTime: 0,
        });
        // Add to recently played
        addToRecentlyPlayed(track);
    },

    play: () => {
        const { playerInstance } = get();
        if (playerInstance) {
            // @ts-ignore - YouTube player methods
            playerInstance.internalPlayer?.playVideo();
        }
        set({ isPlaying: true });
    },

    pause: () => {
        const { playerInstance } = get();
        if (playerInstance) {
            // @ts-ignore - YouTube player methods
            playerInstance.internalPlayer?.pauseVideo();
        }
        set({ isPlaying: false });
    },

    togglePlayPause: () => {
        const { isPlaying, play, pause } = get();
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    },

    setCurrentTime: (time) => set({ currentTime: time }),

    setDuration: (duration) => set({ duration }),

    setVolume: (volume) => {
        const { playerInstance } = get();
        if (playerInstance) {
            // @ts-ignore - YouTube player methods
            playerInstance.internalPlayer?.setVolume(volume);
        }
        set({ volume, isMuted: false });
    },

    toggleMute: () => {
        const { isMuted, volume, playerInstance } = get();
        if (playerInstance) {
            // @ts-ignore - YouTube player methods
            if (isMuted) {
                playerInstance.internalPlayer?.setVolume(volume);
            } else {
                playerInstance.internalPlayer?.setVolume(0);
            }
        }
        set({ isMuted: !isMuted });
    },

    setPlayerInstance: (player) => set({ playerInstance: player }),

    seekTo: (time) => {
        const { playerInstance } = get();
        if (playerInstance) {
            // @ts-ignore - YouTube player methods
            playerInstance.internalPlayer?.seekTo(time, true);
        }
        set({ currentTime: time });
    },

    reset: () => {
        set({
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
        });
    },

    // Queue management
    setQueue: (tracks, startIndex = 0) => {
        if (tracks.length === 0) return;

        const { shuffle, addToRecentlyPlayed } = get();

        let queue = tracks;
        let currentIndex = startIndex;

        if (shuffle) {
            // Keep the starting track at position 0, shuffle the rest
            const currentTrack = tracks[startIndex];
            const otherTracks = tracks.filter((_, i) => i !== startIndex);
            const shuffledOthers = shuffleArray(otherTracks);
            queue = [currentTrack, ...shuffledOthers];
            currentIndex = 0;
        }

        const track = queue[currentIndex];

        set({
            queue,
            originalQueue: tracks,
            currentIndex,
            currentTrack: track,
            isPlaying: true,
            currentTime: 0,
        });

        // Add to recently played
        addToRecentlyPlayed(track);
    },

    playNext: () => {
        const { queue, currentIndex, repeat } = get();

        if (queue.length === 0) return;

        // Repeat one - replay current track
        if (repeat === 'one') {
            const currentTrack = queue[currentIndex];
            const { addToRecentlyPlayed } = get();
            set({
                isPlaying: true,
                currentTime: 0,
            });
            addToRecentlyPlayed(currentTrack);
            return;
        }

        const nextIndex = currentIndex + 1;

        // Check if there's a next track
        if (nextIndex < queue.length) {
            const nextTrack = queue[nextIndex];
            const { addToRecentlyPlayed } = get();

            set({
                currentIndex: nextIndex,
                currentTrack: nextTrack,
                isPlaying: true,
                currentTime: 0,
            });

            addToRecentlyPlayed(nextTrack);
        } else if (repeat === 'all') {
            // Repeat all - go back to first track
            const firstTrack = queue[0];
            const { addToRecentlyPlayed } = get();

            set({
                currentIndex: 0,
                currentTrack: firstTrack,
                isPlaying: true,
                currentTime: 0,
            });

            addToRecentlyPlayed(firstTrack);
        } else {
            // End of queue - stop playing
            set({ isPlaying: false });
        }
    },

    playPrevious: () => {
        const { queue, currentIndex } = get();

        if (queue.length === 0) return;

        const prevIndex = currentIndex - 1;

        // Check if there's a previous track
        if (prevIndex >= 0) {
            const prevTrack = queue[prevIndex];
            const { addToRecentlyPlayed } = get();

            set({
                currentIndex: prevIndex,
                currentTrack: prevTrack,
                isPlaying: true,
                currentTime: 0,
            });

            addToRecentlyPlayed(prevTrack);
        }
    },

    addToQueue: (track) => {
        const { queue } = get();
        set({ queue: [...queue, track] });
    },

    addNext: (track) => {
        const { queue, currentIndex } = get();
        const newQueue = [...queue];
        newQueue.splice(currentIndex + 1, 0, track);
        set({ queue: newQueue });
    },

    removeFromQueue: (index) => {
        const { queue, currentIndex } = get();
        const newQueue = queue.filter((_, i) => i !== index);

        // Adjust current index if needed
        let newIndex = currentIndex;
        if (index < currentIndex) {
            newIndex = currentIndex - 1;
        } else if (index === currentIndex) {
            // Removed current track, don't change index (will play next track at same index)
            newIndex = currentIndex;
        }

        set({
            queue: newQueue,
            currentIndex: newIndex
        });
    },

    reorderQueue: (fromIndex, toIndex) => {
        const { queue, currentIndex } = get();
        const newQueue = [...queue];
        const [removed] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, removed);

        // Adjust current index if needed
        let newIndex = currentIndex;
        if (fromIndex === currentIndex) {
            newIndex = toIndex;
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
            newIndex = currentIndex - 1;
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
            newIndex = currentIndex + 1;
        }

        set({
            queue: newQueue,
            currentIndex: newIndex
        });
    },

    clearQueue: () => {
        set({ queue: [], originalQueue: [], currentIndex: -1 });
    },

    // Playback modes
    toggleShuffle: () => {
        const { shuffle, queue, originalQueue, currentTrack } = get();

        if (!shuffle) {
            // Turning shuffle ON
            if (queue.length > 0 && currentTrack) {
                // Keep current track at position 0, shuffle the rest
                const otherTracks = queue.filter(t => t.musicbrainzId !== currentTrack.musicbrainzId);
                const shuffledOthers = shuffleArray(otherTracks);
                const newQueue = [currentTrack, ...shuffledOthers];

                set({
                    shuffle: true,
                    originalQueue: queue,
                    queue: newQueue,
                    currentIndex: 0,
                });
            } else {
                set({ shuffle: true });
            }
        } else {
            // Turning shuffle OFF - restore original queue
            if (originalQueue.length > 0 && currentTrack) {
                const originalIndex = originalQueue.findIndex(
                    t => t.musicbrainzId === currentTrack.musicbrainzId
                );

                set({
                    shuffle: false,
                    queue: originalQueue,
                    currentIndex: originalIndex !== -1 ? originalIndex : 0,
                });
            } else {
                set({ shuffle: false });
            }
        }
    },

    toggleRepeat: () => {
        const { repeat } = get();
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const currentModeIndex = modes.indexOf(repeat);
        const nextMode = modes[(currentModeIndex + 1) % modes.length];
        set({ repeat: nextMode });
    },

    setRepeat: (mode) => {
        set({ repeat: mode });
    },

    // UI actions
    toggleQueue: () => {
        const { showQueue } = get();
        set({ showQueue: !showQueue, showLyrics: false });
    },

    toggleLyrics: () => {
        const { showLyrics } = get();
        set({ showLyrics: !showLyrics, showQueue: false });
    },

    // Recently played management
    addToRecentlyPlayed: (track) => {
        const { recentlyPlayed } = get();

        // Check if track already exists
        const existingIndex = recentlyPlayed.findIndex(
            (t) => t.musicbrainzId === track.musicbrainzId
        );

        let newRecentlyPlayed: Track[];

        if (existingIndex !== -1) {
            // Move existing track to the front
            newRecentlyPlayed = [
                track,
                ...recentlyPlayed.filter((_, i) => i !== existingIndex),
            ];
        } else {
            // Add new track to the front
            newRecentlyPlayed = [track, ...recentlyPlayed];
        }

        // Keep only last 10 tracks
        newRecentlyPlayed = newRecentlyPlayed.slice(0, MAX_RECENTLY_PLAYED);

        set({ recentlyPlayed: newRecentlyPlayed });

        // Save to LocalStorage
        try {
            localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(newRecentlyPlayed));
        } catch (error) {
            console.error('Failed to save recently played to LocalStorage:', error);
        }
    },

    loadRecentlyPlayed: () => {
        try {
            const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Track[];
                set({ recentlyPlayed: parsed });
            }
        } catch (error) {
            console.error('Failed to load recently played from LocalStorage:', error);
        }
    },
}));
