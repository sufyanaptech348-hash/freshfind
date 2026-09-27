

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const products = [...document.querySelectorAll(".product-item")];

const settings = {
  
  fitWidth: .92,
  fitHeight: .8,
  headroom: .04,
  groundInset: .06,
  hoverScale: 1.05,
  
  idleRotation: 0.0018,
  hoverRotation: 0.003,
  floatAmount: 0.055,
  floatSpeed: 0.0015,
  scrollTravel: .06,
  maxPixelRatio: 1.7
};

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const scenes = new Map();

function visibleBand(camera, reserve){
  const distance = Math.abs(camera.position.z);
  const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
  const aspect = Number.isFinite(camera.aspect) && camera.aspect > 0 ? camera.aspect : 1;
  const safeReserve = Number.isFinite(reserve) ? Math.max(0, Math.min(reserve, .5)) : 0;
  const canvasBottom = camera.position.y - viewHeight / 2;
  return {
    width: viewHeight * aspect,
    top: camera.position.y + viewHeight / 2 - settings.headroom,
    bottom: canvasBottom + safeReserve * viewHeight - settings.groundInset
  };
}

function bandCentre(camera, reserve){
  const band = visibleBand(camera, reserve);
  return (band.top + band.bottom) / 2;
}

function fitModelToCard(camera, model, size, nudge, reserve){
  const band = visibleBand(camera, reserve);
  const bandHeight = band.top - band.bottom;
  const silhouette = Math.max(size.x, size.z);
  const scale = (size.y > 0 && silhouette > 0 && bandHeight > 0)
    ? Math.min((bandHeight * settings.fitHeight) / size.y,
               (band.width * settings.fitWidth) / silhouette) * nudge
    : nudge;
  model.scale.setScalar(scale);
  return scale;
}

function createScene(product){
  const container = product.querySelector(".model-container");
  const wrapper = product.querySelector(".model-wrapper");
  const caption = product.querySelector(".card-content");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.15, 3.4);

  const renderer = new THREE.WebGLRenderer({
    alpha: true, antialias: true, powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.maxPixelRatio));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x77805e, 2.3));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(3, 5, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe6efd1, 1.7);
  fillLight.position.set(-4, 2, 3);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xc8d89b, 2.5, 10);
  rimLight.position.set(0, 3, -2);
  scene.add(rimLight);

  const state = {
    model: null,
    targetRotationX: 0, targetRotationY: 0,
    currentRotationX: 0, currentRotationY: 0,
    scrollOffset: 0, scrollTilt: 0,
    hovered: false, mouseX: 0, mouseY: 0,
    startTime: performance.now(), loaded: false,
    baselineY: bandCentre(camera, 0),
    rawSize: null, nudge: 1, fitScale: 1, hoverAmount: 1,
    reserve: 0
  };

  
  function measureCaption(){
    const h = container.clientHeight;
    if (!h) return;
    const captionH = caption ? caption.getBoundingClientRect().height + 48 : 0;
    state.reserve = Math.min(captionH / h, .5);
    if (wrapper) wrapper.style.setProperty("--caption-h", Math.round(state.reserve * h) + "px");
  }

  
  function refit(){
    state.baselineY = bandCentre(camera, state.reserve);
    if (state.model && state.rawSize) {
      state.fitScale = fitModelToCard(camera, state.model, state.rawSize, state.nudge, state.reserve);
    }
  }

  function resize(){
    const w = container.clientWidth, h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    measureCaption();
    refit();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  
  if (caption) resizeObserver.observe(caption);
  resize();

  function updateScrollMotion(){
    const rect = product.getBoundingClientRect();
    const distanceFromCenter =
      (window.innerHeight * .5 - (rect.top + rect.height * .5)) / window.innerHeight;
    const progress = Math.max(-1, Math.min(1, distanceFromCenter));
    state.scrollOffset = progress * settings.scrollTravel;
    state.scrollTilt = progress * .08;
  }
  updateScrollMotion();
  window.addEventListener("scroll", updateScrollMotion, { passive: true });

  container.addEventListener("pointermove", event => {
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    state.mouseX = (x - .5) * 2;
    state.mouseY = (y - .5) * 2;
    state.targetRotationY = state.mouseX * .35;
    state.targetRotationX = state.mouseY * .18;
  });

  container.addEventListener("pointerenter", () => { state.hovered = true; });
  container.addEventListener("pointerleave", () => {
    state.hovered = false;
    state.targetRotationX = 0;
    state.targetRotationY = 0;
  });

  function animate(){
    if (!state.loaded) { requestAnimationFrame(animate); return; }

    const elapsed = performance.now() - state.startTime;

    state.model.rotation.y += state.hovered ? settings.hoverRotation : settings.idleRotation;
    state.currentRotationX += (state.targetRotationX - state.currentRotationX) * .08;
    state.currentRotationY += (state.targetRotationY - state.currentRotationY) * .08;

    state.model.rotation.x = state.currentRotationX + state.scrollTilt;
    state.model.rotation.y += state.currentRotationY * .02;

    state.model.position.y =
      state.baselineY +
      state.scrollOffset +
      Math.sin(elapsed * settings.floatSpeed) * settings.floatAmount;

    
    const hoverTarget = state.hovered ? settings.hoverScale : 1;
    state.hoverAmount += (hoverTarget - state.hoverAmount) * .07;
    state.model.scale.setScalar(state.fitScale * state.hoverAmount);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  return { scene, camera, renderer, state, resizeObserver, refit };
}

function loadModel(product){
  if (scenes.has(product)) return;
  const sceneData = createScene(product);
  scenes.set(product, sceneData);

  const modelPath = product.dataset.model;
  const loading = product.querySelector(".model-loading");

  const nudgeAttr = parseFloat(product.dataset.scale);
  const cardNudge = isNaN(nudgeAttr) ? 1 : nudgeAttr;

  loader.load(
    modelPath,
    gltf => {
      const model = gltf.scene;

      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          const tint = product.dataset.tint;
          const materials = Array.isArray(child.material) ? child.material : [child.material];

          materials.forEach(material => {
            if (material && material.color && tint) material.color.set(tint);
            if (material) material.needsUpdate = true;
          });
        }
      });

      
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.set(-center.x, -center.y, -center.z);

      const pivot = new THREE.Group();
      pivot.add(model);

      sceneData.state.rawSize = size;
      sceneData.state.nudge = cardNudge;
      sceneData.state.model = pivot;
      sceneData.refit();
      sceneData.scene.add(pivot);
      sceneData.state.loaded = true;

      if (loading) loading.classList.add("hidden");
    },
    undefined,
    error => {
      console.error("Could not load model:", modelPath, error);
      if (loading) loading.classList.add("hidden");
    }
  );
}

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        loadModel(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "300px 0px" }
);

products.forEach(product => observer.observe(product));

window.addEventListener("beforeunload", () => {
  scenes.forEach(sceneData => {
    sceneData.resizeObserver.disconnect();
    sceneData.scene.traverse(object => {
      if (object.isMesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
          else object.material.dispose();
        }
      }
    });
    sceneData.renderer.dispose();
  });
});


