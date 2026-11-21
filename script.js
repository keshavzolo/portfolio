const themeButton = document.querySelector(".theme-toggle");
const searchDialog = document.querySelector(".search-dialog");
const imageDialog = document.querySelector(".image-dialog");
const avatarTrigger = document.querySelector(".avatar-trigger");
const profileTagline = document.querySelector(".profile-tagline");
const contributionsCalendar = document.querySelector("#contributions-calendar");
const contributionsTotal = document.querySelector("#contributions-total");
const searchInput = document.querySelector("#site-search");
const searchResults = document.querySelector(".search-results");
const searchTrigger = document.querySelector(".search-trigger");
const mascotButton = document.querySelector(".mascot-button");
const mascotMessage = document.querySelector(".mascot-message");
const projectCards = [...document.querySelectorAll(".note-card")];
const projectGrid = document.querySelector(".notes-grid");
const elsewhereCards = [...document.querySelectorAll(".elsewhere-card")];

projectCards.forEach((card) => {
  card.addEventListener("toggle", () => {
    if (card.open) {
      projectCards.forEach((otherCard) => {
        if (otherCard !== card) {
          otherCard.open = false;
        }
      });
    }

    projectGrid.classList.toggle("has-open-card", projectCards.some((projectCard) => projectCard.open));
  });
});

elsewhereCards.forEach((card) => {
  card.addEventListener("toggle", () => {
    if (card.open) {
      elsewhereCards.forEach((otherCard) => {
        if (otherCard !== card) {
          otherCard.open = false;
        }
      });
    }
  });
});

const savedTheme = localStorage.getItem("portfolio-theme");
const initialDark = savedTheme === null ? true : savedTheme === "dark";

function setTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#171817" : "#f8f8f7";
}

setTheme(initialDark);

async function loadContributions() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://github-contributions-api.jogruber.de/v4/keshavzolo?y=last", {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Contribution service returned ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.contributions) || typeof data.total?.lastYear !== "number") {
      throw new Error("Contribution service returned an unexpected response");
    }

    const weeks = [];
    const monthLabels = new Map();
    for (const contribution of data.contributions) {
      const date = new Date(`${contribution.date}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || typeof contribution.count !== "number") {
        continue;
      }

      if (!weeks.length) {
        weeks.push(Array(date.getUTCDay()).fill(null));
      } else if (date.getUTCDay() === 0) {
        weeks.push([]);
      }
      const week = weeks[weeks.length - 1];
      while (week.length < date.getUTCDay()) {
        week.push(null);
      }
      week.push(contribution);

      const month = date.toLocaleString("en", { month: "short", timeZone: "UTC" });
      if (!monthLabels.has(month)) {
        const usedColumns = new Set(monthLabels.values());
        let labelColumn = weeks.length;
        while (usedColumns.has(labelColumn)) {
          labelColumn += 1;
        }
        monthLabels.set(month, labelColumn);
      }
    }

    if (!weeks.length) {
      throw new Error("Contribution service returned no contribution dates");
    }
    const monthRow = document.createElement("div");
    monthRow.className = "contributions-month-row";
    monthRow.style.gridColumn = `2 / span ${weeks.length}`;
    monthRow.style.display = "grid";
    monthRow.style.gridTemplateColumns = `repeat(${weeks.length}, 11px)`;
    monthRow.style.columnGap = "3px";
    monthLabels.forEach((weekIndex, month) => {
      const label = document.createElement("span");
      label.className = "contributions-month";
      label.style.gridColumn = String(weekIndex);
      label.textContent = month;
      monthRow.append(label);
    });
    contributionsCalendar.append(monthRow);

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day, index) => {
      const label = document.createElement("span");
      label.className = "contributions-weekday";
      label.style.gridRow = String(index + 3);
      label.textContent = day;
      contributionsCalendar.append(label);
    });
    contributionsTotal.textContent = `${data.total.lastYear} contributions in the last year`;
    contributionsCalendar.setAttribute("role", "img");
    contributionsCalendar.setAttribute("aria-label", `GitHub contributions over the last year: ${data.total.lastYear} contributions`);
    contributionsCalendar.style.gridTemplateColumns = `26px repeat(${weeks.length}, 11px)`;
    weeks.forEach((week, weekIndex) => {
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const contribution = week[dayIndex];
        if (!contribution) {
          continue;
        }
        const cell = document.createElement("span");
        const level = Math.max(0, Math.min(4, Number(contribution.level) || 0));
        cell.className = `contribution-day level-${level}`;
        cell.style.gridColumn = String(weekIndex + 2);
        cell.style.gridRow = String(dayIndex + 3);
        cell.title = `${contribution.count} contribution${contribution.count === 1 ? "" : "s"} on ${contribution.date}`;
        contributionsCalendar.append(cell);
      }
    });
  } catch (error) {
    console.error("Could not load GitHub contributions:", error);
    contributionsTotal.textContent = "Contribution total unavailable.";
    contributionsCalendar.setAttribute("aria-label", "GitHub contribution calendar unavailable");
    contributionsCalendar.closest(".contributions-card")?.classList.add("has-error");
  } finally {
    window.clearTimeout(timeout);
  }
}

loadContributions();

const profileTaglines = [
  "Keep learning. Keep building.",
  "Small steps make big progress.",
  "Stay curious. Make it happen.",
  "Every expert was once a beginner.",
  "Turn your ideas into something real.",
  "Consistency beats perfection.",
];
let profileTaglineIndex = 0;

window.setInterval(() => {
  profileTagline.classList.add("is-fading");
  window.setTimeout(() => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * profileTaglines.length);
    } while (nextIndex === profileTaglineIndex);

    profileTaglineIndex = nextIndex;
    profileTagline.textContent = profileTaglines[profileTaglineIndex];
    profileTagline.classList.remove("is-fading");
  }, 350);
}, 3500);

avatarTrigger.addEventListener("click", () => imageDialog.showModal());
imageDialog.querySelector(".image-dialog-close").addEventListener("click", () => imageDialog.close());
imageDialog.addEventListener("click", (event) => {
  if (event.target === imageDialog) {
    imageDialog.close();
  }
});

themeButton.addEventListener("click", () => {
  const nextDark = !document.documentElement.classList.contains("dark");
  setTheme(nextDark);
  localStorage.setItem("portfolio-theme", nextDark ? "dark" : "light");
});

function openSearch() {
  if (!searchDialog.open) {
    searchDialog.showModal();
    searchInput.focus();
    renderResults("");
  }
}

searchTrigger.addEventListener("click", openSearch);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});

const searchableItems = [...document.querySelectorAll("main h1, main h2, .work-title, .note-card h3, .elsewhere-card strong")].map((heading) => {
  const container = heading.closest(".note-card, .work-item, .elsewhere-card, section") ?? heading;
  const destination = `#${heading.closest("section")?.id || "home"}`;
  return {
    title: heading.textContent.trim(),
    text: container.textContent.trim().replace(/\s+/g, " "),
    href: destination,
  };
});

function renderResults(query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = searchableItems.filter((item) => !normalizedQuery || `${item.title} ${item.text}`.toLocaleLowerCase().includes(normalizedQuery)).slice(0, 6);

  searchResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "No matches yet. Try a different word.";
    searchResults.append(empty);
    return;
  }

  matches.forEach((item) => {
    const link = document.createElement("a");
    link.className = "search-result";
    link.href = item.href;
    const title = document.createElement("strong");
    title.textContent = item.title;
    const summary = document.createElement("span");
    summary.textContent = item.text.slice(item.title.length).trim().slice(0, 100) || "Explore this section";
    link.append(title, summary);
    link.addEventListener("click", () => searchDialog.close());
    searchResults.append(link);
  });
}

searchInput.addEventListener("input", () => renderResults(searchInput.value));
searchDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    searchDialog.close();
  }
});
searchDialog.addEventListener("close", () => {
  searchInput.value = "";
  searchResults.replaceChildren();
  searchTrigger.focus();
});

document.addEventListener("click", (event) => {
  if (searchDialog.open && event.target === searchDialog) {
    searchDialog.close();
  }
});

const mascotMessages = [
  "Keep shipping, keep learning.",
  "A good idea gets better when you build it.",
  "Small improvements add up.",
];
let mascotMessageIndex = 0;
let mascotTimeout;

mascotButton.addEventListener("click", () => {
  mascotMessage.textContent = mascotMessages[mascotMessageIndex];
  mascotMessageIndex = (mascotMessageIndex + 1) % mascotMessages.length;
  mascotMessage.classList.add("show");
  mascotButton.setAttribute("aria-expanded", "true");
  window.clearTimeout(mascotTimeout);
  mascotTimeout = window.setTimeout(() => {
    mascotMessage.classList.remove("show");
    mascotButton.setAttribute("aria-expanded", "false");
  }, 3000);
});
