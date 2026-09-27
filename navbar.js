(() => {
  "use strict";

  const ROOT = (() => {
    try {
      const script = document.currentScript;
      if (!script || !script.src) return "";
      const clean = (path) => path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      const pageParts = clean(location.pathname);
      const scriptParts = clean(new URL(script.src).pathname);
      pageParts.pop();
      scriptParts.pop();
      let same = 0;
      while (same < pageParts.length && same < scriptParts.length && pageParts[same] === scriptParts[same]) same++;
      const rest = scriptParts.slice(same).join("/");
      return "../".repeat(pageParts.length - same) + (rest ? rest + "/" : "");
    } catch {
      return "";
    }
  })();

  const NAV = [
    ["01", "HOME", "index.html", "vids/farme video.mp4", "FreshFind .co"],
    ["02", "MARKET FIND", "marketfind.html", "vids/farme video.mp4", "Find a Market"],
    ["03", "MARKET DIRECTORY", "Market.html", "vids/farme video.mp4", "Market Directory & Detail"],
    ["04", "PRODUCE", "progress.html", "vids/farme video.mp4", "Fresh Produce"],
    ["05", "SEASONS", "Seasonal.html", "vids/farme video.mp4", "Seasonal Freshness"],
    ["06", "ASK FRESHFIND", "chat.html", "vids/farme video.mp4", "Ask FreshFind"],
    ["07", "CONTACT", "contact.html", "vids/farme video.mp4", "Get in Touch"],
    ["08", "ABOUT", "about.html", "vids/farme video.mp4", "About FreshFind"]
  ];

  const EYE_OPEN = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  const EYE_CLOSED = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `;

  const nav = document.createElement("header");
  nav.className = "ff-nav";
  nav.id = "freshFindNav";
  nav.innerHTML = `
    <div class="ff-account-area">
      <div class="ff-user-box" id="ffUserBox"></div>
      <button class="ff-auth-btn ff-login-btn" id="ffLoginButton" type="button">LOGIN</button>
      <button class="ff-auth-btn ff-signup-btn" id="ffSignupButton" type="button">SIGNUP</button>
      <button class="ff-menu-button" id="openMenu" type="button" aria-label="Open navigation" aria-expanded="false">
        <span class="ff-menu-text">Explore</span>
        <span class="ff-menu-icon"><span></span><span></span></span>
      </button>
    </div>
  `;

  const menu = document.createElement("div");
  menu.className = "ff-menu";
  menu.id = "freshFindMenu";
  menu.setAttribute("aria-hidden", "true");
  menu.innerHTML = `
    <div class="ff-menu-header">
      <a href="${ROOT}index.html" class="ff-menu-brand" aria-label="FreshFind home">

        <span class="ff-menu-brand-mark"></span> FreshFind
      </a>
      <button class="ff-close" id="closeMenu" type="button" aria-label="Close navigation"></button>
    </div>
    <div class="ff-menu-body">
      <p class="ff-menu-kicker">Explore your local food system</p>
      <nav aria-label="Main navigation">
        <ul class="ff-menu-links">
          ${NAV.map(([num, label, href, vid, title]) => `
            <li>
              <a href="${ROOT}${href}" data-video="${vid}" data-label="${title}">
                <span class="ff-number">${num}</span> ${label}
              </a>
            </li>
          `).join("")}
        </ul>
      </nav>
    </div>
    <div class="ff-video-preview" id="ffVideoPreview">
      <video class="ff-preview-video" id="ffPreviewVideo" muted playsinline loop preload="metadata"></video>
      <div class="ff-video-overlay"></div>
      <div class="ff-video-label" id="ffVideoLabel">FreshFind</div>
    </div>
  `;

  const authModal = document.createElement("div");
  authModal.className = "ff-auth-modal";
  authModal.id = "ffAuthModal";
  authModal.setAttribute("aria-hidden", "true");
  authModal.innerHTML = `
    <div class="ff-auth-backdrop" id="ffAuthBackdrop"></div>
    <div class="ff-auth-card" role="dialog" aria-modal="true" aria-labelledby="ffAuthTitle">
      <button class="ff-auth-close" id="ffAuthClose" type="button" aria-label="Close">?</button>
      <div class="ff-auth-deco">
        <div class="ff-deco-ring"></div>
        <div class="ff-deco-ring"></div>
        <div class="ff-deco-ring"></div>
        <div class="ff-deco-ring"></div>
        <div class="ff-deco-logo">
          <span class="ff-deco-logo-mark">
            <img src="${ROOT}fruit-img/logo.png" alt="logo"/>
          </span>
          FreshFind
        </div>
        <div class="ff-deco-body">
          <h3 class="ff-deco-heading">Freshness Straight from<br><em>Nature to You</em></h3>
          <p class="ff-deco-text">Discover local markets, seasonal produce, and the people who grow your food.</p>
          <div class="ff-deco-tag">Naturally Fresh, Always</div>
        </div>
      </div>
      <div class="ff-auth-form-panel">
        <div class="ff-auth-tabs">
          <button class="ff-auth-tab active" id="ffTabLogin" type="button">Login</button>
          <button class="ff-auth-tab" id="ffTabSignup" type="button">Create Account</button>
        </div>
        <div id="ffPanelLogin">
          <div class="ff-auth-heading">
            <h2 id="ffAuthTitle">Welcome back</h2>
            <p>Sign in to your FreshFind account.</p>
          </div>
          <form class="ff-auth-form" id="ffLoginForm" novalidate>
            <div class="ff-field">
              <label for="ffLoginEmail">Email</label>
              <input type="email" id="ffLoginEmail" placeholder="your@email.com" autocomplete="email" required />
            </div>
            <div class="ff-field">
              <label for="ffLoginPassword">Password</label>
              <div class="ff-input-wrap">
                <input type="password" id="ffLoginPassword" placeholder="Enter your password" autocomplete="current-password" required />
                <button type="button" class="ff-pass-toggle" data-target="ffLoginPassword" aria-label="Show password">${EYE_OPEN}</button>
              </div>
            </div>
            <button type="submit" class="ff-auth-submit">LOGIN ?</button>
            <p class="ff-auth-switch">Don't have an account? <button type="button" id="ffGoSignup">Create one</button></p>
          </form>
        </div>
        <div id="ffPanelSignup" style="display:none">
          <div class="ff-auth-heading">
            <h2>Join FreshFind</h2>
            <p>Create your account and start exploring.</p>
          </div>
          <form class="ff-auth-form" id="ffSignupForm" novalidate>
            <div class="ff-field">
              <label for="ffSignupName">Full Name</label>
              <input type="text" id="ffSignupName" placeholder="Your full name" autocomplete="name" required />
            </div>
            <div class="ff-field">
              <label for="ffSignupEmail">Email</label>
              <input type="email" id="ffSignupEmail" placeholder="your@email.com" autocomplete="email" required />
            </div>
            <div class="ff-field">
              <label for="ffSignupPassword">Password</label>
              <div class="ff-input-wrap">
                <input type="password" id="ffSignupPassword" placeholder="Min. 6 characters" minlength="6" autocomplete="new-password" required />
                <button type="button" class="ff-pass-toggle" data-target="ffSignupPassword" aria-label="Show password">${EYE_OPEN}</button>
              </div>
            </div>
            <button type="submit" class="ff-auth-submit">CREATE ACCOUNT ?</button>
            <p class="ff-auth-switch">Already have an account? <button type="button" id="ffGoLogin">Sign in</button></p>
          </form>
        </div>
        <p class="ff-auth-message" id="ffAuthMessage"></p>
      </div>
    </div>
  `;

  document.body.prepend(authModal);
  document.body.prepend(menu);
  document.body.prepend(nav);

  const openMenuBtn = document.getElementById("openMenu");
  const closeMenuBtn = document.getElementById("closeMenu");
  const prevVid = document.getElementById("ffPreviewVideo");
  const vidPrev = document.getElementById("ffVideoPreview");
  const vidLbl = document.getElementById("ffVideoLabel");
  const menuLinks = [...document.querySelectorAll(".ff-menu-links a")];
  const loginBtn = document.getElementById("ffLoginButton");
  const signupBtn = document.getElementById("ffSignupButton");
  const userBox = document.getElementById("ffUserBox");
  const authClose = document.getElementById("ffAuthClose");
  const authBackdrop = document.getElementById("ffAuthBackdrop");
  const tabLogin = document.getElementById("ffTabLogin");
  const tabSignup = document.getElementById("ffTabSignup");
  const panelLogin = document.getElementById("ffPanelLogin");
  const panelSignup = document.getElementById("ffPanelSignup");
  const loginForm = document.getElementById("ffLoginForm");
  const signupForm = document.getElementById("ffSignupForm");
  const goSignup = document.getElementById("ffGoSignup");
  const goLogin = document.getElementById("ffGoLogin");
  const authMsg = document.getElementById("ffAuthMessage");

  const USER_KEY = "freshfind_user";
  const REG_KEY = "freshfind_registered_user";

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }

  function getReg() {
    try { return JSON.parse(localStorage.getItem(REG_KEY)); } catch { return null; }
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function updateUserUI() {
    const user = getUser();
    if (!user) {
      userBox.innerHTML = "";
      loginBtn.style.display = "";
      signupBtn.style.display = "";
      return;
    }
    loginBtn.style.display = "none";
    signupBtn.style.display = "none";
    const firstLetter = (user.name || "U").charAt(0).toUpperCase();
    userBox.innerHTML = `
      <div class="ff-user">
        <span class="ff-user-avatar">${firstLetter}</span>
        <span class="ff-user-name">${esc(user.name)}</span>
        <button class="ff-logout" id="ffLogoutBtn" type="button">Logout</button>
      </div>
    `;
    document.getElementById("ffLogoutBtn")?.addEventListener("click", () => {
      localStorage.removeItem(USER_KEY);
      updateUserUI();
    });
  }

  let currentVideo = "";

  function stopPreview() {
    prevVid.pause();
    prevVid.removeAttribute("src");
    prevVid.load();
    vidPrev.classList.remove("playing");
    currentVideo = "";
  }

  function openMenu() {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    openMenuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("ff-menu-open");
    setTimeout(() => closeMenuBtn.focus(), 500);
  }

  function closeMenu() {
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    openMenuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("ff-menu-open");
    stopPreview();
    openMenuBtn.focus();
  }

  openMenuBtn.addEventListener("click", openMenu);
  closeMenuBtn.addEventListener("click", closeMenu);

  function initDotGrid() {
    const canvas = document.createElement("canvas");
    canvas.className = "ff-dot-canvas";
    menu.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let width, height;
    let dots = [];
    const spacing = 35;
    const maxDist = 120;
    const mouse = { x: -1000, y: -1000 };

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createDots();
    }

    function createDots() {
      dots = [];
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = (height - (rows - 1) * spacing) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;
          dots.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0 });
        }
      }
    }

    window.addEventListener("resize", resize);

    menu.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    menu.addEventListener("mouseleave", () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let dot of dots) {
        let dx = mouse.x - dot.x;
        let dy = mouse.y - dot.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let force = 0;
        if (dist < maxDist) {
          force = (maxDist - dist) / maxDist;
          dot.vx += (dx / dist) * force * 0.5;
          dot.vy += (dy / dist) * force * 0.5;
        }

        dot.vx += (dot.baseX - dot.x) * 0.05;
        dot.vy += (dot.baseY - dot.y) * 0.05;
        dot.vx *= 0.85;
        dot.vy *= 0.85;
        dot.x += dot.vx;
        dot.y += dot.vy;

        const radius = 2 + force * 2;
        const opacity = 0.2 + force * 0.6;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(18, 60, 43, ${opacity})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    resize();
    animate();
  }

  initDotGrid();

  function changePreview(link) {
    const videoPath = link.dataset.video || "";
    if (!videoPath) return;
    const src = ROOT + videoPath;
    if (currentVideo === src) {
      prevVid.play().catch(() => {});
      return;
    }
    currentVideo = src;
    vidLbl.textContent = link.dataset.label || link.textContent.trim();
    prevVid.style.opacity = "0";

    setTimeout(() => {
      prevVid.pause();
      prevVid.src = src;
      prevVid.load();
      prevVid.addEventListener("loadeddata", () => {
        prevVid.play().then(() => {
          vidPrev.classList.add("playing");
          prevVid.style.opacity = "1";
        }).catch(() => {
          prevVid.style.opacity = "1";
        });
      }, { once: true });
    }, 120);
  }

  menuLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => changePreview(link));
    link.addEventListener("focus", () => changePreview(link));
    link.addEventListener("click", closeMenu);
  });

  function showMsg(message, type = "") {
    authMsg.textContent = message;
    authMsg.className = "ff-auth-message " + type;
  }

  function clearMsg() {
    authMsg.textContent = "";
    authMsg.className = "ff-auth-message";
  }

  function switchTab(tab) {
    const isLogin = tab === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabSignup.classList.toggle("active", !isLogin);
    panelLogin.style.display = isLogin ? "" : "none";
    panelSignup.style.display = isLogin ? "none" : "";
    clearMsg();
    clearAllErrors();
  }

  function openAuth(type = "login") {
    authModal.classList.add("open");
    authModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("ff-auth-open");
    switchTab(type);
    setTimeout(() => {
      const target = type === "login" ? document.getElementById("ffLoginEmail") : document.getElementById("ffSignupName");
      target?.focus();
    }, 350);
  }

  function closeAuth() {
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ff-auth-open");
    clearMsg();
    clearAllErrors();
  }

  loginBtn.addEventListener("click", () => openAuth("login"));
  signupBtn.addEventListener("click", () => openAuth("signup"));
  authClose.addEventListener("click", closeAuth);
  authBackdrop.addEventListener("click", closeAuth);
  tabLogin.addEventListener("click", () => switchTab("login"));
  tabSignup.addEventListener("click", () => switchTab("signup"));
  goSignup.addEventListener("click", () => switchTab("signup"));
  goLogin.addEventListener("click", () => switchTab("login"));

  function showFieldError(input, message) {
    const field = input.closest(".ff-field");
    if (!field) return;
    const oldTooltip = field.querySelector(".ff-tooltip");
    if (oldTooltip) oldTooltip.remove();
    const tooltip = document.createElement("div");
    tooltip.className = "ff-tooltip";
    tooltip.setAttribute("role", "alert");
    tooltip.textContent = message;
    field.appendChild(tooltip);
    field.classList.remove("error");
    void field.offsetWidth;
    field.classList.add("error");
    requestAnimationFrame(() => tooltip.classList.add("show"));
  }

  function clearFieldError(input) {
    const field = input.closest(".ff-field");
    if (!field) return;
    field.classList.remove("error");
    const tooltip = field.querySelector(".ff-tooltip");
    if (tooltip) {
      tooltip.classList.remove("show");
      setTimeout(() => { if (tooltip.parentElement) tooltip.remove(); }, 300);
    }
  }

  function clearAllErrors() {
    document.querySelectorAll(".ff-field input").forEach((input) => clearFieldError(input));
  }

  function validateForm(inputs) {
    let valid = true;
    let firstInvalid = null;

    inputs.forEach((input) => {
      const value = (input.value || "").trim();

      if (input.required && !value) {
        showFieldError(input, "Please fill out this field");
        if (!firstInvalid) firstInvalid = input;
        valid = false;
        return;
      }

      if (input.type === "email" && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          showFieldError(input, "Please enter a valid email address");
          if (!firstInvalid) firstInvalid = input;
          valid = false;
          return;
        }
      }

      const minLength = input.getAttribute("minlength");
      if (minLength && value.length < Number(minLength)) {
        showFieldError(input, `Password must be at least ${minLength} characters`);
        if (!firstInvalid) firstInvalid = input;
        valid = false;
        return;
      }

      clearFieldError(input);
    });

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  document.querySelectorAll(".ff-field input").forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
  });

  document.querySelectorAll(".ff-pass-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;
      const show = target.type === "password";
      target.type = show ? "text" : "password";
      button.innerHTML = show ? EYE_CLOSED : EYE_OPEN;
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nameEl = document.getElementById("ffSignupName");
    const emailEl = document.getElementById("ffSignupEmail");
    const passEl = document.getElementById("ffSignupPassword");

    const valid = validateForm([nameEl, emailEl, passEl]);
    if (!valid) return;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passEl.value;

    localStorage.setItem(REG_KEY, JSON.stringify({ name, email, password }));
    localStorage.setItem(USER_KEY, JSON.stringify({ name, email }));

    updateUserUI();
    showMsg(`Account created! Welcome, ${name}.`, "success");
    setTimeout(closeAuth, 1200);
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailEl = document.getElementById("ffLoginEmail");
    const passEl = document.getElementById("ffLoginPassword");

    const valid = validateForm([emailEl, passEl]);
    if (!valid) return;

    const email = emailEl.value.trim();
    const password = passEl.value;
    const registered = getReg();

    if (!registered) {
      showFieldError(emailEl, "No account found ? please create one");
      return;
    }

    if (email !== registered.email || password !== registered.password) {
      showFieldError(passEl, "Email or password is incorrect");
      passEl.focus();
      return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify({ name: registered.name, email: registered.email }));
    updateUserUI();
    showMsg(`Welcome back, ${registered.name}!`, "success");
    setTimeout(closeAuth, 1200);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (authModal.classList.contains("open")) {
      closeAuth();
      return;
    }
    if (menu.classList.contains("open")) {
      closeMenu();
    }
  });

  const currentPage = decodeURIComponent(location.pathname.split("/").pop() || "index.html").toLowerCase();

  menuLinks.forEach((link) => {
    const href = link.getAttribute("href")?.split("#")[0] || "";
    const page = decodeURIComponent(href.split("/").pop()).toLowerCase();
    if (page === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });

  updateUserUI();

})();


