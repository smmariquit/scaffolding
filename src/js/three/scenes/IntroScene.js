import * as THREE from "three";

export function createIntroScene() {
  const group = new THREE.Group();
  const dynamicMaterials = [];

  const ambient = new THREE.AmbientLight(0x4f6a52, 0.36);
  const key = new THREE.PointLight(0xffb35b, 20, 30);
  key.position.set(2.6, 1.8, 3.4);
  group.add(ambient, key);

  const fragmentCount = 140;
  const baseGeometry = new THREE.IcosahedronGeometry(0.065, 0);

  for (let i = 0; i < fragmentCount; i += 1) {
    const warm = i % 3 === 0;
    const color = warm ? 0xffb35b : 0x96ffc1;
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: warm ? 0.26 : 0.16,
      roughness: 0.36,
      metalness: 0.06
    });

    dynamicMaterials.push(material);

    const mesh = new THREE.Mesh(baseGeometry, material);
    const ring = 1.4 + (i % 13) * 0.09;
    const angle = (i / fragmentCount) * Math.PI * 2.0;

    mesh.position.set(
      Math.cos(angle) * ring,
      (Math.random() - 0.5) * 2.4,
      Math.sin(angle) * ring
    );

    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    mesh.userData = {
      speed: 0.2 + Math.random() * 0.9,
      drift: Math.random() * Math.PI * 2,
      originalY: mesh.position.y,
      pulse: 0
    };

    group.add(mesh);
  }

  const glowGeometry = new THREE.TorusGeometry(1.3, 0.04, 16, 120);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xe6f7cf,
    transparent: true,
    opacity: 0.25
  });
  const glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
  glowRing.rotation.x = Math.PI / 2.2;
  group.add(glowRing);

  let chapterProgress = 0;
  let pulseAmount = 0;

  function pulse() {
    pulseAmount = 1;
  }

  function setProgress(progress) {
    chapterProgress = progress;
  }

  function update({ time, reducedMotion, active }) {
    if (!active) return;

    const spin = reducedMotion ? 0.0012 : 0.003 + chapterProgress * 0.006;
    group.rotation.y += spin;

    pulseAmount *= 0.92;

    group.children.forEach((node) => {
      if (!(node instanceof THREE.Mesh) || !node.userData.speed) return;

      const wave = Math.sin(time * node.userData.speed + node.userData.drift);
      const amplitude = reducedMotion ? 0.04 : 0.16 + chapterProgress * 0.3;
      node.position.y = node.userData.originalY + wave * amplitude + pulseAmount * 0.8;
      node.rotation.x += 0.002 * node.userData.speed;
      node.rotation.y += 0.003 * node.userData.speed;
      node.scale.setScalar(1 + pulseAmount * 0.45);
    });

    glowRing.scale.setScalar(1 + chapterProgress * 0.44 + pulseAmount * 0.16);
    glowMaterial.opacity = 0.17 + chapterProgress * 0.3;

    const emissiveBoost = 0.15 + chapterProgress * 0.44 + pulseAmount * 0.18;
    dynamicMaterials.forEach((material) => {
      material.emissiveIntensity = emissiveBoost;
    });
  }

  function dispose() {
    baseGeometry.dispose();
    glowGeometry.dispose();
    glowMaterial.dispose();
    dynamicMaterials.forEach((material) => material.dispose());
  }

  return {
    group,
    setProgress,
    update,
    pulse,
    dispose
  };
}
