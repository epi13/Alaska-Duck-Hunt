import Phaser from 'phaser';
import { HuntScene } from './game/HuntScene';
import { LEGAL_DISCLAIMER, locations, modes, species, type GameMode } from './data/content';
import { birdSpriteBySpecies } from './data/bird-sprites';
import { AudioManager } from './services/audio';
import { BrowserInputProvider, type InputEvent } from './core/input';
import './styles/main.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
const audio = new AudioManager();
let game: Phaser.Game | undefined;
let browserInput: BrowserInputProvider | undefined;
let selectedMode: GameMode = 'campaign';
const icon = (n: string) => `<span class="pixel-icon" aria-hidden="true">${n}</span>`;
function shell(content: string) {
  root.innerHTML = `<div class="app-shell"><header><button class="brand" data-go="menu"><img src="assets/icon.svg" alt=""><span>ALASKA <b>DUCK HUNT</b></span></button><div class="header-actions"><button data-go="guide">FIELD GUIDE</button><button data-go="settings">SETTINGS</button></div></header><main>${content}</main><footer><span>ORIGINAL ALASKAN ARCADE HUNT</span><span>OFFLINE READY • v1.0</span></footer></div>`;
  bindNav();
}
function bindNav() {
  root.querySelectorAll<HTMLElement>('[data-go]').forEach((el) =>
    el.addEventListener('click', () => {
      audio.nav();
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
  root.innerHTML = `<section class="splash"><div class="mountain-mark">▲<i>⌁</i></div><h1>ALASKA<br><strong>DUCK HUNT</strong></h1><p>THE LAST FRONTIER TAKES FLIGHT</p><button id="enter" class="primary">ENTER THE WILD</button><small>Original art, code & sound • No affiliation with Nintendo</small></section>`;
  document.querySelector('#enter')?.addEventListener('click', async () => {
    await audio.unlock();
    localStorage.setItem('adh-launched', '1');
    menu();
  });
}
function menu() {
  shell(
    `<section class="menu-layout"><div class="menu-copy"><h1>THE MIGRATION<br>IS <em>UNDERWAY.</em></h1><p>Track the wind. Know the silhouette. Make every shell count across Alaska’s wildest flyways.</p><button class="primary large" data-go="campaign">CONTINUE CAMPAIGN <span>→</span></button><button data-go="modes">CHOOSE HUNT MODE</button></div><div class="menu-art" role="img" aria-label="Pixel art pintails crossing an Alaskan mountain delta"><div class="sun"></div><div class="mountains">▲ ▲ ▲</div><div class="bird-flight">⌁ ︿ ⌁</div><div class="reeds">╱╲╱╲╱╲╱╲╱╲</div></div><nav class="menu-rail"><button data-go="guide">${icon('◈')}<span>FIELD GUIDE<small>${species.length} species logged</small></span></button><button data-go="stats">${icon('⌁')}<span>RECORDS<small>Local profile</small></span></button><button data-go="achievements">${icon('✦')}<span>ACHIEVEMENTS<small>12 challenges</small></span></button><button data-go="controller">${icon('⌁')}<span>CONTROLLER LAB<small>Simulator ready</small></span></button></nav></section>`,
  );
  bindNav();
}
function modeSelect() {
  shell(
    `<section class="page"><div class="section-title"><p>SELECT OPERATION</p><h1>HUNT MODES</h1></div><div class="mode-list">${modes.map((m, i) => `<button class="mode ${m.id === selectedMode ? 'selected' : ''}" data-mode="${m.id}"><span>0${i + 1}</span><div><b>${m.name}</b><small>${m.description}</small></div><i>→</i></button>`).join('')}</div><button class="primary" id="brief">CONTINUE TO BRIEFING</button></section>`,
  );
  root.querySelectorAll<HTMLElement>('[data-mode]').forEach(
    (b) =>
      (b.onclick = () => {
        selectedMode = b.dataset.mode as GameMode;
        modeSelect();
      }),
  );
  document.querySelector('#brief')?.addEventListener('click', briefing);
}
function campaign() {
  shell(
    `<section class="page campaign"><div class="section-title"><p>CAMPAIGN • NORTHBOUND</p><h1>ALASKA FLYWAYS</h1></div><div class="map-grid">${locations.map((l, i) => `<button class="location ${i > 3 ? 'locked' : ''}" data-location="${i}"><span>${String(i + 1).padStart(2, '0')}</span><b>${l.name}</b><small>${l.region} • ${l.habitat}</small></button>`).join('')}</div><p class="hint">Complete accuracy and identification objectives to unlock the northbound route.</p></section>`,
  );
  root.querySelectorAll<HTMLElement>('[data-location]').forEach(
    (b) =>
      (b.onclick = () => {
        if (!b.classList.contains('locked')) {
          sessionStorage.setItem('location', b.dataset.location ?? '2');
          briefing();
        }
      }),
  );
}
function briefing() {
  const l = locations[Number(sessionStorage.getItem('location') ?? 2)] ?? locations[2]!;
  shell(
    `<section class="brief"><div><p>PRE-HUNT BRIEFING</p><h1>${l.name}</h1><h2>${modes.find((m) => m.id === selectedMode)?.name}</h2><p>${l.habitat}. Expect ${l.hazards.join(' and ')} with ${l.ambience}.</p><dl><div><dt>OBJECTIVE</dt><dd>Score 1,200+ and maintain 45% accuracy</dd></div><div><dt>FIELD RULE</dt><dd>Identify silhouettes. Protected birds carry a severe penalty.</dd></div><div><dt>AMMUNITION</dt><dd>5 fictional game shells • R to reload</dd></div></dl><button class="primary large" id="start-hunt">START HUNT</button></div><aside><h3>TARGET PROFILE</h3><div class="bird-card">⌁</div><b>NORTHERN PINTAIL</b><p>Long neck, pointed tail, swift direct flight.</p><small>Game limits are fictional and are not real regulations.</small></aside></section>`,
  );
  document.querySelector('#start-hunt')?.addEventListener('click', startHunt);
}
function startHunt() {
  browserInput?.disconnect();
  browserInput = undefined;
  game?.destroy(true);
  game = undefined;
  const locationIndex = Number(sessionStorage.getItem('location') ?? 2);
  const selectedLocation = locations[locationIndex] ?? locations[2]!;
  root.innerHTML = `<div id="game"></div><div id="aim-layer" aria-label="Hunt aiming surface" data-shots="0" data-sprite-birds="0" data-scene-layers="3" data-dog-layer="ground" data-location-id="${selectedLocation.id}" data-scene-background="assets/scenes/${selectedLocation.id}.png"></div><div class="hud"><div><small>SCORE</small><b id="score">000000</b><span id="combo">COMBO ×0</span></div><div class="objective">PINTAIL • FIELD ROUND</div><div><small>TIME</small><b id="time">01:00</b></div></div><div class="ammo"><small>SHELLS</small><b id="ammo">●●●●●</b><span>R RELOAD</span></div><div id="notice" aria-live="polite"></div><div id="pause" class="overlay hidden"><h2>HUNT PAUSED</h2><button id="resume">RESUME</button><button id="quit">RETURN TO MENU</button></div>`;
  const scene = new HuntScene(locationIndex);
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
      if (huntPaused) scene.pauseHunt();
      else scene.resumeHunt();
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
        (h: { score: number; ammo: number; combo: number; time: number; shots?: number }) => {
          setText('score', String(h.score).padStart(6, '0'));
          setText('ammo', '●'.repeat(h.ammo) + '○'.repeat(5 - h.ammo));
          setText('combo', `COMBO ×${h.combo}`);
          setText('time', `00:${String(Math.max(0, h.time)).padStart(2, '0')}`);
          aimLayer?.setAttribute('data-shots', String(h.shots ?? 0));
        },
      );
      scene.events.on('aim', ({ x, y }: { x: number; y: number }) => {
        aimLayer?.setAttribute('data-aim-x', x.toFixed(2));
        aimLayer?.setAttribute('data-aim-y', y.toFixed(2));
      });
      scene.events.on(
        'bird-spawned',
        ({
          speciesId,
          illustrated,
          lane,
        }: {
          speciesId: string;
          illustrated: boolean;
          lane: string;
        }) => {
          aimLayer?.setAttribute('data-last-bird', speciesId);
          aimLayer?.setAttribute('data-bird-lane', lane);
          if (illustrated && aimLayer) {
            const count = Number(aimLayer.dataset.spriteBirds ?? 0) + 1;
            aimLayer.dataset.spriteBirds = String(count);
            aimLayer.dataset.lastIllustratedBird = speciesId;
          }
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
        audio.shot();
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
        (r: { score: number; hits: number; shots: number; accuracy: number }) => results(r),
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
    game?.canvas.focus({ preventScroll: true });
  });
  document.querySelector('#quit')?.addEventListener('click', () => {
    browserInput?.disconnect();
    browserInput = undefined;
    game?.destroy(true);
    game = undefined;
    menu();
  });
}
function setText(id: string, v: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}
function results(r: { score: number; hits: number; shots: number; accuracy: number }) {
  browserInput?.disconnect();
  browserInput = undefined;
  game?.destroy(true);
  game = undefined;
  audio.success();
  shell(
    `<section class="results"><p>ROUND COMPLETE</p><h1>DELTA CLEARED</h1><div class="score-result">${r.score.toLocaleString()}</div><div class="result-grid"><div><b>${r.hits}</b><span>VALID HITS</span></div><div><b>${r.accuracy}%</b><span>ACCURACY</span></div><div><b>${r.shots}</b><span>SHOTS</span></div><div><b>${r.score >= 1200 ? 'A' : 'B'}</b><span>RATING</span></div></div><div><button class="primary" id="retry">RETRY</button><button data-go="menu">MAIN MENU</button></div></section>`,
  );
  bindNav();
  document.querySelector('#retry')?.addEventListener('click', startHunt);
}
function guide() {
  shell(
    `<section class="page"><div class="section-title"><p>IDENTIFY BEFORE YOU ACT</p><h1>FIELD GUIDE</h1></div><p class="disclaimer">${LEGAL_DISCLAIMER}</p><div class="guide-grid">${species.map((s) => `<article>${fieldGuideBird(s.id, s.common, s.target)}<p>${s.category.toUpperCase()}</p><h2>${s.common}</h2><i>${s.scientific}</i><p>${s.traits}</p><details><summary>FIELD NOTES</summary><p><b>Habitat:</b> ${s.habitat}<br><b>Flight:</b> ${s.flight}<br><b>Range:</b> ${s.distribution}<br><b>Status:</b> ${s.status}<br><b>Similar:</b> ${s.similar.join(', ') || 'None listed'}<br><b>Protected lookalikes:</b> ${s.lookalikes.join(', ') || 'Consult current guide'}<br><b>Source:</b> ${s.source}<br><b>Verified:</b> ${s.lastVerified ?? '2026-07-19'}</p></details></article>`).join('')}</div></section>`,
  );
}
function fieldGuideBird(id: string, common: string, target: boolean) {
  const art = birdSpriteBySpecies.get(id);
  if (!art)
    return `<div class="guide-bird ${target ? '' : 'protected'}" role="img" aria-label="${common} silhouette">⌁</div>`;
  return `<div class="guide-bird has-sprite" role="img" aria-label="Animated ${common} pixel art" style="background-image:url('${art.path}')"></div>`;
}
function settings() {
  shell(
    `<section class="page settings"><div class="section-title"><p>PLAYER CONFIGURATION</p><h1>SETTINGS</h1></div>${['Master volume', 'Music', 'Effects', 'Ambience', 'Aim sensitivity', 'Reticle size', 'Text scale'].map((x, i) => `<label>${x}<input type="range" min="0" max="100" value="${i < 4 ? 65 : 50}" data-setting="${x}"></label>`).join('')}<div class="toggles">${['Aim assist', 'High-contrast reticle', 'Reduced motion', 'Reduced flashing', 'Screen shake', 'CRT scanlines', 'Mute'].map((x) => `<label><input type="checkbox" data-setting="${x}">${x}</label>`).join('')}</div><h2>CONTROLS</h2><p>Mouse / touch aim • Left click / Space fire • WASD / arrows reticle • R reload • Esc pause • F fullscreen • M mute • Tab focus</p><button id="export">EXPORT SAVE</button><button id="reset">RESET LOCAL DATA</button></section>`,
  );
  root.querySelectorAll<HTMLInputElement>('[data-setting]').forEach((i) => {
    const key = `adh-${i.dataset.setting}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      if (i.type === 'checkbox') i.checked = saved === 'true';
      else i.value = saved;
    }
    i.onchange = () =>
      localStorage.setItem(key, i.type === 'checkbox' ? String(i.checked) : i.value);
  });
  document.querySelector('#export')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ ...localStorage }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alaska-duck-hunt-save.json';
    a.click();
  });
  document.querySelector('#reset')?.addEventListener('click', () => {
    if (confirm('Reset all local game data?')) localStorage.clear();
  });
}
function stats() {
  shell(
    `<section class="results"><p>LOCAL PROFILE</p><h1>PLAYER RECORDS</h1><div class="result-grid"><div><b>0</b><span>TOTAL SCORE</span></div><div><b>0%</b><span>ACCURACY</span></div><div><b>0</b><span>BEST COMBO</span></div><div><b>0</b><span>DAILY BEST</span></div></div><button data-go="menu">BACK</button></section>`,
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
    `<section class="page"><div class="section-title"><p>MADE IN ALASKA</p><h1>CREDITS</h1></div><p>Original game design, code-native pixel art, procedural audio and writing created for Alaska Duck Hunt. Regulatory context references Alaska Department of Fish and Game and U.S. Fish & Wildlife Service public information.</p><p>MIT licensed code and original generated assets. No Nintendo assets or intellectual property are included.</p></section>`,
  );
}
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    audio.muted = !audio.muted;
  }
  if (e.key === 'Enter' && document.querySelector<HTMLElement>('.splash #enter'))
    document.querySelector<HTMLElement>('.splash #enter')?.click();
});
if (localStorage.getItem('adh-launched')) menu();
else splash();

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
