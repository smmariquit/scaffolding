import * as THREE from 'three';

// Block colors  
const BLOCK_COLORS = {
  0: 0x000000,
  1: 0x3d8c40, // Grass
  2: 0x9d8554, // Dirt
  3: 0x888888, // Stone
  4: 0x424242, // Bedrock
  5: 0x654321, // Log
  6: 0x2d7a2d, // Leaves
  7: 0xa37b52, // Timber wall / hub block
  8: 0xffd95a, // Flower accent (used in custom flower mesh)
  9: 0x8b4f2f, // Roof block
  10: 0xd2b48c // Scaffolding block
};

function createBlock(x, y, z, type) {
  if (type === 8) {
    const flower = new THREE.Group();
    flower.position.set(x, y, z);

    const stem = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.72, 0.14),
      new THREE.MeshPhongMaterial({ color: 0x4a9b3f, flatShading: true })
    );
    stem.position.y = 0.36;
    stem.castShadow = true;
    stem.receiveShadow = true;
    flower.add(stem);

    const bloomCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.22, 0.22),
      new THREE.MeshPhongMaterial({ color: 0xffd95a, flatShading: true })
    );
    bloomCore.position.y = 0.84;
    bloomCore.castShadow = true;
    bloomCore.receiveShadow = true;
    flower.add(bloomCore);

    const petalOffsets = [
      [0.14, 0.84, 0],
      [-0.14, 0.84, 0],
      [0, 0.84, 0.14],
      [0, 0.84, -0.14]
    ];

    petalOffsets.forEach(([px, py, pz]) => {
      const petal = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.13, 0.13),
        new THREE.MeshPhongMaterial({ color: 0xf4f2ff, flatShading: true })
      );
      petal.position.set(px, py, pz);
      petal.castShadow = true;
      petal.receiveShadow = true;
      flower.add(petal);
    });

    return flower;
  }

  if (type === 10) {
    const scaffold = new THREE.Group();
    scaffold.position.set(x, y, z);

    const poleMaterial = new THREE.MeshPhongMaterial({
      color: 0xb89357,
      transparent: true,
      opacity: 0.68,
      flatShading: true
    });

    const slatMaterial = new THREE.MeshPhongMaterial({
      color: 0xc8a66e,
      transparent: true,
      opacity: 0.52,
      flatShading: true
    });

    const poleGeo = new THREE.BoxGeometry(0.13, 1, 0.13);
    const slatGeo = new THREE.BoxGeometry(0.82, 0.08, 0.12);
    const topGeo = new THREE.BoxGeometry(0.9, 0.1, 0.9);

    const poleOffsets = [
      [-0.34, 0, -0.34],
      [0.34, 0, -0.34],
      [-0.34, 0, 0.34],
      [0.34, 0, 0.34]
    ];

    poleOffsets.forEach(([px, py, pz]) => {
      const pole = new THREE.Mesh(poleGeo, poleMaterial);
      pole.position.set(px, py, pz);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scaffold.add(pole);
    });

    const slatHeights = [-0.2, 0.1, 0.36];
    slatHeights.forEach((sy) => {
      const front = new THREE.Mesh(slatGeo, slatMaterial);
      front.position.set(0, sy, -0.34);
      const back = new THREE.Mesh(slatGeo, slatMaterial);
      back.position.set(0, sy, 0.34);

      const sideGeo = new THREE.BoxGeometry(0.12, 0.08, 0.82);
      const left = new THREE.Mesh(sideGeo, slatMaterial);
      left.position.set(-0.34, sy, 0);
      const right = new THREE.Mesh(sideGeo, slatMaterial);
      right.position.set(0.34, sy, 0);

      [front, back, left, right].forEach((piece) => {
        piece.castShadow = true;
        piece.receiveShadow = true;
        scaffold.add(piece);
      });
    });

    const top = new THREE.Mesh(topGeo, slatMaterial);
    top.position.y = 0.46;
    top.castShadow = true;
    top.receiveShadow = true;
    scaffold.add(top);

    return scaffold;
  }

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({
    color: BLOCK_COLORS[type],
    flatShading: true
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, y, z);
  cube.castShadow = true;
  cube.receiveShadow = true;
  return cube;
}

function getStoryBlocks() {
  const blocks = [];

  function pushCenterPass(items, startAt, endAt, options = {}) {
    if (!Array.isArray(items) || items.length === 0) return;

    const { centerX = 0, centerZ = 0, sortWithinDistance = null } = options;
    const ranked = items
      .map((item) => ({
        ...item,
        dist2: (item.x - centerX) ** 2 + (item.z - centerZ) ** 2
      }))
      .sort((a, b) => (a.dist2 - b.dist2) || (a.y - b.y) || (a.x - b.x));

    if (typeof sortWithinDistance === "function") {
      ranked.sort((a, b) => {
        const d = a.dist2 - b.dist2;
        if (Math.abs(d) > 0.0001) return d;
        return sortWithinDistance(a, b);
      });
    }

    const span = Math.max(1, ranked.length - 1);
    ranked.forEach((item, index) => {
      const alpha = index / span;
      blocks.push({ ...item, appearAt: startAt + (endAt - startAt) * alpha });
    });
  }

  function pushZPass(items, startAt, endAt, options = {}) {
    if (!Array.isArray(items) || items.length === 0) return;

    const { sortWithinLayer = null } = options;
    const layers = new Map();
    items.forEach((item) => {
      const list = layers.get(item.z) ?? [];
      list.push(item);
      layers.set(item.z, list);
    });

    const sortedZ = Array.from(layers.keys()).sort((a, b) => a - b);
    const zSpan = Math.max(1, sortedZ.length - 1);

    sortedZ.forEach((zValue, zIndex) => {
      const zAlpha = zIndex / zSpan;
      const layerAppearAt = startAt + (endAt - startAt) * zAlpha;
      const layerItems = layers.get(zValue);

      if (typeof sortWithinLayer === "function") {
        layerItems.sort(sortWithinLayer);
      }

      const layerSpan = Math.max(1, layerItems.length - 1);
      layerItems.forEach((item, itemIndex) => {
        const itemAlpha = itemIndex / layerSpan;
        // Keep a tiny cadence within each z-layer so large rows do not pop all at once.
        const localNudge = (endAt - startAt) * 0.04 * itemAlpha;
        blocks.push({ ...item, appearAt: Math.min(endAt, layerAppearAt + localNudge) });
      });
    });
  }

  // Section timing anchors: I=Foundation, II=Build, III=Finished Structure.
  const FOUNDATION_END = 0.58;
  const BUILD_START = FOUNDATION_END;
  const BUILD_END = 0.82;
  const FINISHED_START = BUILD_END;

  const foundationItems = [];

  // Stage 0.05+ - tiny starting patch (first exposure to tech)
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      foundationItems.push({ x: col, y: -1, z: row, type: 2 });
      foundationItems.push({ x: col, y: 0, z: row, type: 1 });
    }
  }

  // Stage 0.2+ - wider world foundation
  for (let row = -4; row <= 5; row++) {
    for (let col = -7; col <= 7; col++) {
      if (Math.abs(col) <= 1 && Math.abs(row) <= 1) continue;
      foundationItems.push({ x: col, y: -1, z: row, type: 2 });
      foundationItems.push({ x: col, y: 0, z: row, type: 1 });
    }
  }

  // Trees and flora still complete during section I.
  foundationItems.push({ x: -3, y: 1, z: -2, type: 5 });
  foundationItems.push({ x: -3, y: 2, z: -2, type: 5 });
  foundationItems.push({ x: -4, y: 3, z: -2, type: 6 });
  foundationItems.push({ x: -2, y: 3, z: -2, type: 6 });
  foundationItems.push({ x: -3, y: 3, z: -3, type: 6 });
  foundationItems.push({ x: -3, y: 3, z: -1, type: 6 });
  foundationItems.push({ x: -3, y: 4, z: -2, type: 6 });

  foundationItems.push({ x: 5, y: 1, z: 1, type: 5 });
  foundationItems.push({ x: 5, y: 2, z: 1, type: 5 });
  foundationItems.push({ x: 4, y: 3, z: 1, type: 6 });
  foundationItems.push({ x: 6, y: 3, z: 1, type: 6 });
  foundationItems.push({ x: 5, y: 3, z: 0, type: 6 });
  foundationItems.push({ x: 5, y: 3, z: 2, type: 6 });
  foundationItems.push({ x: 5, y: 4, z: 1, type: 6 });

  foundationItems.push({ x: 0, y: 0.5, z: 0, type: 8 });
  foundationItems.push({ x: -1, y: 0.5, z: -1, type: 8 });
  foundationItems.push({ x: 1, y: 0.5, z: 1, type: 8 });
  foundationItems.push({ x: -2, y: 0.5, z: 2, type: 8 });
  foundationItems.push({ x: 2, y: 0.5, z: -2, type: 8 });

  // Foundation grows out from center to avoid a long strip startup frame.
  pushCenterPass(foundationItems, 0.05, FOUNDATION_END, {
    centerX: 0,
    centerZ: 0,
    sortWithinDistance: (a, b) => (a.y - b.y) || (a.x - b.x)
  });

  // Section II - build a simple hut (home) with a door opening and roof.
  const house = [];
  const houseMinX = -1;
  const houseMaxX = 1;
  const houseMinZ = 2;
  const houseMaxZ = 4;
  const wallTopY = 3;
  const roofBaseY = 4;
  const roofPeakY = 5;

  // Wall ring with front door opening at x=0, z=houseMinZ (two-block tall door).
  // Two window holes are carved on left/right walls at eye level.
  for (let y = 1; y <= wallTopY; y++) {
    for (let x = houseMinX; x <= houseMaxX; x++) {
      for (let z = houseMinZ; z <= houseMaxZ; z++) {
        const isEdge = x === houseMinX || x === houseMaxX || z === houseMinZ || z === houseMaxZ;
        if (!isEdge) continue;
        const isDoorOpening = z === houseMinZ && x === 0 && y <= 2;
        const isWindowOpening = y === 2 && z === 3 && (x === houseMinX || x === houseMaxX);
        if (isDoorOpening || isWindowOpening) continue;
        house.push({ x, y, z, type: 7 });
      }
    }
  }

  // Door lintel and center support in the back wall.
  house.push({ x: 0, y: 3, z: houseMinZ, type: 7 });
  house.push({ x: 0, y: 2, z: houseMaxZ, type: 7 });

  // Layered roof: broad base and a smaller cap.
  for (let x = houseMinX - 1; x <= houseMaxX + 1; x++) {
    for (let z = houseMinZ - 1; z <= houseMaxZ + 1; z++) {
      house.push({ x, y: roofBaseY, z, type: 9 });
    }
  }

  for (let x = houseMinX; x <= houseMaxX; x++) {
    for (let z = houseMinZ; z <= houseMaxZ; z++) {
      house.push({ x, y: roofPeakY, z, type: 9 });
    }
  }

  // Small stone chimney on back-right of the roof.
  house.push({ x: houseMaxX, y: roofPeakY + 1, z: houseMaxZ, type: 3 });
  house.push({ x: houseMaxX, y: roofPeakY + 2, z: houseMaxZ, type: 3 });

  pushZPass(house, BUILD_START, BUILD_END, {
    sortWithinLayer: (a, b) => (a.y - b.y) || (a.x - b.x)
  });

  // Temporary scaffolding around the house (removed in section III).
  const scaffold = [];
  for (let y = 1; y <= roofPeakY; y++) {
    scaffold.push({ x: houseMinX - 1, y, z: houseMinZ, type: 10 });
    scaffold.push({ x: houseMaxX + 1, y, z: houseMinZ, type: 10 });
    scaffold.push({ x: houseMinX - 1, y, z: houseMaxZ, type: 10 });
    scaffold.push({ x: houseMaxX + 1, y, z: houseMaxZ, type: 10 });

    if (y % 2 === 0) {
      scaffold.push({ x: houseMinX, y, z: houseMinZ - 1, type: 10 });
      scaffold.push({ x: 0, y, z: houseMinZ - 1, type: 10 });
      scaffold.push({ x: houseMaxX, y, z: houseMinZ - 1, type: 10 });
      scaffold.push({ x: houseMinX, y, z: houseMaxZ + 1, type: 10 });
      scaffold.push({ x: 0, y, z: houseMaxZ + 1, type: 10 });
      scaffold.push({ x: houseMaxX, y, z: houseMaxZ + 1, type: 10 });
    }
  }

  const scaffoldBuildStart = BUILD_START + 0.02;
  const scaffoldBuildEnd = BUILD_END - 0.02;
  const scaffoldTakedownAt = FINISHED_START + 0.08;
  const scaffoldTemp = [];

  pushZPass(scaffold, scaffoldBuildStart, scaffoldBuildEnd, {
    sortWithinLayer: (a, b) => (a.y - b.y) || (a.x - b.x)
  });

  const scaffoldCount = scaffold.length;
  if (scaffoldCount > 0) {
    for (let i = blocks.length - scaffoldCount; i < blocks.length; i++) {
      scaffoldTemp.push({ ...blocks[i], disappearAt: scaffoldTakedownAt });
    }
    blocks.splice(blocks.length - scaffoldCount, scaffoldCount, ...scaffoldTemp);
  }

  return blocks;
}

function getGlobalProgress(activeBeatIndex, totalBeats, progress) {
  const clamped = Math.max(0, Math.min(1, progress));
  if (totalBeats <= 1) return clamped;
  return (activeBeatIndex + clamped) / (totalBeats - 1);
}

function keyframeTarget(globalProgress) {
  const g = Math.max(0, Math.min(1, globalProgress));

  const keyframes = [
    { t: 0, rotY: 0.08, camX: 0.4, camY: 3.4, camZ: 9.8, lookX: 0, lookY: 0.7, lookZ: 0, ambient: 0.48, dir: 0.88, bg: 0x425869 },
    { t: 0.3, rotY: 0.56, camX: 0.9, camY: 3.2, camZ: 8.5, lookX: 0, lookY: 0.7, lookZ: 0.5, ambient: 0.58, dir: 0.9, bg: 0x5d8296 },
    { t: 0.55, rotY: 1.38, camX: -1.2, camY: 2.8, camZ: 7.4, lookX: 0, lookY: 0.9, lookZ: 1.2, ambient: 0.44, dir: 0.98, bg: 0x4a5f73 },
    { t: 0.8, rotY: 2.2, camX: -0.3, camY: 4.4, camZ: 9.6, lookX: 0, lookY: 1.0, lookZ: 2.2, ambient: 0.62, dir: 0.8, bg: 0x6f8fa2 },
    { t: 1, rotY: 2.9, camX: 0.1, camY: 3.9, camZ: 10.9, lookX: 0, lookY: 1.6, lookZ: 3.2, ambient: 0.74, dir: 0.74, bg: 0x95b7c9 }
  ];

  let from = keyframes[0];
  let to = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (g >= keyframes[i].t && g <= keyframes[i + 1].t) {
      from = keyframes[i];
      to = keyframes[i + 1];
      break;
    }
  }

  const span = Math.max(0.0001, to.t - from.t);
  const local = (g - from.t) / span;
  const lerp = (a, b) => a + (b - a) * local;

  return {
    rotY: lerp(from.rotY, to.rotY),
    camX: lerp(from.camX, to.camX),
    camY: lerp(from.camY, to.camY),
    camZ: lerp(from.camZ, to.camZ),
    lookX: lerp(from.lookX, to.lookX),
    lookY: lerp(from.lookY, to.lookY),
    lookZ: lerp(from.lookZ, to.lookZ),
    ambient: lerp(from.ambient, to.ambient),
    dir: lerp(from.dir, to.dir),
    bg: to.bg
  };
}

export function createSceneManager({ canvas, reducedMotion, chapters = [], chapterIds = [] }) {
  const chapterConfig = Array.isArray(chapters) && chapters.length > 0
    ? chapters
    : Array.isArray(chapterIds)
      ? chapterIds.map((id) => ({ id }))
      : [];

  const chapterProgress = Object.fromEntries(chapterConfig.map((chapter) => [chapter.id, 0]));
  const chapterIndex = new Map(chapterConfig.map((chapter, index) => [chapter.id, index]));
  const totalBeats = chapterConfig.length;
  let activeChapterId = chapterConfig[0]?.id ?? "";
  let activeBeatIndex = chapterIndex.get(activeChapterId) ?? 0;
  let motionReducedState = reducedMotion;
  let activeProgress = 0;

  // Three.js setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
  
  const initialWidth = canvas.clientWidth || window.innerWidth;
  const initialHeight = canvas.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 1000);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true,
    alpha: false
  });
  renderer.setSize(initialWidth, initialHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  const sceneBlocks = getStoryBlocks().map((block) => {
    const mesh = createBlock(block.x, block.y, block.z, block.type);
    mesh.visible = false;
    mesh.scale.y = 0.0001;
    scene.add(mesh);
    return { ...block, mesh };
  });

  const visualState = {
    rotY: 0,
    camX: 0,
    camY: 3,
    camZ: 8,
    lookX: 0,
    lookY: 0.7,
    lookZ: 0,
    ambient: 0.6,
    dir: 0.8,
    bgColor: new THREE.Color(0x87ceeb)
  };

  const clock = new THREE.Clock();
  let eventPulse = 0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const globalProgress = getGlobalProgress(activeBeatIndex, totalBeats, activeProgress);
    const target = keyframeTarget(globalProgress);
    const dampFactor = motionReducedState ? 16 : 8;

    visualState.rotY = THREE.MathUtils.damp(visualState.rotY, target.rotY, dampFactor, delta);
    visualState.camX = THREE.MathUtils.damp(visualState.camX, target.camX, dampFactor, delta);
    visualState.camY = THREE.MathUtils.damp(visualState.camY, target.camY, dampFactor, delta);
    visualState.camZ = THREE.MathUtils.damp(visualState.camZ, target.camZ, dampFactor, delta);
    visualState.lookX = THREE.MathUtils.damp(visualState.lookX, target.lookX, dampFactor, delta);
    visualState.lookY = THREE.MathUtils.damp(visualState.lookY, target.lookY, dampFactor, delta);
    visualState.lookZ = THREE.MathUtils.damp(visualState.lookZ, target.lookZ, dampFactor, delta);
    visualState.ambient = THREE.MathUtils.damp(visualState.ambient, target.ambient, dampFactor, delta);
    visualState.dir = THREE.MathUtils.damp(visualState.dir, target.dir, dampFactor, delta);

    const targetColor = new THREE.Color(target.bg);
    visualState.bgColor.lerp(targetColor, 1 - Math.exp(-delta * 6));

    const revealWindow = 0.42;
    const beatFloat = activeBeatIndex + activeProgress;
    sceneBlocks.forEach((block) => {
      const appearBeat = block.appearAt * Math.max(1, totalBeats - 1);
      const reveal = Math.max(0, Math.min(1, (beatFloat - appearBeat + revealWindow) / revealWindow));
      const removeFactor = block.disappearAt
        ? Math.max(0, Math.min(1, (beatFloat - block.disappearAt * Math.max(1, totalBeats - 1) + revealWindow) / revealWindow))
        : 0;
      const finalReveal = Math.max(0, reveal * (1 - removeFactor));
      const targetScale = Math.max(0.0001, finalReveal);
      const targetY = block.y - (1 - finalReveal) * 0.55;

      block.mesh.visible = finalReveal > 0.002 || block.mesh.scale.y > 0.002;
      block.mesh.scale.y = THREE.MathUtils.damp(block.mesh.scale.y, targetScale, 12, delta);
      block.mesh.position.y = THREE.MathUtils.damp(block.mesh.position.y, targetY, 10, delta);
    });

    eventPulse = THREE.MathUtils.damp(eventPulse, 0, 5, delta);

    scene.rotation.y = visualState.rotY;
    camera.position.set(visualState.camX, visualState.camY, visualState.camZ);
    camera.lookAt(visualState.lookX, visualState.lookY, visualState.lookZ);
    ambientLight.intensity = visualState.ambient;
    directionalLight.intensity = visualState.dir + eventPulse * 0.22;
    scene.background.copy(visualState.bgColor);

    renderer.render(scene, camera);
  }

  animate();

  function setChapter(id) {
    const nextBeatIndex = chapterIndex.get(id) ?? activeBeatIndex;
    if (nextBeatIndex !== activeBeatIndex) {
      eventPulse = 1;
    }
    activeChapterId = id;
    activeBeatIndex = nextBeatIndex;
    activeProgress = chapterProgress[id] ?? 0;
  }

  function setChapterProgress(id, progress) {
    chapterProgress[id] = progress;
    if (id === activeChapterId) {
      activeProgress = progress;
    }
  }

  function setReducedMotion(nextValue) {
    motionReducedState = nextValue;
  }

  function pulseAtPointer(clientX, clientY) {
    eventPulse = Math.max(eventPulse, 0.6);
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("beforeunload", () => {
    renderer.dispose();
  });

  return {
    setChapter,
    setChapterProgress,
    setReducedMotion,
    pulseAtPointer,
    resize
  };
}
