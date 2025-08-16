import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { TAU } from '../utils.js';

export class GalaxyView {
  constructor(renderer, loadingManager, uiCallbacks) {
    this.renderer = renderer;
    this.loadingManager = loadingManager;
    this.ui = uiCallbacks;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(60, 1, 1, 5e12);
    this.camera.position.set(0, 6e8, 1.6e9);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 5e6;
    this.controls.maxDistance = 2e10;

    this._createMilkyWay();
    this._createDustClouds();
    this._createNearbyGalaxies();
  }

  _createMilkyWay() {
    // Procedural spiral galaxy using point sprites
    const arms = 4;
    const starsPerArm = 8000;
    const total = arms * starsPerArm;

    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const color = new THREE.Color();

    const radiusMax = 8e8;
    let i = 0;
    for (let a = 0; a < arms; a++) {
      const armAngle = (a / arms) * TAU;
      for (let s = 0; s < starsPerArm; s++) {
        const t = s / starsPerArm;
        const radius = Math.pow(t, 0.8) * radiusMax * (0.8 + 0.4 * Math.random());
        const theta = armAngle + t * 5.5 + (Math.random() - 0.5) * 0.3;
        const x = Math.cos(theta) * radius + (Math.random() - 0.5) * 8e6;
        const z = Math.sin(theta) * radius + (Math.random() - 0.5) * 8e6;
        const y = (Math.random() - 0.5) * (2e7 * (1 - t));
        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        color.setHSL(0.6 - 0.35 * t + (Math.random() * 0.02), 0.6 - 0.5 * t, 0.6 + 0.3 * (1 - t));
        colors[i * 3 + 0] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
        i++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({ size: 2e6, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.galaxyPoints = points;
  }

  _createDustClouds() {
    const dustCount = 6000;
    const positions = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);
    const radiusMax = 8.2e8;
    for (let i = 0; i < dustCount; i++) {
      const t = Math.random();
      const r = Math.pow(t, 0.5) * radiusMax;
      const a = Math.random() * TAU;
      positions[i * 3 + 0] = Math.cos(a) * r + (Math.random() - 0.5) * 5e6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (1.2e7 * (1 - t));
      positions[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 5e6;
      sizes[i] = 4e6 + Math.random() * 7e6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ size: 5e6, color: 0x8899aa, transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(geo, mat);
    this.scene.add(dust);
    this.dust = dust;
  }

  _createNearbyGalaxies() {
    const spriteMat = new THREE.SpriteMaterial({ color: 0xaad0ff, opacity: 0.7 });
    const andromeda = new THREE.Sprite(spriteMat);
    andromeda.scale.set(1.5e8, 1.5e8, 1);
    andromeda.position.set(2.5e9, 3.2e8, -1.6e9);
    andromeda.userData = { type: 'galaxy', name: 'Andromeda (M31)' };
    this.scene.add(andromeda);
  }

  update(deltaSeconds, timeScale) {
    if (this.galaxyPoints) this.galaxyPoints.rotation.y += 0.00001 * deltaSeconds * timeScale * 86400;
    this.controls.update();
  }

  render() { this.renderer.render(this.scene, this.camera); }

  dispose() {
    this.controls.dispose();
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) { const m = obj.material; if (Array.isArray(m)) m.forEach(x => x.dispose()); else m.dispose(); }
    });
  }
}