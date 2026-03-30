import createGame from "voxel-engine";

function chunkGenerator(x, y, z) {
  const height = Math.floor(2 + Math.sin(x / 20) * 2 + Math.cos(z / 20) * 2);
  if (y > height) return 0;
  if (y === height) return 1;
  if (y > height - 3) return 2;
  return 3;
}

export function createSceneManager({ canvas, reducedMotion, chapters = [], chapterIds = [] }) {
  const chapterConfig = Array.isArray(chapters) && chapters.length > 0
    ? chapters
    : Array.isArray(chapterIds)
      ? chapterIds.map((id) => ({ id }))
      : [];

  const chapterProgress = Object.fromEntries(chapterConfig.map((chapter) => [chapter.id, 0]));
  let activeChapterId = chapterConfig[0]?.id ?? "";
  let motionReducedState = reducedMotion;

  const game = createGame({
    generate: chunkGenerator,
    chunkDistance: 3,
    removeDistance: 4,
    worldOrigin: [0, 0, 0],
    materials: [
      ["grass_top", "grass_side", "dirt"],
      "dirt",
      "stone",
      "brick",
      "obsidian"
    ],
    texturePath: "https://cdn.jsdelivr.net/gh/voxel/voxel-texture-pack@master/png/"
  });

  const container = canvas.parentElement ?? document.body;
  game.appendTo(container);
  const view = game.view;
  view.id = "gl-canvas";
  view.setAttribute("aria-hidden", "true");
  if (canvas.parentElement) canvas.replaceWith(view);

  if (game.controls?.target?.()) {
    const target = game.controls.target();
    target.yaw.position.set(0, 18, 0);
    target.pitch.rotation.x = -0.35;
  }

  function setChapter(id) {
    activeChapterId = id;
  }

  function setChapterProgress(id, progress) {
    chapterProgress[id] = progress;
    const level = chapterProgress[activeChapterId] ?? 0;
    if (game.scene?.fog) {
      game.scene.fog.near = motionReducedState ? 8 : 5 + level * 6;
      game.scene.fog.far = motionReducedState ? 120 : 80 + level * 120;
    }
  }

  function setReducedMotion(nextValue) {
    motionReducedState = nextValue;
  }

  function pulseAtPointer(clientX, clientY) {
    if (!game.controls?.target?.()) return;
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = (clientY / window.innerHeight) * 2 - 1;
    const target = game.controls.target();
    target.yaw.rotation.y += nx * 0.03;
    target.pitch.rotation.x = Math.max(-1.1, Math.min(0.3, target.pitch.rotation.x + ny * 0.02));
  }

  function resize() {
    game.resize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("beforeunload", () => {
    game.destroy();
  });

  return {
    setChapter,
    setChapterProgress,
    setReducedMotion,
    pulseAtPointer,
    resize
  };
}
