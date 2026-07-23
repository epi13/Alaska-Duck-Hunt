import Phaser from 'phaser';
import { HuntScene } from './game/HuntScene';
import { LEGAL_DISCLAIMER, locations, modes, species, type GameMode } from './data/content';
import { birdSpriteBySpecies } from './data/bird-sprites';
import { birdBehaviorBySpecies } from './data/bird-behaviors';
import { sceneMapByLocation } from './data/scene-maps';
import { scenePropLayoutByLocation } from './data/scene-props';
import { campaignMissions } from './data/campaign-missions';
import { AudioManager } from './services/audio';
import { BrowserInputProvider, type InputEvent } from './core/input';
import type { BirdFamily } from './core/birds/bird-placement';
import type { BirdSurface } from './core/birds/bird-plan';
import type { AudioBus } from './core/audio/audio-bus';
import type { AudioTelemetry, SpatialAudioInput } from './services/audio';
import {
  createRoundConfig,
  modeBestStorageKey,
  modePresentations,
  speciesForLocation,
} from './data/mode-configs';
import {
  type RoundConfig,
  type RoundPlayerOptions,
  type RoundResultStats,
} from './core/modes/round-config';
import {
  applyCampaignResult,
  campaignCurrentLocation,
  campaignMission,
  campaignNextLocation,
  canPlayCampaignLocation,
  CAMPAIGN_LOCATION_IDS,
  startCampaign,
  type CampaignLocationId,
} from './core/campaign/campaign-progression';
import {
  createDefaultSave,
  migrateLegacyCampaignIndex,
  parseSave,
  SAVE_STORAGE_KEY,
  serializeSave,
  type SaveData,
} from './core/save';
import './styles/main.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
const audio = new AudioManager();
const audioSettingBus: Readonly<Record<string, AudioBus>> = {
  'Master volume': 'master',
  Music: 'music',
  Effects: 'effects',
  Ambience: 'ambience',
  Birds: 'birds',
  Dog: 'dog',
  UI: 'UI',
};
const audioMuteBus: Readonly<Record<string, AudioBus>> = {
  'Mute music': 'music',
  'Mute ambience': 'ambience',
  'Mute effects': 'effects',
  'Mute birds': 'birds',
  'Mute dog': 'dog',
  'Mute UI': 'UI',
};
applyStoredAudioSettings();
window.addEventListener('adh-audio', ((event: CustomEvent<AudioTelemetry>) => {
  const layer = document.querySelector<HTMLElement>('#aim-layer');
  if (!layer) return;
  layer.dataset.audioLastCue = event.detail.cue;
  layer.dataset.audioLastBus = event.detail.bus;
  layer.dataset.audioLastStatus = event.detail.status;
  layer.dataset.audioPan = String(event.detail.pan ?? 0);
  layer.dataset.audioGain = String(event.detail.gain ?? 0);
  layer.dataset.audioLowpass = String(event.detail.lowpassHz ?? 18_000);
  layer.dataset.audioEventCount = String(Number(layer.dataset.audioEventCount ?? 0) + 1);
  layer.dataset.audioCueHistory =
    `${layer.dataset.audioCueHistory ?? ''}>${event.detail.cue}:${event.detail.status}`.slice(
      -2_000,
    );
}) as EventListener);
window.addEventListener('adh-audio-state', ((
  event: CustomEvent<{ unlocked: boolean; contextState: string; gains: object; muted: object }>,
) => {
  root.dataset.audioUnlocked = String(event.detail.unlocked);
  root.dataset.audioContextState = event.detail.contextState;
  root.dataset.audioSettings = JSON.stringify({
    gains: event.detail.gains,
    muted: event.detail.muted,
  });
}) as EventListener);
let game: Phaser.Game | undefined;
let browserInput: BrowserInputProvider | undefined;
let selectedMode: GameMode = 'campaign';
let currentRoundConfig: RoundConfig | undefined;
const modeOptions = loadModeOptions();
let saveData = loadSaveData();
let debugRoundCompletionHandler: EventListener | undefined;
type FrontDoorPage =
  | 'campaign'
  | 'campaign-continue'
  | 'modes'
  | 'guide'
  | 'settings'
  | 'stats'
  | 'controller';

function loadSaveData(): SaveData {
  const serialized = localStorage.getItem(SAVE_STORAGE_KEY);
  let save = serialized ? parseSave(serialized) : createDefaultSave();
  if (!serialized)
    save = migrateLegacyCampaignIndex(
      save,
      localStorage.getItem('adh-next-location'),
      localStorage.getItem('adh-campaign-started'),
    );
  localStorage.setItem(SAVE_STORAGE_KEY, serializeSave(save));
  return save;
}

function persistSave() {
  localStorage.setItem(SAVE_STORAGE_KEY, serializeSave(saveData));
}

function loadModeOptions(): Partial<Record<GameMode, RoundPlayerOptions>> {
  try {
    return JSON.parse(sessionStorage.getItem('adh-mode-options') ?? '{}') as Partial<
      Record<GameMode, RoundPlayerOptions>
    >;
  } catch {
    return {};
  }
}

function saveModeOptions() {
  sessionStorage.setItem('adh-mode-options', JSON.stringify(modeOptions));
}

function speciesName(id: string) {
  return species.find((entry) => entry.id === id)?.common ?? id;
}

function menuIcon(name: 'campaign' | 'modes' | 'guide' | 'records' | 'settings' | 'controller') {
  const paths = {
    campaign: '<path d="M2 18 8.5 8l3 4 3.2-5L22 18H2Z"/><path d="M5 18h14"/>',
    modes: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    guide:
      '<path d="M4 5.5c3-1 5-.5 8 1.5v12c-3-2-5-2.5-8-1.5v-12Zm16 0c-3-1-5-.5-8 1.5v12c3-2 5-2.5 8-1.5v-12Z"/>',
    records: '<path d="M5 19V9h3v10H5Zm6 0V4h3v15h-3Zm6 0v-7h3v7h-3ZM3 19h19"/>',
    settings:
      '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19 13.5 2-1.5-2-1.5-.7-1.8.4-2.5-2.5.4L14.5 5 13 3l-1.5 2-1.8.7-2.5-.4.4 2.5L6 9.5 4 11l2 1.5.7 1.8-.4 2.5 2.5-.4 1.7 1.6 1.5 2 1.5-2 1.8-.7 2.5.4-.4-2.5 1.6-1.7Z"/>',
    controller:
      '<path d="M7 9h10c3.5 0 5 7 3 9-1.4 1.4-3.2-2-5-2H9c-1.8 0-3.6 3.4-5 2-2-2 0-9 3-9Z"/><path d="M8 11v4m-2-2h4m6-1h.01m2 2h.01"/>',
  } as const;
  return `<svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function playerProgress() {
  const currentLocationId =
    campaignCurrentLocation(saveData.campaign) ??
    CAMPAIGN_LOCATION_IDS[CAMPAIGN_LOCATION_IDS.length - 1]!;
  const nextLocationIndex = CAMPAIGN_LOCATION_IDS.indexOf(currentLocationId);
  return {
    campaignStarted: saveData.campaign.started,
    nextLocationIndex,
    nextLocation: locations.find(({ id }) => id === currentLocationId) ?? locations[0]!,
    completedLocations: saveData.campaign.completedLocations.length,
    campaignComplete: saveData.campaign.campaignComplete,
    hunts: saveData.stats.huntsCompleted,
    bestScore: Math.max(0, ...Object.values(saveData.records.highScores)),
    bestAccuracy: saveData.stats.bestAccuracy,
    totalHits: saveData.stats.validHits,
    loggedSpecies: new Set(
      JSON.parse(localStorage.getItem('adh-species-logged') ?? '[]') as string[],
    ).size,
  };
}

function wildlifeLayers() {
  return `<div class="front-wildlife" aria-hidden="true">
    <div class="front-bird bird-near"><i></i></div>
    <div class="front-bird bird-mid"><i></i></div>
    <div class="front-bird bird-far"><i></i></div>
    <div class="front-husky"></div>
  </div>`;
}

function progressStrip(progress: ReturnType<typeof playerProgress>) {
  return `<div class="front-progress" aria-label="Campaign progress">
    <div class="next-location"><img src="/assets/ui/start-copper-river.webp" alt=""><span><b>${progress.campaignComplete ? 'CAMPAIGN COMPLETE' : `NEXT: ${progress.nextLocation.name}`}</b><small>${progress.completedLocations} / ${locations.length} LOCATIONS CLEARED</small></span></div>
    <div><b>${species.length} SPECIES IN FIELD GUIDE</b><small>${progress.loggedSpecies} identified in completed hunts</small></div>
    <div class="offline-status"><span aria-hidden="true"></span><b>OFFLINE READY</b></div>
    <small class="front-legal">ORIGINAL ART & AUDIO • FICTIONAL GAME RULES • v1.0</small>
  </div>`;
}

function shell(content: string) {
  root.innerHTML = `<div class="app-shell"><header><button class="brand" data-go="menu"><img src="assets/icon.svg" alt=""><span>ALASKA <b>DUCK HUNT</b></span></button><div class="header-actions"><button data-go="guide">FIELD GUIDE</button><button data-go="settings">SETTINGS</button></div></header><main>${content}</main><footer><span>ORIGINAL ALASKAN ARCADE HUNT</span><span>OFFLINE READY • v1.0</span></footer></div>`;
  window.scrollTo({ top: 0, left: 0 });
  root.classList.toggle('reduce-motion', localStorage.getItem('adh-Reduced motion') === 'true');
  bindNav();
}

function routePage(page: FrontDoorPage) {
  if (page === 'campaign') {
    saveData = { ...saveData, campaign: startCampaign(saveData.campaign) };
    persistSave();
    campaign();
  } else if (page === 'campaign-continue') continueCampaign();
  else if (page === 'modes') modeSelect();
  else if (page === 'guide') guide();
  else if (page === 'settings') settings();
  else if (page === 'stats') stats();
  else controller();
}

function bindFrontDoor() {
  const unlockOnFirstInteraction = () => {
    void audio.unlock();
  };
  document.addEventListener('pointerdown', unlockOnFirstInteraction, {
    capture: true,
    once: true,
  });
  document.addEventListener('keydown', unlockOnFirstInteraction, {
    capture: true,
    once: true,
  });
  root.querySelectorAll<HTMLElement>('[data-front-go]').forEach((element) => {
    element.addEventListener('click', async () => {
      await audio.unlock();
      localStorage.setItem('adh-launched', '1');
      audio.nav();
      routePage(element.dataset.frontGo as FrontDoorPage);
    });
  });
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>('#enter')?.focus({ preventScroll: true }),
  );
}

function bindNav() {
  root.querySelectorAll<HTMLElement>('[data-go]').forEach((el) =>
    el.addEventListener('click', () => {
      void audio.unlock().then(() => audio.nav());
      const page = el.dataset.go;
      if (page === 'menu') menu();
      else if (page === 'modes') modeSelect();
      else if (page === 'guide') guide();
      else if (page === 'settings') settings();
      else if (page === 'stats') stats();
      else if (page === 'achievements') achievements();
      else if (page === 'credits') credits();
      else if (page === 'controller') controller();
      else if (page === 'legal') legal();
      else if (page === 'campaign') campaign();
    }),
  );
}
function splash() {
  const progress = playerProgress();
  const campaignAction = progress.campaignStarted ? 'CONTINUE CAMPAIGN' : 'START CAMPAIGN';
  const campaignRoute = progress.campaignStarted ? 'campaign-continue' : 'campaign';
  root.innerHTML = `<section class="front-door start-screen" aria-labelledby="start-title">
    ${wildlifeLayers()}
    <div class="front-panel pixel-frame">
      <div class="title-mountains" aria-hidden="true"></div>
      <h1 id="start-title"><span>ALASKA</span><strong>DUCK HUNT</strong></h1>
      <p class="front-subtitle">IDENTIFY THE FLOCK. HUNT THE FLYWAY.</p>
      <div class="front-actions">
        <button id="enter" class="primary large" data-front-go="${campaignRoute}" data-controller-action="confirm">${campaignAction}</button>
        <button class="secondary-action" data-front-go="modes">CHOOSE HUNT MODE</button>
        <div class="front-quick-actions">
          <button data-front-go="guide">${menuIcon('guide')} FIELD GUIDE</button>
          <button data-front-go="settings">${menuIcon('settings')} SETTINGS</button>
        </div>
      </div>
      <p class="input-prompt">PRESS ENTER / A <span>•</span> CLICK OR TAP</p>
    </div>
    ${progressStrip(progress)}
  </section>`;
  root.classList.toggle('reduce-motion', localStorage.getItem('adh-Reduced motion') === 'true');
  bindFrontDoor();
  audio.setMusic('menu');
}
function menu() {
  const progress = playerProgress();
  const campaignAction = progress.campaignStarted ? 'CONTINUE CAMPAIGN' : 'START CAMPAIGN';
  const campaignRoute = progress.campaignStarted ? 'campaign-continue' : 'campaign';
  root.innerHTML = `<section class="front-door main-menu-screen" aria-labelledby="menu-title">
    ${wildlifeLayers()}
    <div class="front-panel menu-panel pixel-frame">
      <h1 id="menu-title"><span>ALASKA</span><strong>DUCK HUNT</strong></h1>
      <p class="front-subtitle">KNOW THE SILHOUETTE. FOLLOW THE FLYWAY.</p>
      <button class="primary large" data-front-go="${campaignRoute}">${campaignAction}</button>
      <button class="secondary-action" data-front-go="modes">CHOOSE HUNT MODE</button>
    </div>
    <nav class="front-destinations" aria-label="Main menu">
      <button data-front-go="campaign">${menuIcon('campaign')}<span>CAMPAIGN<small>${progress.nextLocation.name}</small></span></button>
      <button data-front-go="modes">${menuIcon('modes')}<span>HUNT MODES<small>${modes.length} operations</small></span></button>
      <button data-front-go="guide">${menuIcon('guide')}<span>FIELD GUIDE<small>${species.length} species</small></span></button>
      <button data-front-go="stats">${menuIcon('records')}<span>RECORDS<small>${progress.hunts} hunts • best ${progress.bestScore.toLocaleString()}</small></span></button>
      <button data-front-go="settings">${menuIcon('settings')}<span>SETTINGS<small>Audio, display, input</small></span></button>
      <button data-front-go="controller">${menuIcon('controller')}<span>CONTROLLER LAB<small>Simulator ready</small></span></button>
    </nav>
    ${progressStrip(progress)}
  </section>`;
  root.classList.toggle('reduce-motion', localStorage.getItem('adh-Reduced motion') === 'true');
  bindFrontDoor();
  audio.setMusic('menu');
}
function modeSelect() {
  shell(
    `<section class="page mode-page"><div class="section-title"><p>SELECT OPERATION</p><h1>HUNT MODES</h1></div><div class="mode-list">${modePresentations
      .map((mode, index) => {
        const best = Number(localStorage.getItem(modeBestStorageKey(mode.id)) ?? 0);
        return `<button class="mode ${mode.id === selectedMode ? 'selected' : ''}" data-mode="${mode.id}" aria-pressed="${mode.id === selectedMode}"><span>0${index + 1}</span><div><b>${mode.name}</b><small>${mode.rulesSummary}</small><dl><div><dt>DURATION</dt><dd>${mode.duration}</dd></div><div><dt>OBJECTIVE</dt><dd>${mode.objectiveStyle}</dd></div><div><dt>BEST</dt><dd>${best.toLocaleString()}</dd></div></dl></div><i aria-hidden="true">→</i></button>`;
      })
      .join(
        '',
      )}</div><div class="mode-actions"><button data-go="menu">BACK</button><button class="primary" id="brief">CONTINUE WITH ${modePresentations.find(({ id }) => id === selectedMode)?.name.toUpperCase()}</button></div></section>`,
  );
  root.querySelectorAll<HTMLElement>('[data-mode]').forEach(
    (b) =>
      (b.onclick = () => {
        selectedMode = b.dataset.mode as GameMode;
        modeSelect();
      }),
  );
  document.querySelector('#brief')?.addEventListener('click', () => {
    if (selectedMode === 'campaign') campaign();
    else if (selectedMode === 'daily') {
      currentRoundConfig = createRoundConfig('daily', {}, new Date());
      briefing();
    } else modeSetup(selectedMode);
  });
  bindNav();
}

function modeSetup(mode: Exclude<GameMode, 'campaign' | 'daily'>) {
  const saved = modeOptions[mode] ?? {};
  const defaultConfig = createRoundConfig(mode, saved);
  const selectedLocation = saved.locationId ?? defaultConfig.locationId;
  const availableSpecies = speciesForLocation(selectedLocation);
  const selectedTargets = saved.targetSpeciesIds ?? defaultConfig.targetSpeciesIds;
  const isBuilder = mode === 'practice' || mode === 'custom';
  const chooseSpecies = ['species', 'identification', 'practice', 'custom'].includes(mode);
  const chooseDuration = ['time', 'practice', 'custom'].includes(mode);
  shell(
    `<section class="page mode-setup" data-mode-setup="${mode}"><div class="section-title"><p>CONFIGURE OPERATION</p><h1>${modePresentations.find(({ id }) => id === mode)?.name}</h1></div>
      <p class="setup-summary">${modePresentations.find(({ id }) => id === mode)?.rulesSummary}</p>
      <form id="mode-form">
        <label>LOCATION<select name="locationId">${locations.map((location) => `<option value="${location.id}" ${location.id === selectedLocation ? 'selected' : ''}>${location.name}</option>`).join('')}</select></label>
        ${
          chooseSpecies
            ? mode === 'custom'
              ? `<label class="wide">TARGET POOL<select name="targetSpeciesIds" multiple size="6">${availableSpecies.map((id) => `<option value="${id}" ${selectedTargets.includes(id) ? 'selected' : ''}>${speciesName(id)}</option>`).join('')}</select><small>Select one or more compatible species.</small></label>`
              : `<label>TARGET SPECIES<select name="targetSpeciesId">${availableSpecies.map((id) => `<option value="${id}" ${selectedTargets[0] === id ? 'selected' : ''}>${speciesName(id)}</option>`).join('')}</select></label>`
            : ''
        }
        ${
          chooseDuration
            ? `<label>DURATION<select name="durationSeconds">${[30, 45, 60, 90, 120, 180].map((value) => `<option value="${value}" ${value === (saved.durationSeconds ?? defaultConfig.durationSeconds) ? 'selected' : ''}>${value} seconds</option>`).join('')}</select></label>`
            : ''
        }
        ${
          mode === 'endless' || isBuilder
            ? `<label>DIFFICULTY<select name="difficulty">${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${value === (saved.difficulty ?? 2) ? 'selected' : ''}>${value} / 5</option>`).join('')}</select></label>`
            : ''
        }
        ${
          isBuilder
            ? `<label>WEATHER<select name="weather">${['clear', 'rain', 'snow', 'fog', 'wind'].map((value) => `<option value="${value}" ${value === (saved.weather ?? defaultConfig.weather) ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
              <label>BIRD SPEED<select name="speedMultiplier">${[0.75, 1, 1.25, 1.5].map((value) => `<option value="${value}" ${value === (saved.speedMultiplier ?? 1) ? 'selected' : ''}>${value}×</option>`).join('')}</select></label>
              <label>MAGAZINE SIZE<input name="magazineSize" type="number" min="1" max="20" value="${saved.magazineSize ?? defaultConfig.ammunition.magazineSize}"></label>
              <label>FLOCK CAP<input name="flockCap" type="number" min="1" max="30" value="${saved.flockCap ?? defaultConfig.flockCap}"></label>
              <label>RELOADS<select name="reloads">${[0, 1, 2, 3, 5].map((value) => `<option value="${value}" ${value === (saved.reloads ?? defaultConfig.ammunition.reloads) ? 'selected' : ''}>${value}</option>`).join('')}<option value="unlimited" ${saved.reloads === 'unlimited' || defaultConfig.ammunition.reloads === 'unlimited' ? 'selected' : ''}>Unlimited</option></select></label>
              <fieldset class="wide"><legend>ASSISTS & SAFETY</legend><label><input name="aimAssist" type="checkbox" ${saved.assists?.aimAssist ? 'checked' : ''}> Aim assist</label><label><input name="identificationLabels" type="checkbox" ${saved.assists?.identificationLabels ? 'checked' : ''}> Identification labels</label><label><input name="trajectoryGuide" type="checkbox" ${saved.assists?.trajectoryGuide ? 'checked' : ''}> Trajectory guide</label><label><input name="includeProtected" type="checkbox" ${saved.includeProtected ? 'checked' : ''}> Include protected lookalikes</label></fieldset>`
            : ''
        }
        <p id="config-error" class="config-error" role="alert"></p>
        <div class="mode-actions wide"><button type="button" id="setup-back">BACK TO MODES</button>${isBuilder ? '<button type="button" id="reset-defaults">RESET DEFAULTS</button>' : ''}<button class="primary" type="submit">REVIEW BRIEFING</button></div>
      </form>
    </section>`,
  );
  const form = document.querySelector<HTMLFormElement>('#mode-form')!;
  const readOptions = () => {
    const data = new FormData(form);
    const reloadValue = String(data.get('reloads') ?? defaultConfig.ammunition.reloads);
    const targetSpeciesIds =
      mode === 'custom'
        ? data.getAll('targetSpeciesIds').map(String)
        : chooseSpecies
          ? [String(data.get('targetSpeciesId'))]
          : undefined;
    return {
      locationId: String(data.get('locationId')),
      targetSpeciesIds,
      durationSeconds: data.has('durationSeconds')
        ? Number(data.get('durationSeconds'))
        : undefined,
      difficulty: data.has('difficulty') ? Number(data.get('difficulty')) : undefined,
      speedMultiplier: data.has('speedMultiplier')
        ? Number(data.get('speedMultiplier'))
        : undefined,
      weather: data.has('weather')
        ? (String(data.get('weather')) as RoundPlayerOptions['weather'])
        : undefined,
      magazineSize: data.has('magazineSize') ? Number(data.get('magazineSize')) : undefined,
      flockCap: data.has('flockCap') ? Number(data.get('flockCap')) : undefined,
      reloads: reloadValue === 'unlimited' ? 'unlimited' : Number(reloadValue),
      includeProtected: data.get('includeProtected') === 'on',
      assists: {
        aimAssist: data.get('aimAssist') === 'on',
        identificationLabels: data.get('identificationLabels') === 'on',
        trajectoryGuide: data.get('trajectoryGuide') === 'on',
      },
    } satisfies RoundPlayerOptions;
  };
  form.addEventListener('change', (event) => {
    modeOptions[mode] = readOptions();
    saveModeOptions();
    const changed = event.target as HTMLInputElement | HTMLSelectElement;
    if (changed.name === 'locationId' && chooseSpecies) modeSetup(mode);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      modeOptions[mode] = readOptions();
      saveModeOptions();
      currentRoundConfig = createRoundConfig(mode, modeOptions[mode]);
      briefing();
    } catch (error) {
      setText('config-error', error instanceof Error ? error.message : 'Invalid configuration.');
    }
  });
  document.querySelector('#setup-back')?.addEventListener('click', modeSelect);
  document.querySelector('#reset-defaults')?.addEventListener('click', () => {
    delete modeOptions[mode];
    saveModeOptions();
    modeSetup(mode);
  });
}
function campaign() {
  const currentLocationId = campaignCurrentLocation(saveData.campaign);
  shell(
    `<section class="page campaign"><div class="section-title"><p>CAMPAIGN • NORTHBOUND</p><h1>ALASKA FLYWAYS</h1></div><div class="map-grid">${locations
      .map((location, index) => {
        const id = location.id as CampaignLocationId;
        const unlocked = canPlayCampaignLocation(saveData.campaign, id);
        const completed = saveData.campaign.completedLocations.includes(id);
        const current = id === currentLocationId;
        const mission = campaignMission(campaignMissions, id);
        const best = saveData.campaign.bestResults[id];
        return `<button class="location ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''} ${current ? 'current' : ''}" data-location="${index}" data-location-id="${id}" ${unlocked ? '' : 'disabled aria-disabled="true"'}><span>${String(index + 1).padStart(2, '0')}</span><b>${location.name}</b><small>${location.region} • ${completed ? `COMPLETED • BEST ${best?.rating ?? 'C'}` : current ? 'CURRENT MISSION' : unlocked ? 'AVAILABLE' : 'LOCKED'}</small><em>${mission.objective}</em></button>`;
      })
      .join('')}</div><p class="hint">${saveData.campaign.campaignComplete ? 'Campaign complete. Every location remains available for replay.' : 'Complete each fictional arcade objective to unlock the next area.'}</p><p class="disclaimer">Campaign goals are fictional arcade challenges and do not represent real hunting regulations.</p></section>`,
  );
  root.querySelectorAll<HTMLElement>('[data-location]').forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.locationId;
        if (id && canPlayCampaignLocation(saveData.campaign, id))
          openCampaignLocation(id as CampaignLocationId);
      }),
  );
}

function openCampaignLocation(locationId: CampaignLocationId) {
  if (!canPlayCampaignLocation(saveData.campaign, locationId)) return;
  const index = CAMPAIGN_LOCATION_IDS.indexOf(locationId);
  sessionStorage.setItem('location', String(index));
  modeOptions.campaign = { locationId, roundIndex: index };
  saveModeOptions();
  currentRoundConfig = createRoundConfig('campaign', modeOptions.campaign);
  briefing();
}

function continueCampaign() {
  saveData = { ...saveData, campaign: startCampaign(saveData.campaign) };
  persistSave();
  const locationId = campaignCurrentLocation(saveData.campaign);
  if (locationId) openCampaignLocation(locationId);
  else campaign();
}
function briefing() {
  const config =
    currentRoundConfig ??
    createRoundConfig(selectedMode === 'campaign' ? 'campaign' : selectedMode, {
      roundIndex: Number(sessionStorage.getItem('location') ?? 0),
    });
  currentRoundConfig = config;
  if (import.meta.env.DEV) {
    if (debugRoundCompletionHandler)
      window.removeEventListener('adh-debug-complete-round', debugRoundCompletionHandler);
    debugRoundCompletionHandler = ((event: CustomEvent<RoundResultStats>) => {
      results({
        ...event.detail,
        passed: false,
        failures: [],
        endReason: 'objective',
        config,
      });
    }) as EventListener;
    window.addEventListener('adh-debug-complete-round', debugRoundCompletionHandler, {
      once: true,
    });
  }
  sessionStorage.setItem('adh-round-config', JSON.stringify(config));
  const l = locations.find(({ id }) => id === config.locationId) ?? locations[0]!;
  const target = species.find(({ id }) => id === config.targetSpeciesIds[0]) ?? species[0]!;
  const targetArt = birdSpriteBySpecies.get(target.id);
  const timeLabel = config.endless ? 'ENDLESS' : `${config.durationSeconds} seconds`;
  const reloadLabel =
    config.ammunition.reloads === 'unlimited'
      ? 'unlimited reloads'
      : `${config.ammunition.reloads} reloads`;
  const protectedNames = config.protectedLookalikes.speciesIds.map(speciesName);
  const nonTargetNames = config.spawnSpecies
    .filter(({ role }) => role === 'non-target')
    .map(({ speciesId }) => speciesName(speciesId));
  shell(
    `<section class="brief" data-round-mode="${config.mode}"><div><p>PRE-HUNT BRIEFING${config.challengeDate ? ` • UTC ${config.challengeDate}` : ''}</p><h1>${l.name}</h1><h2>${modePresentations.find(({ id }) => id === config.mode)?.name}</h2><p>${l.habitat}. ${config.weather.toUpperCase()} weather • ${Math.round(config.visibility * 100)}% visibility.</p><dl><div><dt>OBJECTIVE</dt><dd>${config.objective.description}</dd></div><div><dt>TARGETS</dt><dd>${config.targetSpeciesIds.map(speciesName).join(', ')}</dd></div><div><dt>TIME</dt><dd>${timeLabel}</dd></div><div><dt>AMMUNITION</dt><dd>${config.ammunition.magazineSize} shells • ${reloadLabel}</dd></div><div><dt>PENALTIES</dt><dd>Miss −${config.scoring.missPenalty} • Non-target −${config.scoring.nonTargetPenalty} • Protected −${config.scoring.protectedPenalty}</dd></div><div><dt>LOOKALIKES</dt><dd>${[...nonTargetNames, ...protectedNames].join(', ') || 'None included in this round'}</dd></div></dl><div class="mode-actions"><button id="brief-back">BACK</button><button class="primary large" id="start-hunt">START HUNT</button></div><p class="disclaimer">This game uses fictional scoring, ammunition, seasons, and limits. It does not represent real hunting rules.</p></div><aside><h3>TARGET PROFILE</h3>${targetArt ? `<div class="bird-card production-bird" role="img" aria-label="${target.common}" style="background-image:url('/${targetArt.previewPath}')"></div>` : ''}<b>${target.common.toUpperCase()}</b><p>${target.traits}</p><small>${target.flight}</small></aside></section>`,
  );
  document.querySelector('#start-hunt')?.addEventListener('click', startHunt);
  document.querySelector('#brief-back')?.addEventListener('click', () => {
    if (config.mode === 'campaign') campaign();
    else if (config.mode === 'daily') modeSelect();
    else modeSetup(config.mode);
  });
  audio.setMusic('briefing');
}
function startHunt() {
  if (currentRoundConfig?.mode === 'campaign') {
    saveData = { ...saveData, campaign: startCampaign(saveData.campaign) };
    persistSave();
  }
  browserInput?.disconnect();
  browserInput = undefined;
  game?.destroy(true);
  game = undefined;
  const storedConfig = sessionStorage.getItem('adh-round-config');
  const config =
    currentRoundConfig ??
    (storedConfig ? (JSON.parse(storedConfig) as RoundConfig) : createRoundConfig('classic'));
  currentRoundConfig = config;
  const locationIndex = locations.findIndex(({ id }) => id === config.locationId);
  const selectedLocation = locations[locationIndex] ?? locations[2]!;
  sessionStorage.setItem('location', String(Math.max(0, locationIndex)));
  void audio.unlock();
  audio.cleanupScene();
  const selectedSceneMap = sceneMapByLocation.get(selectedLocation.id);
  const selectedPropLayout = scenePropLayoutByLocation.get(selectedLocation.id);
  root.innerHTML = `<div id="game"></div><div id="aim-layer" aria-label="Hunt aiming surface with working Alaskan Husky companion" data-round-mode="${config.mode}" data-round-seed="${config.seed}" data-round-config='${JSON.stringify(config)}' data-shots="0" data-sprite-birds="0" data-scene-layers="4" data-dog-character="alaska-husky" data-dog-animation-state="idle" data-dog-layer="ground" data-location-id="${selectedLocation.id}" data-scene-background="assets/scenes/${selectedLocation.id}.png" data-scene-map-regions="${selectedSceneMap?.regions.length ?? 0}" data-scene-prop-count="${selectedPropLayout?.placements.length ?? 0}" data-scene-prop-invalid="0" data-dog-path-ids="${selectedSceneMap?.dogPatrolPaths.map(({ id }) => id).join(',') ?? ''}" data-scene-map-debug="${new URLSearchParams(location.search).get('debugSceneMap') === '1'}"></div><div class="hud"><div><small>SCORE</small><b id="score">000000</b><span id="combo">COMBO ×0</span></div><div class="objective"><b>${modePresentations.find(({ id }) => id === config.mode)?.name.toUpperCase()}</b><span>${config.targetSpeciesIds.map(speciesName).join(' • ')}</span><small>${config.objective.description}</small>${config.assists.identificationLabels ? '<em id="assist-label">IDENTIFICATION LABELS ON</em>' : ''}</div><div><small>${config.endless ? 'SURVIVAL' : 'TIME'}</small><b id="time">${config.endless ? 'WAVE 01' : formatTime(config.durationSeconds ?? 0)}</b><span id="mistakes">${config.endless ? '0 / 3 MISTAKES' : config.weather.toUpperCase()}</span></div></div><div class="ammo"><small>SHELLS</small><b id="ammo">${'●'.repeat(config.ammunition.magazineSize)}</b><span id="reloads">R RELOAD • ${config.ammunition.reloads === 'unlimited' ? '∞' : config.ammunition.reloads} LEFT</span></div><div id="notice" aria-live="polite"></div><div id="pause" class="overlay hidden"><h2>HUNT PAUSED</h2><button id="resume">RESUME</button><button id="quit">RETURN TO MENU</button></div>`;
  audio.setAmbience(selectedLocation.id);
  audio.setMusic('hunt');
  const scene = new HuntScene(config);
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#071521',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [scene],
    input: { mouse: { preventDefaultWheel: true } },
  });
  let huntPaused = false;
  const aimLayer = document.querySelector<HTMLElement>('#aim-layer');
  const handleInput = (event: InputEvent) => {
    if (!game || event.phase === 'released') return;
    if (event.action === 'aim') {
      const camera = scene.cameras.main;
      const displayX = event.x * scene.scale.gameSize.width;
      const displayY = event.y * scene.scale.gameSize.height;
      const world = camera.getWorldPoint(displayX, displayY);
      scene.aim(world.x, world.y);
    } else if (event.action === 'fire') {
      scene.fireAtAim();
    } else if (event.action === 'reload') {
      scene.reloadHunt();
    } else if (event.action === 'pause') {
      huntPaused = !huntPaused;
      document.querySelector('#pause')?.classList.toggle('hidden', !huntPaused);
      if (huntPaused) {
        scene.pauseHunt();
        void audio.pause();
      } else {
        scene.resumeHunt();
        void audio.resume();
      }
    } else if (event.action === 'fullscreen') {
      void scene.scale.toggleFullscreen();
    }
  };
  const connectBrowserInput = () => {
    if (!aimLayer || !game?.canvas || browserInput) return;
    game.canvas.tabIndex = 0;
    browserInput = new BrowserInputProvider(aimLayer, game.canvas);
    browserInput.connect(handleInput);
  };
  const waitForCanvas = () => {
    if (!game || browserInput) return;
    if (game.canvas && scene.sys?.isActive()) {
      connectBrowserInput();
      scene.events.on(
        'hud',
        (h: {
          score: number;
          ammo: number;
          magazineSize: number;
          reloads: number | 'unlimited';
          combo: number;
          time: number | null;
          elapsed: number;
          mistakes: number;
          shots?: number;
        }) => {
          setText('score', String(h.score).padStart(6, '0'));
          setText('ammo', '●'.repeat(h.ammo) + '○'.repeat(h.magazineSize - h.ammo));
          setText('combo', `COMBO ×${h.combo}`);
          setText(
            'time',
            h.time === null
              ? `WAVE ${String(Math.floor(h.elapsed / 30) + 1).padStart(2, '0')}`
              : formatTime(Math.max(0, h.time)),
          );
          setText('reloads', `R RELOAD • ${h.reloads === 'unlimited' ? '∞' : h.reloads} LEFT`);
          setText(
            'mistakes',
            config.endless
              ? `${h.mistakes} / ${config.passRequirements.maxMistakes ?? 3} MISTAKES`
              : config.weather.toUpperCase(),
          );
          aimLayer?.setAttribute('data-shots', String(h.shots ?? 0));
        },
      );
      scene.events.on(
        'spawn-pressure',
        ({ wave, speedMultiplier }: { wave: number; speedMultiplier: number }) => {
          aimLayer?.setAttribute('data-round-wave', String(wave));
          aimLayer?.setAttribute('data-round-speed-multiplier', speedMultiplier.toFixed(2));
        },
      );
      scene.events.on('aim', ({ x, y }: { x: number; y: number }) => {
        aimLayer?.setAttribute('data-aim-x', x.toFixed(2));
        aimLayer?.setAttribute('data-aim-y', y.toFixed(2));
      });
      scene.events.on('bird-individual-plans', (plans: object[]) => {
        if (aimLayer) aimLayer.dataset.birdIndividualPlans = JSON.stringify(plans);
      });
      scene.events.on('bird-animation-telemetry', (animations: object[]) => {
        if (aimLayer) aimLayer.dataset.birdAnimationTelemetry = JSON.stringify(animations);
      });
      scene.events.on(
        'bird-spawned',
        ({
          speciesId,
          illustrated,
          lane,
          initialState,
          surface,
          contactType,
          spawnZone,
          sceneRegionId,
          sceneDepth,
          worldX,
          worldY,
          biologicalVariant,
          individualVisualSeed,
          individualVisualVariant,
          scaleMultiplier,
          animationPhase,
          animationRateMultiplier,
          posePreference,
          speedOffset,
          reactionOffsetMs,
          formationOffsetX,
          formationOffsetY,
        }: {
          speciesId: string;
          illustrated: boolean;
          lane: string;
          initialState: string;
          surface: string;
          contactType: string;
          spawnZone: string;
          sceneRegionId: string;
          sceneDepth: number;
          worldX: number;
          worldY: number;
          biologicalVariant: string;
          individualVisualSeed: number;
          individualVisualVariant: string;
          scaleMultiplier: number;
          animationPhase: number;
          animationRateMultiplier: number;
          posePreference: string;
          speedOffset: number;
          reactionOffsetMs: number;
          formationOffsetX: number;
          formationOffsetY: number;
        }) => {
          aimLayer?.setAttribute('data-last-bird', speciesId);
          aimLayer?.setAttribute('data-bird-lane', lane);
          aimLayer?.setAttribute('data-bird-initial-state', initialState);
          aimLayer?.setAttribute('data-bird-surface', surface);
          aimLayer?.setAttribute('data-bird-contact-type', contactType);
          aimLayer?.setAttribute('data-bird-spawn-zone', spawnZone);
          aimLayer?.setAttribute('data-scene-region-id', sceneRegionId);
          aimLayer?.setAttribute('data-scene-depth', sceneDepth.toFixed(3));
          aimLayer?.setAttribute('data-scene-world-x', worldX.toFixed(2));
          aimLayer?.setAttribute('data-scene-world-y', worldY.toFixed(2));
          if (illustrated && aimLayer) {
            const count = Number(aimLayer.dataset.spriteBirds ?? 0) + 1;
            aimLayer.dataset.spriteBirds = String(count);
            aimLayer.dataset.lastIllustratedBird = speciesId;
            const roster = JSON.parse(aimLayer.dataset.birdIndividualPlans ?? '[]') as object[];
            roster.push({
              speciesId,
              biologicalVariant,
              individualVisualSeed,
              individualVisualVariant,
              scaleMultiplier,
              animationPhase,
              animationRateMultiplier,
              posePreference,
              speedOffset,
              reactionOffsetMs,
              formationOffsetX,
              formationOffsetY,
            });
            aimLayer.dataset.birdIndividualPlans = JSON.stringify(roster.slice(-24));
          }
        },
      );
      scene.events.on(
        'bird-surface-contact',
        ({
          speciesId,
          state,
          surface,
          contactType,
          sceneRegionId,
          sceneDepth,
          worldX,
          worldY,
          renderedContactX,
          renderedContactY,
          contactError,
        }: {
          speciesId: string;
          state: string;
          surface: string;
          contactType: string;
          sceneRegionId: string;
          sceneDepth: number;
          worldX: number;
          worldY: number;
          renderedContactX: number;
          renderedContactY: number;
          contactError: number;
        }) => {
          aimLayer?.setAttribute('data-contact-species', speciesId);
          aimLayer?.setAttribute('data-contact-state', state);
          if (aimLayer) {
            const signature = `${speciesId}:${surface}:${state}`;
            const history = aimLayer.dataset.contactStateHistory ?? '';
            if (!history.endsWith(`>${signature}`))
              aimLayer.dataset.contactStateHistory = `${history}>${signature}`.slice(-1_500);
          }
          aimLayer?.setAttribute('data-bird-surface', surface);
          aimLayer?.setAttribute('data-bird-contact-type', contactType);
          aimLayer?.setAttribute('data-scene-region-id', sceneRegionId);
          aimLayer?.setAttribute('data-scene-depth', sceneDepth.toFixed(3));
          aimLayer?.setAttribute('data-scene-world-x', worldX.toFixed(2));
          aimLayer?.setAttribute('data-scene-world-y', worldY.toFixed(2));
          aimLayer?.setAttribute('data-contact-world-x', renderedContactX.toFixed(2));
          aimLayer?.setAttribute('data-contact-world-y', renderedContactY.toFixed(2));
          aimLayer?.setAttribute('data-contact-error', contactError.toFixed(3));
        },
      );
      scene.events.on(
        'scene-prop-position',
        ({
          id,
          worldX,
          worldY,
          depth,
        }: {
          id: string;
          worldX: number;
          worldY: number;
          depth: number;
        }) => {
          aimLayer?.setAttribute('data-scene-prop-id', id);
          aimLayer?.setAttribute('data-scene-prop-world-x', worldX.toFixed(2));
          aimLayer?.setAttribute('data-scene-prop-world-y', worldY.toFixed(2));
          aimLayer?.setAttribute('data-scene-prop-depth', depth.toFixed(2));
        },
      );
      scene.events.on(
        'scene-props-ready',
        ({ count, invalidCount }: { count: number; invalidCount: number }) => {
          aimLayer?.setAttribute('data-scene-prop-count', String(count));
          aimLayer?.setAttribute('data-scene-prop-invalid', String(invalidCount));
        },
      );
      scene.events.on(
        'bird-prop-depth',
        ({
          propId,
          depth,
          occlusion,
          relation,
        }: {
          propId?: string;
          depth: number;
          occlusion: number;
          relation: string;
        }) => {
          aimLayer?.setAttribute('data-bird-prop-id', propId ?? 'none');
          aimLayer?.setAttribute('data-bird-display-depth', depth.toFixed(2));
          aimLayer?.setAttribute('data-bird-prop-occlusion', occlusion.toFixed(2));
          aimLayer?.setAttribute('data-bird-prop-relation', relation);
        },
      );
      scene.events.on(
        'scene-map-selected',
        ({
          sceneRegionId,
          surface,
          sceneDepth,
          worldX,
          worldY,
        }: {
          sceneRegionId: string;
          surface: string;
          sceneDepth: number;
          worldX: number;
          worldY: number;
        }) => {
          aimLayer?.setAttribute('data-scene-region-id', sceneRegionId);
          aimLayer?.setAttribute('data-bird-surface', surface);
          aimLayer?.setAttribute('data-scene-depth', sceneDepth.toFixed(3));
          aimLayer?.setAttribute('data-scene-world-x', worldX.toFixed(2));
          aimLayer?.setAttribute('data-scene-world-y', worldY.toFixed(2));
        },
      );
      scene.events.on(
        'scene-map-ready',
        ({ regionCount, dogPathIds }: { regionCount: number; dogPathIds: string[] }) => {
          aimLayer?.setAttribute('data-scene-map-regions', String(regionCount));
          aimLayer?.setAttribute('data-dog-path-ids', dogPathIds.join(','));
        },
      );
      scene.events.on(
        'dog-map-position',
        ({
          characterId,
          animationState,
          frame,
          facing,
          flipX,
          reducedMotion,
          animationPhase,
          animationRateMultiplier,
          pathId,
          worldX,
          worldY,
          renderedContactY,
          contactError,
          scale,
          depth,
          propId,
          relation,
          mapDepth,
          occlusion,
        }: {
          characterId: string;
          animationState: string;
          frame: string | number;
          facing: string;
          flipX: boolean;
          reducedMotion: boolean;
          animationPhase: number;
          animationRateMultiplier: number;
          pathId: string;
          worldX: number;
          worldY: number;
          renderedContactY: number;
          contactError: number;
          scale: number;
          depth: number;
          propId?: string;
          relation: string;
          mapDepth: number;
          occlusion: number;
        }) => {
          aimLayer?.setAttribute('data-dog-character', characterId);
          aimLayer?.setAttribute('data-dog-animation-state', animationState);
          aimLayer?.setAttribute('data-dog-frame', String(frame));
          aimLayer?.setAttribute('data-dog-facing', facing);
          aimLayer?.setAttribute('data-dog-flip-x', String(flipX));
          aimLayer?.setAttribute('data-dog-reduced-motion', String(reducedMotion));
          aimLayer?.setAttribute('data-dog-animation-phase', animationPhase.toFixed(6));
          aimLayer?.setAttribute('data-dog-animation-rate', animationRateMultiplier.toFixed(6));
          aimLayer?.setAttribute('data-dog-path-id', pathId);
          aimLayer?.setAttribute('data-dog-world-x', worldX.toFixed(2));
          aimLayer?.setAttribute('data-dog-world-y', worldY.toFixed(2));
          aimLayer?.setAttribute('data-dog-contact-world-y', renderedContactY.toFixed(2));
          aimLayer?.setAttribute('data-dog-contact-error', contactError.toFixed(3));
          aimLayer?.setAttribute('data-dog-scale', scale.toFixed(3));
          aimLayer?.setAttribute('data-dog-display-depth', depth.toFixed(2));
          aimLayer?.setAttribute('data-dog-prop-id', propId ?? 'none');
          aimLayer?.setAttribute('data-dog-prop-relation', relation);
          audio.setDogPosition({
            worldX,
            worldWidth: scene.scale.width,
            mapDepth,
            occlusion,
            rear: relation === 'behind',
          });
        },
      );
      const birdSpatial = (event: {
        worldX: number;
        mapDepth: number;
        occlusion?: number;
        rear?: boolean;
      }): SpatialAudioInput => ({
        worldX: event.worldX,
        worldWidth: scene.scale.width,
        mapDepth: event.mapDepth,
        occlusion: event.occlusion,
        rear: event.rear,
      });
      scene.events.on('weapon-fired', () => audio.route({ type: 'weapon-fired' }));
      scene.events.on('weapon-empty', () => audio.route({ type: 'weapon-empty' }));
      scene.events.on('weapon-reloaded', () => audio.route({ type: 'weapon-reloaded' }));
      scene.events.on(
        'score-result',
        ({
          result,
          x,
          depth,
          occlusion,
        }: {
          result: 'hit' | 'miss' | 'protected';
          x: number;
          depth: number;
          occlusion: number;
        }) => {
          audio.route(
            { type: 'score-result', result },
            { worldX: x, worldWidth: scene.scale.width, mapDepth: depth, occlusion },
          );
          if (result === 'hit') {
            const speciesId = aimLayer?.dataset.targetSpecies;
            if (speciesId) {
              const logged = new Set(
                JSON.parse(localStorage.getItem('adh-species-logged') ?? '[]') as string[],
              );
              logged.add(speciesId);
              localStorage.setItem('adh-species-logged', JSON.stringify([...logged]));
            }
          }
        },
      );
      scene.events.on(
        'bird-call',
        (event: {
          speciesId: string;
          family: BirdFamily;
          worldX: number;
          mapDepth: number;
          occlusion: number;
          rear: boolean;
        }) =>
          audio.route(
            { type: 'bird-call', speciesId: event.speciesId, family: event.family },
            birdSpatial(event),
          ),
      );
      scene.events.on(
        'bird-flush',
        (event: {
          speciesId: string;
          family: BirdFamily;
          surface: BirdSurface;
          worldX: number;
          mapDepth: number;
          occlusion: number;
          rear: boolean;
        }) =>
          audio.route(
            {
              type: 'bird-flush',
              speciesId: event.speciesId,
              family: event.family,
              surface: event.surface,
            },
            birdSpatial(event),
          ),
      );
      scene.events.on(
        'bird-takeoff',
        (event: {
          family: BirdFamily;
          surface: BirdSurface;
          worldX: number;
          mapDepth: number;
          occlusion: number;
          rear: boolean;
        }) =>
          audio.route(
            { type: 'bird-takeoff', family: event.family, surface: event.surface },
            birdSpatial(event),
          ),
      );
      scene.events.on(
        'bird-land',
        (event: {
          surface: BirdSurface;
          worldX: number;
          mapDepth: number;
          occlusion: number;
          rear: boolean;
        }) => audio.route({ type: 'bird-land', surface: event.surface }, birdSpatial(event)),
      );
      scene.events.on(
        'dog-vocalization',
        ({
          vocalization,
        }: {
          vocalization: 'sniff' | 'bark' | 'pant' | 'movement' | 'celebrate';
        }) => audio.route({ type: 'dog-vocalization', vocalization }),
      );
      scene.events.on(
        'environment-one-shot',
        ({
          sound,
          ...position
        }: {
          sound: 'rain' | 'water' | 'vegetation';
          worldX: number;
          mapDepth: number;
          occlusion?: number;
        }) => audio.route({ type: 'environment-one-shot', sound }, birdSpatial(position)),
      );
      scene.events.on('hunt-phase', ({ phase }: { phase: 'active' | 'final' }) =>
        audio.setMusic(phase === 'final' ? 'final' : 'hunt'),
      );
      scene.events.on(
        'bird-state',
        ({
          speciesId,
          from,
          to,
          surface,
        }: {
          speciesId: string;
          from: string | null;
          to: string;
          surface: string;
        }) => {
          aimLayer?.setAttribute('data-bird-state', to);
          aimLayer?.setAttribute('data-bird-state-species', speciesId);
          aimLayer?.setAttribute('data-bird-surface', surface);
          if (from) aimLayer?.setAttribute('data-bird-state-from', from);
          if (aimLayer) {
            const history = `${aimLayer.dataset.birdStateHistory ?? ''}>${speciesId}:${to}`;
            aimLayer.dataset.birdStateHistory = history.slice(-1_500);
          }
        },
      );
      scene.events.on('dog-flush', ({ speciesId }: { speciesId: string }) => {
        aimLayer?.setAttribute('data-dog-flush', speciesId);
        aimLayer?.setAttribute('data-dog-layer', 'front');
        window.setTimeout(() => aimLayer?.setAttribute('data-dog-layer', 'ground'), 560);
      });
      scene.events.on(
        'bird-target',
        ({
          speciesId,
          state,
          x,
          y,
          protected: protectedBird,
        }: {
          speciesId: string;
          state: string;
          x: number;
          y: number;
          protected: boolean;
        }) => {
          aimLayer?.setAttribute('data-target-species', speciesId);
          aimLayer?.setAttribute('data-target-state', state);
          aimLayer?.setAttribute('data-target-x', x.toFixed(2));
          aimLayer?.setAttribute('data-target-y', y.toFixed(2));
          aimLayer?.setAttribute('data-target-protected', String(protectedBird));
          if (config.assists.identificationLabels)
            setText(
              'assist-label',
              `${speciesName(speciesId).toUpperCase()} • ${protectedBird ? 'PROTECTED' : config.targetSpeciesIds.includes(speciesId) ? 'TARGET' : 'NON-TARGET'}`,
            );
        },
      );
      scene.events.on(
        'scene-art-ready',
        ({
          locationId,
          background,
          layers,
        }: {
          locationId: string;
          background: string;
          layers: number;
        }) => {
          aimLayer?.setAttribute('data-location-id', locationId);
          aimLayer?.setAttribute('data-scene-background', background);
          aimLayer?.setAttribute('data-scene-layers', String(layers));
        },
      );
      scene.events.on('dog-layer', (layer: string) =>
        aimLayer?.setAttribute('data-dog-layer', layer),
      );
      scene.events.on('notice', (n: string) => {
        const el = document.querySelector('#notice');
        if (el) {
          el.textContent = n;
          el.classList.add('show');
          setTimeout(() => el.classList.remove('show'), 700);
        }
      });
      scene.events.on('pause', (p: boolean) =>
        document.querySelector('#pause')?.classList.toggle('hidden', !p),
      );
      scene.events.on(
        'complete',
        (
          r: RoundResultStats & {
            passed: boolean;
            failures: readonly string[];
            endReason: string;
            config: RoundConfig;
          },
        ) => results(r),
      );
    } else requestAnimationFrame(waitForCanvas);
  };
  waitForCanvas();
  document.querySelector('#resume')?.addEventListener('click', () => {
    huntPaused = false;
    const pauseOverlay = document.querySelector<HTMLElement>('#pause');
    if (pauseOverlay) {
      pauseOverlay.classList.add('hidden');
    }
    scene.resumeHunt();
    void audio.resume();
    game?.canvas.focus({ preventScroll: true });
  });
  document.querySelector('#quit')?.addEventListener('click', () => {
    browserInput?.disconnect();
    browserInput = undefined;
    game?.destroy(true);
    game = undefined;
    audio.cleanupScene();
    menu();
  });
}
function setText(id: string, v: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function results(
  r: RoundResultStats & {
    passed: boolean;
    failures: readonly string[];
    endReason: string;
    config: RoundConfig;
  },
) {
  if (debugRoundCompletionHandler) {
    window.removeEventListener('adh-debug-complete-round', debugRoundCompletionHandler);
    debugRoundCompletionHandler = undefined;
  }
  browserInput?.disconnect();
  browserInput = undefined;
  game?.destroy(true);
  game = undefined;
  audio.cleanupScene();
  audio.success();
  currentRoundConfig = r.config;
  const campaignResult =
    r.config.mode === 'campaign'
      ? applyCampaignResult(campaignMissions, saveData.campaign, r.config.locationId, r)
      : undefined;
  if (campaignResult) saveData = { ...saveData, campaign: campaignResult.progress };
  saveData = {
    ...saveData,
    records: {
      ...saveData.records,
      highScores: {
        ...saveData.records.highScores,
        [r.config.mode]: Math.max(r.score, saveData.records.highScores[r.config.mode] ?? 0),
      },
    },
    stats: {
      ...saveData.stats,
      shots: saveData.stats.shots + r.shots,
      validHits: saveData.stats.validHits + r.hits,
      misses: saveData.stats.misses + r.misses,
      huntsCompleted: saveData.stats.huntsCompleted + 1,
      bestAccuracy: Math.max(saveData.stats.bestAccuracy, r.accuracy),
    },
  };
  persistSave();
  localStorage.setItem(
    modeBestStorageKey(r.config.mode),
    String(Math.max(r.score, Number(localStorage.getItem(modeBestStorageKey(r.config.mode)) ?? 0))),
  );
  if (r.config.mode === 'daily' && r.config.challengeDate)
    localStorage.setItem(
      `adh-daily-result-${r.config.challengeDate}`,
      JSON.stringify({
        score: r.score,
        accuracy: r.accuracy,
        identificationAccuracy: r.identificationAccuracy,
        passed: r.passed,
        seed: r.config.seed,
      }),
    );
  const effectivePassed = campaignResult?.evaluation.passed ?? r.passed;
  const effectiveFailures = campaignResult?.evaluation.failures ?? r.failures;
  const nextCampaignLocation =
    r.config.mode === 'campaign' && effectivePassed
      ? campaignNextLocation(
          saveData.campaign,
          r.config.locationId as CampaignLocationId,
        )
      : undefined;
  const newlyUnlocked = campaignResult?.newlyUnlockedLocation
    ? locations.find(({ id }) => id === campaignResult.newlyUnlockedLocation)
    : undefined;
  const modeName = modePresentations.find(({ id }) => id === r.config.mode)?.name ?? r.config.mode;
  const resultLabel = effectivePassed
    ? r.config.mode === 'practice'
      ? 'TRAINING COMPLETE'
      : 'OBJECTIVE COMPLETE'
    : 'OBJECTIVE NOT MET';
  shell(
    `<section class="results mode-results" data-result-mode="${r.config.mode}" data-result-passed="${effectivePassed}"><p>${modeName.toUpperCase()} • ${resultLabel}</p><h1>${saveData.campaign.campaignComplete && r.config.mode === 'campaign' && effectivePassed ? 'CAMPAIGN COMPLETE' : effectivePassed ? 'ROUND CLEARED' : 'KEEP TRACKING'}</h1>${newlyUnlocked ? `<p class="campaign-unlock">NEW AREA UNLOCKED: <b>${newlyUnlocked.name}</b></p>` : ''}<div class="score-result">${r.score.toLocaleString()}</div><div class="result-grid"><div><b>${r.hits}</b><span>VALID HITS</span></div><div><b>${r.accuracy}%</b><span>SHOT ACCURACY</span></div><div><b>${r.identificationAccuracy}%</b><span>IDENTIFICATION</span></div><div><b>${formatTime(r.elapsedSeconds)}</b><span>ELAPSED</span></div><div><b>${r.misses}</b><span>MISSES</span></div><div><b>${r.nonTargetHits}</b><span>NON-TARGET</span></div><div><b>${r.protectedHits}</b><span>PROTECTED</span></div><div><b>${campaignResult?.evaluation.rating ?? r.endReason.toUpperCase()}</b><span>${campaignResult ? 'MISSION RATING' : 'ROUND END'}</span></div></div>${effectiveFailures.length ? `<p class="result-requirements">Objective missed: ${effectiveFailures.join(' • ')}</p>` : ''}<div class="mode-actions"><button class="primary" id="retry">${['practice', 'custom'].includes(r.config.mode) ? 'RESTART SAME SETTINGS' : 'RETRY SAME ROUND'}</button>${r.config.mode === 'classic' ? '<button id="next-round">NEXT CLASSIC ROUND</button>' : ''}${nextCampaignLocation ? '<button id="campaign-next">NEXT AREA</button>' : ''}${r.config.mode === 'campaign' ? '<button id="campaign-map">CAMPAIGN MAP</button>' : ''}${r.config.mode === 'campaign' && saveData.campaign.campaignComplete ? '<button data-go="stats">RECORDS</button>' : ''}${!['campaign', 'daily'].includes(r.config.mode) ? '<button id="change-settings">CHANGE SETTINGS</button>' : ''}<button data-go="menu">MAIN MENU</button></div></section>`,
  );
  bindNav();
  document.querySelector('#retry')?.addEventListener('click', startHunt);
  document
    .querySelector('#change-settings')
    ?.addEventListener('click', () =>
      modeSetup(r.config.mode as Exclude<GameMode, 'campaign' | 'daily'>),
    );
  document.querySelector('#next-round')?.addEventListener('click', () => {
    const nextOptions = {
      ...r.config.playerOptions,
      roundIndex: (r.config.playerOptions.roundIndex ?? 0) + 1,
    };
    modeOptions.classic = nextOptions;
    saveModeOptions();
    currentRoundConfig = createRoundConfig('classic', nextOptions);
    briefing();
  });
  document.querySelector('#campaign-next')?.addEventListener('click', () => {
    if (nextCampaignLocation) openCampaignLocation(nextCampaignLocation);
  });
  document.querySelector('#campaign-map')?.addEventListener('click', campaign);
}
function guide() {
  shell(
    `<section class="page"><div class="section-title"><p>IDENTIFY BEFORE YOU ACT</p><h1>FIELD GUIDE</h1></div><p class="disclaimer">${LEGAL_DISCLAIMER}</p><div class="guide-grid">${species
      .map((s) => {
        const behavior = birdBehaviorBySpecies.get(s.id);
        if (!behavior) throw new Error(`Missing behavior notes for ${s.id}.`);
        const notes = behavior.fieldNotes;
        return `<article>${fieldGuideBird(s.id, s.common, s.target)}<p>${s.category.toUpperCase()}</p><h2>${s.common}</h2><i>${s.scientific}</i><p>${s.traits}</p><details><summary>FIELD NOTES</summary><p><b>Starts:</b> ${notes.start}<br><b>Feeds:</b> ${notes.feeding}<br><b>Flush:</b> ${notes.flush}<br><b>Flight:</b> ${notes.flight}<br><b>Grouping:</b> ${notes.grouping}<br><b>Special:</b> ${notes.special}<br><b>Range:</b> ${s.distribution}<br><b>Status:</b> ${s.status}<br><b>Similar:</b> ${s.similar.join(', ') || 'None listed'}<br><b>Protected lookalikes:</b> ${s.lookalikes.join(', ') || 'Consult current guide'}<br><b>Source:</b> ${s.source}<br><b>Verified:</b> ${s.lastVerified ?? '2026-07-20'}</p></details></article>`;
      })
      .join('')}</div></section>`,
  );
}
function fieldGuideBird(id: string, common: string, target: boolean) {
  const art = birdSpriteBySpecies.get(id);
  if (!art) throw new Error(`Missing bird atlas manifest for ${id}.`);
  return `<div class="guide-bird has-sprite ${target ? '' : 'protected'}" role="img" aria-label="Animated ${common} behavior preview" style="background-image:url('${art.previewPath}')"></div>`;
}
function settings() {
  const audioSettings = ['Master volume', 'Music', 'Effects', 'Ambience', 'Birds', 'Dog', 'UI'];
  shell(
    `<section class="page settings"><div class="section-title"><p>PLAYER CONFIGURATION</p><h1>SETTINGS</h1></div>${[...audioSettings, 'Aim sensitivity', 'Reticle size', 'Text scale'].map((x) => `<label>${x}<input type="range" min="0" max="100" value="${audioSettingBus[x] ? 65 : 50}" data-setting="${x}"></label>`).join('')}<div class="toggles">${['Aim assist', 'High-contrast reticle', 'Reduced motion', 'Reduced flashing', 'Reduced ambience', 'Screen shake', 'CRT scanlines', 'Mute', ...Object.keys(audioMuteBus)].map((x) => `<label><input type="checkbox" data-setting="${x}">${x}</label>`).join('')}</div><h2>CONTROLS</h2><p>Mouse / touch aim • Left click / Space fire • WASD / arrows reticle • R reload • Esc pause • F fullscreen • M mute • Tab focus</p><button id="export">EXPORT SAVE</button><button id="reset">RESET LOCAL DATA</button></section>`,
  );
  root.querySelectorAll<HTMLInputElement>('[data-setting]').forEach((i) => {
    const key = `adh-${i.dataset.setting}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      if (i.type === 'checkbox') i.checked = saved === 'true';
      else i.value = saved;
    }
    i.oninput = () => {
      localStorage.setItem(key, i.type === 'checkbox' ? String(i.checked) : i.value);
      if (i.dataset.setting === 'Reduced motion') root.classList.toggle('reduce-motion', i.checked);
      const bus = audioSettingBus[i.dataset.setting ?? ''];
      if (bus) {
        const reduced =
          bus === 'ambience' && localStorage.getItem('adh-Reduced ambience') === 'true';
        audio.setBusGain(bus, (Number(i.value) / 100) * (reduced ? 0.45 : 1));
      }
      if (i.dataset.setting === 'Reduced ambience') applyStoredAudioSettings();
      if (i.dataset.setting === 'Mute') audio.muted = i.checked;
      const mutedBus = audioMuteBus[i.dataset.setting ?? ''];
      if (mutedBus) audio.setBusMuted(mutedBus, i.checked);
    };
  });
  document.querySelector('#export')?.addEventListener('click', () => {
    const blob = new Blob([serializeSave(saveData)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alaska-duck-hunt-save.json';
    a.click();
  });
  document.querySelector('#reset')?.addEventListener('click', () => {
    if (
      confirm(
        'Reset the campaign, records, settings, and all other local game data? This cannot be undone.',
      )
    ) {
      localStorage.clear();
      sessionStorage.clear();
      saveData = createDefaultSave();
      persistSave();
      splash();
    }
  });
}
function stats() {
  const progress = playerProgress();
  shell(
    `<section class="results"><p>LOCAL PROFILE</p><h1>PLAYER RECORDS</h1><div class="result-grid"><div><b>${progress.bestScore.toLocaleString()}</b><span>BEST SCORE</span></div><div><b>${progress.bestAccuracy}%</b><span>BEST ACCURACY</span></div><div><b>${progress.totalHits}</b><span>VALID HITS</span></div><div><b>${progress.hunts}</b><span>HUNTS COMPLETE</span></div></div><p>${progress.loggedSpecies} of ${species.length} species identified • next stop: ${progress.nextLocation.name}</p><button data-go="menu">BACK</button></section>`,
  );
  bindNav();
}
function achievements() {
  shell(
    `<section class="page"><div class="section-title"><p>12 ORIGINAL CHALLENGES</p><h1>ACHIEVEMENTS</h1></div><div class="mode-list">${['First Flight', 'Clean Sweep', 'Delta Master', 'Storm Chaser', 'Sharp Eye', 'Migration Legend'].map((x, i) => `<div class="mode"><span>✦</span><div><b>${x}</b><small>${i ? 'Locked — complete campaign objectives' : 'Complete your first valid hit'}</small></div></div>`).join('')}</div></section>`,
  );
}
function controller() {
  shell(
    `<section class="page"><div class="section-title"><p>DEVELOPER SIMULATOR</p><h1>CONTROLLER LAB</h1></div><p>Test the abstract input pathway for future ESP32 BLE and Web Serial hardware. No controller is required.</p><div class="controller-pad"><button id="calibrate">CALIBRATE</button><button id="trigger">SIMULATE TRIGGER</button><button id="reload-control">SIMULATE RELOAD</button><output id="controller-output">Controller disconnected • Simulator ready</output></div><p>Protocol details: <a href="https://github.com/epi13/Alaska-Duck-Hunt/blob/main/docs/esp32-controller-protocol.md">ESP32 controller documentation</a>.</p></section>`,
  );
  ['calibrate', 'trigger', 'reload-control'].forEach((id) =>
    document
      .querySelector(`#${id}`)
      ?.addEventListener('click', () =>
        setText(
          'controller-output',
          `${id.replace('-', ' ').toUpperCase()} event • ${performance.now().toFixed(0)}ms`,
        ),
      ),
  );
}
function legal() {
  shell(
    `<section class="page"><div class="section-title"><p>PLAY RESPONSIBLY</p><h1>LEGAL & REGULATORY NOTICE</h1></div><p class="disclaimer">${LEGAL_DISCLAIMER}</p><p>All round limits, scoring, objectives, ammunition and seasons depicted in the game are fictional. Protected-bird scenarios are identification exercises, not a complete statement of law.</p></section>`,
  );
}
function credits() {
  shell(
    `<section class="page"><div class="section-title"><p>MADE IN ALASKA</p><h1>CREDITS</h1></div><p>Original game design, code-native pixel art, procedural audio and writing created for Alaska Duck Hunt. The original Alaskan Husky field companion was developed from a research brief informed by public National Park Service material about Denali working sled dogs.</p><p>Regulatory context references Alaska Department of Fish and Game and U.S. Fish & Wildlife Service public information. MIT licensed code and original generated assets. No Nintendo assets or proprietary character art are included.</p></section>`,
  );
}
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    audio.muted = !audio.muted;
    localStorage.setItem('adh-Mute', String(audio.muted));
  }
  const primary = document.querySelector<HTMLElement>('.front-door #enter');
  const target = e.target as HTMLElement | null;
  const interactive = target?.closest('button, a, input, select, textarea');
  if ((e.key === 'Enter' || e.key === ' ') && primary && !interactive) {
    e.preventDefault();
    primary.click();
  }
});
splash();

function applyStoredAudioSettings() {
  for (const [setting, bus] of Object.entries(audioSettingBus)) {
    const fallback = bus === 'master' ? 65 : bus === 'music' ? 55 : 65;
    const stored = Number(localStorage.getItem(`adh-${setting}`) ?? fallback);
    const reduced = bus === 'ambience' && localStorage.getItem('adh-Reduced ambience') === 'true';
    audio.setBusGain(bus, (stored / 100) * (reduced ? 0.45 : 1));
  }
  audio.muted = localStorage.getItem('adh-Mute') === 'true';
  for (const [setting, bus] of Object.entries(audioMuteBus)) {
    audio.setBusMuted(bus, localStorage.getItem(`adh-${setting}`) === 'true');
  }
}

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    );
  if ('caches' in window) {
    void caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => /workbox|precache|alaska|adh/i.test(key))
            .map((key) => caches.delete(key)),
        ),
      );
  }
}
