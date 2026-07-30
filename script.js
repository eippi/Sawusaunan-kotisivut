const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".main-nav a")];

const setActiveLink = () => {
  const offset = window.scrollY + 180;

  let activeId = sections[0]?.id;

  for (const section of sections) {
    if (section.offsetTop <= offset) {
      activeId = section.id;
    }
  }

  for (const link of navLinks) {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
  }
};

setActiveLink();
window.addEventListener("scroll", setActiveLink, { passive: true });
