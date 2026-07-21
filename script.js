const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const cityNameEl = document.getElementById("city-name");
const currentDateEl = document.getElementById("current-date");
const currentTempEl = document.getElementById("current-temp");
const currentConditionEl = document.getElementById("current-condition");
const feelsLikeEl = document.getElementById("feels-like");
const windSpeedEl = document.getElementById("wind-speed");
const precipitationEl = document.getElementById("precipitation");
const forecastEl = document.getElementById("forecast");
const cityChips = document.querySelectorAll(".city-chip");
const langBtn = document.getElementById("lang-btn");
const eyebrowEl = document.querySelector(".eyebrow");
const titleEl = document.querySelector("h1");

const defaultCity = "München";
let isArabic = false;

function updateLanguage() {
  if (eyebrowEl) {
    eyebrowEl.textContent = isArabic ? "الطقس المباشر" : "LIVE-WETTER";
  }

  if (titleEl) {
    titleEl.textContent = isArabic ? "طقس مدينتك" : "Wetter in deiner Stadt";
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function getWeatherCodeText(code) {
  const map = {
    0: { text: "Klarer Himmel", icon: "☀️" },
    1: { text: "Überwiegend klar", icon: "🌤️" },
    2: { text: "Teilweise bewölkt", icon: "⛅" },
    3: { text: "Bewölkt", icon: "☁️" },
    45: { text: "Nebel", icon: "🌫️" },
    48: { text: "Reifnebel", icon: "🌫️" },
    51: { text: "Leichter Nieselregen", icon: "🌦️" },
    53: { text: "Mäßiger Nieselregen", icon: "🌦️" },
    55: { text: "Dichter Nieselregen", icon: "🌧️" },
    61: { text: "Leichter Regen", icon: "🌦️" },
    63: { text: "Mäßiger Regen", icon: "🌧️" },
    65: { text: "Starker Regen", icon: "⛈️" },
    71: { text: "Leichter Schnee", icon: "🌨️" },
    73: { text: "Mäßiger Schnee", icon: "❄️" },
    75: { text: "Starker Schnee", icon: "❄️" },
    95: { text: "Gewitter", icon: "⛈️" },
    96: { text: "Gewitter mit Hagel", icon: "⛈️" },
    99: { text: "Schweres Gewitter", icon: "⛈️" },
  };

  return map[code] || { text: "Wetterlage", icon: "🌈" };
}

function setActiveChip(city) {
  const normalizedCity = city.toLowerCase();

  cityChips.forEach((chip) => {
    const chipCity = chip.dataset.city.toLowerCase();
    chip.classList.toggle("active", chipCity === normalizedCity);
  });
}

async function fetchWeather(city) {
  statusEl.textContent = "Wetter wird geladen...";
  setActiveChip(city);

  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results?.length) {
      throw new Error("Ort nicht gefunden. Bitte versuche einen anderen Namen.");
    }

    const { name, latitude, longitude, country } = geoData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,windspeed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
    );
    const weatherData = await weatherResponse.json();

    const current = weatherData.current;
    const daily = weatherData.daily;
    const weatherInfo = getWeatherCodeText(current.weather_code);

    cityNameEl.textContent = `${name}, ${country}`;
    currentDateEl.textContent = formatDate(new Date());
    currentTempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    currentConditionEl.textContent = `${weatherInfo.icon} ${weatherInfo.text}`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    windSpeedEl.textContent = `${Math.round(current.windspeed_10m)} km/h`;
    precipitationEl.textContent = `${current.precipitation} mm`;

    renderForecast(daily);
    statusEl.textContent = "Wetterdaten erfolgreich geladen.";
  } catch (error) {
    statusEl.textContent = error.message || "Beim Laden ist ein Fehler aufgetreten.";
    forecastEl.innerHTML = "";
    cityNameEl.textContent = "Keine Daten";
    currentTempEl.textContent = "--";
    currentConditionEl.textContent = "--";
    feelsLikeEl.textContent = "--";
    windSpeedEl.textContent = "--";
    precipitationEl.textContent = "--";
  }
}

function renderForecast(daily) {
  forecastEl.innerHTML = "";

  daily.time.slice(0, 6).forEach((day, index) => {
    const weatherInfo = getWeatherCodeText(daily.weather_code[index]);
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <h3>${formatDate(day)}</h3>
      <div class="forecast-temp">${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°</div>
      <p>${weatherInfo.icon} ${weatherInfo.text}</p>
      <p>Niederschlag: ${daily.precipitation_sum[index]} mm</p>
    `;
    forecastEl.appendChild(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    statusEl.textContent = "Bitte gib eine Stadt ein.";
    return;
  }

  fetchWeather(city);
});

cityChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const city = chip.dataset.city;
    cityInput.value = city;
    fetchWeather(city);
  });
});

if (langBtn) {
  langBtn.addEventListener("click", () => {
    isArabic = !isArabic;
    updateLanguage();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  cityInput.value = defaultCity;
  updateLanguage();
  fetchWeather(defaultCity);
});
