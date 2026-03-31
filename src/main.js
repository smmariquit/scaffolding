import "./style.css";
import Lenis from "lenis";
import { createSceneManager } from "./js/three/sceneManager.js";

const storyRoot = document.querySelector("#story");

let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeChapterId = null;
let timelineBeats = [];
let beatNodes = [];
let sceneManager = null;

const imageMap = new Map();

function normalizeInlineMarkdown(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\\!/g, "!")
    .replace(/\\#/g, "")
    .replace(/#/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitHeadingByColon(text) {
  const separatorIndex = text.indexOf(":");
  if (separatorIndex === -1) {
    return { lead: text, tail: "" };
  }

  const lead = text.slice(0, separatorIndex).trim();
  const tail = text.slice(separatorIndex + 1).trim();
  return { lead, tail };
}

function applyHeadingParts(element, text) {
  const { lead, tail } = splitHeadingByColon(text);
  if (!tail) {
    element.textContent = lead;
    return;
  }

  const leadSpan = document.createElement("span");
  leadSpan.className = "heading-lead";
  leadSpan.textContent = lead;

  const colonSpan = document.createElement("span");
  colonSpan.className = "heading-colon";
  colonSpan.setAttribute("aria-hidden", "true");
  colonSpan.textContent = ":";

  const tailSpan = document.createElement("span");
  tailSpan.className = "heading-tail";
  tailSpan.textContent = tail;

  element.replaceChildren(leadSpan, colonSpan, tailSpan);
}

function parseStoryMarkdown(rawText) {
  const lines = rawText.replace(/\u200b/g, "").replace(/\r/g, "").split("\n");
  const nodes = [];
  let paragraphBuffer = [];
  let partSlug = "intro";
  let sectionSlug = "opening";

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    const text = normalizeInlineMarkdown(paragraphBuffer.join(" "));
    paragraphBuffer = [];
    if (!text) return;
    nodes.push({ type: "p", text, partSlug, sectionSlug });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("## **Image References**")) {
      flushParagraph();
      break;
    }

    if (!line) {
      flushParagraph();
      continue;
    }

    const inlineImage = line.match(/!\[\]\[(image\d+)\]/i);
    if (inlineImage) {
      flushParagraph();
      nodes.push({
        type: "img",
        marker: inlineImage[1].toLowerCase(),
        partSlug,
        sectionSlug
      });
      continue;
    }

    if (/^\[image\d+\]:/i.test(line)) {
      continue;
    }

    if (/^\d+\.\s*###\s*/.test(line) || /^###\s*/.test(line)) {
      flushParagraph();
      const text = normalizeInlineMarkdown(line.replace(/^\d+\.\s*/, "").replace(/^###\s*/, ""));
      sectionSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || sectionSlug;
      nodes.push({ type: "h3", text, partSlug, sectionSlug });
      continue;
    }

    if (/^\d+\.\s*##(?!#)\s*/.test(line) || /^##(?!#)\s*/.test(line)) {
      flushParagraph();
      const text = normalizeInlineMarkdown(line.replace(/^\d+\.\s*/, "").replace(/^##\s*/, ""));
      partSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || partSlug;
      sectionSlug = "overview";
      nodes.push({ type: "h2", text, partSlug, sectionSlug });
      continue;
    }

    if (/^\d+\.\s*$/.test(line)) {
      continue;
    }

    const maybeQuote = normalizeInlineMarkdown(line);
    const isEmphasizedLeadQuote = line.startsWith("*") && line.endsWith("*") && maybeQuote.startsWith("...");
    const isWrappedInQuotes = /^["“].+["”]$/.test(maybeQuote);

    if (isEmphasizedLeadQuote || isWrappedInQuotes) {
      flushParagraph();
      nodes.push({ type: "quote", text: maybeQuote, partSlug, sectionSlug });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return nodes;
}

function hydrateImageMap(imageOrderPayload) {
  imageMap.clear();

  const placements = Array.isArray(imageOrderPayload?.placements) ? imageOrderPayload.placements : [];
  const images = Array.isArray(imageOrderPayload?.images) ? imageOrderPayload.images : [];
  const usableImages = images
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(1); // Drop the first extracted image (title page).

  const markerMeta = new Map();
  placements.forEach((item) => {
    const marker = String(item.marker || "").toLowerCase();
    if (!/^image\d+$/i.test(marker)) return;
    markerMeta.set(marker, {
      line: item.line,
      h2: item.h2,
      h3: item.h3
    });
  });

  markerMeta.forEach((meta, marker) => {
    const markerNumber = Number(marker.replace(/^image/i, ""));
    if (!Number.isFinite(markerNumber) || markerNumber < 1) return;
    const mappedImage = usableImages[markerNumber - 1];
    const src = mappedImage?.relativePath;
    if (!src) return;

    imageMap.set(marker, {
      src,
      line: meta.line,
      h2: meta.h2,
      h3: meta.h3
    });
  });
}

function renderStory(nodes) {
  storyRoot.replaceChildren();
  const storyFlow = document.createElement("article");
  storyFlow.className = "story-flow";

  let currentPart = null;
  let beatCounter = 0;
  beatNodes = [];
  timelineBeats = [];

  nodes.forEach((node) => {
    if (node.type === "h2") {
      currentPart = {
        slug: node.partSlug,
        title: node.text,
        firstBeatId: null
      };

      const heading = document.createElement("h2");
      heading.className = "part-title";
      applyHeadingParts(heading, node.text);
      storyFlow.append(heading);
      return;
    }

    if (node.type === "h3") {
      const subheading = document.createElement("h3");
      subheading.className = "section-title";
      applyHeadingParts(subheading, node.text);
      storyFlow.append(subheading);
      return;
    }

    if (node.type === "p") {
      beatCounter += 1;
      const beatId = `beat-${String(beatCounter).padStart(3, "0")}`;
      const paragraph = document.createElement("p");
      paragraph.className = "story-paragraph chapter-flow";
      paragraph.id = beatId;
      paragraph.dataset.scene = "CRTScene";
      paragraph.dataset.part = node.partSlug;
      paragraph.dataset.section = node.sectionSlug;
      paragraph.textContent = node.text;
      storyFlow.append(paragraph);

      if (currentPart && !currentPart.firstBeatId) {
        currentPart.firstBeatId = beatId;
      }

      timelineBeats.push({ id: beatId, scene: "CRTScene", partSlug: node.partSlug, sectionSlug: node.sectionSlug });
      beatNodes.push(paragraph);
    }

    if (node.type === "quote") {
      beatCounter += 1;
      const beatId = `beat-${String(beatCounter).padStart(3, "0")}`;
      const quote = document.createElement("blockquote");
      quote.className = "story-quote chapter-flow";
      quote.id = beatId;
      quote.dataset.scene = "CRTScene";
      quote.dataset.part = node.partSlug;
      quote.dataset.section = node.sectionSlug;
      quote.textContent = node.text;
      storyFlow.append(quote);

      if (currentPart && !currentPart.firstBeatId) {
        currentPart.firstBeatId = beatId;
      }

      timelineBeats.push({ id: beatId, scene: "CRTScene", partSlug: node.partSlug, sectionSlug: node.sectionSlug });
      beatNodes.push(quote);
      return;
    }

    if (node.type === "img") {
      const imageMeta = imageMap.get(node.marker);
      if (!imageMeta?.src) return;

      const figure = document.createElement("figure");
      figure.className = "story-figure";
      const img = document.createElement("img");
      img.className = "story-image";
      img.src = imageMeta.src;
      img.alt = imageMeta.h3 || imageMeta.h2 || "Story reference image";
      img.loading = "lazy";
      img.decoding = "async";
      figure.append(img);
      storyFlow.append(figure);
    }
  });

  storyRoot.append(storyFlow);

  return timelineBeats[0]?.id ?? null;
}

async function loadStory() {
  const [storyResponse, mapResponse] = await Promise.all([
    fetch("/assets/pdf-images/Scaffolding.md"),
    fetch("/assets/pdf-images/scaffolding-image-order.json")
  ]);

  if (!storyResponse.ok) {
    throw new Error(`Failed to load story source (${storyResponse.status})`);
  }

  if (mapResponse.ok) {
    const imagePayload = await mapResponse.json();
    hydrateImageMap(imagePayload);
  }

  const text = await storyResponse.text();
  return parseStoryMarkdown(text);
}

const lenis = new Lenis({
  smoothWheel: true,
  duration: 1.0,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.12
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

function chapterVisibilityProgress(node) {
  const bounds = node.getBoundingClientRect();
  const viewport = window.innerHeight;
  const center = bounds.top + bounds.height * 0.5;
  const normalized = 1 - Math.min(Math.abs(center - viewport * 0.5) / (viewport * 0.6), 1);
  return Math.max(0, Math.min(1, normalized));
}

function setActiveChapter(id) {
  if (id === activeChapterId) return;
  activeChapterId = id;

  sceneManager?.setChapter(id);
}

function tickStoryState() {
  if (!sceneManager || beatNodes.length === 0) return;
  let best = { id: activeChapterId, value: -1 };

  beatNodes.forEach((beatNode) => {
    const progress = chapterVisibilityProgress(beatNode);
    sceneManager.setChapterProgress(beatNode.id, progress);
    if (progress > best.value) best = { id: beatNode.id, value: progress };
  });

  setActiveChapter(best.id);
}

lenis.on("scroll", () => {
  tickStoryState();
});

window.addEventListener("resize", () => {
  sceneManager?.resize();
  tickStoryState();
});

document.addEventListener("pointerdown", (event) => {
  sceneManager?.pulseAtPointer(event.clientX, event.clientY);
});

async function init() {
  try {
    const storyNodes = await loadStory();
    const firstChapterId = renderStory(storyNodes);

    sceneManager = createSceneManager({
      canvas: document.querySelector("#gl-canvas"),
      reducedMotion,
      chapters: timelineBeats.map((beat) => ({ id: beat.id, scene: beat.scene }))
    });

    setActiveChapter(firstChapterId);
    tickStoryState();
  } catch (error) {
    storyRoot.innerHTML = `
      <section class="chapter">
        <p class="kicker">Load Error</p>
        <h2>Content Unavailable</h2>
        <p class="meta">The story could not be loaded</p>
        <p>${error.message}</p>
      </section>
    `;
  }
}

init();
