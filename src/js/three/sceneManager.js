import * as THREE from "three";
import { createIntroScene } from "./scenes/IntroScene.js";
import { createConflictScene } from "./scenes/ConflictScene.js";
import { createLowPointScene } from "./scenes/LowPointScene.js";
import { createRecoveryScene } from "./scenes/RecoveryScene.js";
import { createReflectionScene } from "./scenes/ReflectionScene.js";
import { createCRTScene } from "./scenes/CRTScene.js";

export function createSceneManager({ canvas, reducedMotion, chapters = [], chapterIds = [] }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x09111a, 2.8, 9.4);

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.15, 4.4);

  const clock = new THREE.Clock();

  const scenesByName = {
    CRTScene: createCRTScene(),
    IntroScene: createIntroScene(),
    ConflictScene: createConflictScene(),
    LowPointScene: createLowPointScene(),
    RecoveryScene: createRecoveryScene(),
    ReflectionScene: createReflectionScene()
  };

  const fallbackSceneName = "CRTScene";
  const sceneNames = Object.keys(scenesByName);
  const chapterConfig = Array.isArray(chapters) && chapters.length > 0
    ? chapters
    : Array.isArray(chapterIds)
      ? chapterIds.map((id) => ({ id, scene: fallbackSceneName }))
      : [];
  const normalizedChapterConfig = chapterConfig.map((chapter, index) => ({
    id: chapter.id,
    scene: scenesByName[chapter.scene] ? chapter.scene : sceneNames[index % sceneNames.length]
  }));
  const chapterIdsList = normalizedChapterConfig.map((chapter) => chapter.id);
  const chapterSceneLookup = Object.fromEntries(normalizedChapterConfig.map((chapter) => [chapter.id, chapter.scene]));

  function sceneForChapter(chapterId) {
    const sceneName = chapterSceneLookup[chapterId] ?? fallbackSceneName;
    return scenesByName[sceneName] ?? scenesByName[fallbackSceneName];
  }

  Object.values(scenesByName).forEach((chapterScene, index) => {
    chapterScene.group.visible = index === 0;
    scene.add(chapterScene.group);
  });

  const chapterProgress = Object.fromEntries(chapterIdsList.map((id) => [id, 0]));
  let activeChapterId = chapterIdsList[0] ?? null;
  let motionReduced = reducedMotion;

  function setChapter(id) {
    activeChapterId = id;
    const activeScene = sceneForChapter(id);
    Object.values(scenesByName).forEach((chapterScene) => {
      chapterScene.group.visible = chapterScene === activeScene;
    });
  }

  function setChapterProgress(id, progress) {
    chapterProgress[id] = progress;
  }

  function setReducedMotion(nextValue) {
    motionReduced = nextValue;
  }

  function pulseAtPointer(clientX, clientY) {
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = (clientY / window.innerHeight) * 2 - 1;
    const activeScene = sceneForChapter(activeChapterId);

    activeScene.group.rotation.x = ny * 0.1;
    activeScene.group.rotation.z = nx * 0.1;
    activeScene.pulse();
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function render() {
    const elapsed = clock.getElapsedTime();
    const currentProgress = chapterProgress[activeChapterId] ?? 0;
    const activeScene = sceneForChapter(activeChapterId);

    activeScene.setProgress(currentProgress);
    activeScene.update({
      time: elapsed,
      reducedMotion: motionReduced,
      active: true
    });

    const targetZ = motionReduced ? 4.7 : 4.6 - currentProgress * 0.65;
    camera.position.z += (targetZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  window.addEventListener("beforeunload", () => {
    Object.values(scenesByName).forEach((chapterScene) => {
      chapterScene.dispose();
    });
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
