import feed from "./instagram.json";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const navLinks = [...document.querySelectorAll(".main-nav a")];
const reveals = [...document.querySelectorAll(".reveal")];

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

const carousel = document.querySelector("[data-carousel]");
const previousButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");

/* Instagram feed only replaces the fallback carousel when posts exist, so
   the homepage always keeps a working photo gallery. */
const renderFeed = () => {
  const posts = Array.isArray(feed?.posts) ? feed.posts : [];
  if (!carousel || !posts.length) return;

  const safeLink = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" &&
        parsed.hostname.endsWith("instagram.com")
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  };

  const cards = posts.map((post) => {
    const href = safeLink(post.permalink);
    const card = document.createElement(href ? "a" : "article");
    card.className = "event-card feed-card";

    if (href) {
      card.href = href;
      card.target = "_blank";
      card.rel = "noreferrer";
    }

    const img = document.createElement("img");
    img.src = post.image;
    img.alt = post.alt || "Sawusaunan Instagram-julkaisu";
    img.loading = "lazy";

    card.append(img);
    return card;
  });

  carousel.replaceChildren(...cards);

  const label = document.querySelector("[data-feed-label]");
  if (label) label.textContent = "Instagramista";

  const heading = document.querySelector("[data-feed-heading]");
  if (heading) heading.textContent = "Viimeksi lauteilta.";
};

renderFeed();

const getCarouselStep = () => {
  const card = carousel?.querySelector(".event-card");

  if (!(card instanceof HTMLElement) || !(carousel instanceof HTMLElement)) {
    return 0;
  }

  const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
  return card.getBoundingClientRect().width + gap;
};

previousButton?.addEventListener("click", () => {
  carousel?.scrollBy({ left: -getCarouselStep(), behavior: "smooth" });
});

nextButton?.addEventListener("click", () => {
  carousel?.scrollBy({ left: getCarouselStep(), behavior: "smooth" });
});

/* Palkki ja nuolten tilat kertovat missä kohtaa karusellia ollaan. Lasketaan
   vieritysosuudesta eikä korttien indeksistä, jotta luku pitää paikkansa myös
   kesken snap-liikkeen ja kun näkyviä kortteja on eri määrä eri leveyksillä. */
const progressBar = document.querySelector("[data-carousel-progress]");

const updateCarouselControls = () => {
  if (!(carousel instanceof HTMLElement)) return;

  const max = carousel.scrollWidth - carousel.clientWidth;
  const ratio = max > 1 ? carousel.scrollLeft / max : 0;

  if (progressBar instanceof HTMLElement) {
    progressBar.style.width = `${Math.round(ratio * 100)}%`;
  }

  /* Yhden pikselin liukuma: snap ei aina osu tasan reunaan. */
  if (previousButton) previousButton.disabled = carousel.scrollLeft <= 1;
  if (nextButton) nextButton.disabled = carousel.scrollLeft >= max - 1;
};

if (carousel instanceof HTMLElement) {
  let ticking = false;

  carousel.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateCarouselControls();
      });
    },
    { passive: true },
  );

  window.addEventListener("resize", updateCarouselControls);
  updateCarouselControls();
}
