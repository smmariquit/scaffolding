import * as THREE from "three";

export function createConflictScene() {
  const group = new THREE.Group();
  const shardMaterial = new THREE.MeshStandardMaterial({
    color: 0xb3552f,
    emissive: 0xffa15e,
    emissiveIntensity: 0.24,
    roughness: 0.34,
    metalness: 0.12
  });

  const ambient = new THREE.AmbientLight(0x3d2b1d, 0.28);
  const point = new THREE.PointLight(0xffaf68, 24, 25);
  point.position.set(-0.5, 1.2, 2.8);
  group.add(ambient, point);

  const shardGeometry = new THREE.TetrahedronGeometry(0.12, 0);
  const shards = [];

  for (let i = 0; i < 120; i += 1) {
    const mesh = new THREE.Mesh(shardGeometry, shardMaterial);
    mesh.position.set(
      (Math.random() - 0.5) * 4.4,
      (Math.random() - 0.5) * 2.8,
      (Math.random() - 0.5) * 3.2
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData = {
      drift: Math.random() * Math.PI * 2,
      speed: 0.45 + Math.random() * 1.2,
      baseX: mesh.position.x,
      baseY: mesh.position.y
    };
    shards.push(mesh);
    group.add(mesh);
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

    pulseAmount *= 0.9;
    const chaos = reducedMotion ? 0.1 : 0.26 + chapterProgress * 0.84;

    group.rotation.y += reducedMotion ? 0.001 : 0.004 + chapterProgress * 0.01;
    group.rotation.x = Math.sin(time * 0.2) * 0.08;

    for (const shard of shards) {
      const wobble = Math.sin(time * shard.userData.speed + shard.userData.drift);
      shard.position.x = shard.userData.baseX + wobble * chaos * 0.45;
      shard.position.y = shard.userData.baseY + Math.cos(time * shard.userData.speed) * chaos * 0.25;
      shard.rotation.x += 0.008 * shard.userData.speed * (1 + chapterProgress);
      shard.rotation.y += 0.006 * shard.userData.speed * (1 + chapterProgress);
      shard.scale.setScalar(1 + pulseAmount * 0.55);
    }

    shardMaterial.emissiveIntensity = 0.2 + chapterProgress * 0.58 + pulseAmount * 0.28;
  }

  function dispose() {
    shardGeometry.dispose();
    shardMaterial.dispose();
  }

  return { group, setProgress, pulse, update, dispose };
}
