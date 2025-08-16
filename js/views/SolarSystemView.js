import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'https://unpkg.com/three@0.161.0/examples/jsm/webxr/VRButton.js';
import { PLANETS, SUN, AU_KM, DISTANCE_SCALE, RADIUS_SCALE, ASTEROID_BELT } from '../data/planets.js';
import { TAU } from '../utils.js';

export class SolarSystemView {
  constructor(renderer, loadingManager, uiCallbacks) {
    this.renderer = renderer;
    this.loadingManager = loadingManager;
    this.ui = uiCallbacks; // { onObjectSelected(object, meta), onStatus(text) }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1e9);
    this.camera.position.set(0, 2000, 6000);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 500;
    this.controls.maxDistance = 2e7;

    this.sunLight = new THREE.PointLight(0xffffff, 2.2, 0);
    this.scene.add(this.sunLight);
    this.scene.add(new THREE.AmbientLight(0x333333, 0.4));

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clickables = [];

    this.planetPivots = [];
    this.planetMeshes = [];
    this.moonSystems = []; // per planet: { instancedMesh, instances: [...], planet }

    this._setupBackgroundStars();
    this._createSun();
    this._createPlanetsAndMoons();
    this._createAsteroidBelt();
    this._addEasterEggs();

    this._bindEvents();
    this.selectedObject = null;

    this._vrButtonHook();
  }

  _vrButtonHook() {
    const btn = document.getElementById('btn-vr');
    if (!btn) return;
    try {
      // Lazily attach VRButton
      if (!btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
          const el = VRButton.createButton(this.renderer);
          el.click();
        });
      }
    } catch (e) {}
  }

  _setupBackgroundStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 8e7 * Math.pow(Math.random(), 0.5) + 2e6;
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 60000, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  _createSun() {
    const texLoader = new THREE.TextureLoader(this.loadingManager);
    const sunTex = texLoader.load(SUN.texture);
    const sunGeo = new THREE.SphereGeometry(SUN.radiusKm * RADIUS_SCALE, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.name = 'Sun';
    sunMesh.userData = { type: 'star', info: { name: 'Sun', size: SUN.radiusKm + ' km', description: 'Our star.' } };
    this.root.add(sunMesh);
    this.clickables.push(sunMesh);

    this.sunLight.position.set(0, 0, 0);
  }

  _createPlanetsAndMoons() {
    const texLoader = new THREE.TextureLoader(this.loadingManager);

    PLANETS.forEach((planet, idx) => {
      const pivot = new THREE.Group();
      pivot.userData = { planet };
      this.root.add(pivot);
      this.planetPivots.push(pivot);

      const distance = planet.distanceAu * AU_KM * DISTANCE_SCALE;
      pivot.position.set(0, 0, 0);

      const planetGeo = new THREE.SphereGeometry(planet.radiusKm * RADIUS_SCALE, 48, 48);
      const planetMat = new THREE.MeshPhongMaterial({ color: planet.color || 0xffffff, map: planet.texture ? texLoader.load(planet.texture) : null });
      const mesh = new THREE.Mesh(planetGeo, planetMat);
      mesh.position.set(distance, 0, 0);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData = { type: 'planet', planet };
      pivot.add(mesh);
      this.planetMeshes.push(mesh);
      this.clickables.push(mesh);

      // Rings
      if (planet.ringTexture) {
        const inner = (planet.ringInnerKm || planet.radiusKm * 1.4) * RADIUS_SCALE;
        const outer = (planet.ringOuterKm || planet.radiusKm * 2.1) * RADIUS_SCALE;
        const ringGeo = new THREE.RingGeometry(inner, outer, 128, 1);
        ringGeo.rotateX(-Math.PI / 2);
        const ringTex = texLoader.load(planet.ringTexture);
        ringTex.wrapS = ringTex.wrapT = THREE.ClampToEdgeWrapping;
        const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(mesh.position);
        ringMesh.userData = { type: 'ring', planet };
        pivot.add(ringMesh);
      }

      // Moons system (local group centered on planet)
      const moonCount = planet.moons || 0;
      if (moonCount > 0) {
        const moonsGroup = new THREE.Group();
        moonsGroup.position.copy(mesh.position);
        pivot.add(moonsGroup);

        const baseMoonSize = Math.max(planet.radiusKm * 0.02, 300) * RADIUS_SCALE;
        const moonGeo = new THREE.SphereGeometry(baseMoonSize, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xbababa, roughness: 1.0, metalness: 0.0 });
        const instanced = new THREE.InstancedMesh(moonGeo, moonMat, moonCount);
        instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        instanced.userData = { type: 'moons', planet };
        moonsGroup.add(instanced);
        this.clickables.push(instanced);

        const planetRadius = planet.radiusKm * RADIUS_SCALE;
        const instances = [];
        for (let i = 0; i < moonCount; i++) {
          const angle = Math.random() * TAU;
          const orbitRadius = planetRadius * (3 + i * 0.5 + Math.random() * 0.6);
          const speed = (0.3 + Math.random() * 0.7) / Math.sqrt(orbitRadius);
          const tilt = (planet.tiltDeg || 0) * Math.PI / 180 + (Math.random() - 0.5) * 0.3;
          const size = baseMoonSize * (0.6 + Math.random() * 0.8);
          instances.push({ angle, orbitRadius, speed, tilt, size });
        }
        this.moonSystems.push({ instancedMesh: instanced, instances, pivot, planet, around: mesh, group: moonsGroup });
      }
    });
  }

  _addEasterEggs() {
    // Simple hidden probes as glowing sprites/points
    const eggs = [
      { name: 'Voyager 1', distanceAu: 32, color: 0xffcc88 },
      { name: 'Voyager 2', distanceAu: 28, color: 0xffaa66 },
      { name: 'James Webb Space Telescope', distanceAu: 1.01, color: 0x99ddff }
    ];
    const geo = new THREE.SphereGeometry(60, 8, 8);
    eggs.forEach((egg) => {
      const r = egg.distanceAu * AU_KM * DISTANCE_SCALE;
      const theta = Math.random() * TAU;
      const pos = new THREE.Vector3(Math.cos(theta) * r, (Math.random() - 0.5) * r * 0.02, Math.sin(theta) * r);
      const mat = new THREE.MeshBasicMaterial({ color: egg.color });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      m.userData = { type: 'spacecraft', name: egg.name };
      this.root.add(m);
      this.clickables.push(m);
    });
  }

  _createAsteroidBelt() {
    const count = ASTEROID_BELT.count;
    const geo = new THREE.IcosahedronGeometry(2, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1.0, metalness: 0.0 });
    const inst = new THREE.InstancedMesh(geo, mat, count);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    inst.userData = { type: 'asteroidBelt' };
    this.root.add(inst);

    const minR = ASTEROID_BELT.minAu * AU_KM * DISTANCE_SCALE;
    const maxR = ASTEROID_BELT.maxAu * AU_KM * DISTANCE_SCALE;

    const instances = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const radius = Math.sqrt(Math.random()) * (maxR - minR) + minR;
      const angle = Math.random() * TAU;
      const height = (Math.random() - 0.5) * radius * 0.02; // thin belt
      const scale = THREE.MathUtils.lerp(ASTEROID_BELT.minSizeKm, ASTEROID_BELT.maxSizeKm, Math.random()) * RADIUS_SCALE;
      const speed = 0.02 / Math.sqrt(radius) * (0.5 + Math.random());
      instances.push({ radius, angle, height, speed, scale });

      dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    this.asteroidBelt = { instancedMesh: inst, instances };
  }

  _bindEvents() {
    this._onResize = () => {
      const el = this.renderer.domElement;
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
    this._onResize();

    this._onPointerMove = (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this._onClick = (e) => {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.clickables, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        let meta = null;
        if (hit.object.isInstancedMesh && hit.instanceId !== undefined) {
          const system = this.moonSystems.find(s => s.instancedMesh === hit.object);
          if (system) {
            meta = { type: 'moon', name: `${system.planet.name} Moon #${hit.instanceId + 1}`, parent: system.planet.name };
          }
        } else if (hit.object.userData && hit.object.userData.type) {
          const type = hit.object.userData.type;
          if (type === 'planet') meta = { type, ...hit.object.userData.planet };
          if (type === 'star') meta = { type, name: 'Sun', radiusKm: 696340 };
          if (type === 'spacecraft') meta = { type, name: hit.object.userData.name };
        }
        if (meta && this.ui && this.ui.onObjectSelected) this.ui.onObjectSelected(hit.object, meta);
        this.selectedObject = hit.object;
      }
    };
    this.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.addEventListener('click', this._onClick);
  }

  startFlyBy() {
    if (!this.selectedObject) return;
    const obj = this.selectedObject;
    const targetPos = new THREE.Vector3();
    obj.getWorldPosition(targetPos);

    const startCam = this.camera.position.clone();
    const dir = new THREE.Vector3().subVectors(targetPos, this.camera.position).normalize();
    const pathLen = Math.min(5000, targetPos.length() * 0.1 + 2000);
    const pathStart = startCam.clone();
    const pathMid = targetPos.clone().add(new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0)).normalize().multiplyScalar(pathLen * 0.5)).add(new THREE.Vector3(0, pathLen * 0.2, 0));
    const pathEnd = targetPos.clone().add(dir.multiplyScalar(800 + (obj.geometry && obj.geometry.boundingSphere ? obj.geometry.boundingSphere.radius * 2 : 500)));

    const curve = new THREE.CatmullRomCurve3([pathStart, pathMid, pathEnd]);
    const startTime = performance.now();
    const duration = 6000;

    const animateFly = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const p = curve.getPoint(t);
      const look = targetPos;
      this.camera.position.copy(p);
      this.camera.lookAt(look);
      if (t < 1) requestAnimationFrame(animateFly);
    };
    requestAnimationFrame(animateFly);
  }

  update(deltaSeconds, timeScale) {
    // Orbital motion and rotation
    PLANETS.forEach((planet, i) => {
      const pivot = this.planetPivots[i];
      if (!pivot) return;
      const mesh = this.planetMeshes[i];

      // revolution
      const daysPerOrbit = planet.orbitDays;
      const angularSpeed = TAU / (daysPerOrbit * 86400); // rad per second (real-time seconds)
      const angleDelta = angularSpeed * deltaSeconds * timeScale * 86400; // scaled to simulation days/sec mapping in app
      pivot.rotation.y += angleDelta;

      // rotation on axis
      const hoursPerRotation = Math.abs(planet.rotationHours) || 24;
      const rotDir = planet.rotationHours >= 0 ? 1 : -1;
      const rotSpeed = rotDir * TAU / (hoursPerRotation * 3600);
      mesh.rotation.y += rotSpeed * deltaSeconds * timeScale * 86400;
    });

    // Moons orbit around their planet (local group origin)
    const dummy = new THREE.Object3D();
    for (const system of this.moonSystems) {
      const { instancedMesh, instances, group } = system;
      for (let i = 0; i < instances.length; i++) {
        const m = instances[i];
        m.angle += m.speed * deltaSeconds * timeScale * 86400 * 0.00005;
        const x = Math.cos(m.angle) * m.orbitRadius;
        const z = Math.sin(m.angle) * m.orbitRadius;
        const y = Math.sin(m.tilt) * (m.orbitRadius * 0.2);
        dummy.position.set(x, y, z);
        const s = m.size;
        dummy.scale.set(s, s, s);
        dummy.rotation.set(0, m.angle, 0);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    // Asteroid belt drift
    if (this.asteroidBelt) {
      const { instancedMesh, instances } = this.asteroidBelt;
      const dummyAst = new THREE.Object3D();
      for (let i = 0; i < instances.length; i++) {
        const a = instances[i];
        a.angle += a.speed * deltaSeconds * timeScale * 0.2;
        dummyAst.position.set(Math.cos(a.angle) * a.radius, a.height, Math.sin(a.angle) * a.radius);
        dummyAst.scale.setScalar(a.scale);
        dummyAst.rotation.set(a.angle * 2.3, a.angle * 1.7, a.angle * 0.9);
        dummyAst.updateMatrix();
        instancedMesh.setMatrixAt(i, dummyAst.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.removeEventListener('click', this._onClick);

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => this._disposeMaterial(m)); else this._disposeMaterial(obj.material);
      }
      if (obj.texture) obj.texture.dispose && obj.texture.dispose();
    });

    this.controls.dispose();
  }

  _disposeMaterial(mat) {
    ['map','normalMap','specularMap','alphaMap','emissiveMap'].forEach(k => { if (mat[k]) { mat[k].dispose(); mat[k] = null; } });
    mat.dispose && mat.dispose();
  }
}