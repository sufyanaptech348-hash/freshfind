import * as THREE from "three";
  import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
  import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

  const canvas = document.getElementById("avoCanvas");
  const mount = document.getElementById("avoGlb");
  const loading = document.getElementById("avoGlbLoading");

  if (canvas && mount) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.15, 4.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x426b4a, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb8f0cf, 1.5);
    fill.position.set(-4, 1, 3);
    scene.add(fill);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let model = null;

    
    const FIT = { height: .9, width: .92 };
    let rawSize = null;
    let baseY = 0;

    
    function fitToStage() {
      if (!model || !rawSize) return;
      const distance = camera.position.z;
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
      const viewWidth = viewHeight * camera.aspect;
      const silhouette = Math.max(rawSize.x, rawSize.z);
      if (rawSize.y > 0 && silhouette > 0) {
        model.scale.setScalar(
          Math.min((viewHeight * FIT.height) / rawSize.y,
                   (viewWidth * FIT.width) / silhouette)
        );
      }
    }

    loader.load(
      "chat%20glb/AVOCADO%20by%20sugamo%20-%201tgxGbXymi_.glb",
      gltf => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        rawSize = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -center.y, -center.z);
        baseY = -center.y;
        model.rotation.set(0, Math.PI, 0);
        fitToStage();
        scene.add(model);
        loading?.classList.add("is-hidden");
      },
      undefined,
      error => {
        console.error("Could not load Avo GLB:", error);
        if (loading) loading.textContent = "3D unavailable";
      }
    );

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      fitToStage();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const animate = time => {
      requestAnimationFrame(animate);
      if (model) {
        model.position.y = baseY + Math.sin(time * 0.0012) * 0.035;
      }
      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);
  }
(() => {
  "use strict";

  
  const video = document.querySelector(".bg-video");

  function tryPlay() {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }

  video.addEventListener("error", () => { video.style.display = "none"; }, true);

  tryPlay();
  video.addEventListener("canplay", tryPlay);
  video.addEventListener("loadeddata", tryPlay);

  ["click", "touchstart", "keydown", "scroll"].forEach((ev) =>
    window.addEventListener(ev, tryPlay, { once: true, passive: true })
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
    else tryPlay();
  });

  
  const stage      = document.getElementById("stage");
  const mouth      = document.getElementById("avoMouth");
  const voiceBtn   = document.getElementById("voiceBtn");

  const synthOK = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  let voiceOn = true;
  try {
    const saved = localStorage.getItem("avo-voice");
    if (saved === "off") voiceOn = false;
  } catch (e) {}
  if (!synthOK) voiceOn = false;
  voiceBtn.classList.toggle("muted", !voiceOn);

  voiceBtn.addEventListener("click", () => {
    voiceOn = !voiceOn;
    voiceBtn.classList.toggle("muted", !voiceOn);
    try { localStorage.setItem("avo-voice", voiceOn ? "on" : "off"); } catch (e) {}
    if (!voiceOn && synthOK) window.speechSynthesis.cancel();
  });

  let mouthLoop = null;

  function startMouth() {
    if (!mouth || mouthLoop) return;
    mouthLoop = setInterval(() => {
      const sy = 0.35 + Math.random() * 1.55;
      const sx = 0.85 + Math.random() * 0.35;
      mouth.style.transform = `scale(${sx}, ${sy})`;
    }, 70);
  }

  function stopMouth() {
    clearInterval(mouthLoop);
    mouthLoop = null;
    if (mouth) mouth.style.transform = "scale(1, 1)";
  }

  function startTalking() { stage.classList.add("talking"); startMouth(); }

  function stopTalking() {
    stage.classList.remove("talking");
    stopMouth();
  }

  let currentUtterance = null;

  function speak(text, onDone) {
    if (!voiceOn || !synthOK) {
      const ms = Math.min(4500, 700 + text.length * 45);
      startTalking();
      setTimeout(() => { stopTalking(); onDone && onDone(); }, ms);
      return;
    }

    try { window.speechSynthesis.cancel(); } catch (e) {}

    const u = new SpeechSynthesisUtterance(text);
    u.rate  = 1.0;
    u.pitch = 1.15;
    u.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(v => /en(-|_)?(US|GB)/i.test(v.lang) && /female|samantha|zira|karen|moira|tessa|google us english/i.test(v.name)) ||
      voices.find(v => /en(-|_)?(US|GB)/i.test(v.lang)) ||
      voices[0];
    if (preferred) u.voice = preferred;

    u.onstart = () => startTalking();
    u.onend   = () => { stopTalking(); onDone && onDone(); };
    u.onerror = () => { stopTalking(); onDone && onDone(); };

    u.onboundary = () => {
      if (!mouthLoop) startMouth();
    };

    currentUtterance = u;
    try { window.speechSynthesis.speak(u); }
    catch (e) { stopTalking(); onDone && onDone(); }
  }

  if (synthOK) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  let actionTimer = null;
  function playAction(name, ms = 1200) {
    stage.classList.remove("act-wave", "act-bounce", "act-dance");
    void stage.offsetWidth;
    stage.classList.add("act-" + name);
    clearTimeout(actionTimer);
    actionTimer = setTimeout(() => {
      stage.classList.remove("act-wave", "act-bounce", "act-dance");
    }, ms);
  }

  

  const DEFAULT_CHIPS = [
    "What is FreshFind?",
    "Find a market near me",
    "What fruits are in season?",
    "Can you suggest a recipe?"
  ];

  const rules = [

    { test: /\b(what('s| is) fresh ?find|about fresh ?find|what does fresh ?find do|who are you|what are you|tell me about (fresh ?find|yourself|avo))\b/i,
      reply: () =>
        "FreshFind helps you discover local farmers markets, fresh produce, " +
        "seasonal recommendations, and useful market information.",
      followups: ["How does FreshFind work?", "Find a market near me", "What fruits are in season?"] },

    { test: /\b(how does (fresh ?find|it|this|the app) work|how do i use|how to use|getting started|what can i do here)\b/i,
      reply: () =>
        "Choose what you need. Find a Market searches by location, date, and time. " +
        "The Market Directory lets you browse every market. The Produce Guide explores " +
        "fruits and vegetables. And Seasonal Recommendations show what's in season now.",
      followups: ["Find a market near me", "What is the Produce Guide?", "What can I find on the Market Directory?"] },

    { test: /\b(market directory|the directory|browse markets|list of markets|all markets|see all markets)\b/i,
      reply: () =>
        "The Market Directory lets you browse farmers markets and open their " +
        "individual market detail pages.",
      followups: ["What products does a market sell?", "How can I find a farmers market?"] },

    { test: /\b(produce guide|what is the produce guide|the produce guide)\b/i,
      reply: () =>
        "The Produce Guide helps you explore fruits, vegetables, and other " +
        "local produce.",
      followups: ["What vegetables are in season?", "Where can I buy fresh produce?"] },

    { test: /\b(opening hours|open(ing)? times?|what time.*(open|close)|when.*(open|close)|market schedule|what are the hours|the hours)\b/i,
      reply: () =>
        "Open the market's detail page to see its available schedule and " +
        "opening hours.",
      followups: ["What products does a market sell?", "How can I find a farmers market?"] },

    { test: /\b(what products|which products|products does|what do(es)? .{0,20}sell|what.*sell|what can i buy there|available products)\b/i,
      reply: () =>
        "Select a market from the Market Directory or Find a Market to view " +
        "its available products.",
      followups: ["What can I find on the Market Directory?", "Where can I buy fresh produce?"] },

    { test: /\b(near me|nearby|close to me|near my (location|area)|around me|in my area|closest market)\b/i,
      reply: () =>
        "Yes. Use Find a Market and search by your location to discover " +
        "nearby farmers markets.",
      followups: ["What are the market opening hours?", "What products does a market sell?"] },

    { test: /\b(find|search|locate|look(ing)? for|discover|where).{0,30}\b(market|farmers market)\b|\bmarket (finder|search)\b/i,
      reply: () =>
        "Use Find a Market to search for farmers markets by location, date, " +
        "and time.",
      followups: ["Can I search for a market near me?", "What are the market opening hours?"] },

    { test: /\b(fruits?|berries)\b.{0,25}\b(season|now|available|fresh|right now)\b|\bseasonal fruits?\b|\bwhat fruits?\b|\bfruits? are in\b/i,
      reply: () =>
        "I can help you discover fruits that are currently in season through " +
        "the Seasonal Recommendations section.",
      followups: ["What vegetables are in season?", "Can you recommend seasonal produce?"] },

    { test: /\b(vegetables?|veggies?|greens)\b.{0,25}\b(season|now|available|fresh|right now)\b|\bseasonal vegetables?\b|\bwhat vegetables?\b/i,
      reply: () =>
        "Check the Produce Guide, or just ask me which seasonal vegetables " +
        "are available.",
      followups: ["What is the Produce Guide?", "Can you recommend seasonal produce?"] },

    { test: /\b(recommend|suggest|what should i (get|try|buy)|ideas?)\b.{0,30}\b(produce|seasonal|fruit|vegetable)\b|\bseasonal recommendations?\b/i,
      reply: () =>
        "Yes. Tell me the season you're interested in. Spring, summer, " +
        "autumn, or winter. Then I can suggest fruits and vegetables to explore.",
      followups: ["What fruits are in season right now?", "What vegetables are in season?"] },

    { test: /\b(buy|purchase|get|pick up|where.{0,12}(buy|get))\b.{0,25}\b(fresh )?produce\b|\bwhere can i buy\b/i,
      reply: () =>
        "I can help you find nearby farmers markets and explore the produce " +
        "they offer.",
      followups: ["Find a market near me", "What fruits are in season right now?"] },

    { test: /\b(recipe|recipes|cook|cooking|meal|dish|prepare|what can i make)\b/i,
      reply: () =>
        "Yes. Tell me what fruits or vegetables you have, and I can suggest " +
        "a simple recipe. For example, try saying, I have tomatoes and basil.",
      followups: ["What vegetables are in season?", "Can you recommend seasonal produce?"] },

    { test: /\b(feedback|suggestion|complaint|complain|review|report a problem|report an issue|improve)\b/i,
      reply: () =>
        "Yes. Go to the Contact Us page and send your feedback or questions to " +
        "FreshFind.",
      followups: ["How do I contact FreshFind?"] },

    { test: /\b(contact|reach (you|out)|get in touch|email|support|talk to (a )?(human|person|team|someone))\b/i,
      reply: () =>
        "Visit the Contact Us page to send a question, comment, or feedback.",
      followups: ["Can I give feedback?"] },

    { test: /^(hi|hey+|hello|yo|hiya|howdy|sup|good\s+(morning|afternoon|evening))\b[\s!.?]*$/i,
      action: "wave",
      reply: () =>
        "Hello! I'm Avo, the FreshFind assistant. Ask me about farmers " +
        "markets, seasonal produce, or recipes.",
      followups: DEFAULT_CHIPS },

    { test: /\b(thanks|thank you|thx|ty|appreciate it|cheers)\b/i,
      action: "bounce",
      reply: () => "Anytime!",
      followups: DEFAULT_CHIPS },

    { test: /\b(bye|goodbye|see ya|see you|farewell|good ?night)\b/i,
      action: "wave",
      reply: () => "Goodbye! Come back for more fresh finds.",
      followups: DEFAULT_CHIPS },

    { test: /\b(i love you|you'?re (awesome|great|cool|the best|amazing)|good (bot|avo|avocado))\b/i,
      action: "dance",
      reply: () => "Aw, thanks! You're pretty great yourself.",
      followups: DEFAULT_CHIPS },

    { test: /\b(help|what can you (do|answer|help with)|topics|questions|faq|menu|options)\b/i,
      reply: () =>
        "I can answer FreshFind questions like: What is FreshFind? " +
        "How can I find a farmers market? What fruits or vegetables are in season? " +
        "What are the market opening hours? What products does a market sell? " +
        "Can you recommend seasonal produce? Can you suggest a recipe? " +
        "How do I contact FreshFind? And can I give feedback? " +
        "Just ask in your own words.",
      followups: DEFAULT_CHIPS }
  ];

  function fallback() {
    return pick([
      "I'm not sure about that one. I mainly answer FreshFind questions. " +
      "Try asking about farmers markets, seasonal produce, the Produce Guide, " +
      "or recipes.",

      "Hmm, I don't have an answer for that yet. You could ask, what is " +
      "FreshFind? Or send your question through Contact Us.",

      "That's outside what I know right now. Ask me about markets, produce, " +
      "or opening hours. Or reach the team via Contact Us."
    ]);
  }

  function respond(text) {
    const t = text.trim();

    if (!t) {
      return { text: "Ask me anything about FreshFind!", followups: DEFAULT_CHIPS };
    }

    for (const rule of rules) {
      const m = rule.test instanceof RegExp ? t.match(rule.test) : rule.test(t);
      if (m) {
        return {
          text:      rule.reply(m, t),
          followups: rule.followups || DEFAULT_CHIPS,
          action:    rule.action
        };
      }
    }

    return { text: fallback(), followups: DEFAULT_CHIPS };
  }

  
  const messagesEl = document.getElementById("messages");
  const chipsEl    = document.getElementById("chips");
  const form       = document.getElementById("form");
  const input      = document.getElementById("input");
  const sendBtn    = form.querySelector(".send");

  const pick  = (a) => a[Math.floor(Math.random() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function addMessage(text, who) {
    const row = document.createElement("div");
    row.className = `msg ${who}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    row.append(bubble);
    messagesEl.append(row);
    scrollDown();
  }

  function showTyping() {
    const row = document.createElement("div");
    row.className = "msg bot typing";
    row.innerHTML =
      '<div class="bubble">' +
        '<span class="dot"></span><span class="dot"></span><span class="dot"></span>' +
      '</div>';
    messagesEl.append(row);
    scrollDown();
    return row;
  }

  function scrollDown() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setChips(items) {
    chipsEl.innerHTML = "";
    if (!items) return;
    for (const label of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = label;
      btn.title = label;
      btn.addEventListener("click", () => {
        chipsEl.innerHTML = "";
        send(label);
      });
      chipsEl.append(btn);
    }
  }

  let busy = false;

  async function send(text) {
    if (busy || !text.trim()) return;
    busy = true;
    sendBtn.disabled = true;

    if (synthOK) try { window.speechSynthesis.cancel(); } catch (e) {}
    stopTalking();

    addMessage(text.trim(), "user");
    input.value = "";
    autoGrow();

    const typing = showTyping();
    const { text: reply, followups, action } = respond(text);

    await sleep(Math.min(900, 350 + reply.length * 8));

    typing.remove();

    addMessage(reply, "bot");

    if (action) playAction(action, 1200);

    await new Promise((resolve) => {
      speak(reply, resolve);
    });

    stopTalking();
    setChips(followups);

    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  function autoGrow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  }

  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
  });
  
  const greeting =
    "Hello! I'm Avo, the FreshFind assistant. " +
    "Ask me about farmers markets, seasonal produce, opening hours, or recipes.";

  addMessage(greeting, "bot");
  setChips(DEFAULT_CHIPS);
  input.focus();

  setTimeout(() => playAction("wave", 1200), 500);
  setTimeout(() => {
    const ms = Math.min(4500, 700 + greeting.length * 45);
    startTalking();
    setTimeout(stopTalking, ms);
  }, 700);

  ["click", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, () => {
      if (synthOK && voiceOn) {
        const warm = new SpeechSynthesisUtterance("");
        warm.volume = 0;
        try { window.speechSynthesis.speak(warm); } catch (e) {}
      }
    }, { once: true, passive: true })
  );
})();


