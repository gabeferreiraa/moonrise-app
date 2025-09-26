import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

export type Version = "guided" | "birth" | "life" | "death" | "full";

type Options = {
  fadeMs?: number;
  loop?: boolean;
  autoStart?: boolean;
  preloadAll?: boolean;
};

type TrackState = {
  sound: Audio.Sound;
  isActive: boolean;
  volume: number;
};

export default function useCrossfadeAudio(
  urls: Record<Version, string>,
  initial: Version,
  opts: Options = {}
) {
  const {
    fadeMs = 800,
    loop = true,
    autoStart = true,
    preloadAll = true,
  } = opts;

  const [version, setVersion] = useState<Version>(initial);
  const [isReady, setIsReady] = useState(false);

  // Store all loaded sounds
  const tracksRef = useRef<Map<Version, TrackState>>(new Map());
  const isInitializedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPositionRef = useRef<number>(0);
  const positionTrackerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Initialize audio and preload all tracks
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const init = async () => {
      try {
        console.log("Initializing audio system...");

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        // Preload all tracks or just the initial one
        const versionsToLoad = preloadAll
          ? (Object.keys(urls) as Version[])
          : [initial];

        console.log(`Preloading ${versionsToLoad.length} tracks...`);

        await Promise.all(
          versionsToLoad.map(async (ver) => {
            const sound = new Audio.Sound();

            try {
              await sound.loadAsync(
                { uri: urls[ver] },
                {
                  shouldPlay: false,
                  isLooping: loop,
                  volume: ver === initial ? 1.0 : 0.0,
                  progressUpdateIntervalMillis: 100,
                }
              );

              tracksRef.current.set(ver, {
                sound,
                isActive: ver === initial,
                volume: ver === initial ? 1.0 : 0.0,
              });

              console.log(`Loaded: ${ver}`);
            } catch (error) {
              console.error(`Failed to load ${ver}:`, error);
            }
          })
        );

        // Start playing the initial track
        const initialTrack = tracksRef.current.get(initial);
        if (initialTrack && autoStart) {
          await initialTrack.sound.playAsync();
          console.log("Started playback:", initial);

          // Start tracking position
          startPositionTracking(initialTrack.sound);
        }

        setIsReady(true);
        console.log("Audio system ready!");
      } catch (error) {
        console.error("Audio init failed:", error);
      }
    };

    init();

    return () => {
      // Cleanup
      if (positionTrackerRef.current) {
        clearInterval(positionTrackerRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      tracksRef.current.forEach(({ sound }) => {
        sound.unloadAsync().catch(() => {});
      });
    };
  }, [urls, initial, loop, autoStart, preloadAll]);

  // Track position of current playing track
  const startPositionTracking = useCallback((sound: Audio.Sound) => {
    if (positionTrackerRef.current) {
      clearInterval(positionTrackerRef.current);
    }

    positionTrackerRef.current = setInterval(async () => {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.positionMillis !== undefined) {
          currentPositionRef.current = status.positionMillis;
        }
      } catch (error) {
        // Ignore errors during position tracking
      }
    }, 100);
  }, []);

  // Handle version changes with crossfade
  const changeVersion = useCallback(
    async (newVersion: Version) => {
      if (newVersion === version || isTransitioningRef.current || !isReady) {
        return;
      }

      isTransitioningRef.current = true;
      console.log(`Transitioning: ${version} → ${newVersion}`);

      try {
        const currentTrack = tracksRef.current.get(version);
        let newTrack = tracksRef.current.get(newVersion);

        if (!currentTrack) {
          console.error("Current track not found");
          isTransitioningRef.current = false;
          return;
        }

        // Load new track if not preloaded
        if (!newTrack && !preloadAll) {
          console.log(`Loading track on demand: ${newVersion}`);
          const sound = new Audio.Sound();

          await sound.loadAsync(
            { uri: urls[newVersion] },
            {
              shouldPlay: false,
              isLooping: loop,
              volume: 0,
              progressUpdateIntervalMillis: 100,
            }
          );

          newTrack = {
            sound,
            isActive: false,
            volume: 0,
          };

          tracksRef.current.set(newVersion, newTrack);
        }

        if (!newTrack) {
          console.error("New track not available");
          isTransitioningRef.current = false;
          return;
        }

        // Get current position for syncing
        const syncPosition = currentPositionRef.current;
        console.log(`Syncing to position: ${Math.round(syncPosition / 1000)}s`);

        // Set new track to same position (slightly ahead to compensate for processing delay)
        const compensatedPosition = Math.max(0, syncPosition + 50); // 50ms ahead
        await newTrack.sound.setPositionAsync(compensatedPosition);

        // Start new track at zero volume
        await newTrack.sound.setVolumeAsync(0);
        await newTrack.sound.playAsync();

        // Update tracking to new sound
        startPositionTracking(newTrack.sound);

        // Clear any existing fade
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }

        // Perform crossfade
        const startTime = Date.now();
        const fadeDuration = fadeMs;

        fadeIntervalRef.current = setInterval(async () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / fadeDuration);

          // Use exponential curve for smoother fade
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          const oldVolume = Math.max(0, 1 - easeProgress);
          const newVolume = Math.min(1, easeProgress);

          try {
            await Promise.all([
              currentTrack.sound.setVolumeAsync(oldVolume),
              newTrack.sound.setVolumeAsync(newVolume),
            ]);

            currentTrack.volume = oldVolume;
            newTrack.volume = newVolume;
          } catch (error) {
            console.error("Volume update failed:", error);
          }

          if (progress >= 1) {
            // Fade complete
            clearInterval(fadeIntervalRef.current!);
            fadeIntervalRef.current = null;

            // Stop and reset old track
            try {
              await currentTrack.sound.pauseAsync();
              await currentTrack.sound.setPositionAsync(0);
              currentTrack.isActive = false;
            } catch (error) {
              console.error("Failed to stop old track:", error);
            }

            newTrack.isActive = true;
            setVersion(newVersion);
            isTransitioningRef.current = false;

            console.log("Transition complete!");
          }
        }, 16); // ~60fps for smooth fade
      } catch (error) {
        console.error("Transition failed:", error);
        isTransitioningRef.current = false;
      }
    },
    [version, isReady, fadeMs, loop, urls, preloadAll, startPositionTracking]
  );

  return {
    version,
    setVersion: changeVersion,
    isReady,
  };
}
