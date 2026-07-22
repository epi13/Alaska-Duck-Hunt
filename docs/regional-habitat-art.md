# Regional Habitat Art and Semantic Maps

Verified: 2026-07-21

The runtime now treats habitat as two connected data sets:

- `src/data/bird-habitats.ts` limits each species to plausible locations and preferred surfaces.
- `src/data/scene-maps.ts` maps those surfaces onto authored normalized polygons and paths inside the visible water, shore, meadow, tundra, forest floor, snow, rocky coast, river edge, and low-branch areas of each 1280×720 scene plate.
- `src/data/scene-props.ts` gives every location its own stable composition of map-region-linked plants, rocks, wood, snow cover, and shoreline details; no shared coordinate template remains authoritative.

`profilesForLocation()` intersects species preferences, behavior capabilities, and visible scene surfaces. A plan therefore cannot select an open-water start in a scene with no open-water region. Deterministic sampling, no-spawn rejection, path/polygon projection, and responsive cover transforms remain pure functions in `src/core/scenes/scene-map.ts`; see [semantic scene maps](scene-maps.md) for the format and authoring workflow.

## Regional atlas mapping

| Atlas | Locations | Representative foreground vocabulary |
| --- | --- | --- |
| Southcentral wetland | Mat-Su | Bluejoint-like grasses, sedges, horsetail, willow, dwarf birch, spruce, moss, glacial rock |
| Coastal delta | Cook Inlet, Copper River Delta | Coastal sedges, beach rye, bulrush, silverweed, willow, cottonwood, gravel and tidal edges |
| Western tundra | Y–K Delta, tundra wetlands | Water sedge, cottongrass, dwarf willow/birch, Labrador tea, crowberry, peat and mudflat edges |
| Boreal interior | Interior, river flats | Black/white spruce, paper birch, aspen, willow, alder, horsetail, moss, slough edges |
| Southeast rainforest | Southeast | Sitka spruce, western hemlock, alder, salmonberry, blueberry, devil's club, fern, estuary edge |
| Arctic/alpine | Arctic, alpine | Low sedges, cottongrass, dwarf willow/birch, mountain avens, crowberry, lichen and meltwater |
| Aleutian coast | Aleutians | Beach grasses, coastal forbs, lupine, crowberry, wind-shaped shrub, basalt, kelp and surf |
| Winter willow | Willow/snow scene | Snow-covered willow, spruce, alder, exposed sedge, rocks, logs, ice and narrow open water |

Frames 0–11 are plant/rock/wood cutouts. Frames 12–15 are low, wide water or shore occluders. Each authored placement now selects its own layer and perspective depth; airborne birds retain their independent flight depth.

Runtime placement and spatial occlusion are documented in [scene-map prop placement](scene-props.md). Prop depths now vary by authored layer and perspective rather than one fixed atlas-wide depth.

## Natural-history references

The art uses representative habitat forms, not a claim that every depicted plant co-occurs at every exact coordinate.

- [NPS Alaska ecoregions](https://www.nps.gov/subjects/aknatureandscience/akecoregions.htm): treeless arctic/subarctic tundra; Interior spruce/birch/willow/alder with moss, lichen, sedge and berry understory; larger coastal conifers and lush understory.
- [NPS Arctic tundra](https://home.nps.gov/articles/000/fire-in-ecosystems-arctic-tundra.htm): cottongrass and Bigelow's sedge tussocks with willow, dwarf birch, mosses and lichens.
- [USGS Y–K Delta coastal meadow study](https://www.usgs.gov/publications/vegetation-patterns-and-environmental-gradients-coastal-meadows-yukon-kuskokwim-delta): vegetation gradients from intertidal mudflat to upland tundra.
- [USGS Arctic Coastal Plain and Y–K Delta overview](https://www.usgs.gov/programs/climate-adaptation-science-centers/science/understanding-landscape-change-alaskan-arctic): shallow-lake coastal plain and wetland/tundra delta context.
- [USFS West Copper River Delta assessment](https://www.fs.usda.gov/Internet/FSE_DOCUMENTS/fsbdev2_038276.pdf): marsh, grass, willow, forest, alpine, rock and coastal wetland communities.
- [NPS Interior boreal forest](https://www.nps.gov/wrst/learn/nature/forests.htm): black/white spruce, birch, aspen, poplar, willow, cranberry, Labrador tea, blueberry, moss, lichen, sedge and horsetail.
- [NPS Southeast Alaska plants](https://www.nps.gov/sitk/learn/nature/plants.htm): western hemlock, Sitka spruce, blueberry, devil's club, salmonberry and fern-rich openings.
- [NPS Denali plants by form](https://www.nps.gov/dena/learn/nature/plants-by-form.htm): alpine mountain avens and dwarf willow context.

All game tuning and semantic surface boundaries are fictionalized for readable play. This document does not provide hunting or legal guidance; the in-game regulatory disclaimer remains controlling.
