/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for player controls
 */

import { useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export function useKeyboardShortcuts() {
    const {
        isPlaying,
        play,
        pause,
        playNext,
        playPrevious,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        shuffle,
        toggleShuffle,
        toggleRepeat,
        toggleQueue,
        toggleLyrics,
    } = usePlayerStore();

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Prevent default for shortcuts we handle
            const shouldPreventDefault = [
                ' ', // Space
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
            ].includes(e.key);

            if (shouldPreventDefault) {
                e.preventDefault();
            }

            // Handle shortcuts
            switch (e.key.toLowerCase()) {
                // Play/Pause
                case ' ':
                case 'k':
                    if (isPlaying) {
                        pause();
                    } else {
                        play();
                    }
                    break;

                // Next track
                case 'n':
                case 'arrowright':
                    if (e.shiftKey) {
                        playNext();
                    }
                    break;

                // Previous track
                case 'p':
                case 'arrowleft':
                    if (e.shiftKey) {
                        playPrevious();
                    }
                    break;

                // Volume up
                case 'arrowup':
                    if (!isMuted) {
                        const newVolume = Math.min(100, volume + 5);
                        setVolume(newVolume);
                    }
                    break;

                // Volume down
                case 'arrowdown':
                    if (!isMuted) {
                        const newVolume = Math.max(0, volume - 5);
                        setVolume(newVolume);
                    }
                    break;

                // Mute/Unmute
                case 'm':
                    toggleMute();
                    break;

                // Shuffle
                case 's':
                    toggleShuffle();
                    break;

                // Repeat
                case 'r':
                    toggleRepeat();
                    break;

                // Queue
                case 'q':
                    toggleQueue();
                    break;

                // Lyrics
                case 'l':
                    toggleLyrics();
                    break;

                default:
                    break;
            }
        };

        // Add event listener
        window.addEventListener('keydown', handleKeyPress);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [
        isPlaying,
        play,
        pause,
        playNext,
        playPrevious,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleQueue,
        toggleLyrics,
    ]);
}

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
    playPause: ['Space', 'K'],
    next: ['Shift + →', 'Shift + N'],
    previous: ['Shift + ←', 'Shift + P'],
    volumeUp: ['↑'],
    volumeDown: ['↓'],
    mute: ['M'],
    shuffle: ['S'],
    repeat: ['R'],
    queue: ['Q'],
    lyrics: ['L'],
} as const;
