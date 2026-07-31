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

/* Instagram-syöte korvaa karusellin sisällön vain jos julkaisuja on.
   Ilman syötettä HTML:n tapahtumajulisteet jäävät voimaan, joten sivu ei
   ole missään vaiheessa tyhjä eikä rikki. */
const renderFeed = () => {
  const posts = Array.isArray(feed?.posts) ? feed.posts : [];
  if (!carousel || !posts.length) return;

  // Osoite tulee rajapinnasta, joten hyväksytään vain Instagramin omat linkit
  const safeLink = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "https:" && u.hostname.endsWith("instagram.com")
        ? u.href
        : null;
    } catch {
      return null;
    }
  };

  const date = new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

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

    const meta = document.createElement("div");
    const when = document.createElement("span");
    when.textContent = post.timestamp ? date.format(new Date(post.timestamp)) : "";
    meta.append(when);

    if (href) {
      const arrow = document.createElement("b");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      meta.append(arrow);
    }

    card.append(img, meta);
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
