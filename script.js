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
const subtitleEl = document.getElementById("subtitle");
const feelsLabelEl = document.getElementById("feels-label");
const windLabelEl = document.getElementById("wind-label");
const rainLabelEl = document.getElementById("rain-label");
const searchButtonEl = document.querySelector(".search-box button");

const defaultCity = "München";
const translations = {
  de: {
    title: "Wetter in deiner Stadt",
    subtitle: "Aktuelle Bedingungen und 7-Tage-Prognose auf Deutsch.",
    search: "Suchen",
    placeholder: "Stadt eingeben",
    loading: "Wetter wird geladen...",
    loaded: "Wetterdaten erfolgreich geladen.",
    notFound: "Ort nicht gefunden. Bitte versuche einen anderen Namen.",
    empty: "Bitte gib eine Stadt ein.",
    feels: "Gefühl",
    wind: "Wind",
    rain: "Niederschlag",
    live: "LIVE-WETTER",
    days: {
      Dienstag: "Dienstag",
      Mittwoch: "Mittwoch",
      Donnerstag: "Donnerstag",
      Freitag: "Freitag",
      Samstag: "Samstag",
      Sonntag: "Sonntag",
    },
    weather: {
      0: "Klarer Himmel",
      1: "Überwiegend klar",
      2: "Teilweise bewölkt",
      3: "Bewölkt",
      45: "Nebel",
      48: "Reifnebel",
      51: "Leichter Nieselregen",
      53: "Mäßiger Nieselregen",
      55: "Dichter Nieselregen",
      61: "Leichter Regen",
      63: "Mäßiger Regen",
      65: "Starker Regen",
      71: "Leichter Schnee",
      73: "Mäßiger Schnee",
      75: "Starker Schnee",
      95: "Gewitter",
      96: "Gewitter mit Hagel",
      99: "Schweres Gewitter",
      default: "Wetterlage",
    },
  },
  ar: {
    title: "طقس مدينتك",
    subtitle: "الأحوال الحالية وتوقعات 7 أيام",
    search: "بحث",
    placeholder: "أدخل المدينة",
    loading: "يتم تحميل الطقس...",
    loaded: "تم تحميل بيانات الطقس بنجاح",
    notFound: "لم يتم العثور على المدينة. يرجى تجربة اسم آخر.",
    empty: "يرجى إدخال مدينة.",
    feels: "الاحساس",
    wind: "الرياح",
    rain: "الهطول",
    live: "الطقس المباشر",
    days: {
      Dienstag: "الثلاثاء",
      Mittwoch: "الأربعاء",
      Donnerstag: "الخميس",
      Freitag: "الجمعة",
      Samstag: "السبت",
      Sonntag: "الأحد",
    },
    weather: {
      0: "سماء صافية",
      1: "غالبًا صافي",
      2: "غائم جزئيًا",
      3: "غائم",
      45: "ضباب",
      48: "ضباب صقيعي",
      51: "رذاذ خفيف",
      53: "رذاذ متوسط",
      55: "رذاذ كثيف",
      61: "مطر خفيف",
      63: "مطر متوسط",
      65: "مطر شديد",
      71: "ثلج خفيف",
      73: "ثلج متوسط",
      75: "ثلج شديد",
      95: "عاصفة رعدية",
      96: "عاصفة رعدية مع برد",
      99: "عاصفة رعدية شديدة",
      default: "حالة الجو",
    },
  },
};

let currentLang = "de";
let currentStatusMode = "idle";
let currentErrorMessage = "";
let currentWeatherCode = null;
let currentDailyData = null;

function updateLanguage() {
  const t = translations[currentLang];

  if (eyebrowEl) {
    eyebrowEl.textContent = t.live;
  }

  if (titleEl) {
    titleEl.textContent = t.title;
  }

  if (subtitleEl) {
    subtitleEl.textContent = t.subtitle;
  }

  if (searchButtonEl) {
    searchButtonEl.textContent = t.search;
  }

  if (cityInput) {
    cityInput.placeholder = t.placeholder;
  }

  if (feelsLabelEl) {
    feelsLabelEl.textContent = t.feels;
  }

  if (windLabelEl) {
    windLabelEl.textContent = t.wind;
  }

  if (rainLabelEl) {
    rainLabelEl.textContent = t.rain;
  }

  if (statusEl) {
    updateStatusText();
  }

  if (currentWeatherCode !== null) {
    renderCurrentWeather(currentWeatherCode);
  }

  if (currentDailyData) {
    renderForecast(currentDailyData);
  }
}

function updateStatusText() {
  const t = translations[currentLang];

  if (currentStatusMode === "loading") {
    statusEl.textContent = t.loading;
    return;
  }

  if (currentStatusMode === "loaded") {
    statusEl.textContent = t.loaded;
    return;
  }

  if (currentStatusMode === "error") {
    statusEl.textContent = currentErrorMessage || t.notFound;
    return;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("de-DE", { weekday: "long" });
  const localizedWeekday = currentLang === "ar" ? translations.ar.days[weekday] || weekday : weekday;
  const formatter = new Intl.DateTimeFormat(currentLang === "ar" ? "ar-EG" : "de-DE", {
    day: "2-digit",
    month: "short",
  });

  return `${localizedWeekday}, ${formatter.format(date)}`;
}

function getWeatherCodeText(code) {
  const weatherMap = translations[currentLang].weather;
  const text = weatherMap[code] || weatherMap.default;
  const iconMap = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    61: "🌦️",
    63: "🌧️",
    65: "⛈️",
    71: "🌨️",
    73: "❄️",
    75: "❄️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  return { text, icon: iconMap[code] || "🌈" };
}

function setActiveChip(city) {
  const normalizedCity = city.toLowerCase();

  cityChips.forEach((chip) => {
    const chipCity = chip.dataset.city.toLowerCase();
    chip.classList.toggle("active", chipCity === normalizedCity);
  });
}

function renderCurrentWeather(weatherData) {
  const weatherInfo = getWeatherCodeText(weatherData.weather_code);

  currentTempEl.textContent = `${Math.round(weatherData.temperature_2m)}°C`;
  currentConditionEl.textContent = `${weatherInfo.icon} ${weatherInfo.text}`;
  feelsLikeEl.textContent = `${Math.round(weatherData.apparent_temperature)}°C`;
  windSpeedEl.textContent = `${Math.round(weatherData.windspeed_10m)} km/h`;
  precipitationEl.textContent = `${weatherData.precipitation} mm`;
}

async function fetchWeather(city) {
  currentStatusMode = "loading";
  updateStatusText();
  setActiveChip(city);

  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results?.length) {
      currentErrorMessage = translations[currentLang].notFound;
      currentStatusMode = "error";
      updateStatusText();
      return;
    }

    const { name, latitude, longitude, country } = geoData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,windspeed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
    );
    const weatherData = await weatherResponse.json();

    const current = weatherData.current;
    const daily = weatherData.daily;

    cityNameEl.textContent = `${name}, ${country}`;
    currentDateEl.textContent = formatDate(new Date());
    currentWeatherCode = current;
    currentDailyData = daily;
    renderCurrentWeather(current);
    renderForecast(daily);

    currentStatusMode = "loaded";
    updateStatusText();
  } catch (error) {
    currentErrorMessage = error.message || "Beim Laden ist ein Fehler aufgetreten.";
    currentStatusMode = "error";
    updateStatusText();
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
      <p>${translations[currentLang].rain}: ${daily.precipitation_sum[index]} mm</p>
    `;
    forecastEl.appendChild(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    currentStatusMode = "error";
    currentErrorMessage = translations[currentLang].empty;
    updateStatusText();
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
    currentLang = currentLang === "de" ? "ar" : "de";
    updateLanguage();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  cityInput.value = defaultCity;
  updateLanguage();
  fetchWeather(defaultCity);
});
