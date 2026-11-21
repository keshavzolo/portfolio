document.documentElement.classList.add("is-loading");

window.addEventListener(
  "load",
  () => {
    window.setTimeout(() => {
      document.documentElement.classList.remove("is-loading");
    }, 1500);
  },
  { once: true },
);
