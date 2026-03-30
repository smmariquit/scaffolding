import * as THREE from "three";

export function createLowPointScene() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0x141a28, 0.4);
  const rim = new THREE.PointLight(0x00d1c7, 7, 12);
  rim.position.set(0, 0, 1.8);
  group.add(ambient, rim);

  const rings = [];
  const ringGeometry = new THREE.TorusGeometry(0.6, 0.028, 8, 72);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x4f6d7e,
    emissive: 0x0e1620,
    emissiveIntensity: 0.22,
    roughness: 0.6,
    metalness: 0.1
  });

  for (let i = 0; i < 16; i += 1) {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -i * 0.42;
    ring.scale.setScalar(1 + i * 0.07);
    rings.push(ring);
    group.add(ring);
  }

  const coreGeometry = new THREE.SphereGeometry(0.12, 18, 18);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xf4ebd5, transparent: true, opacity: 0.75 });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.z = -5.2;
  group.add(core);

  let chapterProgress = 0;
  let pulseAmount = 0;

  function setProgress(progress) {
    chapterProgress = progress;
  }

  function pulse() {
    pulseAmount = 1;
  }

  function update({ time, reducedMotion, active }) {
    if (!active) return;

    pulseAmount *= 0.9;

    for (let i = 0; i < rings.length; i += 1) {
      const ring = rings[i];
      const p = i / rings.length;
      const wobble = reducedMotion ? 0.01 : Math.sin(time * 0.75 + i * 0.35) * 0.045;
      ring.rotation.z += (0.002 + p * 0.004) * (reducedMotion ? 0.5 : 1);
      ring.position.x = wobble * (1 + chapterProgress);
      ring.material.emissiveIntensity = 0.08 + chapterProgress * 0.4 + pulseAmount * 0.25;
    }

    core.scale.setScalar(1 + chapterProgress * 0.65 + pulseAmount * 0.5);
    coreMaterial.opacity = 0.45 + chapterProgress * 0.45;
    group.position.z = reducedMotion ? 0 : Math.sin(time * 0.36) * 0.08;
  }

  function dispose() {
    ringGeometry.dispose();
    ringMaterial.dispose();
    coreGeometry.dispose();
    coreMaterial.dispose();
  }

  return { group, setProgress, pulse, update, dispose };
}
