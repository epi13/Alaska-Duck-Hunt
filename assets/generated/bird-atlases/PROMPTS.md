# Bird atlas ImageGen prompt record

Generated 2026-07-20 with the built-in ImageGen tool. All outputs are original project art. References were used only for species identity, proportions, and the existing project’s pixel scale—not as source pixels or as a request to imitate proprietary game art.

## Shared exact constraints

> Create one ORIGINAL production-ready vintage 16-bit pixel-art sprite sheet for an Alaska bird hunting education game. Strict 4 columns by 4 rows, exactly 16 isolated full-body poses, each pose centered in its own equal cell, no overlap and no cropping. Pure flat chroma-key background #FF00FF only; no shadows, scenery, grid lines, labels, text, UI, gradients, antialiasing, blur, glow, or semitransparent pixels. Crisp black/dark outline and compact readable game silhouette, consistent scale and left/right side profile where useful. Every cell must be a genuinely different pose. Match the reference only for species identity and proportions; create all art originally.

ImageGen returned white rather than the requested key for Spectacled Eider, summer Willow Ptarmigan, and blue-morph Snow Goose. The packer normalizes only the corner-connected background before applying the same alpha workflow.

## Family sequence suffixes

- Dabbler: `row 1 concealed/resting, swimming or foraging, feeding, alert; row 2 pre-takeoff, spring/run, takeoff, landing; row 3 flight wing-up, wing-level, wing-down, glide; row 4 bank, climb/descend, hit reaction, falling.`
- Diver/sea duck: `row 1 rest on water, swim, dive preparation, underwater dive; row 2 surface, alert, pre-takeoff, running/pattering takeoff; row 3 liftoff, flight wing-up, wing-level, wing-down; row 4 glide/bank, landing splash, hit reaction, falling.`
- Goose: `row 1 resting, grazing, sentry, threat alert; row 2 walking, alert, pre-run crouch, running; row 3 takeoff wing-up, flight wing-up, wing-level, wing-down; row 4 glide/bank, running landing, hit reaction, falling.`
- Upland: `row 1 concealed crouch, resting, walking, ground foraging; row 2 freeze-alert, pre-takeoff crouch, hop/flutter, explosive takeoff; row 3 flight wing-up, wing-level, wing-down, glide; row 4 bank/descend, ground landing, hit reaction, falling.`
- Crane: `row 1 concealed low, feeding, partial neck raise, fully upright; row 2 upright bonus, alert, pre-run crouch, running takeoff; row 3 wing-up, wing-level, wing-down, glide; row 4 running landing, display/stretch, hit reaction, falling.`

## Species identity suffixes

- Mallard drake: breeding male; iridescent green head, white neck ring, chestnut breast, gray body, blue speculum.
- Mallard hen: mottled warm brown female; orange-and-dark bill and blue speculum bordered in white.
- Northern Pintail drake: elegant long neck, chocolate head, white neck stripe/breast, gray body, very long pointed black tail.
- American Wigeon drake: pale forehead/crown, green eye stripe, pinkish-brown breast, gray body, black rear, white wing patch.
- Green-winged Teal drake: very small compact duck, chestnut head, broad green eye patch, gray body, vertical white shoulder stripe, green speculum.
- Greater Scaup drake: rounded green-black head, pale blue broad bill/black nail, white sides, barred gray back, black chest/tail.
- Common Eider drake: very large heavy sea duck, white back/breast, black belly/flanks/crown, pale sea-green nape, long wedge bill.
- Harlequin drake: compact slate-blue sea duck, chestnut sides, bold white facial crescent and neck/side stripes outlined black.
- Common Goldeneye drake: steep dark green head, golden eye, circular white cheek spot, white body and black back.
- Common Goldeneye hen: chocolate-brown head, golden eye, gray body, white neck ring and compact diving-duck profile.
- Greater White-fronted Goose: brown goose, orange legs, pink-orange bill, conspicuous white bill-base patch, irregular black belly bars.
- Canada Goose: long black neck/head, bold white cheek patch, brown body, pale breast, black bill/feet.
- Snow Goose white morph: white plumage, black primary tips, pink bill with dark grin patch, pink legs.
- Snow Goose blue morph: slate blue-gray body, white head, dark neck, pink grin-patch bill/legs, black primaries.
- Brant: compact small dark goose, black head/chest/neck, short high white necklace, dark brown back, pale flanks.
- Sandhill Crane gray adult: tall gray crane, trailing long black legs, straight bill, red crown, readable low/partial/upright sequence.
- Sandhill Crane rust-stained: same morphology with natural rusty-brown body staining.
- Spruce Grouse male: compact forest grouse, slate/black barred body, black throat/breast, white spotting, chestnut tail tip, red comb.
- Willow Ptarmigan winter: rounded white tundra grouse, black bill, feathered white feet, red comb, black tail feathers visible in flight.
- Willow Ptarmigan summer: mottled chestnut-brown body, barred flanks, white belly/wing flashes, black bill, feathered feet, red comb.
- Spectacled Eider drake: protected Alaska sea duck; black chest/body, white back, pale green head, large white eye patches ringed black, orange bill; evasive rather than graphic hit reaction.
- Northern Pintail hen: slender long-necked mottled brown female, plain pale tan face, dark bill, shorter pointed tail, bronzy speculum.
- American Wigeon hen: warm brown compact female, brownish-gray head, dark eye smudge, pale black-tipped bill, dark speculum with thin white border.
- Green-winged Teal hen: very small compact mottled brown female, buff-yellow tail stripe, green speculum, no male shoulder stripe.
- Greater Scaup hen: warm brown rounded-headed female, darker head, broad blue-gray bill, yellow eye, variable white patch beside bill.
- Common Eider hen: heavy reddish-brown female with dense dark barring, black bill, and long sloping forehead-to-bill profile.
- Harlequin hen: compact gray-brown female with a white patch behind the bill, white around the eye, and a neat rear-cheek spot.
- Spruce Grouse female: brown/gray/buff/black/white mottled female with strong barring below and no male black throat.
- Spectacled Eider hen: densely barred rich-brown female with black bill, dark forehead, and subtle pale-brown spectacle pattern.
- Greater White-fronted Goose juvenile: lacks adult white bill-base feathering and black belly bars; duller bare parts and pale rounded upperpart feather tips.
- Canada Goose juvenile: flight-capable, adult-like head/neck/cheek pattern with restrained softer brown feather edges and modest proportions.
- Brant juvenile: black neck without the adult white necklace; pale scalloping and rounded pale tips across upperparts.

The eight hen/female and three juvenile keyed masters above were generated 2026-07-22 with the built-in ImageGen edit workflow, using the corresponding project adult sheet only as the pose-layout and pixel-scale reference. Species field marks were constrained from Cornell Lab identification references; the output pixels remain original project art.

Reference paths used for the ten supplied species are under `assets/references/Alaska_Game_Bird_Reference_Collection`. Existing project sheets were used as a pixel-style baseline only for unpictured close relatives. Generated keyed masters are immutable files in `keyed/`; all palette derivatives and alpha-normalized outputs are in `processed/`.
