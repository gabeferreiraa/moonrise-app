import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

export type Version = "guided" | "birth" | "life" | "death" | "full";

type Options = {
  fadeMs?: number;
  loop?: boolean;
  autoStart?: boolean;
};

type TrackState = {
  sound: Audio.Sound;
  savedPosition: number; // Position in milliseconds
  hasBeenPlayed: boolean;
};

export default function useCrossfadeAudio(
  urls: Record<Version, string>,
  initial: Version,
  opts: Options = {}
) {
  const { fadeMs = 800, loop = true, autoStart = true } = opts;

  const [version, setVersion] = useState<Version>(initial);
  const [isReady, setIsReady] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Version | null>(
    null
  );

  const tracksRef = useRef<Map<Version, TrackState>>(new Map());
  const isInitializedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const masterVolumeRef = useRef<number>(1.0);

  // Track the sync position for guided/full pair
  const guidedFullPositionRef = useRef<number>(0);
  const positionTrackerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const isGuidedFullGroup = (ver: Version) =>
    ver === "guided" || ver === "full";

  // Set initial volume for all tracks
  const setInitialVolume = useCallback(
    async (volume: number) => {
      masterVolumeRef.current = Math.max(0, Math.min(1, volume));

      // If a track is currently playing, update its volume
      if (currentlyPlaying) {
        const track = tracksRef.current.get(currentlyPlaying);
        if (track) {
          try {
            await track.sound.setVolumeAsync(masterVolumeRef.current);
          } catch (error) {
            console.error("Failed to set volume:", error);
          }
        }
      }
    },
    [currentlyPlaying]
  );

  // Initialize audio and load all tracks
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

        // Load all tracks
        const allVersions = Object.keys(urls) as Version[];

        await Promise.all(
          allVersions.map(async (ver) => {
            const sound = new Audio.Sound();

            try {
              await sound.loadAsync(
                { uri: urls[ver] },
                {
                  shouldPlay: false,
                  isLooping: true,
                  volume: 0,
                  progressUpdateIntervalMillis: 100,
                }
              );

              tracksRef.current.set(ver, {
                sound,
                savedPosition: 0,
                hasBeenPlayed: false,
              });

              console.log(`Loaded: ${ver}`);
            } catch (error) {
              console.error(`Failed to load ${ver}:`, error);
            }
          })
        );

        const initialTrack = tracksRef.current.get(initial);
        if (initialTrack && autoStart) {
          await initialTrack.sound.setVolumeAsync(masterVolumeRef.current);
          await initialTrack.sound.playAsync();
          initialTrack.hasBeenPlayed = true;
          setCurrentlyPlaying(initial);

          startPositionTracking(initial);
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
  }, [urls, initial, loop, autoStart]);

  // Track position of current playing track
  const startPositionTracking = useCallback((currentVersion: Version) => {
    if (positionTrackerRef.current) {
      clearInterval(positionTrackerRef.current);
    }

    positionTrackerRef.current = setInterval(async () => {
      try {
        const track = tracksRef.current.get(currentVersion);
        if (!track) return;

        const status = await track.sound.getStatusAsync();
        if (status.isLoaded && status.positionMillis !== undefined) {
          const position = status.positionMillis;

          // Update the appropriate position tracker
          if (isGuidedFullGroup(currentVersion)) {
            guidedFullPositionRef.current = position;
          } else {
            track.savedPosition = position;
          }
        }
      } catch (error) {}
    }, 100);
  }, []);

  const changeVersion = useCallback(
    async (newVersion: Version, startPositionMs?: number) => {
      // Allow the same version if nothing is playing yet
      if (isTransitioningRef.current || !isReady) {
        console.log("Change blocked:", {
          newVersion,
          version,
          isTransitioning: isTransitioningRef.current,
          isReady,
        });
        return;
      }

      // If trying to set to same version and something is already playing, ignore
      if (
        newVersion === currentlyPlaying &&
        currentlyPlaying !== null &&
        startPositionMs === undefined
      ) {
        console.log("Already playing:", newVersion);
        return;
      }

      isTransitioningRef.current = true;
      console.log(
        `Transitioning: ${currentlyPlaying || "none"} → ${newVersion}`
      );

      try {
        const newTrack = tracksRef.current.get(newVersion);

        if (!newTrack) {
          console.error("New track not found");
          isTransitioningRef.current = false;
          return;
        }

        // If nothing is currently playing (autoStart was false)
        if (currentlyPlaying === null) {
          console.log(
            `Starting first track: ${newVersion} at volume ${masterVolumeRef.current}`
          );

          // Determine starting position for new track
          let startPosition = startPositionMs ?? 0; // Use provided position or default
          if (startPositionMs === undefined) {
            if (isGuidedFullGroup(newVersion)) {
              startPosition = guidedFullPositionRef.current;
            } else {
              startPosition = newTrack.hasBeenPlayed
                ? newTrack.savedPosition
                : 0;
            }
          }

          await newTrack.sound.setPositionAsync(startPosition);
          // IMPORTANT: Start at the current master volume, not 0
          await newTrack.sound.setVolumeAsync(masterVolumeRef.current);
          await newTrack.sound.playAsync();
          newTrack.hasBeenPlayed = true;

          setCurrentlyPlaying(newVersion);
          startPositionTracking(newVersion);
          setVersion(newVersion);
          isTransitioningRef.current = false;

          console.log(
            `Started playing ${newVersion} at volume ${masterVolumeRef.current}!`
          );
          return;
        }

        const currentTrack = tracksRef.current.get(currentlyPlaying);

        if (!currentTrack) {
          console.error("Current track not found");
          isTransitioningRef.current = false;
          return;
        }

        // Save current track's position before switching
        const currentStatus = await currentTrack.sound.getStatusAsync();
        if (
          currentStatus.isLoaded &&
          currentStatus.positionMillis !== undefined
        ) {
          if (isGuidedFullGroup(currentlyPlaying)) {
            guidedFullPositionRef.current = currentStatus.positionMillis;
          } else {
            currentTrack.savedPosition = currentStatus.positionMillis;
          }
        }

        // Determine starting position for new track
        let startPosition: number;

        if (startPositionMs !== undefined) {
          // Use explicitly provided position
          startPosition = startPositionMs;
        } else if (isGuidedFullGroup(newVersion)) {
          // Guided/Full always use the shared sync position
          startPosition = guidedFullPositionRef.current;
        } else {
          // Birth/Life/Death start from 0 if never played, otherwise resume
          startPosition = newTrack.hasBeenPlayed ? newTrack.savedPosition : 0;
        }

        console.log(
          `Starting ${newVersion} at position: ${Math.round(
            startPosition / 1000
          )}s`
        );

        // Set new track to starting position
        await newTrack.sound.setPositionAsync(startPosition);
        await newTrack.sound.setVolumeAsync(0);
        await newTrack.sound.playAsync();
        newTrack.hasBeenPlayed = true;

        // Update tracking to new sound
        startPositionTracking(newVersion);

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

          const oldVolume = Math.max(
            0,
            (1 - easeProgress) * masterVolumeRef.current
          );
          const newVolume = Math.min(
            masterVolumeRef.current,
            easeProgress * masterVolumeRef.current
          );

          try {
            await Promise.all([
              currentTrack.sound.setVolumeAsync(oldVolume),
              newTrack.sound.setVolumeAsync(newVolume),
            ]);
          } catch (error) {
            console.error("Volume update failed:", error);
          }

          if (progress >= 1) {
            // Fade complete
            clearInterval(fadeIntervalRef.current!);
            fadeIntervalRef.current = null;

            // Pause old track (keep its position saved)
            try {
              await currentTrack.sound.pauseAsync();
            } catch (error) {
              console.error("Failed to pause old track:", error);
            }

            setVersion(newVersion);
            setCurrentlyPlaying(newVersion);
            isTransitioningRef.current = false;

            console.log("Transition complete!");
          }
        }, 16); // ~60fps for smooth fade
      } catch (error) {
        console.error("Transition failed:", error);
        isTransitioningRef.current = false;
      }
    },
    [version, currentlyPlaying, isReady, fadeMs, startPositionTracking]
  );

  return {
    version,
    setVersion: changeVersion,
    isReady,
    setInitialVolume,
  };
}
