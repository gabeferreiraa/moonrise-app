import {
  AVPlaybackStatus,
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Version = "guided" | "birth" | "life" | "death" | "full";

export default function AudioPlayerMobile({
  version,
  sources, // map Version -> URL
  onAnyInteraction,
  crossfadeMs = 1200,
}: {
  version: Version;
  sources: Record<Version, string>;
  onAnyInteraction?: () => void;
  crossfadeMs?: number;
}) {
  // two-sound engine for crossfade
  const soundARef = useRef<Audio.Sound | null>(null);
  const soundBRef = useRef<Audio.Sound | null>(null);
  const liveWhichRef = useRef<"A" | "B">("A");
  const genRef = useRef(0); // race guard for rapid switches

  // UI state
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [position, setPosition] = useState(0); // ms
  const [duration, setDuration] = useState(0); // ms

  // one-time audio mode (if you haven't set it elsewhere)
  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
    })();
  }, []);

  // helper: status updates only from the *live* sound
  const makeStatusHandler =
    (which: "A" | "B") => (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (liveWhichRef.current !== which) return; // ignore non-live
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis ?? 0);
      setDuration(status.durationMillis ?? 0);
    };

  const fmt = (ms: number) => {
    const s = Math.floor((ms || 0) / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // crossfade to a new URI, preserving timeline
  const crossfadeTo = async (uri: string) => {
    const myGen = ++genRef.current;

    const liveRef = liveWhichRef.current === "A" ? soundARef : soundBRef;
    const altRef = liveWhichRef.current === "A" ? soundBRef : soundARef;

    // read current timestamp & play state from live
    let startAt = 0;
    let wasPlaying = true;
    if (liveRef.current) {
      try {
        const st = await liveRef.current.getStatusAsync();
        if (st.isLoaded) {
          startAt = st.positionMillis ?? 0;
          wasPlaying = st.isPlaying ?? true;
        }
      } catch {}
    }

    // reset alt
    if (altRef.current) {
      try {
        await altRef.current.stopAsync();
      } catch {}
      try {
        await altRef.current.unloadAsync();
      } catch {}
      altRef.current = null;
    }

    // create incoming at 0 volume
    let incoming: Audio.Sound | null = null;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, isLooping: loop, volume: 0 },
        makeStatusHandler(liveWhichRef.current === "A" ? "B" : "A")
      );
      incoming = sound;
    } catch (e) {
      console.warn("[mobile audio] createAsync failed:", e);
      return;
    }

    if (myGen !== genRef.current) {
      try {
        await incoming.unloadAsync();
      } catch {}
      return;
    }

    // seek to same timestamp, then start if was playing
    try {
      await incoming.setPositionAsync(startAt);
    } catch {}
    if (wasPlaying) {
      try {
        await incoming.playAsync();
      } catch {}
    }

    // ensure outgoing is at volume 1 before fade
    const fadeOut = liveRef.current;
    if (fadeOut) {
      try {
        const st = await fadeOut.getStatusAsync();
        if (st.isLoaded) {
          const vol = (st as any).volume ?? 1;
          if (vol < 0.99) await fadeOut.setVolumeAsync(1);
        }
      } catch {}
    }

    // fade
    const start = Date.now();
    const dur = Math.max(100, crossfadeMs);
    const ease = (t: number) => t * t * (3 - 2 * t);
    let timer: NodeJS.Timer | null = null;

    const tick = async () => {
      if (myGen !== genRef.current) {
        if (timer) clearInterval(timer);
        return;
      }
      const k = Math.min(1, (Date.now() - start) / dur);
      const f = ease(k);
      try {
        await incoming!.setVolumeAsync(f);
      } catch {}
      if (fadeOut) {
        try {
          await fadeOut.setVolumeAsync(1 - f);
        } catch {}
      }
      if (k >= 1) {
        if (timer) clearInterval(timer);

        // swap: incoming becomes live
        if (liveWhichRef.current === "A") {
          soundBRef.current = incoming!;
          liveWhichRef.current = "B";
        } else {
          soundARef.current = incoming!;
          liveWhichRef.current = "A";
        }

        // stop/unload old
        if (fadeOut) {
          try {
            await fadeOut.stopAsync();
          } catch {}
          try {
            await fadeOut.unloadAsync();
          } catch {}
        }
      }
    };

    timer = setInterval(tick, 16);
    tick();
  };

  // switch on version change
  useEffect(() => {
    const uri = sources[version] ?? sources.full;
    if (!uri) return;
    crossfadeTo(uri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, sources, loop]);

  // keep loop setting in sync with the live sound
  useEffect(() => {
    const liveRef = liveWhichRef.current === "A" ? soundARef : soundBRef;
    if (liveRef.current) {
      liveRef.current.setIsLoopingAsync(loop).catch(() => {});
    }
  }, [loop]);

  // cleanup both sounds on unmount
  useEffect(() => {
    return () => {
      [soundARef.current, soundBRef.current].forEach(async (s) => {
        if (!s) return;
        try {
          await s.stopAsync();
        } catch {}
        try {
          await s.unloadAsync();
        } catch {}
      });
    };
  }, []);

  // controls
  const togglePlay = async () => {
    onAnyInteraction?.();
    const s =
      liveWhichRef.current === "A" ? soundARef.current : soundBRef.current;
    if (!s) return;
    const status = await s.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) await s.pauseAsync();
      else await s.playAsync();
    }
  };

  const rewind10 = async () => {
    onAnyInteraction?.();
    const sLive =
      liveWhichRef.current === "A" ? soundARef.current : soundBRef.current;
    const sAlt =
      liveWhichRef.current === "A" ? soundBRef.current : soundARef.current;
    if (!sLive) return;
    const st = await sLive.getStatusAsync();
    if (!st.isLoaded) return;
    const next = Math.max(0, (st.positionMillis ?? 0) - 10000);
    await sLive.setPositionAsync(next);
    // keep alt roughly aligned for the next switch
    try {
      await sAlt?.setPositionAsync(next);
    } catch {}
  };

  const toggleLoop = async () => {
    onAnyInteraction?.();
    setLoop((v) => !v);
    const sLive =
      liveWhichRef.current === "A" ? soundARef.current : soundBRef.current;
    try {
      await sLive?.setIsLoopingAsync(!loop);
    } catch {}
  };

  return (
    <View style={styles.bar}>
      {/* Rewind */}
      <Pressable
        onPress={rewind10}
        style={styles.btn}
        android_ripple={{ color: "#444" }}
      >
        <Text style={styles.btnText}>↺10</Text>
      </Pressable>

      {/* Play / Pause */}
      <Pressable
        onPress={togglePlay}
        style={styles.btn}
        android_ripple={{ color: "#444" }}
      >
        <Text style={styles.btnText}>{isPlaying ? "❚❚" : "▶︎"}</Text>
      </Pressable>

      {/* Time */}
      <Text style={styles.time}>
        {fmt(position)} / {duration ? fmt(duration) : "0:00"}
      </Text>

      {/* Loop */}
      <Pressable
        onPress={toggleLoop}
        style={[styles.btn, loop && styles.btnActive]}
        android_ripple={{ color: "#444" }}
      >
        <Text style={styles.btnText}>⟲</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "92%",
    maxWidth: 720,
    backgroundColor: "rgba(28,28,30,0.7)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: {
    backgroundColor: "rgba(255,236,204,0.08)",
    borderColor: "rgba(255,236,204,0.7)",
  },
  btnText: {
    color: "#F4F2ED",
    fontSize: 16,
    fontWeight: "600",
  },
  time: {
    color: "#CBBCA4",
    fontSize: 14,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: "auto",
  },
});
