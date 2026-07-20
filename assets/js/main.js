(() => {
  const config = window.CLP_CONFIG || {
    downloadUrl: "/downloads/Clp-0.1.0.dmg",
    version: "0.1.0",
    githubUrl: "https://github.com/erick-ribeiro/clp-app",
  };

  document.querySelectorAll("[data-download]").forEach((el) => {
    el.setAttribute("href", config.downloadUrl);
    el.setAttribute("download", "");
  });

  document.querySelectorAll("[data-github]").forEach((el) => {
    el.setAttribute("href", config.githubUrl);
  });

  document.querySelectorAll("[data-version]").forEach((el) => {
    el.textContent = config.version;
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reveal = (selector) => {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
  };

  // Shelf enters shortly after paint (hero presence)
  const shelf = document.querySelector('[data-animate="shelf"]');
  if (shelf) {
    if (reduceMotion) {
      shelf.classList.add("is-visible");
    } else {
      requestAnimationFrame(() => {
        setTimeout(() => shelf.classList.add("is-visible"), 120);
      });
    }
  }

  reveal('[data-animate="rise"]');

  // Light parallax of atmosphere orbs under the glass
  if (!reduceMotion) {
    const orbs = document.querySelectorAll("[data-parallax]");
    let ticking = false;

    const updateParallax = () => {
      const y = window.scrollY || 0;
      orbs.forEach((orb) => {
        const factor = Number(orb.getAttribute("data-parallax")) || 0.1;
        orb.style.transform = `translate3d(0, ${y * factor}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateParallax);
        }
      },
      { passive: true }
    );

    updateParallax();
  }
})();
