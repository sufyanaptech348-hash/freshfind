gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {

    gsap.set(
        ".contact-hero, .contact-grid, .fruit-banner",
        { opacity: 1, y: 0 }
    );

} else {

    const pageTimeline = gsap.timeline();

    pageTimeline.from(".hero-label", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power3.out"
    });

    pageTimeline.from(".hero-content h1", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.3");

    pageTimeline.from(".hero-content > p", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out"
    }, "-=0.4");

    pageTimeline.from(".hero-feature", {
        opacity: 0,
        y: 15,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out"
    }, "-=0.3");

    pageTimeline.from(".fruit-image-circle", {
        opacity: 0,
        scale: 0.85,
        duration: 0.9,
        ease: "back.out(1.5)"
    }, "-=0.6");

    pageTimeline.from(".fruit-tag", {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        stagger: 0.15,
        ease: "back.out(1.7)"
    }, "-=0.5");

    gsap.from(".contact-form-card", {
        scrollTrigger: {
            trigger: ".contact-grid",
            start: "top 80%"
        },
        opacity: 0,
        x: -60,
        duration: 0.8,
        ease: "power3.out"
    });

    gsap.from(".info-card", {
        scrollTrigger: {
            trigger: ".contact-side",
            start: "top 80%"
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out"
    });

    gsap.from(".fruit-banner", {
        scrollTrigger: {
            trigger: ".fruit-banner",
            start: "top 85%"
        },
        opacity: 0,
        y: 60,
        duration: 0.9,
        ease: "power3.out"
    });
}

document.addEventListener("DOMContentLoaded", function () {

    const contactForm  = document.getElementById("contactForm");
    const nameInput     = document.getElementById("name");
    const emailInput    = document.getElementById("email");
    const phoneInput    = document.getElementById("phone");
    const messageInput  = document.getElementById("message");

    const nameError    = document.getElementById("name-error");
    const emailError   = document.getElementById("email-error");
    const messageError = document.getElementById("message-error");

    const successModal = document.getElementById("successModal");
    const modalClose    = document.getElementById("modalClose");
    const successBtn    = document.getElementById("successBtn");
    const submitBtn     = contactForm.querySelector(".submit-btn");

    function validateName() {
        const value = nameInput.value.trim();
        const box = nameInput.closest(".input-box");

        if (!value) {
            box.classList.add("invalid");
            nameError.textContent = "Please enter your name.";
            return false;
        }
        box.classList.remove("invalid");
        nameError.textContent = "";
        return true;
    }

    function validateEmail() {
        const value = emailInput.value.trim();
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const box = emailInput.closest(".input-box");

        if (!value) {
            box.classList.add("invalid");
            emailError.textContent = "Please enter your email.";
            return false;
        }
        if (!pattern.test(value)) {
            box.classList.add("invalid");
            emailError.textContent = "Please enter a valid email address.";
            return false;
        }
        box.classList.remove("invalid");
        emailError.textContent = "";
        return true;
    }

    function validateMessage() {
        const value = messageInput.value.trim();
        const box = messageInput.closest(".input-box");

        if (!value) {
            box.classList.add("invalid");
            messageError.textContent = "Please write your message.";
            return false;
        }
        if (value.length < 10) {
            box.classList.add("invalid");
            messageError.textContent = "Message must be at least 10 characters.";
            return false;
        }
        box.classList.remove("invalid");
        messageError.textContent = "";
        return true;
    }

    nameInput.addEventListener("input", validateName);
    emailInput.addEventListener("input", validateEmail);
    messageInput.addEventListener("input", validateMessage);

    contactForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const validName    = validateName();
        const validEmail   = validateEmail();
        const validMessage = validateMessage();

        if (validName && validEmail && validMessage) {

            if (submitBtn) submitBtn.disabled = true;

            successModal.classList.add("show");
            contactForm.reset();

            document.querySelectorAll(".input-box.invalid")
                .forEach(el => el.classList.remove("invalid"));

            nameError.textContent = "";
            emailError.textContent = "";
            messageError.textContent = "";

            if (submitBtn) submitBtn.disabled = false;

        } else {
            const firstInvalid = document.querySelector(".input-box.invalid");
            if (firstInvalid) {
                firstInvalid.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                    block: "center"
                });
                const field = firstInvalid.querySelector("input, textarea");
                if (field) field.focus();
            }
        }
    });

    function closeModal() {
        successModal.classList.remove("show");
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (successBtn) successBtn.addEventListener("click", closeModal);

    successModal.addEventListener("click", function (e) {
        if (e.target === successModal) closeModal();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && successModal.classList.contains("show")) {
            closeModal();
        }
    });
});