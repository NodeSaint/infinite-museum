// Three.js scene, renderer, camera and render loop. Dim, top-lit, warm
// spotlights on the art. The renderer is the only place that touches WebGL.

import * as THREE from 'three';

export interface Engine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock;
  /** Register a per-frame callback. Returns an unsubscribe. */
  onFrame(cb: (dt: number, elapsed: number) => void): () => void;
  start(): void;
  dispose(): void;
}

export function createEngine(mount: HTMLElement): Engine {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0908');
  scene.fog = new THREE.FogExp2('#0a0908', 0.045);

  const camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.05,
    100,
  );
  camera.position.set(0, 1.65, 4); // eye height ~1.65 m

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  mount.appendChild(renderer.domElement);

  const clock = new THREE.Clock();
  const frameCbs = new Set<(dt: number, elapsed: number) => void>();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    for (const cb of frameCbs) cb(dt, elapsed);
    renderer.render(scene, camera);
  }

  return {
    scene,
    camera,
    renderer,
    clock,
    onFrame(cb) {
      frameCbs.add(cb);
      return () => frameCbs.delete(cb);
    },
    start() {
      if (!raf) loop();
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** Ambient + faint top fill that defines the "dim, top-lit" base mood.
 *  Per-artwork warm spotlights are added by the room builder. */
export function installBaseLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight('#2a2622', 0.6);
  scene.add(ambient);

  const fill = new THREE.HemisphereLight('#3b3026', '#080706', 0.5);
  scene.add(fill);
}
