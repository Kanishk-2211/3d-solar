import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { SolarSystemView } from './views/SolarSystemView.js';
import { EarthView } from './views/EarthView.js';
import { GalaxyView } from './views/GalaxyView.js';
import { BASE_SECONDS_PER_SIM_DAY } from './data/planets.js';
import { clamp } from './utils.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.timeScale = 10; // user-adjustable (1 = 1 sim day per BASE_SECONDS_PER_SIM_DAY seconds)
    this.paused = false;

    this.loadingManager = new THREE.LoadingManager();
    this._bindLoadingUI();

    this.currentView = null;
    this.currentViewName = '';
    this.selectedMeta = null;

    this._bindUI();
    this._setupAudio();
    this._fetchAPOD();

    this.switchView('solar');

    this.renderer.setAnimationLoop(this._animate.bind(this));
    window.addEventListener('resize', this._onResize.bind(this));
  }

  _bindLoadingUI() {
    const overlay = document.getElementById('loading-overlay');
    const bar = document.getElementById('loading-bar');
    const label = document.getElementById('loading-text');
    const detail = document.getElementById('loading-detail');
    let items = 0, loaded = 0;
    this.loadingManager.onStart = (url, i, total) => { items = total; loaded = 0; overlay.classList.add('visible'); label.textContent = '0%'; bar.style.width = '0%'; };
    this.loadingManager.onLoad = () => { bar.style.width = '100%'; label.textContent = '100%'; setTimeout(() => overlay.classList.remove('visible'), 300); };
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      loaded = itemsLoaded; items = itemsTotal; const p = itemsTotal ? Math.floor((itemsLoaded / itemsTotal) * 100) : 0; bar.style.width = p + '%'; label.textContent = p + '%'; detail.textContent = url.split('/').pop();
    };
    this.loadingManager.onError = (url) => { detail.textContent = 'Error: ' + url; };
  }

  _bindUI() {
    const setActive = (name) => {
      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === name));
    };
    const solarBtn = document.getElementById('btn-solar');
    const earthBtn = document.getElementById('btn-earth');
    const galaxyBtn = document.getElementById('btn-galaxy');
    solarBtn.addEventListener('click', () => { this.switchView('solar'); setActive('solar'); });
    earthBtn.addEventListener('click', () => { this.switchView('earth'); setActive('earth'); });
    galaxyBtn.addEventListener('click', () => { this.switchView('galaxy'); setActive('galaxy'); });
    setActive('solar');

    document.getElementById('btn-pause').addEventListener('click', () => { this.paused = true; });
    document.getElementById('btn-play').addEventListener('click', () => { this.paused = false; this.timeScale = clamp(this.timeScale, 0.01, 200); });
    document.getElementById('btn-ff').addEventListener('click', () => { this.paused = false; this.timeScale = 100; this._syncSpeedSlider(); });
    document.getElementById('speed-range').addEventListener('input', (e) => {
      const v = Number(e.target.value);
      this.timeScale = Math.pow(v / 10, 2); // nonlinear mapping for fine control
    });

    document.getElementById('info-close').addEventListener('click', () => this._clearInfo());
    const flyBtn = document.getElementById('btn-flyby');
    flyBtn.addEventListener('click', () => { if (this.currentView && this.currentView.startFlyBy) this.currentView.startFlyBy(); });

    const musicBtn = document.getElementById('btn-music');
    musicBtn.addEventListener('click', () => this._toggleMusic());
  }

  _syncSpeedSlider() {
    const slider = document.getElementById('speed-range');
    const v = Math.sqrt(clamp(this.timeScale, 0, 400)) * 10; // inverse of mapping
    slider.value = String(Math.floor(v));
  }

  _setupAudio() {
    const audio = document.getElementById('ambient-audio');
    // A gentle space ambient from Pixabay (royalty-free)
    audio.src = 'https://cdn.pixabay.com/audio/2022/02/23/audio_7d59f71b85.mp3';
    audio.volume = 0.4;
    this.audio = audio;
  }

  async _toggleMusic() {
    const btn = document.getElementById('btn-music');
    if (this.audio.paused) {
      try { await this.audio.play(); btn.textContent = 'Music: On'; } catch (_) { /* autoplay blocked */ }
    } else {
      this.audio.pause(); btn.textContent = 'Music: Off';
    }
  }

  async _fetchAPOD() {
    try {
      const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
      const data = await res.json();
      const root = document.getElementById('apod');
      if (!root) return;
      root.querySelector('.apod-title').textContent = 'NASA APOD: ' + (data.title || '');
      const img = root.querySelector('.apod-image');
      if (data.media_type === 'image') { img.src = data.url; img.style.display = 'block'; } else { img.style.display = 'none'; }
      root.querySelector('.apod-expl').textContent = data.explanation || '';
    } catch (e) {
      // ignore
    }
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.currentView) {
      this.currentView.camera.aspect = w / h;
      this.currentView.camera.updateProjectionMatrix();
    }
  }

  _animate() {
    const dt = this.clock.getDelta();
    const elapsedSeconds = this.paused ? 0 : dt;
    if (this.currentView && this.currentView.update) {
      this.currentView.update(elapsedSeconds, this.timeScale);
    }
    if (this.currentView && this.currentView.render) this.currentView.render();
  }

  switchView(name) {
    if (this.currentView) {
      try { this.currentView.dispose(); } catch (_) {}
      this.currentView = null;
    }

    const uiCallbacks = {
      onObjectSelected: (object, meta) => this._showInfo(meta),
      onStatus: (text) => this._status(text)
    };

    if (name === 'solar') this.currentView = new SolarSystemView(this.renderer, this.loadingManager, uiCallbacks);
    else if (name === 'earth') this.currentView = new EarthView(this.renderer, this.loadingManager, uiCallbacks);
    else if (name === 'galaxy') this.currentView = new GalaxyView(this.renderer, this.loadingManager, uiCallbacks);

    this.currentViewName = name;

    // Toggle Earth search UI
    const earthSearch = document.getElementById('earth-search-wrap');
    if (earthSearch) earthSearch.style.display = name === 'earth' ? '' : 'none';

    // Reset selection
    this._clearInfo();

    this._onResize();
  }

  _showInfo(meta) {
    const title = document.getElementById('info-title');
    const body = document.getElementById('info-content');
    const apod = document.getElementById('apod');
    const flyBtn = document.getElementById('btn-flyby');

    flyBtn.disabled = false;

    const setBody = (html) => {
      // Preserve APOD section at bottom
      if (apod && apod.parentElement) apod.parentElement.removeChild(apod);
      body.innerHTML = html;
      if (apod) body.appendChild(apod);
    };

    this.selectedMeta = meta;
    if (meta.type === 'planet') {
      title.textContent = meta.name;
      setBody(`
        <div><b>Size</b>: ${Math.round(meta.radiusKm).toLocaleString()} km radius</div>
        <div><b>Distance</b>: ${meta.distanceAu ? meta.distanceAu.toFixed(2) + ' AU' : '—'}</div>
        <div><b>Orbit</b>: ${meta.orbitDays ? Math.round(meta.orbitDays) + ' days' : '—'}</div>
        <div><b>Rotation</b>: ${meta.rotationHours ? meta.rotationHours + ' hours' : '—'}</div>
        <div><b>Moons</b>: ${meta.moons || 0}</div>
        <div><b>Atmosphere</b>: ${meta.info?.atmosphere || '—'}</div>
        <div><b>Discovery</b>: ${meta.info?.discovered || '—'}</div>
        <div style="margin-top:6px">${meta.info?.more || ''}</div>
      `);
    } else if (meta.type === 'moon') {
      title.textContent = meta.name;
      setBody(`<div><b>Parent</b>: ${meta.parent}</div>`);
    } else if (meta.type === 'location') {
      title.textContent = meta.name || 'Location';
      setBody('');
    } else if (meta.type === 'star') {
      title.textContent = 'Sun';
      setBody('<div>The star at the center of our Solar System.</div>');
    } else if (meta.type === 'spacecraft') {
      title.textContent = meta.name;
      setBody('<div>Hidden spacecraft discovered!</div>');
    }
  }

  _clearInfo() {
    const body = document.getElementById('info-content');
    const apod = document.getElementById('apod');
    document.getElementById('info-title').textContent = 'Welcome';
    body.innerHTML = '<p>Click a planet or moon to see details here.</p>';
    if (apod) body.appendChild(apod);
    document.getElementById('btn-flyby').disabled = true;
    this.selectedMeta = null;
  }

  _status(text) {
    const detail = document.getElementById('loading-detail');
    if (detail) detail.textContent = text;
  }
}

// Bootstrap
new App();