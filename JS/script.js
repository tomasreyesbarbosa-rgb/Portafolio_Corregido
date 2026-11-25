(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ---------- Año del footer ---------- */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Efecto de escritura en el hero ---------- */
    const role = document.getElementById("typed-role");
    if (role && !reduceMotion) {
        const fullText = role.textContent.trim();
        role.textContent = "";
        role.classList.add("typing");
        let i = 0;
        const type = () => {
            role.textContent = fullText.slice(0, ++i);
            if (i < fullText.length) {
                setTimeout(type, 55);
            } else {
                setTimeout(() => role.classList.remove("typing"), 1800);
            }
        };
        setTimeout(type, 400);
    }

    /* ---------- Header y barra de progreso ---------- */
    const header = document.querySelector("header");
    const progress = document.querySelector(".scroll-progress");
    let ticking = false;

    const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;
        progress.style.transform = `scaleX(${ratio})`;
        header.classList.toggle("scrolled", window.scrollY > 40);
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    /* ---------- Revelado al hacer scroll (con escalonado) ---------- */
    const revealItems = document.querySelectorAll(".reveal");
    revealItems.forEach((el) => {
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        el.style.setProperty("--delay", `${siblings.indexOf(el) * 0.09}s`);
    });

    if ("IntersectionObserver" in window && !reduceMotion) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealItems.forEach((el) => revealObserver.observe(el));
    } else {
        revealItems.forEach((el) => el.classList.add("visible"));
    }

    /* ---------- Enlace activo del menú según la sección ---------- */
    const navLinks = document.querySelectorAll("nav a");
    const sections = [...navLinks]
        .map((a) => document.querySelector(a.getAttribute("href")))
        .filter(Boolean);

    if ("IntersectionObserver" in window) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    navLinks.forEach((a) => {
                        a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`);
                    });
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach((s) => navObserver.observe(s));
    }

    /* ---------- Inclinación 3D de las tarjetas de proyecto ---------- */
    const cards = [...document.querySelectorAll(".project-card")];

    if (canHover && !reduceMotion) {
        cards.forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                card.classList.add("tilt");
                card.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
                card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
                card.style.setProperty("--mx", `${x * 100}%`);
                card.style.setProperty("--my", `${y * 100}%`);
            });
            card.addEventListener("mouseleave", () => {
                card.classList.remove("tilt");
                card.style.removeProperty("--rx");
                card.style.removeProperty("--ry");
            });
        });
    }

    /* ---------- Modal de proyecto + carrusel ---------- */
    const modal = document.getElementById("project-modal");
    const body = modal.querySelector(".modal-body");
    const mTitle = modal.querySelector("#modal-title");
    const mDesc = modal.querySelector(".modal-desc");
    const mNote = modal.querySelector(".modal-note");
    const mTags = modal.querySelector(".modal-tags");
    const mImg = modal.querySelector(".modal-media img");
    const mCounter = modal.querySelector(".modal-counter");
    const mDots = modal.querySelector(".modal-dots");
    const btnPrev = modal.querySelector(".modal-prev");
    const btnNext = modal.querySelector(".modal-next");
    const btnClose = modal.querySelector(".modal-close");

    // Los datos se leen de las propias tarjetas: editas el HTML y el modal se actualiza solo.
    const projects = cards.map((card) => ({
        title: card.querySelector("h3").textContent.trim(),
        desc: card.querySelector(".project-content p").textContent.trim(),
        note: card.dataset.note || "",
        tags: [...card.querySelectorAll(".tag")].map((t) => t.textContent.trim()),
        img: card.querySelector("img").getAttribute("src"),
        alt: card.querySelector("img").getAttribute("alt"),
    }));

    // Puntos del carrusel
    projects.forEach((p, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "modal-dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Ir al proyecto ${i + 1}: ${p.title}`);
        dot.addEventListener("click", () => go(i, i > current ? "next" : "prev"));
        mDots.appendChild(dot);
    });
    const dots = [...mDots.children];

    let current = 0;
    let lastFocus = null;

    function render(index, direction) {
        const p = projects[index];
        mTitle.textContent = p.title;
        mDesc.textContent = p.desc;
        mNote.textContent = p.note;
        mImg.src = p.img;
        mImg.alt = p.alt;
        mTags.innerHTML = "";
        p.tags.forEach((t) => {
            const span = document.createElement("span");
            span.className = "tag";
            span.textContent = t;
            mTags.appendChild(span);
        });
        mCounter.textContent = `${index + 1} / ${projects.length}`;
        dots.forEach((d, i) => {
            d.classList.toggle("active", i === index);
            d.setAttribute("aria-selected", String(i === index));
        });

        body.classList.remove("slide-next", "slide-prev");
        if (direction) {
            void body.offsetWidth; // reinicia la animación
            body.classList.add(direction === "next" ? "slide-next" : "slide-prev");
        }
    }

    function go(index, direction) {
        current = (index + projects.length) % projects.length;
        render(current, direction);
    }

    const next = () => go(current + 1, "next");
    const prev = () => go(current - 1, "prev");

    function openModal(index) {
        lastFocus = document.activeElement;
        current = index;
        render(current, null);
        modal.classList.remove("closing");
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        btnClose.focus();
    }

    function closeModal() {
        if (modal.hidden || modal.classList.contains("closing")) return;
        modal.classList.add("closing");
        setTimeout(() => {
            modal.hidden = true;
            modal.classList.remove("closing");
            document.body.classList.remove("no-scroll");
            if (lastFocus) lastFocus.focus();
        }, reduceMotion ? 0 : 250);
    }

    cards.forEach((card, i) => {
        card.addEventListener("click", () => openModal(i));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openModal(i);
            }
        });
    });

    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
        if (modal.hidden) return;
        if (e.key === "Escape") closeModal();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();

        // Mantiene el foco dentro del modal
        if (e.key === "Tab") {
            const focusables = [...modal.querySelectorAll("button")];
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Deslizar con el dedo en móvil
    let touchX = null;
    modal.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    modal.addEventListener("touchend", (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
        touchX = null;
    }, { passive: true });
})();