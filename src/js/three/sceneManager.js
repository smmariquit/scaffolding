import {
  ArcRotateCamera,
  Color3,
  DynamicTexture,
  Engine,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from "@babylonjs/core";

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function drawScanlines(texture) {
  const ctx = texture.getContext();
  const size = texture.getSize();
  ctx.clearRect(0, 0, size.width, size.height);

  for (let y = 0; y < size.height; y += 3) {
    const alpha = y % 6 === 0 ? 0.2 : 0.08;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, y, size.width, 1);
  }

  texture.update(false);
}

function drawNoise(texture, time, intensity, phase) {
  const ctx = texture.getContext();
  const size = texture.getSize();

  ctx.fillStyle = "rgb(8,18,12)";
  ctx.fillRect(0, 0, size.width, size.height);

  const bandHeight = Math.floor(16 + intensity * 28);
  const bandY = Math.floor(((time * 42 + phase * 25) % (size.height + bandHeight)) - bandHeight);
  ctx.fillStyle = `rgba(152,255,204,${0.08 + intensity * 0.22})`;
  ctx.fillRect(0, bandY, size.width, bandHeight);

  const dotCount = Math.floor(450 + intensity * 840);
  for (let i = 0; i < dotCount; i += 1) {
    const x = Math.floor(Math.random() * size.width);
    const y = Math.floor(Math.random() * size.height);
    const alpha = 0.08 + Math.random() * (0.16 + intensity * 0.32);
    ctx.fillStyle = `rgba(190,255,220,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  texture.update(false);
}

export function createSceneManager({ canvas, reducedMotion, chapters = [], chapterIds = [] }) {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
  const scene = new Scene(engine);
  scene.clearColor.set(0, 0, 0, 0);

  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2.4, 5.5, new Vector3(0, -0.05, 0), scene);
  camera.lowerRadiusLimit = 4.8;
  camera.upperRadiusLimit = 6.3;
  camera.wheelPrecision = 800;

  const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.62;
  const key = new PointLight("key", new Vector3(1.8, 1.6, 2.8), scene);
  key.intensity = 28;
  const fill = new PointLight("fill", new Vector3(-1.7, 0.9, 2.1), scene);
  fill.intensity = 14;

  const root = new TransformNode("crt-root", scene);

  const body = MeshBuilder.CreateBox("tv-body", { width: 2.4, height: 1.95, depth: 1.6 }, scene);
  body.parent = root;
  const bodyMaterial = new StandardMaterial("body-mat", scene);
  bodyMaterial.diffuseColor = Color3.FromHexString("#3a3228");
  bodyMaterial.specularColor = Color3.FromHexString("#111111");
  body.material = bodyMaterial;

  const bezel = MeshBuilder.CreateBox("tv-bezel", { width: 1.85, height: 1.28, depth: 0.2 }, scene);
  bezel.parent = root;
  bezel.position.z = 0.74;
  const bezelMaterial = new StandardMaterial("bezel-mat", scene);
  bezelMaterial.diffuseColor = Color3.FromHexString("#201d17");
  bezelMaterial.specularPower = 32;
  bezel.material = bezelMaterial;

  const screen = MeshBuilder.CreatePlane("tv-screen", { width: 1.48, height: 1.04 }, scene);
  screen.parent = root;
  screen.position.z = 0.84;

  const noiseTexture = new DynamicTexture("noise-tex", { width: 256, height: 192 }, scene, false);
  const screenMaterial = new StandardMaterial("screen-mat", scene);
  screenMaterial.diffuseTexture = noiseTexture;
  screenMaterial.emissiveTexture = noiseTexture;
  screenMaterial.diffuseColor = Color3.FromHexString("#9fffc7");
  screenMaterial.emissiveColor = Color3.FromHexString("#8fffbf");
  screenMaterial.specularColor = Color3.FromHexString("#121212");
  screen.material = screenMaterial;

  const glass = MeshBuilder.CreatePlane("tv-glass", { width: 1.52, height: 1.08 }, scene);
  glass.parent = root;
  glass.position.z = 0.87;
  const glassMaterial = new StandardMaterial("glass-mat", scene);
  glassMaterial.diffuseColor = Color3.FromHexString("#f2fff8");
  glassMaterial.alpha = 0.1;
  glassMaterial.specularColor = Color3.FromHexString("#ffffff");
  glassMaterial.specularPower = 128;
  glass.material = glassMaterial;

  const scanline = MeshBuilder.CreatePlane("tv-scanline", { width: 1.5, height: 1.06 }, scene);
  scanline.parent = root;
  scanline.position.z = 0.855;
  const scanlineTexture = new DynamicTexture("scanline-tex", { width: 64, height: 64 }, scene, false);
  drawScanlines(scanlineTexture);
  const scanlineMaterial = new StandardMaterial("scanline-mat", scene);
  scanlineMaterial.diffuseTexture = scanlineTexture;
  scanlineMaterial.opacityTexture = scanlineTexture;
  scanlineMaterial.emissiveTexture = scanlineTexture;
  scanlineMaterial.diffuseColor = Color3.FromHexString("#d6ffe7");
  scanlineMaterial.emissiveColor = Color3.FromHexString("#c4ffd9");
  scanlineMaterial.alpha = 0.2;
  scanlineMaterial.specularColor = Color3.Black();
  scanline.material = scanlineMaterial;

  const panel = MeshBuilder.CreateBox("side-panel", { width: 0.36, height: 1.24, depth: 0.1 }, scene);
  panel.parent = root;
  panel.position.set(0.96, 0, 0.75);
  const panelMaterial = new StandardMaterial("panel-mat", scene);
  panelMaterial.diffuseColor = Color3.FromHexString("#2f2a22");
  panel.material = panelMaterial;

  const knobMaterial = new StandardMaterial("knob-mat", scene);
  knobMaterial.diffuseColor = Color3.FromHexString("#d0b27d");
  knobMaterial.emissiveColor = Color3.FromHexString("#604b23");

  const knobTop = MeshBuilder.CreateCylinder("knob-top", { diameter: 0.16, height: 0.06, tessellation: 24 }, scene);
  knobTop.parent = root;
  knobTop.rotation.x = Math.PI / 2;
  knobTop.position.set(0.96, 0.35, 0.84);
  knobTop.material = knobMaterial;

  const knobBottom = MeshBuilder.CreateCylinder("knob-bottom", { diameter: 0.16, height: 0.06, tessellation: 24 }, scene);
  knobBottom.parent = root;
  knobBottom.rotation.x = Math.PI / 2;
  knobBottom.position.set(0.96, -0.05, 0.84);
  knobBottom.material = knobMaterial;

  const speakerMaterial = new StandardMaterial("speaker-mat", scene);
  speakerMaterial.diffuseColor = Color3.FromHexString("#726857");
  for (let i = 0; i < 7; i += 1) {
    const slat = MeshBuilder.CreateBox(`speaker-${i}`, { width: 0.2, height: 0.012, depth: 0.04 }, scene);
    slat.parent = root;
    slat.position.set(0.96, -0.32 + i * 0.08, 0.84);
    slat.material = speakerMaterial;
  }

  const antennaMaterial = new StandardMaterial("antenna-mat", scene);
  antennaMaterial.diffuseColor = Color3.FromHexString("#a4aa9b");

  const antennaLeft = MeshBuilder.CreateCylinder("antenna-left", { diameter: 0.024, height: 1.1, tessellation: 10 }, scene);
  antennaLeft.parent = root;
  antennaLeft.position.set(-0.42, 1.25, 0);
  antennaLeft.rotation.z = 0.42;
  antennaLeft.material = antennaMaterial;

  const antennaRight = MeshBuilder.CreateCylinder("antenna-right", { diameter: 0.024, height: 1.1, tessellation: 10 }, scene);
  antennaRight.parent = root;
  antennaRight.position.set(0.42, 1.25, 0);
  antennaRight.rotation.z = -0.42;
  antennaRight.material = antennaMaterial;

  const stem = MeshBuilder.CreateCylinder("stand-stem", { diameterTop: 0.08, diameterBottom: 0.1, height: 0.3, tessellation: 18 }, scene);
  stem.parent = root;
  stem.position.set(0, -1.05, 0);
  stem.material = panelMaterial;

  const base = MeshBuilder.CreateCylinder("stand-base", { diameterTop: 1.24, diameterBottom: 1.12, height: 0.08, tessellation: 24 }, scene);
  base.parent = root;
  base.position.set(0, -1.24, 0);
  base.material = panelMaterial;

  const chapterConfig = Array.isArray(chapters) && chapters.length > 0
    ? chapters
    : Array.isArray(chapterIds)
      ? chapterIds.map((id) => ({ id }))
      : [];
  const chapterIdsList = chapterConfig.map((chapter) => chapter.id);

  const chapterProgress = Object.fromEntries(chapterIdsList.map((id) => [id, 0]));
  let activeChapterId = chapterIdsList[0] ?? "";
  let reduced = reducedMotion;
  let pulse = 0;
  let pulseTiltX = 0;
  let pulseTiltY = 0;
  let frameCounter = 0;

  function setChapter(id) {
    activeChapterId = id;
  }

  function setChapterProgress(id, progress) {
    chapterProgress[id] = progress;
  }

  function setReducedMotion(nextValue) {
    reduced = nextValue;
  }

  function pulseAtPointer(clientX, clientY) {
    pulse = 1;
    pulseTiltX = (clientX / window.innerWidth) * 2 - 1;
    pulseTiltY = (clientY / window.innerHeight) * 2 - 1;
  }

  function resize() {
    engine.resize();
  }

  engine.runRenderLoop(() => {
    const time = performance.now() * 0.001;
    const progress = chapterProgress[activeChapterId] ?? 0;
    const phase = activeChapterId ? (hashString(activeChapterId) % 1000) / 1000 : 0;

    pulse *= 0.9;
    frameCounter += 1;

    const motionFactor = reduced ? 0.35 : 1;
    const intensity = Math.min(1, progress * 0.85 + pulse * 0.65);

    if (frameCounter % (reduced ? 5 : 2) === 0) {
      drawNoise(noiseTexture, time, intensity, phase);
    }

    if (scanlineTexture.vOffset <= -1) {
      scanlineTexture.vOffset = 0;
    }
    scanlineTexture.vOffset -= reduced ? 0.004 : 0.015;

    const warm = Color3.FromHexString("#ffb35b");
    const cool = Color3.FromHexString("#93ffc3");
    const mix = (Math.sin(time * 0.9 + phase * Math.PI * 2) + 1) * 0.5;
    screenMaterial.emissiveColor = Color3.Lerp(cool, warm, mix * 0.16);
    screenMaterial.alpha = 0.86 + intensity * 0.1;
    scanlineMaterial.alpha = 0.12 + intensity * 0.23;
    glassMaterial.alpha = 0.07 + intensity * 0.08;

    knobTop.rotation.z += 0.002 * motionFactor;
    knobBottom.rotation.z -= 0.0015 * motionFactor;
    antennaLeft.rotation.x = Math.sin(time * 1.2 + phase) * 0.04 * motionFactor;
    antennaRight.rotation.x = Math.cos(time * 1.2 + phase) * 0.04 * motionFactor;

    root.rotation.y = Math.sin(time * 0.52 + phase) * 0.07 * motionFactor + pulseTiltX * 0.08 * pulse;
    root.rotation.x = Math.cos(time * 0.36 + phase) * 0.03 * motionFactor - pulseTiltY * 0.06 * pulse;
    root.position.y = Math.sin(time * 0.85 + phase) * 0.035 * motionFactor;

    const pulseScale = 1 + pulse * 0.06;
    screen.scaling.set(pulseScale, pulseScale, pulseScale);
    scanline.scaling.set(pulseScale, pulseScale, pulseScale);

    camera.radius += ((reduced ? 5.7 : 5.5 - progress * 0.55) - camera.radius) * 0.07;
    scene.render();
  });

  window.addEventListener("beforeunload", () => {
    scene.dispose();
    engine.dispose();
  });

  return {
    setChapter,
    setChapterProgress,
    setReducedMotion,
    pulseAtPointer,
    resize
  };
}
