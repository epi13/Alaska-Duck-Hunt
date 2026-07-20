# Audio System

Audio is original and browser-generated where practical. An `AudioManager` unlocks only after user interaction and exposes independent master, music, effects, and ambience buses. Settings persist per profile; mute is immediate and resumable.

## Synthesis direction

Music uses short original motifs built from oscillators, filtered noise percussion, and sequenced envelopes. Habitat ambience layers loop with randomized, seeded one-shots: wind, water, rain, snow, forest texture, distant wings, and abstracted bird-presence cues. Calls should be stylized rather than misleading field-identification recordings.

Effects include shot, reload, empty action, hit, miss, combo, warning, protected-target penalty, success, failure, achievement, unlock, and navigation. The shot combines a short noise burst, low transient, and bounded tail; it is compressed to avoid startling peaks. No effect or melody may recreate recognizable audio from another game.

The manager limits concurrent voices, fades loops between scenes, suspends on hidden tabs, and uses low-memory fallbacks. Reduced-flash does not alter audio, but an optional reduced-intensity mix softens sharp transients. Visual equivalents accompany every meaningful audio cue.

