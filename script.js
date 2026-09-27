

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";


const runningMotion = new WeakMap();

function getMotionTargets(target) {
  if (!target) return [];
  if (target instanceof Element) return [target];
  if (Array.isArray(target)) return target.filter(Boolean);
  if (typeof NodeList !== "undefined" && target instanceof NodeList) return Array.from(target);
  return [target];
}

function setMotionValue(target, property, value) {
  if (!(target instanceof Element)) { target[property] = value; return; }
  if (["x", "y", "scale", "rotateX"].includes(property)) {
    const x = property === "x" ? value || 0 : 0;
    const y = property === "y" ? value || 0 : 0;
    const scale = property === "scale" ? value : 1;
    const rotateX = property === "rotateX" ? value || 0 : 0;
    target.style.transform = `translate(${x}px, ${y}px) rotateX(${rotateX}deg) scale(${scale})`;
  } else if (property === "opacity") {
    target.style.opacity = value;
  } else if (property === "filter") {
    target.style.filter = value;
  } else if (property === "backgroundColor") {
    target.style.backgroundColor = value;
  }
}

const gsap = {
  set(target, values) {
    getMotionTargets(target).forEach(element => {
      Object.entries(values).forEach(([p, v]) => setMotionValue(element, p, v));
    });
  },
  to(target, values) {
    const targets = getMotionTargets(target);
    const duration = Math.max(0, (Number(values.duration) || 0) * 1000);
    const stagger = Math.max(0, (Number(values.stagger) || 0) * 1000);

    targets.forEach((element, index) => {
      runningMotion.get(element)?.cancel();
      const delay = index * stagger;
      let animation;

      if (element instanceof Element && element.animate) {
        const from = {}, to = {};
        const x = Number(values.x) || 0;
        const y = Number(values.y) || 0;
        const scale = values.scale === undefined ? 1 : values.scale;
        if (["x", "y", "scale", "rotateX"].some(k => values[k] !== undefined)) {
          from.transform = "translate(0, 0) rotateX(0deg) scale(1)";
          to.transform = `translate(${x}px, ${y}px) rotateX(${values.rotateX || 0}deg) scale(${scale})`;
        }
        ["opacity", "filter", "backgroundColor"].forEach(p => {
          if (values[p] !== undefined) {
            from[p] = getComputedStyle(element)[p];
            to[p] = values[p];
          }
        });
        animation = element.animate([from, to], { duration, delay, fill: "forwards" });
      } else {
        const startValues = {};
        Object.keys(values).forEach(p => {
          if (typeof values[p] === "number") startValues[p] = Number(element[p]) || 0;
        });
        const startTime = performance.now() + delay;
        const animate = now => {
          const elapsed = Math.max(0, now - startTime);
          const progress = duration ? Math.min(1, elapsed / duration) : 1;
          const eased = 1 - Math.pow(1 - progress, 3);
          Object.entries(startValues).forEach(([p, start]) => {
            element[p] = start + (values[p] - start) * eased;
          });
          if (progress < 1) animation = requestAnimationFrame(animate);
        };
        animation = requestAnimationFrame(animate);
      }

      runningMotion.set(element, {
        cancel() {
          if (typeof animation === "number") cancelAnimationFrame(animation);
          else animation?.cancel();
        }
      });
    });

    if (typeof values.onComplete === "function") {
      setTimeout(values.onComplete, duration + stagger * Math.max(0, targets.length - 1));
    }
  }
};


const SHOES = [
  {
    file: "./3d/Hi3D_Photorealistic%20Wicker%20Fruit%20Basket%203D%20Model_allparts_20260922_234452.glb",
    name: "Daily Harvest",
    tagline: "Hand-picked, same-day",
    details: "Weight 12kg|Items 18",
    welcome: "fresh",
    welcomeColor: "#9FC79A",
    color: "#9FC79A",
    rotationY: -0.5
  },
  {
    file: "./3d/Hi3D_Untitled_allparts_20260922_233406.glb",
    name: "Neighborhood Stall",
    tagline: "Family-run since 1987",
    details: "Vendors 6|Open hrs 10-19",
    welcome: "local",
    welcomeColor: "#E0A57B",
    color: "#E0A57B",
    rotationY: -0.5
  },
  {
    file: "./3d/Hi3D_Glossy%20Stylized%20Verified%20Map%20Pin%203D%20Model_allparts_20260923_005150.glb",
    pin: true,
    name: "Find a Market",
    tagline: "3 markets near you",
    details: "Distance 0.8 km|ETA 12 min",
    welcome: "nearby",
    welcomeColor: "#AFCBEB",
    color: "#AFCBEB",
    rotationY: -0.5
  }
];

const SETTINGS = {
  shoeSize: 3.2,
  spacing: 3.6,
  verticalSpacing: 4.4,
  cameraDistance: 9,
  animationDuration: 1.25,
  sideScale: 0.58,
  sideDepth: -1.2,
  sideRotation: 0.35
};


const canvas        = document.querySelector("#gl");
const stage         = document.querySelector("#stage");
const title         = document.querySelector("#shoe-title");
const shoeInfo      = document.querySelector("#shoe-info");
const shoeKicker    = document.querySelector("#shoe-kicker");
const tagline       = document.querySelector("#shoe-tagline");
const shoeDetails   = document.querySelector("#shoe-details");
const welcome       = document.querySelector("#welcome-wrap");
const nextButton    = document.querySelector("#next");
const previousButton= document.querySelector("#prev");
const dotsContainer = document.querySelector("#dots");
const exploreButton = document.querySelector("#explore-button");

const loaderEl    = document.getElementById("loader");
const loaderFill  = document.getElementById("loaderFill");
const loaderCount = document.getElementById("loaderCount");
let loadedCount = 0;

const heroEl     = document.getElementById("hero");
const heroSticky = document.querySelector(".hero-sticky");


const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true,
  powerPreference: "high-performance"
});

const basePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let renderScale = 1;

function applySize() {
  renderer.setPixelRatio(Math.max(0.6, basePixelRatio * renderScale));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
applySize();

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.1, SETTINGS.cameraDistance);
camera.lookAt(0, 1.15, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 4);
keyLight.position.set(4, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 2);
fillLight.position.set(-5, 4, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2.5);
rimLight.position.set(0, 5, -6);
scene.add(rimLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.ShadowMaterial({ opacity: 0.16 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.55;
floor.receiveShadow = true;
scene.add(floor);


const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);


const shoes = [];
let currentIndex = 0;
let introMode = true;
let isAnimating = false;
let welcomeSplit = null;


function updateLoaderProgress() {
  const pct = (loadedCount / SHOES.length) * 100;
  if (loaderFill) loaderFill.style.width = pct + "%";
  if (loaderCount) loaderCount.textContent = `${loadedCount} / ${SHOES.length}`;
}

function hideLoader() {
  if (!loaderEl) return;
  loaderEl.classList.add("is-hidden");
  setTimeout(() => loaderEl.remove(), 600);
}


function animateWelcomeIntro() {
  if (!welcome) return;
  if (welcomeSplit) { welcomeSplit.revert(); welcomeSplit = null; }

  welcome.textContent = "Welcome to Market Stories";
  welcome.style.color = "rgba(31, 29, 27, 0.12)";
  welcome.style.opacity = "1";

  const originalText = "Welcome to Market Stories";
  const fragment = document.createDocumentFragment();
  const words = originalText.split(/\s+/).map((word, index, list) => {
    const span = document.createElement("span");
    span.className = "welcome-word";
    span.textContent = word;
    fragment.appendChild(span);
    if (index < list.length - 1) fragment.appendChild(document.createTextNode(" "));
    return span;
  });

  welcome.replaceChildren(fragment);
  welcomeSplit = { words, revert() { welcome.textContent = originalText; } };

  gsap.set(welcomeSplit.words, { opacity: 0, y: 32, rotateX: -25, filter: "blur(6px)" });
  gsap.to(welcomeSplit.words, {
    opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)",
    stagger: 0.08, duration: 0.8, ease: "power3.out"
  });
}


async function loadShoe(config, index) {
  try {
    if (!config.file) { createLocationPin(config, index); return; }

    const gltf = await gltfLoader.loadAsync(config.file);
    const model = gltf?.scene;
    if (!model) throw new Error("No scene");

    model.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(largest) || largest <= 0.000001) throw new Error("Bad bounds");

    model.scale.setScalar(SETTINGS.shoeSize / largest);
    model.updateMatrixWorld(true);

    const newBox = new THREE.Box3().setFromObject(model);
    const center = newBox.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= newBox.min.y;

    const group = new THREE.Group();
    group.add(model);
    scene.add(group);

    shoes[index] = {
      group, model, config, index,
      baseRotation: config.rotationY,
      modelBaseY: model.position.y,
      pin: Boolean(config.pin)
    };
  } catch (error) {
    console.error("GLB error:", config.file, error);
    createFallback(config, index);
  }
}

function createFallback(config, index) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1, 1.2),
    new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.45 })
  );
  mesh.position.y = 0.5;
  mesh.castShadow = true;
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);
  shoes[index] = {
    group, model: mesh, config, index,
    baseRotation: config.rotationY,
    modelBaseY: mesh.position.y,
    pin: Boolean(config.pin)
  };
}

function createLocationPin(config, index) {
  const group = new THREE.Group();
  const pin = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.3, metalness: 0.05 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 20), material);
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 32), material);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xFBF9F4 }));

  point.position.y = -0.85;
  point.rotation.x = Math.PI;
  hole.position.set(0, 0.05, 0.76);
  hole.rotation.x = Math.PI / 2;
  pin.add(head, point, hole);
  pin.position.y = 1.6;
  group.add(pin);
  scene.add(group);

  shoes[index] = {
    group, model: pin, config, index,
    baseRotation: config.rotationY,
    modelBaseY: pin.position.y,
    pin: true
  };
}


function getDistance(index) {
  let d = index - currentIndex;
  if (d > SHOES.length / 2) d -= SHOES.length;
  if (d < -SHOES.length / 2) d += SHOES.length;
  return d;
}


function updateSlider(animate = true) {
  shoeInfo.style.opacity = introMode ? "0" : "1";

  shoes.forEach(shoe => {
    if (!shoe) return;
    const distance = getDistance(shoe.index);

    if (introMode) {
      const isPin = Boolean(shoe.pin);
      const introX = isPin ? 0 : shoe.index === 0 ? -(SETTINGS.spacing * 1.45) : SETTINGS.spacing * 1.45;
      const introZ = isPin ? 0.15 : shoe.index === 0 ? -0.6 : 0.6;

      if (animate) {
        gsap.to(shoe.group.position, { x: introX, y: 0, z: introZ, duration: SETTINGS.animationDuration * 1.25, ease: "power2.inOut", overwrite: true });
        gsap.to(shoe.group.scale, { x: 0.9, y: 0.9, z: 0.9, duration: SETTINGS.animationDuration * 1.25, ease: "power2.inOut", overwrite: true });
      } else {
        shoe.group.position.set(introX, 0, introZ);
        shoe.group.scale.setScalar(0.9);
      }
      shoe.group.rotation.y = shoe.baseRotation;
      return;
    }

    const isPin = Boolean(shoe.pin);
    const activeX = isPin ? 0 : window.innerWidth <= 700 ? 0 : shoe.index % 2 === 0 ? -2.1 : 2.1;
    const x = distance === 0 ? activeX : isPin ? 0 : shoe.index % 2 === 0 ? -SETTINGS.spacing : SETTINGS.spacing;
    const z = Math.abs(distance) * SETTINGS.sideDepth;
    const y = -distance * SETTINGS.verticalSpacing;
    const scale = distance === 0 ? 1 : SETTINGS.sideScale;

    let rotation = shoe.baseRotation;
    if (distance < 0) rotation -= SETTINGS.sideRotation;
    if (distance > 0) rotation += SETTINGS.sideRotation;

    if (animate) {
      gsap.to(shoe.group.position, { x, y, z, duration: SETTINGS.animationDuration, ease: "power2.inOut", overwrite: true });
      gsap.to(shoe.group.scale, { x: scale, y: scale, z: scale, duration: SETTINGS.animationDuration, ease: "power2.inOut", overwrite: true });
      gsap.to(shoe.group.rotation, { y: rotation, duration: SETTINGS.animationDuration, ease: "power2.inOut", overwrite: true });
    } else {
      shoe.group.position.set(x, y, z);
      shoe.group.scale.setScalar(scale);
      shoe.group.rotation.y = rotation;
    }
    shoe.model.rotation.y = 0;
  });

  updateText();
}


function updateText() {
  const shoe = shoes[currentIndex];
  if (!shoe) return;

  if (!introMode) {
    if (welcomeSplit) { welcomeSplit.revert(); welcomeSplit = null; }
    welcome.textContent = shoe.config.welcome;
    welcome.style.color = shoe.config.welcomeColor;
    gsap.to(welcome, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
  } else {
    if (!welcomeSplit) animateWelcomeIntro();
  }

  gsap.to(stage, { backgroundColor: shoe.config.color, duration: SETTINGS.animationDuration, ease: "power2.out" });
  document.documentElement.style.setProperty("--accent", shoe.config.welcomeColor);

  const textTargets = introMode ? [title, tagline] : [title, tagline, shoeDetails];

  gsap.to(textTargets, {
    opacity: 0, y: 15, duration: 0.2,
    onComplete: () => {
      title.textContent = shoe.config.name;
      tagline.textContent = shoe.config.tagline;
      shoeDetails.innerHTML = shoe.config.details.split("|").join("<br>");
      gsap.to(textTargets, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" });
    }
  });

  shoeInfo.classList.toggle("left", shoe.index % 2 !== 0);
  shoeInfo.classList.toggle("right", shoe.index % 2 === 0);
  shoeKicker.textContent = ["DAILY HARVEST", "NEIGHBORHOOD STALL", "MARKET GUIDE"][shoe.index];
  updateDots();
}


function next() {
  if (introMode) { introMode = false; updateSlider(true); return; }
  const ni = (currentIndex + 1) % SHOES.length;
  if (isAnimating || !shoes[ni]) return;
  isAnimating = true;
  currentIndex = ni;
  updateSlider(true);
  setTimeout(() => { isAnimating = false; }, SETTINGS.animationDuration * 1000);
}

function previous() {
  if (introMode) { introMode = false; updateSlider(true); return; }
  const pi = (currentIndex - 1 + SHOES.length) % SHOES.length;
  if (isAnimating || !shoes[pi]) return;
  isAnimating = true;
  currentIndex = pi;
  updateSlider(true);
  setTimeout(() => { isAnimating = false; }, SETTINGS.animationDuration * 1000);
}

nextButton?.addEventListener("click", next);
previousButton?.addEventListener("click", previous);

if (exploreButton) {
  exploreButton.addEventListener("click", () => {
    introMode = false;
    exploreButton.classList.remove("is-visible");
    updateSlider(true);
  });
}

window.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") previous();
});


function createDots() {
  if (!dotsContainer) return;
  SHOES.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider-dot";
    dot.setAttribute("aria-label", `Show market scene ${index + 1}`);
    dot.addEventListener("click", () => {
      if (isAnimating || !shoes[index]) return;
      isAnimating = true;
      introMode = false;
      currentIndex = index;
      updateSlider(true);
      setTimeout(() => { isAnimating = false; }, SETTINGS.animationDuration * 1000);
    });
    dotsContainer.appendChild(dot);
  });
}

function updateDots() {
  document.querySelectorAll(".slider-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });
}


let startX = 0, startY = 0, dragging = false;

canvas?.addEventListener("pointerdown", e => {
  startX = e.clientX; startY = e.clientY;
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
});

canvas?.addEventListener("pointerup", e => {
  if (!dragging) return;
  dragging = false;
  const dx = e.clientX - startX, dy = e.clientY - startY;
  if (Math.abs(dx) < 45 && Math.abs(dy) < 45) return;
  if (Math.abs(dy) < 45) return;
  if (dy < 0) previous(); else next();
});


window.addEventListener("wheel", e => {
  if (isAnimating) return;
  if (Math.abs(e.deltaY) < 10) return;
  if (introMode) { introMode = false; updateSlider(true); }
}, { passive: true });


let resizeQueued = false;
window.addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    applySize();
  });
});


const clock = new THREE.Clock();

function render() {
  requestAnimationFrame(render);
  const time = clock.getElapsedTime();

  shoes.forEach(shoe => {
    if (!shoe) return;
    if (introMode) {
      const idleFloat = Math.sin(time * 1.1 + shoe.index) * 0.08;
      shoe.group.rotation.y = shoe.baseRotation + Math.sin(time * 0.45 + shoe.index) * 0.05;
      shoe.model.rotation.y = time * 0.15;
      shoe.model.rotation.z = Math.sin(time * 0.6 + shoe.index) * 0.008;
      shoe.model.position.y = shoe.modelBaseY + idleFloat;
      return;
    }
    if (shoe.index === currentIndex) {
      shoe.model.rotation.z = Math.sin(time * 0.8) * 0.015;
      shoe.model.position.y = shoe.modelBaseY + Math.sin(time * 1.5) * 0.0007;
    }
  });

  monitorFps();
  renderer.render(scene, camera);
}

let fpsFrames = 0;
let fpsStamp = performance.now();

function monitorFps() {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsStamp < 1000) return;
  const fps = fpsFrames * 1000 / (now - fpsStamp);
  fpsFrames = 0; fpsStamp = now;
  if (fps < 45 && renderScale > 0.6) { renderScale = Math.max(0.6, renderScale - 0.15); applySize(); }
  else if (fps > 57 && renderScale < 1) { renderScale = Math.min(1, renderScale + 0.1); applySize(); }
}

render();


let scrollTicking = false;

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;

  requestAnimationFrame(() => {
    if (!heroEl || !heroSticky) { scrollTicking = false; return; }

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const heroEnd = vh * 3;

    const heroProgress = Math.min(1, Math.max(0, scrollY / heroEnd));

    const fadeStart = vh * 2.55;
    const fadeEnd = vh * 3;
    let opacity = 1;
    if (scrollY > fadeStart) {
      opacity = Math.max(0, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
    }
    heroSticky.style.opacity = opacity;
    heroSticky.style.pointerEvents = opacity > 0.6 ? "auto" : "none";

    if (heroProgress < 1 && !introMode && !isAnimating) {
      const target = Math.min(SHOES.length - 1, Math.floor(heroProgress * SHOES.length));
      if (target !== currentIndex) {
        currentIndex = target;
        updateSlider(true);
      }
    }

    scrollTicking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });


async function init() {
  createDots();
  animateWelcomeIntro();
  updateLoaderProgress();

  try {
    await loadShoe(SHOES[0], 0);
    loadedCount = 1;
    updateLoaderProgress();
    updateSlider(false);
    updateDots();
    setTimeout(hideLoader, 350);
  } catch (e) {
    console.error("First model failed:", e);
    loadedCount = 1;
    updateLoaderProgress();
    hideLoader();
  }

  const remaining = SHOES.slice(1).map((config, i) =>
    loadShoe(config, i + 1)
      .then(() => { loadedCount++; updateLoaderProgress(); updateSlider(false); updateDots(); })
      .catch(err => { console.warn("Model failed:", config.file, err); loadedCount++; updateLoaderProgress(); })
  );

  Promise.all(remaining).then(() => setTimeout(hideLoader, 200));
}

init().catch(error => {
  console.error("Init failed:", error);
  hideLoader();
});


