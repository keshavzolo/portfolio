const themeButton = document.querySelector(".theme-toggle");
const animeNavLink = document.querySelector(".anime-nav-link");
const homeNavLink = document.querySelector('.nav-links a[href="#home"]');
const searchDialog = document.querySelector(".search-dialog");
const imageDialog = document.querySelector(".image-dialog");
const avatarTrigger = document.querySelector(".avatar-trigger");
const profileTagline = document.querySelector(".profile-tagline");
const visitorCount = document.querySelector(".visitor-count");
const visitorCountImage = document.querySelector(".visitor-count-image");
const visitorCountFallback = document.querySelector(".visitor-count-fallback");
const contributionsCalendar = document.querySelector("#contributions-calendar");
const contributionsTotal = document.querySelector("#contributions-total");
const contributionsScroll = document.querySelector(".contributions-scroll");
const contributionsSlider = document.querySelector(".contributions-slider");
const searchInput = document.querySelector("#site-search");
const searchResults = document.querySelector(".search-results");
const searchTrigger = document.querySelector(".search-trigger");
const mascotButton = document.querySelector(".mascot-button");
const mascotMessage = document.querySelector(".mascot-message");
const musicAudio = document.querySelector("#music-audio");
const musicPlayer = document.querySelector(".music-player");
const musicPlayButton = document.querySelector(".music-play-toggle");
const musicSeek = document.querySelector(".music-seek");
const musicCurrentTime = document.querySelector(".music-current-time");
const musicDuration = document.querySelector(".music-duration");
const musicStatus = document.querySelector(".music-status");
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
let themeAudioContext;

function setTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#171817" : "#f8f8f7";
}

function playThemeSound(isDark) {
  if (!window.AudioContext) {
    return;
  }

  themeAudioContext ??= new window.AudioContext();
  const now = themeAudioContext.currentTime;
  const oscillator = themeAudioContext.createOscillator();
  const volume = themeAudioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(isDark ? 660 : 440, now);
  oscillator.frequency.exponentialRampToValueAtTime(isDark ? 440 : 660, now + 0.1);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  oscillator.connect(volume);
  volume.connect(themeAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.15);
}

setTheme(initialDark);

function formatMusicTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateMusicProgress() {
  const duration = musicAudio.duration;
  musicCurrentTime.textContent = formatMusicTime(musicAudio.currentTime);
  musicDuration.textContent = formatMusicTime(duration);
  musicSeek.disabled = !Number.isFinite(duration) || duration <= 0;

  if (!musicSeek.disabled) {
    const progress = (musicAudio.currentTime / duration) * 100;
    musicSeek.value = String(Math.round(progress * 10));
    musicSeek.style.setProperty("--music-progress", `${progress}%`);
  }
}

function updateMusicPlaybackState() {
  const isPlaying = !musicAudio.paused && !musicAudio.ended;
  musicPlayer.classList.toggle("is-playing", isPlaying);
  musicPlayButton.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} Always With Me`);
  musicPlayButton.setAttribute("aria-pressed", String(isPlaying));
}

musicPlayButton.addEventListener("click", async () => {
  musicStatus.textContent = "";
  if (musicAudio.paused) {
    try {
      await musicAudio.play();
    } catch (error) {
      musicStatus.textContent = "Audio playback could not be started.";
      console.error("Audio playback failed:", error);
    }
  } else {
    musicAudio.pause();
  }
});

musicAudio.addEventListener("loadedmetadata", updateMusicProgress);
musicAudio.addEventListener("durationchange", updateMusicProgress);
musicAudio.addEventListener("timeupdate", updateMusicProgress);
musicAudio.addEventListener("play", updateMusicPlaybackState);
musicAudio.addEventListener("pause", updateMusicPlaybackState);
musicAudio.addEventListener("ended", updateMusicPlaybackState);
musicAudio.addEventListener("error", () => {
  musicStatus.textContent = "Audio file could not be loaded.";
  musicSeek.disabled = true;
});
musicSeek.addEventListener("input", () => {
  if (Number.isFinite(musicAudio.duration) && musicAudio.duration > 0) {
    const progress = Number(musicSeek.value) / 1000;
    musicAudio.currentTime = progress * musicAudio.duration;
    musicCurrentTime.textContent = formatMusicTime(progress * musicAudio.duration);
    musicSeek.style.setProperty("--music-progress", `${progress * 100}%`);
  }
});
updateMusicProgress();

visitorCountImage.addEventListener("error", () => {
  visitorCountImage.hidden = true;
  visitorCountFallback.hidden = false;
  visitorCount.setAttribute("aria-label", "Cumulative visitor count unavailable");
  console.error("Could not load the visitor count.");
});

async function loadContributions() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const today = new Date();
  const periodStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1));
  const periodStartDate = periodStart.toISOString().slice(0, 10);
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
    const monthLabels = [];
    let previousMonthKey = null;
    let totalContributions = 0;
    for (const contribution of data.contributions) {
      const date = new Date(`${contribution.date}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || typeof contribution.count !== "number") {
        continue;
      }
      if (contribution.date < periodStartDate) {
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

      const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      if (monthKey !== previousMonthKey) {
        monthLabels.push({
          month: date.toLocaleString("en", { month: "short", timeZone: "UTC" }),
          weekIndex: weeks.length,
        });
        previousMonthKey = monthKey;
      }
      totalContributions += contribution.count;
    }

    if (!weeks.length) {
      throw new Error("Contribution service returned no contribution dates");
    }
    const columnWidth = 14;
    const columnGap = 4;
    const weekPitch = columnWidth + columnGap;

    const monthRow = document.createElement("div");
    monthRow.className = "contributions-month-row";
    monthRow.style.gridColumn = `1 / span ${weeks.length}`;
    monthRow.style.display = "grid";
    monthRow.style.gridTemplateColumns = `repeat(${weeks.length}, ${columnWidth}px)`;
    monthRow.style.columnGap = "4px";
    monthLabels.forEach(({ month, weekIndex }) => {
      const label = document.createElement("span");
      label.className = "contributions-month";
      label.style.gridColumn = String(weekIndex);
      label.textContent = month;
      monthRow.append(label);
    });
    contributionsCalendar.append(monthRow);

    contributionsTotal.textContent = `${totalContributions} contributions in the last 12 months`;
    contributionsCalendar.setAttribute("role", "img");
    contributionsCalendar.setAttribute("aria-label", `GitHub contributions in the last 12 months: ${totalContributions} contributions`);
    contributionsCalendar.style.gridTemplateColumns = `repeat(${weeks.length}, ${columnWidth}px)`;
    weeks.forEach((week, weekIndex) => {
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const contribution = week[dayIndex];
        if (!contribution) {
          continue;
        }
        const cell = document.createElement("span");
        const level = Math.max(0, Math.min(4, Number(contribution.level) || 0));
        cell.className = `contribution-day level-${level}`;
        cell.style.gridColumn = String(weekIndex + 1);
        cell.style.gridRow = String(dayIndex + 3);
        cell.title = `${contribution.count} contribution${contribution.count === 1 ? "" : "s"} on ${contribution.date}`;
        contributionsCalendar.append(cell);
      }
    });

    const getVisibleWeekCount = () => Math.max(
      1,
      Math.floor((contributionsScroll.clientWidth + columnGap) / weekPitch),
    );
    const updateContributionsSlider = () => {
      const visibleWeekCount = getVisibleWeekCount();
      const maxWeekOffset = Math.max(0, weeks.length - visibleWeekCount);
      contributionsSlider.max = String(maxWeekOffset);
      contributionsSlider.disabled = maxWeekOffset === 0;
      contributionsScroll.scrollLeft = Math.min(
        contributionsScroll.scrollLeft,
        maxWeekOffset * weekPitch,
      );
      const currentWeekOffset = Math.min(
        maxWeekOffset,
        Math.round(contributionsScroll.scrollLeft / weekPitch),
      );
      contributionsSlider.value = String(currentWeekOffset);
      contributionsSlider.setAttribute(
        "aria-valuetext",
        `Weeks ${currentWeekOffset + 1} to ${Math.min(currentWeekOffset + visibleWeekCount, weeks.length)} of ${weeks.length}`,
      );
    };

    contributionsSlider.addEventListener("input", () => {
      contributionsScroll.scrollLeft = Number(contributionsSlider.value) * weekPitch;
    });
    contributionsScroll.addEventListener("scroll", () => {
      const maxWeekOffset = Number(contributionsSlider.max);
      const currentWeekOffset = Math.min(
        maxWeekOffset,
        Math.round(contributionsScroll.scrollLeft / weekPitch),
      );
      contributionsSlider.value = String(currentWeekOffset);
      const visibleWeekCount = getVisibleWeekCount();
      contributionsSlider.setAttribute(
        "aria-valuetext",
        `Weeks ${currentWeekOffset + 1} to ${Math.min(currentWeekOffset + visibleWeekCount, weeks.length)} of ${weeks.length}`,
      );
    });
    window.addEventListener("resize", updateContributionsSlider);
    updateContributionsSlider();
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
  playThemeSound(nextDark);
  localStorage.setItem("portfolio-theme", nextDark ? "dark" : "light");
});

function updateAnimeView() {
  const isAnimeView = window.location.hash === "#anime";
  document.body.classList.toggle("anime-view", isAnimeView);
  animeNavLink.toggleAttribute("aria-current", isAnimeView);
  if (isAnimeView) {
    animeNavLink.setAttribute("aria-current", "page");
    homeNavLink.removeAttribute("aria-current");
    document.title = "Anime favorites — Keshav Maheshwari";
    window.scrollTo(0, 0);
    return;
  }

  homeNavLink.setAttribute("aria-current", "page");
  document.title = "Keshav Maheshwari — Full-Stack Developer";
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      window.requestAnimationFrame(() => target.scrollIntoView());
    }
  }
}

animeNavLink.addEventListener("click", (event) => {
  event.preventDefault();
  if (window.location.hash !== "#anime") {
    window.history.pushState(null, "", "#anime");
  }
  updateAnimeView();
});

document.querySelectorAll('.nav-links a[href^="#"]:not(.anime-nav-link)').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!document.body.classList.contains("anime-view")) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, "", link.getAttribute("href"));
    updateAnimeView();
  });
});

window.addEventListener("popstate", updateAnimeView);
window.addEventListener("hashchange", updateAnimeView);
updateAnimeView();

const canTiltAnimeCards = window.matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
).matches;

if (canTiltAnimeCards) {
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
