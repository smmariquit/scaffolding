import * as THREE from "three";

export function createRecoveryScene() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0x123327, 0.35);
  const key = new THREE.PointLight(0x00d1c7, 16, 20);
  key.position.set(1.4, 1.2, 2.3);
  group.add(ambient, key);

  const blockGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0x00d1c7,
    emissive: 0x00d1c7,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.06
  });

  const blocks = [];
  const latticeTargets = [];
  const grid = 6;

  for (let x = -grid; x <= grid; x += 2) {
    for (let y = -grid; y <= grid; y += 2) {
      const z = ((x + y) % 3) * 0.18;
      latticeTargets.push(new THREE.Vector3(x * 0.12, y * 0.08, z));
    }
  }

  for (const target of latticeTargets) {
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set((Math.random() - 0.5) * 4.4, (Math.random() - 0.5) * 2.7, (Math.random() - 0.5) * 2.4);
    block.userData = {
      target,
      speed: 0.015 + Math.random() * 0.018
    };
    blocks.push(block);
    group.add(block);
  }

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

    pulseAmount *= 0.92;

    for (const block of blocks) {
      const t = reducedMotion ? 0.03 : block.userData.speed + chapterProgress * 0.06;
      block.position.lerp(block.userData.target, t);
      block.rotation.x += 0.004;
      block.rotation.y += 0.006;
      block.scale.setScalar(1 + pulseAmount * 0.45);
    }

    const breathing = reducedMotion ? 0.03 : Math.sin(time * 0.8) * 0.12;
    group.rotation.z = breathing;
    group.rotation.y += 0.0015 + chapterProgress * 0.003;
    blockMaterial.emissiveIntensity = 0.16 + chapterProgress * 0.55 + pulseAmount * 0.24;
  }

  function dispose() {
    blockGeometry.dispose();
    blockMaterial.dispose();
  }

  return { group, setProgress, pulse, update, dispose };
}
