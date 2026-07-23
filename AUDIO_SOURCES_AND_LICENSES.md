# Audio Sources and Licenses

Verified: 2026-07-22

## Shipping policy

All 42 audio files shipped by Alaska Duck Hunt are original procedural synthesis created specifically for this repository. No field recording, wildlife-database recording, commercial sound library, video soundtrack, Indigenous ceremonial or traditional music, or proprietary hunting-game audio was copied, sampled, extracted, or redistributed.

The generated audio is an original project asset and may be redistributed under the repository's MIT license. The project owner may relicense these generated outputs. This permission covers both the retained WAV masters and processed Ogg game files.

## Provenance

- Generator: `scripts/generate-audio-assets.ts`
- Original masters: `assets/generated/audio/masters/*.wav`
- Processed runtime files: `public/assets/audio/*.ogg`
- Machine-readable checksums and per-file provenance: `assets/generated/audio/manifest.json`
- Master format: mono PCM WAV, 32 kHz, 16-bit
- Runtime format: mono Ogg Vorbis
- External recordings used: none
- Copyrighted wildlife recordings: research references only; none are stored or shipped

## Catalog

| Category | Runtime cues | Source | Redistribution right |
| --- | --- | --- | --- |
| Weapon and feedback | shot, reload, empty chamber, mechanical UI, hit, miss, protected warning | Original deterministic noise, transient, and tonal synthesis | Repository MIT license |
| Bird movement | three wing-size profiles, water takeoff/landing, ground flush/landing, vegetation rustle | Original deterministic noise-envelope synthesis | Repository MIT license |
| Bird calls | dabbler, diver, sea-duck, goose group, crane, grouse, ptarmigan | Original stylized synthesis informed only by broad call qualities; not wildlife recordings | Repository MIT license |
| Alaskan Husky | sniff, bark, pant, movement, celebration | Original stylized synthesis; no dog recording sampled | Repository MIT license |
| Environment | wind, rain, surf, river, tundra, forest, marsh, snow | Original loopable deterministic noise and tonal synthesis | Repository MIT license |
| Music | menu, briefing, hunt, final seconds, results | Original restrained arcade compositions; no copied hunting-game theme and no imitation of Indigenous traditional or ceremonial music | Repository MIT license |

## Verification rule

`npm run validate:assets` rejects an incomplete catalog, a missing master or processed file, a checksum mismatch, an undeclared audio file, an external-recording flag, or a PWA configuration that does not precache Ogg assets.
