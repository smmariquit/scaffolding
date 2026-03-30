import * as THREE from "three";

export function createReflectionScene() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0x2a2a32, 0.45);
  const soft = new THREE.PointLight(0xf4ebd5, 12, 18);
  soft.position.set(-1.2, 1.3, 2.5);
  group.add(ambient, soft);

  const orbiters = [];
  const sphereGeometry = new THREE.SphereGeometry(0.09, 16, 16);

  const colors = [0xf4ebd5, 0x00d1c7, 0xff6a3d, 0x99b4c2];
  for (let i = 0; i < 36; i += 1) {
    const color = colors[i % colors.length];
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      roughness: 0.38,
      metalness: 0.08
    });

    const orbiter = new THREE.Mesh(sphereGeometry, material);
    orbiter.userData = {
      radius: 1.1 + (i % 9) * 0.2,
      angle: (i / 36) * Math.PI * 2,
      speed: 0.1 + (i % 7) * 0.03,
      yBand: (i % 5) * 0.16 - 0.32
    };
    orbiters.push(orbiter);
    group.add(orbiter);
  }

  const centerGeometry = new THREE.IcosahedronGeometry(0.24, 1);
  const centerMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4ebd5,
    emissive: 0xf4ebd5,
    emissiveIntensity: 0.25,
    roughness: 0.2,
    metalness: 0.08
  });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  group.add(center);

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

    for (const orbiter of orbiters) {
      const { radius, speed, yBand } = orbiter.userData;
      const angle = orbiter.userData.angle + time * speed * (reducedMotion ? 0.5 : 1 + chapterProgress * 0.6);
      orbiter.position.set(
        Math.cos(angle) * radius,
        yBand + Math.sin(angle * 1.3) * 0.12,
        Math.sin(angle) * radius
      );
      orbiter.scale.setScalar(1 + pulseAmount * 0.5);
      orbiter.material.emissiveIntensity = 0.14 + chapterProgress * 0.42 + pulseAmount * 0.25;
    }

    center.rotation.x += 0.004;
    center.rotation.y += 0.006;
    center.scale.setScalar(1 + chapterProgress * 0.4 + pulseAmount * 0.28);
    group.rotation.y += 0.0018;
  }

  function dispose() {
    sphereGeometry.dispose();
    centerGeometry.dispose();
    centerMaterial.dispose();
    orbiters.forEach((orbiter) => {
      orbiter.material.dispose();
    });
  }

  return { group, setProgress, pulse, update, dispose };
}
