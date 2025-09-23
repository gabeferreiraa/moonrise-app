import useCrossfadeAudio, { type Version } from "@/hooks/useCrossfadeAudio";
import React, {
  createContext,
  forwardRef,
  PropsWithChildren,
  useContext,
  useImperativeHandle,
} from "react";

type Props = PropsWithChildren<{
  urls: Record<Version, string>;
  initial: Version;
  overlapMs?: number;
  loop?: boolean;
  autoStart?: boolean;
}>;

type AudioCtx = {
  version: Version;
  setVersion: (v: Version) => void;
  ready: boolean;
};

const AudioContext = createContext<AudioCtx | null>(null);

export type AudioPlayerHandle = {
  setVersion: (v: Version) => void;
  getVersion: () => Version;
  isReady: () => boolean;
};

const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(
  ({ urls, initial, overlapMs, loop, autoStart, children }, ref) => {
    const { version, setVersion, ready } = useCrossfadeAudio(urls, initial, {
      overlapMs,
      loop,
      autoStart,
    });

    useImperativeHandle(
      ref,
      () => ({
        setVersion,
        getVersion: () => version,
        isReady: () => ready,
      }),
      [setVersion, version, ready]
    );

    const contextValue = { version, setVersion, ready };

    return (
      <AudioContext.Provider value={contextValue}>
        {children}
      </AudioContext.Provider>
    );
  }
);

AudioPlayer.displayName = "AudioPlayer";

export function useAudioController() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudioController must be used inside <AudioPlayer>");
  }
  return ctx;
}

export default AudioPlayer;
