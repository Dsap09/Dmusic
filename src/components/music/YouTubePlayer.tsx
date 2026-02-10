'use client';

import { useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { usePlayerStore } from '@/store/usePlayerStore';
import { addHistoryEntry } from '@/services/history.service';

export function YouTubePlayer() {
    const {
        currentTrack,
        isPlaying,
        setPlayerInstance,
        setDuration,
        setCurrentTime,
        pause,
    } = usePlayerStore();

    const playerRef = useRef<YouTube>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // History tracking refs
    const playStartTimeRef = useRef<number>(0);
    const totalPlayedTimeRef = useRef<number>(0);
    const lastUpdateTimeRef = useRef<number>(0);
    const currentTrackIdRef = useRef<string | null>(null);

    // YouTube player options
    const opts: YouTubeProps['opts'] = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
        },
    };

    // Save history entry
    const saveHistoryEntry = async (skipped: boolean = false, completed: boolean = false) => {
        if (!currentTrack || totalPlayedTimeRef.current < 5) {
            // Don't save if played less than 5 seconds
            return;
        }

        try {
            // Get total duration from store or estimate
            const totalDuration = currentTrack.duration || 180; // Default 3 minutes if unknown

            await addHistoryEntry(
                currentTrack,
                Math.floor(totalPlayedTimeRef.current),
                totalDuration,
                skipped
            );
        } catch (error) {
            console.error('Failed to save history entry:', error);
        }

        // Reset tracking
        totalPlayedTimeRef.current = 0;
        playStartTimeRef.current = 0;
        lastUpdateTimeRef.current = 0;
    };

    // Handle player ready
    const onReady: YouTubeProps['onReady'] = (event) => {
        if (playerRef.current) {
            setPlayerInstance(playerRef.current);
        }

        // Get duration
        const duration = event.target.getDuration();
        setDuration(duration);
    };

    // Handle state change
    const onStateChange: YouTubeProps['onStateChange'] = async (event) => {
        // YouTube Player States:
        // -1 (unstarted)
        // 0 (ended)
        // 1 (playing)
        // 2 (paused)
        // 3 (buffering)
        // 5 (video cued)

        if (event.data === 0) {
            // Video ended - mark as completed
            const now = Date.now();
            if (lastUpdateTimeRef.current > 0) {
                totalPlayedTimeRef.current += (now - lastUpdateTimeRef.current) / 1000;
            }

            await saveHistoryEntry(false, true);

            pause();
            setCurrentTime(0);
        } else if (event.data === 1) {
            // Playing - start tracking
            playStartTimeRef.current = Date.now();
            lastUpdateTimeRef.current = Date.now();
        } else if (event.data === 2) {
            // Paused - update total played time
            const now = Date.now();
            if (lastUpdateTimeRef.current > 0) {
                totalPlayedTimeRef.current += (now - lastUpdateTimeRef.current) / 1000;
                lastUpdateTimeRef.current = 0;
            }
        }
    };

    // Track when track changes (for skip detection)
    useEffect(() => {
        const trackId = currentTrack?.musicbrainzId;

        if (currentTrackIdRef.current && currentTrackIdRef.current !== trackId) {
            // Track changed - save previous track as skipped
            saveHistoryEntry(true, false);
        }

        currentTrackIdRef.current = trackId || null;

        // Reset tracking for new track
        if (trackId) {
            totalPlayedTimeRef.current = 0;
            playStartTimeRef.current = Date.now();
            lastUpdateTimeRef.current = Date.now();
        }
    }, [currentTrack?.musicbrainzId]);

    // Update progress and tracking
    useEffect(() => {
        if (isPlaying && playerRef.current) {
            // Update current time every second
            progressIntervalRef.current = setInterval(() => {
                const player = playerRef.current?.internalPlayer;
                if (player && typeof player.getCurrentTime === 'function') {
                    player.getCurrentTime().then((currentTime: number) => {
                        setCurrentTime(currentTime);

                        // Update total played time
                        const now = Date.now();
                        if (lastUpdateTimeRef.current > 0) {
                            totalPlayedTimeRef.current += (now - lastUpdateTimeRef.current) / 1000;
                        }
                        lastUpdateTimeRef.current = now;
                    });
                }
            }, 1000);
        } else {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }

            // Update total played time when pausing
            if (lastUpdateTimeRef.current > 0) {
                const now = Date.now();
                totalPlayedTimeRef.current += (now - lastUpdateTimeRef.current) / 1000;
                lastUpdateTimeRef.current = 0;
            }
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPlaying, setCurrentTime]);

    // Save history when component unmounts
    useEffect(() => {
        return () => {
            if (currentTrack && totalPlayedTimeRef.current >= 5) {
                saveHistoryEntry(true, false);
            }
        };
    }, []);

    if (!currentTrack?.youtubeId) {
        return null;
    }

    return (
        <div className="hidden">
            <YouTube
                ref={playerRef}
                videoId={currentTrack.youtubeId}
                opts={opts}
                onReady={onReady}
                onStateChange={onStateChange}
            />
        </div>
    );
}
