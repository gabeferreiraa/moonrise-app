
import { Audio } from "expo-av";

const INTENTION_AUDIO_URL =
  "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/intentionwheel.m4a?alt=media&token=5b5d4239-8ca0-4be9-a07e-db8f1b1e6220";

// Module-scoped state
let _sound: Audio.Sound | null = null;
let _isInitialized = false;
let _currentVolume = 0;
let _fadeInterval: NodeJS.Timeout | null = null;

export const intentionAudio = {
  async init(): Promise<Audio.Sound | null> {
    if (_isInitialized && _sound) {
      return _sound;
    }

    try {
      // Set audio mode FIRST, before loading
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        interruptionModeIOS: 2, // Mix with others
        interruptionModeAndroid: 1, // Do not mix
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: INTENTION_AUDIO_URL },
        {
          isLooping: true,
          volume: 0,
          shouldPlay: false, // Don't auto-play, we'll control this
          progressUpdateIntervalMillis: 100,
        }
      );

      _sound = sound;
      _isInitialized = true;
      _currentVolume = 0;

      console.log("Intention audio loaded and ready");
      return sound;
    } catch (err) {
      console.error("Failed to load intention audio:", err);
      return null;
    }
  },

  async fadeIn(duration = 2000, toValue = 0.5) {
    if (!_sound) {
      console.warn("Sound not loaded, cannot fade in");
      return;
    }

    // Clear any existing fade
    if (_fadeInterval) {
      clearInterval(_fadeInterval);
      _fadeInterval = null;
    }

    try {
      // Make sure it's playing
      const status = await _sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await _sound.playAsync();
      }

      const startVolume = _currentVolume;
      const targetVolume = Math.max(0, Math.min(1, toValue));
      const startTime = Date.now();

      _fadeInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Exponential easing for smoother fade
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        const newVolume = startVolume + (targetVolume - startVolume) * easeProgress;
        
        _currentVolume = newVolume;

        try {
          await _sound?.setVolumeAsync(newVolume);
        } catch (error) {
          // Ignore errors during fade
        }

        if (progress >= 1) {
          if (_fadeInterval) {
            clearInterval(_fadeInterval);
            _fadeInterval = null;
          }
          _currentVolume = targetVolume;
          console.log(`Fade in complete at volume ${targetVolume}`);
        }
      }, 16); // ~60fps
    } catch (err) {
      console.error("Fade in failed:", err);
    }
  },

  async fadeOut(duration = 2500): Promise<void> {
    return new Promise((resolve) => {
      if (!_sound) {
        resolve();
        return;
      }

      // Clear any existing fade
      if (_fadeInterval) {
        clearInterval(_fadeInterval);
        _fadeInterval = null;
      }

      const startVolume = _currentVolume;
      const startTime = Date.now();

      _fadeInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Exponential easing
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        const newVolume = startVolume * (1 - easeProgress);
        
        _currentVolume = newVolume;

        try {
          await _sound?.setVolumeAsync(newVolume);
        } catch (error) {
          // Ignore errors during fade
        }

        if (progress >= 1) {
          if (_fadeInterval) {
            clearInterval(_fadeInterval);
            _fadeInterval = null;
          }
          _currentVolume = 0;
          console.log("Fade out complete");
          resolve();
        }
      }, 16); // ~60fps
    });
  },

  async stopAndUnload() {
    // Clear any active fade
    if (_fadeInterval) {
      clearInterval(_fadeInterval);
      _fadeInterval = null;
    }

    if (_sound) {
      try {
        await _sound.stopAsync();
        await _sound.unloadAsync();
      } catch {
        /* ignore */
      }
      _sound = null;
      _isInitialized = false;
      _currentVolume = 0;
    }

    console.log("Intention audio stopped and unloaded");
  },

  async pause() {
    if (_sound) {
      try {
        await _sound.pauseAsync();
      } catch (error) {
        console.error("Failed to pause:", error);
      }
    }
  },

  async resume() {
    if (_sound) {
      try {
        await _sound.playAsync();
      } catch (error) {
        console.error("Failed to resume:", error);
      }
    }
  },

  get isLoaded() {
    return _isInitialized;
  },

  get currentVolume() {
    return _currentVolume;
  },
};