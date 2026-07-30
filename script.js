const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const navLinks = [...document.querySelectorAll(".main-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const reveals = [...document.querySelectorAll(".reveal")];
const membershipLink = document.querySelector("[data-membership-link]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

const setMenu = (open) => {
  navigation?.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  menuButton?.setAttribute("aria-expanded", String(open));

  if (menuButton) {
    menuButton.textContent = open ? "Sulje" : "Valikko";
  }
};

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

for (const link of navLinks) {
  link.addEventListener("click", () => setMenu(false));
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
  }
});

const setActiveLink = () => {
  const offset = window.scrollY + window.innerHeight * 0.35;
  let activeId = sections[0]?.id;

  for (const section of sections) {
    if (section.offsetTop <= offset) {
      activeId = section.id;
    }
  }

  for (const link of navLinks) {
    link.classList.toggle(
      "is-active",
      link.getAttribute("href") === `#${activeId}`,
    );
  }

  header?.classList.toggle("is-scrolled", window.scrollY > 40);
};

setActiveLink();
window.addEventListener("scroll", setActiveLink, { passive: true });

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.16 },
  );

  for (const element of reveals) {
    revealObserver.observe(element);
  }
} else {
  for (const element of reveals) {
    element.classList.add("is-visible");
  }
}

membershipLink?.addEventListener("click", () => {
  window.setTimeout(() => {
    const message = contactForm?.elements.namedItem("message");
    if (message instanceof HTMLTextAreaElement && !message.value) {
      message.value = "Hei! Haluaisin kuulla lisää jäsenyydestä.";
      message.focus();
    }
  }, 450);
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) {
    return;
  }

  formStatus.textContent =
    "Kiitos! Lomake yhdistetään Sawusaunan sähköpostiin ennen julkaisua.";
  contactForm.reset();
});

const hero = document.querySelector("[data-hero]");
const steamCanvas = document.querySelector("[data-steam]");

if (hero instanceof HTMLElement && steamCanvas instanceof HTMLCanvasElement) {
  const context = steamCanvas.getContext("2d");
  const steamImage = new Image();
  const clearPoints = [];
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let frameId;

  const resizeCanvas = () => {
    const bounds = hero.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    steamCanvas.width = Math.round(bounds.width * scale);
    steamCanvas.height = Math.round(bounds.height * scale);
    steamCanvas.style.width = `${bounds.width}px`;
    steamCanvas.style.height = `${bounds.height}px`;
    context?.setTransform(scale, 0, 0, scale, 0, 0);
  };

  const drawCoverImage = (image, width, height, offsetX) => {
    const imageRatio = image.width / image.height;
    const canvasRatio = width / height;
    let drawWidth;
    let drawHeight;

    if (imageRatio > canvasRatio) {
      drawHeight = height * 1.04;
      drawWidth = drawHeight * imageRatio;
    } else {
      drawWidth = width * 1.04;
      drawHeight = drawWidth / imageRatio;
    }

    context.drawImage(
      image,
      (width - drawWidth) / 2 + offsetX,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  };

  const renderSteam = (time = 0) => {
    if (!context || !steamImage.complete) {
      return;
    }

    const width = hero.clientWidth;
    const height = hero.clientHeight;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 0.82;

    const drift = reducedMotion ? 0 : Math.sin(time / 5000) * 12;
    drawCoverImage(steamImage, width, height, drift);

    const now = performance.now();
    context.globalCompositeOperation = "destination-out";
    context.filter = "blur(14px)";

    for (let index = clearPoints.length - 1; index >= 0; index -= 1) {
      const point = clearPoints[index];
      const age = now - point.createdAt;

      if (age > 1450) {
        clearPoints.splice(index, 1);
        continue;
      }

      context.globalAlpha = 1 - age / 1450;
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.filter = "none";
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    frameId = window.requestAnimationFrame(renderSteam);
  };

  const addClearPoint = (clientX, clientY) => {
    const bounds = hero.getBoundingClientRect();
    clearPoints.push({
      x: clientX - bounds.left,
      y: clientY - bounds.top,
      radius: Math.max(72, Math.min(128, bounds.width * 0.085)),
      createdAt: performance.now(),
    });

    if (clearPoints.length > 28) {
      clearPoints.shift();
    }

    hero.classList.add("has-interacted");
  };

  hero.addEventListener("pointermove", (event) => {
    addClearPoint(event.clientX, event.clientY);
  });

  hero.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) {
        addClearPoint(touch.clientX, touch.clientY);
      }
    },
    { passive: true },
  );

  steamImage.addEventListener("load", () => {
    resizeCanvas();
    const bounds = hero.getBoundingClientRect();
    clearPoints.push({
      x: bounds.width * 0.73,
      y: bounds.height * 0.52,
      radius: Math.max(72, Math.min(128, bounds.width * 0.085)),
      createdAt: performance.now() - 250,
    });
    frameId = window.requestAnimationFrame(renderSteam);
  });

  steamImage.src = "/assets/steam-overlay.png";
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(frameId));
}
