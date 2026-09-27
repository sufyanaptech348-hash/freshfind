gsap.registerPlugin(ScrollTrigger);

    document.addEventListener("DOMContentLoaded", () => {

      const cards = document.querySelectorAll(".carousel-card");
      let currentIndex = 0;
      const totalCards = cards.length;

      function isMobile() {
        return window.matchMedia("(max-width: 1024px)").matches;
      }

      function updateCarousel() {
        const mobile = isMobile();
        const offsetMultiplier = mobile ? 0.55 : 1;

        cards.forEach((card, index) => {
          let relativeIndex = (index - currentIndex + totalCards) % totalCards;

          let xOffset = -100;
          let zOffset = -500;
          let scale = 0.8;
          let opacity = 0;
          let zIndex = 0;

          if (relativeIndex === 0) {
            xOffset = 0;
            zOffset = 0;
            scale = 1;
            opacity = 1;
            zIndex = 10;
          } else if (relativeIndex === 1) {
            xOffset = -220 * offsetMultiplier;
            zOffset = -150;
            scale = 0.9;
            opacity = 0.85;
            zIndex = 5;
          } else if (relativeIndex === 2) {
            xOffset = -400 * offsetMultiplier;
            zOffset = -300;
            scale = 0.8;
            opacity = 0.5;
            zIndex = 1;
          }

          gsap.to(card, {
            x: xOffset,
            z: zOffset,
            scale: scale,
            opacity: opacity,
            zIndex: zIndex,
            duration: 0.8,
            ease: "power3.out"
          });
        });
      }

      updateCarousel();

      let carouselInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalCards;
        updateCarousel();
      }, 4000);

      const carouselEl = document.querySelector(".carousel-container");
      if (carouselEl) {
        carouselEl.addEventListener("mouseenter", () =>
          clearInterval(carouselInterval)
        );
        carouselEl.addEventListener("mouseleave", () => {
          carouselInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalCards;
            updateCarousel();
          }, 4000);
        });
      }

      window.addEventListener("resize", updateCarousel);

      gsap.to("#parallax-text", {
        yPercent: 50,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      gsap.from(".hero .gsap-reveal", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.2
      });

      gsap.utils.toArray(".section").forEach((section) => {
        gsap.from(section.querySelectorAll(".gsap-reveal"), {
          y: 40,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%"
          }
        });
      });

      gsap.utils.toArray(".gsap-card").forEach((card) => {
        gsap.from(card, {
          y: 80,
          opacity: 0,
          rotation: 2,
          duration: 1.2,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: card,
            start: "top 90%"
          }
        });
      });

      const clock = document.getElementById("about-clock");
      const visitor = document.getElementById("about-visitor-count");
      const marketStatus = document.getElementById("about-market-status");
      const locationButton = document.getElementById("about-location-button");
      const visitorKey = "natural-visitor-count";
      const visitorCount = Number(localStorage.getItem(visitorKey) || 1248) + 1;
      localStorage.setItem(visitorKey, String(visitorCount));
      visitor.textContent = visitorCount.toLocaleString();

      function updateClock() {
        if (clock) clock.textContent = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
      }
      updateClock();
      window.setInterval(updateClock, 1000);

      function showMarkets() {
        if (!marketStatus) return;
        const hour = new Date().getHours();
        const isOpen = hour >= 7 && hour < 19;
        marketStatus.textContent = isOpen ? "3 partner markets open now" : "Markets are closed right now";
      }
      showMarkets();
      window.setInterval(showMarkets, 60000);

      locationButton?.addEventListener("click", () => {
        if (!navigator.geolocation) {
          marketStatus.textContent = "Location is not supported";
          return;
        }
        locationButton.disabled = true;
        locationButton.textContent = "Checking location…";
        navigator.geolocation.getCurrentPosition(
          () => { showMarkets(); locationButton.textContent = "Location enabled"; },
          () => { marketStatus.textContent = "Location permission was not granted"; locationButton.textContent = "Try location again"; locationButton.disabled = false; },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      });

      document.querySelectorAll("[data-auth-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.dataset.authAction;
          const original = button.textContent;
          button.textContent = action === "login" ? "Login preview" : "Signup preview";
          button.disabled = true;
          window.setTimeout(() => { button.textContent = original; button.disabled = false; }, 1400);
        });
      });
    });


