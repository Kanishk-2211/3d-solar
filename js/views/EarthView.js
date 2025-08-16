import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { PLANETS, RADIUS_SCALE } from '../data/planets.js';
import { latLonToVector3, animateVector3, TAU } from '../utils.js';

export class EarthView {
  constructor(renderer, loadingManager, uiCallbacks) {
    this.renderer = renderer;
    this.loadingManager = loadingManager;
    this.ui = uiCallbacks; // { onObjectSelected, onStatus, onSearch }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1e7);
    this.camera.position.set(0, 0, 1200);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 300;
    this.controls.maxDistance = 8000;

    this.light = new THREE.DirectionalLight(0xffffff, 1.2);
    this.light.position.set(5000, 2000, 1000);
    this.scene.add(this.light);
    this.scene.add(new THREE.AmbientLight(0x222233, 0.6));

    this._buildEarth();
    this._bindSearch();
  }

  _buildEarth() {
    const texLoader = new THREE.TextureLoader(this.loadingManager);
    const earth = PLANETS.find(p => p.key === 'earth');

    const radius = earth.radiusKm * RADIUS_SCALE * 50; // Scale Earth view separately for detail

    const day = texLoader.load(earth.texture);
    const normal = texLoader.load(earth.normalMap);
    const spec = texLoader.load(earth.specularMap);
    const night = texLoader.load(earth.nightMap);
    const clouds = texLoader.load(earth.cloudsMap);

    this.earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 96),
      new THREE.MeshPhongMaterial({ map: day, normalMap: normal, specularMap: spec, specular: 0x222222, shininess: 15, emissive: 0x111111, emissiveMap: night })
    );
    this.earthMesh.userData = { type: 'planet', planet: earth };
    this.scene.add(this.earthMesh);

    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.01, 96, 96),
      new THREE.MeshLambertMaterial({ map: clouds, transparent: true, opacity: 0.8, depthWrite: false })
    );
    this.scene.add(cloudMesh);
    this.cloudMesh = cloudMesh;

    // Stars background
    const starGeo = new THREE.SphereGeometry(1e6, 32, 16);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x03050a, side: THREE.BackSide });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    this.scene.add(starMesh);
  }

  _bindSearch() {
    const wrap = document.getElementById('earth-search-wrap');
    if (wrap) wrap.style.display = '';
    const form = document.getElementById('earth-search-form');
    const input = document.getElementById('earth-search');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      this.ui && this.ui.onStatus && this.ui.onStatus('Searching: ' + q);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (!data || !data.length) { this.ui && this.ui.onStatus && this.ui.onStatus('No results'); return; }
        const { lat, lon, display_name } = data[0];
        const earth = PLANETS.find(p => p.key === 'earth');
        const radius = earth.radiusKm * RADIUS_SCALE * 50;
        const pos = latLonToVector3(parseFloat(lat), parseFloat(lon), radius);

        const start = this.camera.position.clone();
        const end = new THREE.Vector3(pos.x, pos.y, pos.z).multiplyScalar(1.8);
        const startTarget = this.controls.target.clone();
        const endTarget = new THREE.Vector3(pos.x, pos.y, pos.z);

        const duration = 3000;
        const startTime = performance.now();
        const animate = (now) => {
          const t = Math.min(1, (now - startTime) / duration);
          this.camera.position.lerpVectors(start, end, t);
          this.controls.target.lerpVectors(startTarget, endTarget, t);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);

        if (this.ui && this.ui.onObjectSelected) {
          this.ui.onObjectSelected(this.earthMesh, { type: 'location', name: display_name });
        }
      } catch (err) {
        this.ui && this.ui.onStatus && this.ui.onStatus('Search failed');
      }
    });
  }

  update(deltaSeconds, timeScale) {
    const rot = (TAU / (24 * 3600)) * deltaSeconds * timeScale * 86400;
    this.earthMesh.rotation.y += rot * 0.3;
    this.cloudMesh.rotation.y += rot * 0.5;

    // Night lights intensity by zoom level
    const d = this.camera.position.length();
    const targetIntensity = THREE.MathUtils.clamp((1800 - d) / 1200 + 0.4, 0.2, 1.6);
    if (this.earthMesh.material && typeof this.earthMesh.material.emissiveIntensity === 'number') {
      this.earthMesh.material.emissiveIntensity = targetIntensity;
    }

    this.controls.update();
  }

  render() { this.renderer.render(this.scene, this.camera); }

  dispose() {
    const wrap = document.getElementById('earth-search-wrap');
    if (wrap) wrap.style.display = 'none';
    this.controls.dispose();
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const m = obj.material; if (Array.isArray(m)) m.forEach(x => x.dispose()); else m.dispose();
      }
    });
  }
}