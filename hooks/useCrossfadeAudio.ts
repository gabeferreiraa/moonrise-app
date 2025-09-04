// hooks/useCrossfadeAudio.ts
import {
  Audio,
  AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { useEffect, useRef, useState } from "react";

export type Version = "guided" | "birth" | "life" | "death" | "full";

type Options = {
  fadeMs?: number; // default 2000
  loop?: boolean; // default true
  autoStart?: boolean; // default true
};

export default function useCrossfadeAudio(
  sources: Record<Version, string>,
  initial: Version,
  opts: Options = {}
) {
  const fadeMs = opts.fadeMs ?? 2000;
  const loop = opts.loop ?? true;
  const autoStart = opts.autoStart ?? true;

  const [version, setVersionState] = useState<Version>(initial);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Two persistent Sound instances (like two <audio> tags on web)
  const soundARef = useRef(new Audio.Sound());
  const soundBRef = useRef(new Audio.Sound());
  const liveWhichRef = useRef<"A" | "B">("A");
  const loadGenRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // only update UI from the live sound
  const makeStatusHandler = (id: "A" | "B") => (st: AVPlaybackStatus) => {
    if (!st.isLoaded) return;
    if (liveWhichRef.current !== id) return;
    setIsPlaying(st.isPlaying);
    setPosition(st.positionMillis ?? 0);
    setDuration(st.durationMillis ?? 0);
  };

  // Configure audio once
  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      // Attach status handlers
      soundARef.current.setOnPlaybackStatusUpdate(makeStatusHandler("A"));
      soundBRef.current.setOnPlaybackStatusUpdate(makeStatusHandler("B"));

      if (autoStart) {
        const uri = sources[initial];
        if (uri) {
          // initial start
          await crossfadeTo(uri, true);
        }
      }
    })();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      (async () => {
        try {
          await soundARef.current.stopAsync();
        } catch {}
        try {
          await soundARef.current.unloadAsync();
        } catch {}
        try {
          await soundBRef.current.stopAsync();
        } catch {}
        try {
          await soundBRef.current.unloadAsync();
        } catch {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Core crossfade:
   *  - read outgoing position
   *  - load incoming at SAME position (no downloadFirst to reduce delay)
   *  - start incoming muted, wait until it's actually playing
   *  - equal-power fade with requestAnimationFrame
   */
  const crossfadeTo = async (nextUri: string, firstStart = false) => {
    const myGen = ++loadGenRef.current;

    const liveRef =
      liveWhichRef.current === "A" ? soundARef.current : soundBRef.current;
    const altRef =
      liveWhichRef.current === "A" ? soundBRef.current : soundARef.current;

    // 1) read timeline from outgoing
    let startPos = 0;
    if (!firstStart) {
      try {
        const st = await liveRef.getStatusAsync();
        if (st.isLoaded) startPos = st.positionMillis ?? 0;
      } catch {}
    }

    // 2) ensure incoming is unloaded then (re)load next source
    try {
      await altRef.stopAsync();
    } catch {}
    try {
      await altRef.unloadAsync();
    } catch {}
    try {
      await altRef.loadAsync(
        { uri: nextUri },
        {
          positionMillis: startPos,
          shouldPlay: false,
          volume: 0,
          isLooping: loop,
          progressUpdateIntervalMillis: 150,
        },
        /* downloadFirst */ false
      );
    } catch (e) {
      console.warn("[Audio] loadAsync failed:", e);
      return;
    }
    if (myGen !== loadGenRef.current) return; // abandoned

    // 3) start incoming (muted) and snap position once more post-play
    try {
      await altRef.playAsync();
      // Tighten sync after decoder starts:
      await altRef.setPositionAsync(startPos);
      await altRef.setRateAsync(1.0, true);
    } catch (e) {
      console.warn("[Audio] play/position failed:", e);
    }
    if (myGen !== loadGenRef.current) return;

    // Make sure outgoing is at full gain
    try {
      const st = await liveRef.getStatusAsync();
      if (st.isLoaded) {
        const v = (st as any).volume ?? 1;
        if (v < 0.999) await liveRef.setVolumeAsync(1);
      }
    } catch {}

    // 4) equal-power crossfade with RAF
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const dur = Math.max(80, fadeMs);

    const step = async (t: number) => {
      if (myGen !== loadGenRef.current) return;
      const k = Math.min(1, (t - t0) / dur);
      const theta = (k * Math.PI) / 2; // 0→π/2
      const inV = Math.sin(theta); // equal-power in
      const outV = Math.cos(theta); // equal-power out

      try {
        await altRef.setVolumeAsync(inV);
      } catch {}
      try {
        await liveRef.setVolumeAsync(outV);
      } catch {}

      if (k < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // finalize
        try {
          await altRef.setVolumeAsync(1);
        } catch {}
        try {
          await liveRef.setVolumeAsync(0);
        } catch {}
        liveWhichRef.current = liveWhichRef.current === "A" ? "B" : "A";
        // fully stop & unload old to avoid any “double”
        try {
          await liveRef.stopAsync();
        } catch {}
        try {
          await liveRef.unloadAsync();
        } catch {}
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // public API: set version and crossfade
  const setVersion = (v: Version) => {
    setVersionState(v);
    const uri = sources[v];
    if (uri) crossfadeTo(uri);
  };

  return { version, setVersion, isPlaying, position, duration };
}
