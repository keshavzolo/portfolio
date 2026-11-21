const themeButton = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("portfolio-theme");

function setTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#171817" : "#f8f8f7";
}

setTheme(savedTheme === null ? true : savedTheme === "dark");

themeButton.addEventListener("click", () => {
  const nextDark = !document.documentElement.classList.contains("dark");
  setTheme(nextDark);
  localStorage.setItem("portfolio-theme", nextDark ? "dark" : "light");
});

const canTiltCards = window.matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
).matches;

if (canTiltCards) {
  document.querySelectorAll(".anime-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      const bounds = card.getBoundingClientRect();
      const horizontalPosition = (event.clientX - bounds.left) / bounds.width - 0.5;
      const verticalPosition = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--tilt-x", `${horizontalPosition * 10}deg`);
      card.style.setProperty("--tilt-y", `${verticalPosition * -10}deg`);
      card.classList.add("is-tilting");
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  });
}
