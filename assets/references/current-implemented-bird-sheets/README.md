# Archived Implemented Bird Sheets

This directory is the verified pre-atlas production baseline archived before the named-animation migration.

- Archived from: `public/assets/birds/*.png`
- Repository state: `5b509a4a2cd9b048d7f0752b430621479a0d10ad`
- Archive date: 2026-07-20
- Original implementation commit: `aac61c51739ffea76ecaae47f2ab1e5ef594094a`
- Layout: 512×512 PNG; four columns × four rows; 128×128 logical frames
- Columns: four looping flight poses (`wing-up`, `wing-neutral`, `wing-down`, `wing-neutral-2`)
- Rows: the four species-specific variants listed in `manifest.json`

The sheets were copied rather than moved so the game remained playable during the atomic migration. `SHA256SUMS` was generated from the archived copies and verified immediately after copying. The original keyed generation masters and art brief remain in `assets/generated/birds`; the licensed photograph collection and its source records remain unchanged in `assets/references/Alaska_Game_Bird_Reference_Collection`.

These files are references, not the new runtime contract. They preserve the established original proportions, plumage interpretation, palette relationships, silhouettes, and general visual identity for the replacement named-state atlases.
