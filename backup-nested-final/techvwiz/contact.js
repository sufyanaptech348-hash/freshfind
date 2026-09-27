gsap.registerPlugin(ScrollTrigger);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            gsap.set(".card", { opacity: 1, y: 0, scale: 1 });
            gsap.set(".bg-particle", { opacity: 0.3 });
            gsap.set(".text-reveal", { opacity: 1, y: 0 });
            
            const videos = document.querySelectorAll('video');
            videos.forEach(v => v.pause());
        } else {
            
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#dashboard",
                    start: "top 80%",
                    toggleActions: "play none none none"
                }
            });

            tl.to(".card-stack .card", {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            });

            tl.to("#stack-hero .text-reveal", {
                  opacity: 1,
                  y: 0,
                  duration: 0.8,
                  stagger: 0.2,
                  ease: "power2.out"
              }, "-=0.4");

            tl.from("#contact-form .form-group", {
                opacity: 0,
                y: 20,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out"
            }, "-=0.6")
            .from("#btn-send", {
                opacity: 0,
                scale: 0.95,
                duration: 0.5,
                ease: "back.out(1.5)"
            }, "-=0.3");

            tl.to(".info-stack .card", {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                stagger: 0.12,
                ease: "power3.out"
            }, "-=0.8");

            gsap.to(".bg-particle", {
                y: "+=20",
                x: "+=10",
                rotation: "+=5",
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {
                    amount: 2,
                    from: "random"
                }
            });

            gsap.to(".card-stack", {
                y: "+=5",
                duration: 3.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {
                    amount: 1.5,
                    from: "random"
                }
            });

            if (window.innerWidth > 768) {
                const dashboard = document.getElementById('dashboard');
                const stacks = document.querySelectorAll('.card-stack');

                dashboard.addEventListener('mousemove', (e) => {
                    const { clientX, clientY } = e;
                    const xPos = (clientX / window.innerWidth - 0.5) * 2;
                    const yPos = (clientY / window.innerHeight - 0.5) * 2;

                    stacks.forEach((stack, index) => {
                        const speed = 2 + (index % 3); 
                        const moveX = xPos * speed;
                        const moveY = yPos * speed;

                        if (!dashboard.matches(':hover')) {
                            gsap.to(stack, {
                                x: moveX,
                                y: moveY,
                                duration: 1,
                                ease: "power2.out",
                                overwrite: "auto"
                            });
                        }
                    });
                });

                dashboard.addEventListener('mouseleave', () => {
                    gsap.to(".card-stack", { x: 0, y: 0, duration: 1, ease: "power2.out", overwrite: "auto" });
                });
            }
        }

        const useLocation = document.getElementById('use-location');
        const locationStatus = document.getElementById('location-status');
        const mapLink = document.getElementById('farm-map-link');
        useLocation?.addEventListener('click', () => {
            if (!navigator.geolocation) {
                locationStatus.textContent = 'Location is not supported by this browser. You can still open the farm on Google Maps.';
                return;
            }
            useLocation.disabled = true;
            useLocation.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding you…';
            locationStatus.textContent = 'Allow location access to calculate your distance from the farm.';
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    mapLink.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                    locationStatus.textContent = 'Location found. The Google Maps link now points to directions near you.';
                    useLocation.innerHTML = '<i class="fas fa-check"></i> Location found';
                    useLocation.disabled = false;
                },
                (error) => {
                    const message = error.code === error.PERMISSION_DENIED
                        ? 'Location permission was denied. You can still open the farm on Google Maps.'
                        : 'We could not determine your location right now. Please try again.';
                    locationStatus.textContent = message;
                    useLocation.innerHTML = '<i class="fas fa-crosshairs"></i> Try again';
                    useLocation.disabled = false;
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
        });



