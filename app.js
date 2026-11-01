const locations = [
  { id: "us", country: "United States", city: "New York", zone: "America/New_York", flag: "🇺🇸", color: "violet", accent: "#7765ec" },
  { id: "gb", country: "United Kingdom", city: "London", zone: "Europe/London", flag: "🇬🇧", color: "orange", accent: "#ee8b55" },
  { id: "jp", country: "Japan", city: "Tokyo", zone: "Asia/Tokyo", flag: "🇯🇵", color: "teal", accent: "#4ab7a5" },
  { id: "au", country: "Australia", city: "Sydney", zone: "Australia/Sydney", flag: "🇦🇺", color: "blue", accent: "#5e91ed" },
  { id: "fr", country: "France", city: "Paris", zone: "Europe/Paris", flag: "🇫🇷", color: "violet", accent: "#7765ec" },
  { id: "in", country: "India", city: "Mumbai", zone: "Asia/Kolkata", flag: "🇮🇳", color: "yellow", accent: "#e8ba4d" },
  { id: "sg", country: "Singapore", city: "Singapore", zone: "Asia/Singapore", flag: "🇸🇬", color: "teal", accent: "#4ab7a5" },
  { id: "br", country: "Brazil", city: "São Paulo", zone: "America/Sao_Paulo", flag: "🇧🇷", color: "orange", accent: "#ee8b55" },
  { id: "za", country: "South Africa", city: "Cape Town", zone: "Africa/Johannesburg", flag: "🇿🇦", color: "blue", accent: "#5e91ed" },
];

let selectedIds = ["us", "gb", "jp", "au"];
let simulationMinutes = null;
const $ = (id) => document.getElementById(id);
const getLocation = (id) => locations.find((location) => location.id === id);
const timeFormatter = (zone, options) => new Intl.DateTimeFormat("en-US", { timeZone: zone, ...options });
const timeParts = (zone, date = displayTime()) => Object.fromEntries(timeFormatter(zone, { hour: "numeric", minute: "numeric", hour12: false }).formatToParts(date).map(({ type, value }) => [type, value]));
const displayTime = () => {
  const now = new Date();
  if (simulationMinutes === null) return now;
  const simulated = new Date(now);
  simulated.setHours(0, simulationMinutes, 0, 0);
  return simulated;
};
const skyPeriod = (location, date = displayTime()) => {
  const hour = Number(timeParts(location.zone, date).hour);
  if (hour < 5 || hour >= 21) return "night";
  if (hour < 7) return "dawn";
  if (hour < 17) return "day";
  return "dusk";
};
function renderSidebar() {
  const selected = selectedIds.map(getLocation);
  $("selectedList").innerHTML = selected.length ? selected.map((location) => `
    <div class="selected-item">
      <span class="country-flag">${location.flag}</span>
      <div class="selected-item-info"><span class="selected-item-name">${location.city}</span><span class="selected-item-zone">${location.country}</span></div>
      <button class="remove-button" data-remove="${location.id}" aria-label="Remove ${location.city}">×</button>
    </div>`).join("") : '<div class="empty-state">Select a location below to get started.</div>';
  $("locationCount").textContent = `${locations.length} places`;
  const query = $("searchInput").value.toLowerCase().trim();
  const visible = locations.filter((location) => `${location.country} ${location.city}`.toLowerCase().includes(query));
  $("countryList").innerHTML = visible.map((location) => {
    const active = selectedIds.includes(location.id);
    return `<button class="country-option" data-select="${location.id}" aria-pressed="${active}">
      <span class="country-flag">${location.flag}</span><span class="option-meta"><span class="option-name">${location.country}</span><span class="option-city">${location.city}</span></span>${active ? '<span class="check">✓</span>' : ""}
    </button>`;
  }).join("") || '<div class="empty-state">No places found.</div>';
  document.querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => toggleLocation(button.dataset.select)));
  document.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => toggleLocation(button.dataset.remove)));
}

function formatTime(location, withSeconds = false, date = displayTime()) {
  return timeFormatter(location.zone, { hour: "numeric", minute: "2-digit", ...(withSeconds ? { second: "2-digit" } : {}), hour12: true }).format(date);
}

function getLocalDate(location, date = displayTime()) {
  return timeFormatter(location.zone, { weekday: "short", month: "short", day: "numeric" }).format(date);
}

function renderClock() {
  const now = displayTime();
  const liveNow = new Date();
  const local = $("localTime");
  local.textContent = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: false }).format(simulationMinutes === null ? liveNow : now);
  $("localDate").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now);
  $("todayDate").textContent = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(now).toUpperCase();
  const seconds = simulationMinutes === null ? now.getSeconds() + now.getMilliseconds() / 1000 : 0;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  $("clockFace").style.setProperty("--unused", "0");
  $("clockFace").querySelector(".hour-hand").style.transform = `rotate(${hours * 30}deg)`;
  $("clockFace").querySelector(".minute-hand").style.transform = `rotate(${minutes * 6}deg)`;
  $("clockFace").querySelector(".second-hand").style.transform = `rotate(${seconds * 6}deg)`;
  const hour = now.getHours() + now.getMinutes() / 60;
  $("dayMarker").style.left = `${Math.min(96, Math.max(2, hour / 24 * 100))}%`;
  const selected = selectedIds.map(getLocation);
  $("clockLegend").innerHTML = selected.map((location) => `<div class="legend-item"><i class="sky-dot sky-${skyPeriod(location, now)}"></i>${location.city} <b>${formatTime(location, false, now)}</b></div>`).join("");
  $("locationSummary").innerHTML = selected.slice(0, 4).map((location) => {
    const parts = timeParts(location.zone, now);
    const localHour = Number(parts.hour);
    const status = localHour >= 8 && localHour < 18 ? "Working hours" : localHour >= 6 && localHour < 22 ? "Waking hours" : "Resting";
    return `<div class="summary-row"><div><div class="summary-place">${location.flag} &nbsp;${location.city}</div><div class="summary-status">${status}</div></div><div class="summary-time">${formatTime(location, false, now)}</div></div>`;
  }).join("");
  $("locationCards").innerHTML = selected.map((location) => `<article class="location-card sky-card-${skyPeriod(location, now)}">
    <button class="card-remove" data-remove="${location.id}" aria-label="Remove ${location.city}">×</button>
    <div class="card-country">${location.flag} &nbsp;${location.country.toUpperCase()}</div><div class="card-city">${location.city}</div>
    <div class="card-time">${formatTime(location, false, now)}</div><div class="card-date">${getLocalDate(location, now)}</div>
  </article>`).join("") || '<div class="empty-state">Your selected clocks will appear here.</div>';
  const slider = $("timelineSlider");
  if (simulationMinutes === null) slider.value = now.getHours() * 60 + now.getMinutes();
  $("timelineValue").textContent = simulationMinutes === null ? "Live now" : formatTimeline(simulationMinutes);
  $("liveButton").hidden = simulationMinutes === null;
  document.querySelectorAll(".card-remove").forEach((button) => button.addEventListener("click", () => toggleLocation(button.dataset.remove)));
}

function formatTimeline(minutes) {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function toggleLocation(id) {
  selectedIds = selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id];
  renderSidebar();
  renderClock();
}

$("searchInput").addEventListener("input", renderSidebar);
$("clearButton").addEventListener("click", () => { selectedIds = []; renderSidebar(); renderClock(); });
$("timelineSlider").addEventListener("input", (event) => {
  simulationMinutes = Number(event.target.value);
  renderClock();
});
$("liveButton").addEventListener("click", () => {
  simulationMinutes = null;
  renderClock();
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("searchInput").focus(); }
});
renderSidebar();
renderClock();
setInterval(renderClock, 1000);
