import "./style.css";
import Lenis from "lenis";
import { gsap } from "gsap";
import { createSceneManager } from "./js/three/sceneManager.js";

const storyRoot = document.querySelector("#story");
const navRoot = document.querySelector("#progress-nav");
const motionToggle = document.querySelector("#motion-toggle");
const sceneCycle = ["CRTScene"];

let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeChapterId = null;
let chapters = [];
let sectionNodes = [];
let navButtons = [];
let sceneManager = null;

function parsePagesFromTranscript(rawTranscript) {
  return rawTranscript
    .split("=== PAGE ")
    .slice(1)
    .map((pageChunk) => {
      const [pageTag, ...rest] = pageChunk.split("===");
      const pageNumber = Number.parseInt(pageTag, 10);
      const text = rest
        .join("===")
        .replace(/\s+/g, " ")
        .trim();

      return {
        pageNumber: Number.isNaN(pageNumber) ? null : pageNumber,
        text
      };
    });
}

function buildChaptersFromTranscript(pages) {
  return pages.map((page, index) => {
    const pageNumber = page.pageNumber ?? index + 1;
    const pageLabel = String(pageNumber).padStart(2, "0");
    return {
      id: `page-${pageLabel}`,
      kicker: `Page ${pageLabel}`,
      navLabel: `Page ${pageLabel}`,
      heading: `Page ${pageLabel}`,
      body: page.text || "No extractable text on this page.",
      scene: sceneCycle[index % sceneCycle.length],
      interactionHint: "Scroll to continue in exact order.",
      meta: "Story sequence"
    };
  });
}

function renderStory(nextChapters) {
  chapters = nextChapters;
  storyRoot.replaceChildren();
  navRoot.replaceChildren();

  sectionNodes = chapters.map((chapter) => {
    const section = document.createElement("section");
    section.className = "chapter";
    section.id = chapter.id;
    section.dataset.scene = chapter.scene;
    section.innerHTML = `
      <p class="kicker">${chapter.kicker}</p>
      <h2>${chapter.heading}</h2>
      <p class="meta">${chapter.meta ?? ""}</p>
      <p>${chapter.body}</p>
      <p class="hint">${chapter.interactionHint}</p>
    `;
    storyRoot.append(section);
    return section;
  });

  navButtons = chapters.map((chapter, index) => {
    const button = document.createElement("button");
    button.className = "progress-pill";
    button.type = "button";
    button.textContent = `${String(index + 1).padStart(2, "0")} ${chapter.navLabel}`;
    button.addEventListener("click", () => {
      document.querySelector(`#${chapter.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    navRoot.append(button);
    return button;
  });

  return chapters[0]?.id ?? null;
}

async function loadTranscriptChapters() {
  const response = await fetch("/assets/pdf-manuscript.txt");
  if (!response.ok) throw new Error(`Failed to load content (${response.status})`);

  const transcript = await response.text();
  const pages = parsePagesFromTranscript(transcript).filter((page) => page.pageNumber !== null || page.text.length > 0);
  return buildChaptersFromTranscript(pages);
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

  navButtons.forEach((button, idx) => {
    const isActive = chapters[idx].id === id;
    button.classList.toggle("is-active", isActive);
  });

  sceneManager?.setChapter(id);
}

function tickStoryState() {
  if (!sceneManager || sectionNodes.length === 0) return;
  let best = { id: activeChapterId, value: -1 };

  sectionNodes.forEach((section) => {
    const progress = chapterVisibilityProgress(section);
    sceneManager.setChapterProgress(section.id, progress);
    if (progress > best.value) best = { id: section.id, value: progress };
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

motionToggle.addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  motionToggle.setAttribute("aria-pressed", String(reducedMotion));
  motionToggle.textContent = `Reduce Motion: ${reducedMotion ? "On" : "Off"}`;
  sceneManager?.setReducedMotion(reducedMotion);

  gsap.to(".chapter", {
    duration: 0.45,
    y: reducedMotion ? 0 : "random(-10, 10)",
    opacity: reducedMotion ? 1 : "random(0.92, 1)",
    stagger: 0.04
  });
});

async function init() {
  try {
    const transcriptChapters = await loadTranscriptChapters();
    const firstChapterId = renderStory(transcriptChapters);

    sceneManager = createSceneManager({
      canvas: document.querySelector("#gl-canvas"),
      reducedMotion,
      chapters: transcriptChapters.map((chapter) => ({ id: chapter.id, scene: chapter.scene }))
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
