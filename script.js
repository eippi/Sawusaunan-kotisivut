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
