(function () {
  "use strict";

  

  var STEPS = [
    {
      num: "01", jp: "土壌", title: "Soil Preparation",
      desc: "We test, till and enrich the soil before anything is planted. Healthy ground is the foundation every good harvest rests on.",
      tags: ["Testing", "Tilling", "Composting"],
      img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1400&q=80"
    },
    {
      num: "02", jp: "播種", title: "Planting",
      desc: "Seeds are sown at the right depth, spacing and season. Timing here decides everything that follows.",
      tags: ["Seeding", "Spacing", "Season"],
      img: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1400&q=80"
    },
    {
      num: "03", jp: "灌漑", title: "Irrigation",
      desc: "Water is delivered precisely — drip by drip — so every plant gets what it needs without waste.",
      tags: ["Drip", "Scheduling", "Water"],
      img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80"
    },
    {
      num: "04", jp: "手入れ", title: "Cultivation",
      desc: "Weeding, pruning, monitoring for pests — the daily, hands-on work that keeps crops strong and thriving.",
      tags: ["Weeding", "Pest Control", "Pruning"],
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80"
    },
    {
      num: "05", jp: "収穫", title: "Harvest",
      desc: "Crops are picked at peak ripeness, handled gently and gathered fresh — the payoff of every earlier step.",
      tags: ["Picking", "Sorting", "Quality"],
      img: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1400&q=80"
    },
    {
      num: "06", jp: "流通", title: "Distribution",
      desc: "From field to market with cold chains and quick turnaround, so what you buy is as fresh as the day it was picked.",
      tags: ["Cold Chain", "Packaging", "Delivery"],
      img: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1400&q=80"
    }
  ];

  
  var GAP = 32;
  var MAX_CARD_WIDTH = 420;
  var LERP = 0.12;

  var prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SMOOTH = prefersReducedMotion ? 1 : LERP;

  
  var container    = document.getElementById("scrollContainer");
  var track        = document.getElementById("track");
  var hudFill      = document.getElementById("hudFill");
  var stepNow      = document.getElementById("stepNow");
  var stepTotal    = document.getElementById("stepTotal");

  var video        = document.getElementById("farmVideo");
  var experience   = document.getElementById("experience");
  var topProgress  = document.getElementById("topProgress");
  var chapterIndex = document.getElementById("chapterIndex");
  var chapterTitle = document.getElementById("chapterTitle");
  var chapterDescription = document.getElementById("chapterDescription");
  var scrollHint   = document.getElementById("scrollHint");
  var readout      = document.getElementById("readout");

  var railFills = [].slice.call(document.querySelectorAll(".rail-fill"));

  
  var itemWidth = MAX_CARD_WIDTH;
  var totalDistance = 0;
  var progress = 0;
  var targetProgress = 0;
  var lastIndex = -1;

  var videoReady = false;
  var duration = 0;
  var targetTime = 0;
  var currentTime = 0;
  var currentChapter = -1;
  var lastVideoProgress = -1;

  
  var CHAPTERS = [
    { start: 0.00, end: 0.25, index: "01 / 04",
      title: "The <i>beginning</i>",
      description: "Every harvest begins with a single seed, healthy soil and a little care." },
    { start: 0.25, end: 0.50, index: "02 / 04",
      title: "With <i>care</i>",
      description: "Water, sunlight and patience give every young plant the chance to grow." },
    { start: 0.50, end: 0.75, index: "03 / 04",
      title: "Life <i>grows</i>",
      description: "Day by day, the plant reaches higher and begins to transform." },
    { start: 0.75, end: 1.00, index: "04 / 04",
      title: "The <i>harvest</i>",
      description: "From the first sprout to the final fruit — grown with care." }
  ];

  
  function buildCards() {
    var frag = document.createDocumentFragment();

    STEPS.forEach(function (step) {
      var card = document.createElement("article");
      card.className = "card";

      var img = document.createElement("div");
      img.className = "card-img";
      img.style.backgroundImage = 'url("' + step.img + '")';
      img.setAttribute("role", "img");
      img.setAttribute("aria-label", step.title);

      var top = document.createElement("div");
      top.className = "card-top";

      var badge = document.createElement("span");
      badge.className = "step-badge";
      badge.textContent = step.num;

      var jp = document.createElement("span");
      jp.className = "card-jp";
      jp.textContent = step.jp;

      top.appendChild(badge);
      top.appendChild(jp);

      var body = document.createElement("div");
      body.className = "card-body";

      var h2 = document.createElement("h2");
      h2.textContent = step.title;

      var p = document.createElement("p");
      p.textContent = step.desc;

      var ul = document.createElement("ul");
      ul.className = "tags";
      step.tags.forEach(function (t) {
        var li = document.createElement("li");
        li.textContent = t;
        ul.appendChild(li);
      });

      body.appendChild(h2);
      body.appendChild(p);
      body.appendChild(ul);

      card.appendChild(img);
      card.appendChild(top);
      card.appendChild(body);

      frag.appendChild(card);
    });

    track.innerHTML = "";
    track.appendChild(frag);

    stepTotal.textContent = String(STEPS.length).padStart(2, "0");
  }

  
  function measure() {
    var vw = document.documentElement.clientWidth;

    itemWidth = Math.min(MAX_CARD_WIDTH, Math.round(vw * 0.78));
    totalDistance = (STEPS.length - 1) * (itemWidth + GAP);

    var cards = track.children;
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.width = itemWidth + "px";
    }

    var sidePad = Math.max(0, (vw - itemWidth) / 2);
    track.style.paddingLeft = sidePad + "px";
    track.style.paddingRight = sidePad + "px";

    container.style.height = window.innerHeight + totalDistance + "px";

    updateCardTargetProgress();
  }

  
  function updateCardTargetProgress() {
    var scrollable = container.offsetHeight - window.innerHeight;

    if (scrollable <= 0) {
      targetProgress = 0;
      return;
    }

    var rect = container.getBoundingClientRect();
    var p = -rect.top / scrollable;
    targetProgress = p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function updateHud(p) {
    hudFill.style.width = (p * 100).toFixed(2) + "%";
    var idx = Math.round(p * (STEPS.length - 1));
    if (idx !== lastIndex) {
      lastIndex = idx;
      stepNow.textContent = String(idx + 1).padStart(2, "0");
    }
  }

  
  video.addEventListener("loadedmetadata", function () {
    duration = video.duration;
    videoReady = true;
    video.pause();
    video.currentTime = 0;
    currentTime = 0;
    targetTime = 0;
    updateReadout();
    updateVideoScroll();
  });

  
  function getVideoProgress() {
    var rect = experience.getBoundingClientRect();
    var scrollable = experience.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    var value = -rect.top / scrollable;
    return Math.max(0, Math.min(1, value));
  }

  function getChapter(p) {
    for (var i = 0; i < CHAPTERS.length; i++) {
      if (p >= CHAPTERS[i].start && p <= CHAPTERS[i].end) return i;
    }
    return CHAPTERS.length - 1;
  }

  function setChapter(index) {
    if (index === currentChapter) return;
    currentChapter = index;
    var c = CHAPTERS[index];
    chapterIndex.textContent = c.index;
    chapterTitle.innerHTML = c.title;
    chapterDescription.textContent = c.description;
  }

  function updateRail(p, active) {
    railFills.forEach(function (fill, index) {
      if (index < active) { fill.style.height = "100%"; return; }
      if (index > active) { fill.style.height = "0%";   return; }
      var ch = CHAPTERS[index];
      var range = ch.end - ch.start;
      var local = (p - ch.start) / range;
      var v = Math.max(0, Math.min(1, local));
      fill.style.height = (v * 100) + "%";
    });
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function updateReadout() {
    readout.textContent = formatTime(currentTime) + " / " + formatTime(duration);
  }

  function updateVideoScroll() {
    var p = getVideoProgress();

    if (Math.abs(p - lastVideoProgress) < 0.0001) return;
    lastVideoProgress = p;

    if (videoReady && duration > 0) targetTime = p * duration;

    var chapter = getChapter(p);
    setChapter(chapter);
    updateRail(p, chapter);

    scrollHint.style.opacity = p > 0.04 ? "0" : "1";

    var zoom = 1 + p * 0.055;
    var moveX = prefersReducedMotion ? 0 : 4 - p * 8;
    var moveY = prefersReducedMotion ? 0 : -2 + p * 4;
    video.style.transform =
      "translate(" +
      (-50 + moveX).toFixed(2) + "%, " +
      (-50 + moveY).toFixed(2) + "%) scale(" +
      zoom.toFixed(4) + ")";
  }

  
  function videoAnimation() {
    if (videoReady && duration > 0) {
      currentTime += (targetTime - currentTime) * 0.12;

      if (Math.abs(targetTime - currentTime) > 0.002) {
        var safeTime = Math.max(0, Math.min(duration, currentTime));
        video.currentTime = safeTime;
      }

      updateReadout();
    }
    requestAnimationFrame(videoAnimation);
  }

  video.addEventListener("play", function () { video.pause(); });

  
  var scrollTicking = false;

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(function () {
      updateCardTargetProgress();
      updateVideoScroll();

      var docEl = document.documentElement;
      var scrollTop = window.pageYOffset || docEl.scrollTop || 0;
      var scrollMax = docEl.scrollHeight - docEl.clientHeight;
      var pageP = scrollMax > 0 ? scrollTop / scrollMax : 0;
      topProgress.style.width = (pageP * 100) + "%";

      scrollTicking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("resize", function () {
    clearTimeout(window.__rt);
    window.__rt = setTimeout(function () {
      measure();
      progress = targetProgress;
      updateVideoScroll();
    }, 120);
  });

  window.addEventListener("orientationchange", function () {
    setTimeout(function () {
      measure();
      progress = targetProgress;
      updateVideoScroll();
    }, 260);
  });

  
  function cardLoop() {
    progress += (targetProgress - progress) * SMOOTH;

    if (Math.abs(targetProgress - progress) < 0.0002) {
      progress = targetProgress;
    }

    var x = -progress * totalDistance;
    track.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";

    updateHud(progress);

    requestAnimationFrame(cardLoop);
  }

  
  buildCards();
  measure();
  updateCardTargetProgress();
  progress = targetProgress;
  updateVideoScroll();

  requestAnimationFrame(cardLoop);
  requestAnimationFrame(videoAnimation);
})();


