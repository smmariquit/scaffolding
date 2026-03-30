import * as THREE from "three";

function createNoiseCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createScanlineCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(255,255,255,0)";
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 3) {
    const alpha = y % 6 === 0 ? 0.22 : 0.08;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, y, width, 1);
  }

  return canvas;
}

export function createCRTScene() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0x2d332f, 0.5);
  const key = new THREE.PointLight(0xffb35b, 16, 30);
  key.position.set(1.8, 1.4, 2.8);
  const fill = new THREE.PointLight(0x93ffc3, 8, 24);
  fill.position.set(-1.6, 0.8, 2.1);
  group.add(ambient, key, fill);

  const bodyGeometry = new THREE.BoxGeometry(2.4, 1.95, 1.6);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.62,
    metalness: 0.1
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = false;
  body.receiveShadow = false;
  group.add(body);

  const bezelGeometry = new THREE.BoxGeometry(1.85, 1.28, 0.2);
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: 0x201d17,
    roughness: 0.45,
    metalness: 0.06
  });
  const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
  bezel.position.z = 0.74;
  group.add(bezel);

  const noiseCanvas = createNoiseCanvas(256, 192);
  const noiseCtx = noiseCanvas.getContext("2d");
  const noiseTexture = new THREE.CanvasTexture(noiseCanvas);
  noiseTexture.colorSpace = THREE.SRGBColorSpace;
  noiseTexture.minFilter = THREE.LinearFilter;
  noiseTexture.magFilter = THREE.LinearFilter;

  const screenGeometry = new THREE.PlaneGeometry(1.48, 1.04, 1, 1);
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0xb0ffc8,
    emissive: 0x86ffba,
    emissiveIntensity: 0.45,
    map: noiseTexture,
    roughness: 0.2,
    metalness: 0.03
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.z = 0.84;
  group.add(screen);

  const glassGeometry = new THREE.PlaneGeometry(1.52, 1.08, 1, 1);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.09,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.55
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.z = 0.87;
  group.add(glass);

  const scanlineTexture = new THREE.CanvasTexture(createScanlineCanvas(64, 64));
  scanlineTexture.wrapS = THREE.RepeatWrapping;
  scanlineTexture.wrapT = THREE.RepeatWrapping;
  scanlineTexture.repeat.set(1, 3);

  const scanlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xd6ffe7,
    alphaMap: scanlineTexture,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const scanline = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.06), scanlineMaterial);
  scanline.position.z = 0.855;
  group.add(scanline);

  const panelGeometry = new THREE.BoxGeometry(0.36, 1.24, 0.1);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f2a22,
    roughness: 0.5,
    metalness: 0.08
  });
  const sidePanel = new THREE.Mesh(panelGeometry, panelMaterial);
  sidePanel.position.set(0.96, 0, 0.75);
  group.add(sidePanel);

  const knobGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 24);
  const knobMaterial = new THREE.MeshStandardMaterial({
    color: 0xd0b27d,
    emissive: 0x5f4a22,
    emissiveIntensity: 0.25,
    roughness: 0.25,
    metalness: 0.35
  });

  const knobTop = new THREE.Mesh(knobGeometry, knobMaterial);
  knobTop.rotation.x = Math.PI / 2;
  knobTop.position.set(0.96, 0.35, 0.84);

  const knobBottom = new THREE.Mesh(knobGeometry, knobMaterial);
  knobBottom.rotation.x = Math.PI / 2;
  knobBottom.position.set(0.96, -0.05, 0.84);

  group.add(knobTop, knobBottom);

  const speakerGeometry = new THREE.BoxGeometry(0.2, 0.012, 0.04);
  const speakerMaterial = new THREE.MeshStandardMaterial({
    color: 0x726857,
    roughness: 0.65,
    metalness: 0.12
  });

  for (let i = 0; i < 7; i += 1) {
    const slat = new THREE.Mesh(speakerGeometry, speakerMaterial);
    slat.position.set(0.96, -0.32 + i * 0.08, 0.84);
    group.add(slat);
  }

  const antennaGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.1, 10);
  const antennaMaterial = new THREE.MeshStandardMaterial({
    color: 0xa4aa9b,
    emissive: 0x3e4038,
    emissiveIntensity: 0.2,
    roughness: 0.32,
    metalness: 0.42
  });

  const antennaLeft = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antennaLeft.position.set(-0.42, 1.25, 0);
  antennaLeft.rotation.z = 0.42;

  const antennaRight = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antennaRight.position.set(0.42, 1.25, 0);
  antennaRight.rotation.z = -0.42;

  group.add(antennaLeft, antennaRight);

  const standStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.3, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a2823, roughness: 0.6, metalness: 0.1 })
  );
  standStem.position.set(0, -1.05, 0);

  const standBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.56, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a2823, roughness: 0.64, metalness: 0.12 })
  );
  standBase.position.set(0, -1.24, 0);

  group.add(standStem, standBase);

  let chapterProgress = 0;
  let pulseAmount = 0;
  let frameCounter = 0;

  function drawNoise(time, intensity) {
    const width = noiseCanvas.width;
    const height = noiseCanvas.height;

    noiseCtx.fillStyle = "rgb(8,18,12)";
    noiseCtx.fillRect(0, 0, width, height);

    const bandHeight = Math.floor(18 + intensity * 26);
    const bandY = Math.floor(((time * 46) % (height + bandHeight)) - bandHeight);
    noiseCtx.fillStyle = `rgba(146,255,194,${0.1 + intensity * 0.2})`;
    noiseCtx.fillRect(0, bandY, width, bandHeight);

    const dotCount = Math.floor(550 + intensity * 700);
    for (let i = 0; i < dotCount; i += 1) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const alpha = 0.08 + Math.random() * (0.2 + intensity * 0.34);
      noiseCtx.fillStyle = `rgba(180,255,210,${alpha})`;
      noiseCtx.fillRect(x, y, 1, 1);
    }

    noiseTexture.needsUpdate = true;
  }

  function pulse() {
    pulseAmount = 1;
  }

  function setProgress(progress) {
    chapterProgress = progress;
  }

  function update({ time, reducedMotion, active }) {
    if (!active) return;

    frameCounter += 1;
    pulseAmount *= 0.9;

    const motionFactor = reducedMotion ? 0.35 : 1;
    const intensity = Math.min(1, chapterProgress * 0.85 + pulseAmount * 0.65);

    if (frameCounter % (reducedMotion ? 5 : 2) === 0) {
      drawNoise(time, intensity);
    }

    scanlineTexture.offset.y = (scanlineTexture.offset.y - (reducedMotion ? 0.004 : 0.016)) % 1;
    scanlineMaterial.opacity = 0.12 + intensity * 0.22;

    screenMaterial.emissiveIntensity = 0.3 + intensity * 0.55;
    glassMaterial.opacity = 0.07 + intensity * 0.07;

    knobTop.rotation.z += 0.002 * motionFactor;
    knobBottom.rotation.z -= 0.0015 * motionFactor;

    antennaLeft.rotation.x = Math.sin(time * 1.2) * 0.04 * motionFactor;
    antennaRight.rotation.x = Math.cos(time * 1.2) * 0.04 * motionFactor;

    group.rotation.y = Math.sin(time * 0.5) * 0.08 * motionFactor;
    group.rotation.x = Math.cos(time * 0.35) * 0.03 * motionFactor;
    group.position.y = Math.sin(time * 0.9) * 0.035 * motionFactor;

    const scalePulse = 1 + pulseAmount * 0.06;
    screen.scale.setScalar(scalePulse);
    scanline.scale.setScalar(scalePulse);
  }

  function dispose() {
    bodyGeometry.dispose();
    bezelGeometry.dispose();
    screenGeometry.dispose();
    glassGeometry.dispose();
    panelGeometry.dispose();
    knobGeometry.dispose();
    speakerGeometry.dispose();
    antennaGeometry.dispose();

    bodyMaterial.dispose();
    bezelMaterial.dispose();
    screenMaterial.dispose();
    glassMaterial.dispose();
    panelMaterial.dispose();
    knobMaterial.dispose();
    speakerMaterial.dispose();
    antennaMaterial.dispose();

    standStem.geometry.dispose();
    standStem.material.dispose();
    standBase.geometry.dispose();
    standBase.material.dispose();

    noiseTexture.dispose();
    scanlineTexture.dispose();
    scanlineMaterial.dispose();
  }

  return {
    group,
    setProgress,
    update,
    pulse,
    dispose
  };
}
