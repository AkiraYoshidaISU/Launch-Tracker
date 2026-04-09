const AUTO_REFRESH_MS = 5 * 60 * 1000;
const DATA_URL = "./data/upcoming-launches.json";
const API_CANDIDATES = [
  "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=20&hide_recent_previous=true",
  "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=20&hide_recent_previous=true"
];

const els = {
  nextMission: document.getElementById("nextMission"),
  countdown: document.getElementById("countdown"),
  nextRocket: document.getElementById("nextRocket"),
  nextSite: document.getElementById("nextSite"),
  nextDate: document.getElementById("nextDate"),
  launchList: document.getElementById("launchList"),
  status: document.getElementById("status"),
  lastUpdated: document.getElementById("lastUpdated"),
  launchCardTemplate: document.getElementById("launchCardTemplate")
};

let launches = [];
let nextLaunch = null;

function launchSiteName(item) {
  const pad = item.pad?.name || "Unknown pad";
  const location = item.pad?.location?.name || item.pad?.location?.country_code || "Unknown location";
  return `${pad}, ${location}`;
}

function rocketName(item) {
  return item.rocket?.configuration?.full_name || item.rocket?.configuration?.name || item.vehicle?.name || "Unknown rocket";
}

function missionName(item) {
  return item.mission?.name || item.name || "Unnamed mission";
}

function localDateTime(iso) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short"
  });
}

function formatDiff(ms) {
  if (ms <= 0) {
    return "LAUNCHED";
  }
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
}

function renderLaunches(items) {
  els.launchList.replaceChildren();

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const node = els.launchCardTemplate.content.cloneNode(true);
    node.querySelector(".mission-name").textContent = missionName(item);
    node.querySelector(".rocket-name").textContent = rocketName(item);
    node.querySelector(".site-name").textContent = launchSiteName(item);
    node.querySelector(".launch-time").textContent = localDateTime(item.net);
    fragment.appendChild(node);
  }
  els.launchList.appendChild(fragment);
}

function renderNextLaunch() {
  if (!nextLaunch) {
    els.nextMission.textContent = "No upcoming launch found";
    els.countdown.textContent = "-- : -- : -- : --";
    els.nextRocket.textContent = "Rocket: --";
    els.nextSite.textContent = "Site: --";
    els.nextDate.textContent = "Date: --";
    return;
  }

  els.nextMission.textContent = missionName(nextLaunch);
  els.nextRocket.textContent = `Rocket: ${rocketName(nextLaunch)}`;
  els.nextSite.textContent = `Site: ${launchSiteName(nextLaunch)}`;
  els.nextDate.textContent = `Date: ${localDateTime(nextLaunch.net)}`;
}

function updateCountdown() {
  if (!nextLaunch) {
    return;
  }
  const diff = new Date(nextLaunch.net).getTime() - Date.now();
  els.countdown.textContent = formatDiff(diff);
}

function pickNextLaunch(items) {
  const now = Date.now();
  return items.find((item) => new Date(item.net).getTime() > now) || null;
}

function applyLaunchResults(results, generatedAt) {
  launches = results
    .filter((x) => x.net)
    .sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime());
  nextLaunch = pickNextLaunch(launches);

  renderLaunches(launches);
  renderNextLaunch();
  updateCountdown();

  const stamp = generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString();
  els.status.textContent = "Live data loaded";
  els.lastUpdated.textContent = `Last updated: ${stamp}`;
}

async function fetchFromApiCandidates() {
  let lastError = null;
  for (const url of API_CANDIDATES) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      if (!results.length) {
        throw new Error("No launch results in API payload");
      }
      applyLaunchResults(results, new Date().toISOString());
      els.status.textContent = "Live data loaded from API fallback";
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All API fallbacks failed");
}

async function fetchUpcomingLaunches() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    if (!results.length) {
      throw new Error("Launch cache is empty");
    }

    applyLaunchResults(results, data.generated_at);
  } catch (err) {
    console.warn("Local cache unavailable or empty. Trying API fallback.", err);
    try {
      await fetchFromApiCandidates();
    } catch (fallbackErr) {
      console.error(fallbackErr);
      launches = [];
      nextLaunch = null;
      renderLaunches(launches);
      renderNextLaunch();
      els.status.textContent = "No launch data available. Run the 'Update Launch Data' GitHub Action.";
      els.lastUpdated.textContent = `Last checked: ${new Date().toLocaleString()}`;
    }
  }
}

setInterval(updateCountdown, 1000);
setInterval(fetchUpcomingLaunches, AUTO_REFRESH_MS);
fetchUpcomingLaunches();
