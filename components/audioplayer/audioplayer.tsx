import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Options = {
  crossfadeMs?: number; // Simplified naming to match web version
  loop?: boolean;
  autoStart?: boolean;
};

type Version = "guided" | "birth" | "life" | "death" | "full";

export default function useCrossfadeAudio(
  urls: Record<Version, string>,
  initial: Version,
  opts: Options = {}
) {
  const {
    crossfadeMs = 2000, // Match web default
    loop = true,
    autoStart = true,
  } = opts;

  const [version, setVersion] = useState<Version>(initial);

  // Two audio instances for crossfade (like web's dual <audio> tags)
  const audio0Ref = useRef<Audio.Sound | null>(null);
  const audio1Ref = useRef<Audio.Sound | null>(null);
  const whichLive = useRef<0 | 1>(0); // Track which audio is currently "live"

  const [ready, setReady] = useState(false);
  const isFadingRef = useRef(false);

  // Get current live/alt audio references
  const getLiveAudio = () =>
    whichLive.current === 0 ? audio0Ref.current : audio1Ref.current;
  const getAltAudio = () =>
    whichLive.current === 0 ? audio1Ref.current : audio0Ref.current;

  // Initialize audio system and preload initial track
  useEffect(() => {
    let cancelled = false;

    const initAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
      });

      // Create two audio instances
      audio0Ref.current = new Audio.Sound();
      audio1Ref.current = new Audio.Sound();

      // Load initial track in audio0
      await audio0Ref.current.loadAsync(
        { uri: urls[initial] },
        { shouldPlay: false, isLooping: loop, volume: 1 },
        true // downloadFirst
      );

      if (cancelled) return;

      // Auto-start if enabled
      if (autoStart) {
        await audio0Ref.current.playAsync();
      }

      setReady(true);
    };

    initAudio();

    return () => {
      cancelled = true;
      audio0Ref.current?.unloadAsync();
      audio1Ref.current?.unloadAsync();
    };
  }, [urls, initial, loop, autoStart]);

  // Crossfade function - mimics web implementation
  const crossfadeTo = useCallback(
    async (nextVersion: Version) => {
      if (!ready || isFadingRef.current || nextVersion === version) return;

      const currentAudio = getLiveAudio();
      const nextAudio = getAltAudio();

      if (!currentAudio || !nextAudio) return;

      isFadingRef.current = true;

      try {
        // Get current playback position (like web's currentTime)
        const currentStatus =
          (await currentAudio.getStatusAsync()) as AVPlaybackStatusSuccess;
        const startPosition = currentStatus.isLoaded
          ? currentStatus.positionMillis || 0
          : 0;

        // Load new track in alternate audio instance
        await nextAudio.unloadAsync(); // Clear previous
        await nextAudio.loadAsync(
          { uri: urls[nextVersion] },
          { shouldPlay: false, isLooping: loop, volume: 0 },
          true
        );

        // Set to same position as current track (perfect sync like web)
        await nextAudio.setPositionAsync(startPosition);
        await nextAudio.playAsync();

        // Crossfade using requestAnimationFrame approach (like web)
        const startTime = performance.now();
        const fadeStep = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(1, elapsed / crossfadeMs);

          // Quick cut-off curve - old audio fades out much faster
          const incomingVolume = progress; // Linear fade in
          const outgoingVolume = Math.pow(1 - progress, 3); // Cubic fade out (much faster)

          // Apply volumes
          Promise.all([
            nextAudio.setVolumeAsync(incomingVolume),
            currentAudio.setVolumeAsync(outgoingVolume),
          ]).catch(() => {}); // Silent error handling

          if (progress < 1) {
            requestAnimationFrame(fadeStep);
          } else {
            // Crossfade complete
            currentAudio
              .stopAsync()
              .then(() => {
                currentAudio.setVolumeAsync(0);
              })
              .catch(() => {});

            nextAudio.setVolumeAsync(1);

            // Switch which audio is "live" (like web's whichLive toggle)
            whichLive.current = whichLive.current === 0 ? 1 : 0;
            isFadingRef.current = false;
          }
        };

        requestAnimationFrame(fadeStep);
      } catch (error) {
        console.warn("Crossfade error:", error);
        isFadingRef.current = false;
      }
    },
    [ready, version, crossfadeMs, urls, loop]
  );

  // Version setter
  const setVersionSmooth = useCallback(
    (newVersion: Version) => {
      setVersion(newVersion);
      if (ready) {
        crossfadeTo(newVersion);
      }
    },
    [ready, crossfadeTo]
  );

  return useMemo(
    () => ({
      version,
      setVersion: setVersionSmooth,
      ready,
    }),
    [version, setVersionSmooth, ready]
  );
}
