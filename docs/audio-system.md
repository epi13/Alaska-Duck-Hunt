# Offline Spatial Audio

The audio system uses decoded, cached `AudioBuffer` samples rather than runtime oscillator effects. Original WAV masters are retained under `assets/generated/audio/masters`; compressed Ogg files under `public/assets/audio` are the only runtime payload. Rights and provenance are recorded in `AUDIO_SOURCES_AND_LICENSES.md` and the generated checksum manifest.

## Signal flow

Every voice routes through an optional low-pass filter, stereo panner, per-voice gain, one of seven buses (`master`, `music`, `ambience`, `effects`, `birds`, `dog`, `UI`), and the master output. Bus gain and mute changes use smoothed `AudioParam` targets. Buffers are fetched and decoded once, voices have cue-specific limits, loops crossfade, and scene cleanup fades non-music voices.

The mixer creates its `AudioContext` only after a user gesture. Failed or delayed unlocking never blocks menu or hunt startup. Pause suspends the context; resume reuses it and the buffer cache.

## Spatial model

Pure code in `src/core/audio/spatial-audio.ts` maps world X to bounded stereo pan and scene-map depth to gain and low-pass cutoff. Occlusion and rear-source flags further reduce immediacy without silencing a cue. The minimum gain remains audible, and runtime gain changes use short ramps.

Bird events carry live world position, mapped depth, and environmental occlusion. Husky events use the most recent mapped dog position and path depth. Weapon and UI sounds remain centered.

## Event contract

`HuntScene`, `BirdEntity`, `BirdSpawnSystem`, and `DogFlushSystem` emit semantic events rather than calling audio directly: weapon fired/empty/reloaded, score result, bird call/flush/takeoff/land, dog vocalization, environment one-shot, and hunt phase. The browser adapter routes those events through the pure cue-selection table. Notice text has no audio side effect.

Calls are scheduled independently of animation loops and use seeded intervals, so birds do not call continuously. Location ambience combines two restrained loops, while music crossfades among menu, briefing, active hunt, final seconds, and results.

