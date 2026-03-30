import p5 from "p5";

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function createSceneManager({ canvas, reducedMotion, chapters = [], chapterIds = [] }) {
  const chapterConfig = Array.isArray(chapters) && chapters.length > 0
    ? chapters
    : Array.isArray(chapterIds)
      ? chapterIds.map((id) => ({ id }))
      : [];

  const chapterProgress = Object.fromEntries(chapterConfig.map((chapter) => [chapter.id, 0]));
  let activeChapterId = chapterConfig[0]?.id ?? "";
  let motionReduced = reducedMotion;
  let pulse = 0;
  let pulseTiltX = 0;
  let pulseTiltY = 0;

  let instance = null;

  const sketch = (p) => {
    let noiseLayer;
    let scanlineLayer;
    let frameCounter = 0;

    function drawNoise(time, intensity, phase) {
      noiseLayer.background(8, 18, 12);

      const bandHeight = Math.floor(18 + intensity * 28);
      const bandY = Math.floor(((time * 44 + phase * 27) % (noiseLayer.height + bandHeight)) - bandHeight);
      noiseLayer.noStroke();
      noiseLayer.fill(155, 255, 205, 35 + intensity * 60);
      noiseLayer.rect(0, bandY, noiseLayer.width, bandHeight);

      const dotCount = Math.floor(520 + intensity * 900);
      for (let i = 0; i < dotCount; i += 1) {
        const x = Math.floor(p.random(noiseLayer.width));
        const y = Math.floor(p.random(noiseLayer.height));
        const alpha = 28 + p.random(55 + intensity * 80);
        noiseLayer.stroke(190, 255, 220, alpha);
        noiseLayer.point(x, y);
      }
    }

    function drawScanlines(offsetY) {
      scanlineLayer.clear();
      scanlineLayer.translate(0, offsetY % 6);
      for (let y = -6; y < scanlineLayer.height + 6; y += 3) {
        const alpha = y % 6 === 0 ? 55 : 24;
        scanlineLayer.noStroke();
        scanlineLayer.fill(220, 255, 232, alpha);
        scanlineLayer.rect(0, y, scanlineLayer.width, 1);
      }
    }

    p.setup = () => {
      const parent = canvas.parentElement ?? document.body;
      const renderer = p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
      renderer.elt.id = "gl-canvas";
      renderer.elt.setAttribute("aria-hidden", "true");

      if (canvas && canvas.parentElement) {
        canvas.replaceWith(renderer.elt);
      } else {
        parent.appendChild(renderer.elt);
      }

      noiseLayer = p.createGraphics(256, 192);
      scanlineLayer = p.createGraphics(256, 192);

      p.noStroke();
      p.angleMode(p.RADIANS);
    };

    p.draw = () => {
      const time = p.millis() * 0.001;
      const progress = chapterProgress[activeChapterId] ?? 0;
      const phase = activeChapterId ? (hashString(activeChapterId) % 1000) / 1000 : 0;
      const motionFactor = motionReduced ? 0.35 : 1;

      pulse *= 0.9;
      frameCounter += 1;

      const intensity = p.constrain(progress * 0.86 + pulse * 0.66, 0, 1);

      if (frameCounter % (motionReduced ? 5 : 2) === 0) {
        drawNoise(time, intensity, phase);
      }

      drawScanlines(-(motionReduced ? 0.5 : 1.8) * frameCounter);

      p.clear();
      p.push();
      p.translate(0, Math.sin(time * 0.9 + phase) * 8 * motionFactor, 0);
      p.rotateY(Math.sin(time * 0.52 + phase) * 0.12 * motionFactor + pulseTiltX * 0.08 * pulse);
      p.rotateX(Math.cos(time * 0.36 + phase) * 0.05 * motionFactor - pulseTiltY * 0.07 * pulse);

      p.ambientLight(70, 82, 72);
      p.pointLight(255, 179, 91, 180, -80, 280);
      p.pointLight(147, 255, 195, -180, -20, 230);

      p.push();
      p.fill(56, 48, 39);
      p.specularMaterial(80, 74, 61);
      p.box(240, 195, 160);
      p.pop();

      p.push();
      p.translate(0, 0, 74);
      p.fill(33, 30, 24);
      p.box(186, 130, 22);
      p.pop();

      const pulseScale = 1 + pulse * 0.06;
      p.push();
      p.translate(0, 0, 84);
      p.scale(pulseScale, pulseScale, 1);
      p.texture(noiseLayer);
      p.plane(148, 104);

      p.tint(220, 255, 230, 70 + intensity * 120);
      p.texture(scanlineLayer);
      p.plane(150, 106);
      p.noTint();
      p.pop();

      p.push();
      p.translate(0, 0, 87);
      p.fill(240, 255, 246, 26 + intensity * 22);
      p.plane(152, 108);
      p.pop();

      p.push();
      p.translate(96, 0, 74);
      p.fill(47, 42, 34);
      p.box(36, 124, 10);

      p.push();
      p.translate(0, -35, 9);
      p.rotateX(Math.PI / 2);
      p.rotateZ(time * 0.4 * motionFactor);
      p.fill(208, 178, 125);
      p.cylinder(8, 6, 20);
      p.pop();

      p.push();
      p.translate(0, 5, 9);
      p.rotateX(Math.PI / 2);
      p.rotateZ(-time * 0.3 * motionFactor);
      p.fill(208, 178, 125);
      p.cylinder(8, 6, 20);
      p.pop();

      p.fill(115, 104, 86);
      for (let i = 0; i < 7; i += 1) {
        p.push();
        p.translate(0, -32 + i * 8, 9);
        p.box(20, 1.4, 4);
        p.pop();
      }
      p.pop();

      p.push();
      p.translate(-42, -126, 0);
      p.rotateZ(0.42);
      p.rotateX(Math.sin(time * 1.2 + phase) * 0.06 * motionFactor);
      p.fill(166, 170, 156);
      p.cylinder(1.2, 110, 8);
      p.pop();

      p.push();
      p.translate(42, -126, 0);
      p.rotateZ(-0.42);
      p.rotateX(Math.cos(time * 1.2 + phase) * 0.06 * motionFactor);
      p.fill(166, 170, 156);
      p.cylinder(1.2, 110, 8);
      p.pop();

      p.push();
      p.translate(0, 105, 0);
      p.fill(42, 40, 35);
      p.cylinder(10, 30, 20);
      p.translate(0, 18, 0);
      p.cylinder(62, 8, 24);
      p.pop();

      p.pop();
    };

    p.windowResized = () => {
      p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
  };

  instance = new p5(sketch);

  function setChapter(id) {
    activeChapterId = id;
  }

  function setChapterProgress(id, progress) {
    chapterProgress[id] = progress;
  }

  function setReducedMotion(nextValue) {
    motionReduced = nextValue;
  }

  function pulseAtPointer(clientX, clientY) {
    pulse = 1;
    pulseTiltX = (clientX / window.innerWidth) * 2 - 1;
    pulseTiltY = (clientY / window.innerHeight) * 2 - 1;
  }

  function resize() {
    instance?.resizeCanvas(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("beforeunload", () => {
    instance?.remove();
  });

  return {
    setChapter,
    setChapterProgress,
    setReducedMotion,
    pulseAtPointer,
    resize
  };
}
