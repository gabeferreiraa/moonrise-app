// src/audio/intentionAudio.ts
import { Audio } from "expo-av";
import { Animated } from "react-native";

const INTENTION_AUDIO_URL =
  "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/intentionwheel.m4a?alt=media&token=5b5d4239-8ca0-4be9-a07e-db8f1b1e6220";

// These are module-scoped but NEVER null after the first init
let _sound: Audio.Sound | null = null;
let _isInitialized = false;

// This one is created immediately — never null, never optional
const _volumeAnim = new Animated.Value(0);

export const intentionAudio = {
  async init(): Promise<Audio.Sound | null> {
    if (_isInitialized && _sound) {
      return _sound;
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: INTENTION_AUDIO_URL },
        {
          isLooping: true,
          volume: 0,
          shouldPlay: true,
        }
      );

      _sound = sound;
      _isInitialized = true;

      // Attach listener exactly once
      _volumeAnim.addListener(({ value }) => {
        _sound?.setVolumeAsync(value as number).catch(() => {});
      });

      console.log("Intention audio ready – animated volume linked");
      return sound;
    } catch (err) {
      console.error("Failed to load intention audio:", err);
      return null;
    }
  },

  fadeIn(duration = 2000, toValue = 0.5) {
    Animated.timing(_volumeAnim, {
      toValue,
      duration,
      useNativeDriver: false,
    }).start();
  },

  fadeOut(duration = 2500): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(_volumeAnim, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start(() => resolve());
    });
  },

  async stopAndUnload() {
    // Remove listener first
    _volumeAnim.removeAllListeners();

    if (_sound) {
      try {
        await _sound.stopAsync();
        await _sound.unloadAsync();
      } catch {
        /* ignore */
      }
      _sound = null;
      _isInitialized = false;
    }

    // Reset volume for next time (optional but clean)
    _volumeAnim.setValue(0);
  },

  get isLoaded() {
    return _isInitialized;
  },
};
