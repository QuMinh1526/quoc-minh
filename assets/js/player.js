(function () {
  const audio = document.getElementById("music-audio");
  audio.volume = 0.4;
  const elAvatar = document.querySelector(".music-avatar");
  const elTitle = document.querySelector(".music-title");
  const elArtist = document.querySelector(".music-artist");
  const elTimeCurrent = document.querySelector(".time-current");
  const elTimeTotal = document.querySelector(".time-total");
  const elProgressBar = document.querySelector(".progress-bar");
  const elProgressFill = document.querySelector(".progress-fill");
  const btnPlay = document.querySelector(".btn-play");
  const btnPrev = document.querySelector(".btn-prev");
  const btnNext = document.querySelector(".btn-next");
  const iconPlay = btnPlay.querySelector(".icon-play");
  const iconPause = btnPlay.querySelector(".icon-pause");

  const PLACEHOLDER_AVATAR =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect width='90' height='90' fill='%23333c37'/><text x='50%25' y='55%25' font-size='36' fill='%23888' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>?</text></svg>";

  let playlist = [];
  let currentIndex = 0;

  function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    const totalSec = Math.floor(sec);
    const min = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${min}:${s < 10 ? "0" : ""}${s}`;
  }

  function showPauseIcon() {
    iconPlay.style.display = "none";
    iconPause.style.display = "block";
  }

  function showPlayIcon() {
    iconPlay.style.display = "block";
    iconPause.style.display = "none";
  }

  function nameFromFile(url) {
    const raw = decodeURIComponent(url.split("/").pop() || "");
    return raw.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
  }

  const STATIC_AVATAR_BASE = "./music_avatar";

  function setAvatarFlexible() {
    elAvatar.onerror = null;
    elAvatar.src = STATIC_AVATAR_BASE + ".png";
    elAvatar.onerror = function () {
      elAvatar.onerror = function () {
        elAvatar.onerror = null;
        elAvatar.src = PLACEHOLDER_AVATAR;
      };
      elAvatar.src = STATIC_AVATAR_BASE + ".jpg";
    };
  }

  // Logo: thử png trước, lỗi thì fallback qua jpg
  function setLogoFlexible() {
    const logoEl = document.getElementById("site-logo");
    if (!logoEl) return;
    logoEl.onerror = null;
    logoEl.src = "./assets/img/logo_blue.png";
    logoEl.onerror = function () {
      logoEl.onerror = null;
      logoEl.src = "./assets/img/logo_blue.jpg";
    };
  }

  // Background phía sau nitro card: thử jpg trước, lỗi thì fallback qua png
  function setPageBackground() {
    const bgEl = document.getElementById("page-bg");
    if (!bgEl) return;
    const tryLoad = (ext, fallback) => {
      const img = new Image();
      img.onload = function () {
        bgEl.style.backgroundImage = `url('./assets/img/background.${ext}')`;
      };
      img.onerror = fallback || null;
      img.src = `./assets/img/background.${ext}`;
    };
    tryLoad("gif", () => tryLoad("jpg", () => tryLoad("png")));
  }

  setLogoFlexible();
  setPageBackground();
  loadWeather();

  // Thời tiết live: dùng geolocation của browser + Open-Meteo (free, ko cần API key)
  // Icon SVG nhúng sẵn kiểu kính (glassmorphism) - ko qua mạng nên ko lỗi/chậm
  const GLASS_DEFS = `
    <defs>
      <linearGradient id="wgGlass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#cfe8ff" stop-opacity="0.55"/>
      </linearGradient>
      <linearGradient id="wgSun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff6c8" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#ffd76a" stop-opacity="0.75"/>
      </linearGradient>
    </defs>`;

  const WEATHER_ICONS = {
    "clear-day": `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <circle cx="32" cy="32" r="14" fill="url(#wgSun)"/>
      <g stroke="#ffe9a3" stroke-width="3" stroke-linecap="round" opacity="0.8">
        <line x1="32" y1="6" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="58"/>
        <line x1="6" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/>
        <line x1="13" y1="13" x2="19" y2="19"/><line x1="45" y1="45" x2="51" y2="51"/>
        <line x1="13" y1="51" x2="19" y2="45"/><line x1="45" y1="19" x2="51" y2="13"/>
      </g></svg>`,
    "clear-night": `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M40 10a22 22 0 1 0 14 38 18 18 0 0 1-14-38z" fill="url(#wgGlass)"/>
      <circle cx="20" cy="14" r="1.6" fill="#ffffff" opacity="0.8"/>
      <circle cx="14" cy="26" r="1.2" fill="#ffffff" opacity="0.6"/></svg>`,
    "partly-cloudy-day": `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <circle cx="24" cy="24" r="10" fill="url(#wgSun)"/>
      <path d="M18 46a12 12 0 0 1-2-23.8A15 15 0 0 1 45 26a10 10 0 0 1-1 20H18z" fill="url(#wgGlass)"/></svg>`,
    "partly-cloudy-night": `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M32 10a14 14 0 0 0 9 24 11 11 0 0 1-8 8H16a12 12 0 0 1-1-24 15 15 0 0 1 17-8z" fill="url(#wgGlass)"/>
      <circle cx="44" cy="16" r="1.4" fill="#fff" opacity="0.7"/></svg>`,
    cloudy: `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M16 46a12 12 0 0 1-2-23.8A15 15 0 0 1 43 24a10 10 0 0 1-1 22H16z" fill="url(#wgGlass)"/></svg>`,
    fog: `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M18 30a10 10 0 0 1 0-19.8A13 13 0 0 1 42 12a9 9 0 0 1 0 18H18z" fill="url(#wgGlass)"/>
      <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.65">
        <line x1="10" y1="42" x2="54" y2="42"/><line x1="16" y1="50" x2="48" y2="50"/>
      </g></svg>`,
    drizzle: `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M16 34a11 11 0 0 1-2-21.8A14 14 0 0 1 41 14a9 9 0 0 1 0 20H16z" fill="url(#wgGlass)"/>
      <g stroke="#bfe3ff" stroke-width="3" stroke-linecap="round" opacity="0.9">
        <line x1="22" y1="42" x2="20" y2="48"/><line x1="34" y1="42" x2="32" y2="48"/><line x1="46" y1="42" x2="44" y2="48"/>
      </g></svg>`,
    rain: `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M16 32a11 11 0 0 1-2-21.8A14 14 0 0 1 41 12a9 9 0 0 1 0 20H16z" fill="url(#wgGlass)"/>
      <g stroke="#8fc7ff" stroke-width="3.5" stroke-linecap="round">
        <line x1="20" y1="40" x2="16" y2="52"/><line x1="32" y1="40" x2="28" y2="52"/><line x1="44" y1="40" x2="40" y2="52"/>
      </g></svg>`,
    snow: `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M16 32a11 11 0 0 1-2-21.8A14 14 0 0 1 41 12a9 9 0 0 1 0 20H16z" fill="url(#wgGlass)"/>
      <g fill="#ffffff" opacity="0.9">
        <circle cx="20" cy="46" r="2.4"/><circle cx="32" cy="50" r="2.4"/><circle cx="44" cy="46" r="2.4"/>
      </g></svg>`,
    extreme: `<svg viewBox="0 0 64 64">${GLASS_DEFS}
      <path d="M16 30a11 11 0 0 1-2-21.8A14 14 0 0 1 41 10a9 9 0 0 1 0 20H16z" fill="url(#wgGlass)"/>
      <path d="M34 32l-9 14h7l-4 12 14-16h-7l3-10z" fill="#ffe36a" opacity="0.95"/></svg>`,
  };

  function weatherCodeToIconSlug(code, isDay) {
    if (code === 0) return isDay ? "clear-day" : "clear-night";
    if ([1, 2, 3].includes(code)) return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
    if ([45, 48].includes(code)) return "fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([95, 96, 99].includes(code)) return "extreme";
    return "cloudy";
  }

  function weatherCodeToText(code) {
    if (code === 0) return "Trời trong xanh, nắng đẹp hết nấc";
    if ([1, 2, 3].includes(code)) return "Trời nhiều mây, hơi lười nắng";
    if ([45, 48].includes(code)) return "Sương mù mờ ảo kiểu ngôn tình";
    if ([51, 53, 55, 56, 57].includes(code)) return "Mưa lâm thâm, buồn man mác";
    if ([61, 63, 65, 66, 67].includes(code)) return "Mưa to, ở nhà cho lành";
    if ([80, 81, 82].includes(code)) return "Mưa rào bất chợt, deal cẩn thận";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Có tuyết, lạnh xỉu";
    if ([95, 96, 99].includes(code)) return "Dông sét, tránh xa ra kẻo bay nón";
    return "Thời tiết bí ẩn, chưa đọc được vibe";
  }

  function degToCompass(deg) {
    const dirs = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
    return dirs[Math.round(deg / 45) % 8];
  }

  function renderWeather(cur) {
    const iconSlug = weatherCodeToIconSlug(cur.weather_code, cur.is_day);
    const desc = weatherCodeToText(cur.weather_code);
    const temp = Math.round(cur.temperature_2m);
    const feels = Math.round(cur.apparent_temperature);
    const humidity = Math.round(cur.relative_humidity_2m);
    const wind = Math.round(cur.wind_speed_10m);
    const gust = Math.round(cur.wind_gusts_10m);
    const windDir = degToCompass(cur.wind_direction_10m);
    const cloud = Math.round(cur.cloud_cover);
    const pressure = Math.round(cur.pressure_msl);
    const rain = cur.rain;
    const showers = cur.showers;
    const snow = cur.snowfall;
    let marqueeText = "";

    const marqueeIcon = document.getElementById("weather-marquee-icon");
    const marqueeInner = document.getElementById("weather-marquee-inner");
    if (marqueeIcon) {
      marqueeIcon.innerHTML = WEATHER_ICONS[iconSlug] || WEATHER_ICONS.cloudy;
    }
    if (marqueeInner) {
      const gap = "\u00A0\u00A0\u00A0\u00A0\u00A0";
      const parts = [
        desc,
        `${temp}°C (feels like ${feels}°C)`,
        `ẩm ${humidity}%`,
        `gió ${wind}km/h hướng ${windDir}, giật ${gust}km/h`,
        `mây che ${cloud}%`,
        `áp suất ${pressure}hPa`,
      ];
      if (rain > 0) parts.push(`mưa ${rain}mm, mang dù nha 🌂`);
      if (showers > 0) parts.push(`mưa rào ${showers}mm`);
      if (snow > 0) parts.push(`tuyết rơi ${snow}cm ❄️`);
      parts.push("✨");
      marqueeText = parts.join(gap);
      // Gemini controls what is visible: show this full weather text only after
      // it has finished writing the headline.
    }

    // Let optional integrations (for example Gemini) enrich the marquee.
    window.dispatchEvent(
      new CustomEvent("weather:loaded", {
        detail: {
          description: desc,
          temp,
          feels,
          weather_code: cur.weather_code,
          is_day: cur.is_day,
          marqueeText,
        },
      })
    );
  }

  function renderWeatherError() {
    const marqueeInner = document.getElementById("weather-marquee-inner");
    if (marqueeInner) {
      const segs = marqueeInner.querySelectorAll(".weather-marquee-seg");
      segs.forEach((seg) => (seg.textContent = "Ơ kìa mất tín hiệu thời tiết rồi 😵‍💫"));
    }
  }

  function fetchWeather(lat, lon) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const cur = data.current;
        if (!cur) return renderWeatherError();
        renderWeather(cur);
      })
      .catch(renderWeatherError);
  }

  function loadWeather() {
    if (!navigator.geolocation) return renderWeatherError();
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        // User không cho phép vị trí -> fallback về TP.HCM
        fetchWeather(10.7769, 106.7009);
      },
      { timeout: 8000 }
    );
  }

  function loadTrack(index, autoPlay) {
    if (!playlist.length) return;
    currentIndex = (index + playlist.length) % playlist.length;
    const rawFile = playlist[currentIndex];
    const file = encodeURI(rawFile);

    audio.src = file;
    elTitle.textContent = nameFromFile(rawFile);
    elArtist.textContent = "Local File";
    setAvatarFlexible();
    elTimeCurrent.textContent = "0:00";
    elProgressFill.style.width = "0%";
    if (autoPlay) audio.play();
  }

  btnPlay.addEventListener("click", function () {
    if (audio.paused) audio.play();
    else audio.pause();
  });

  btnNext.addEventListener("click", function () {
    loadTrack(currentIndex + 1, true);
  });

  btnPrev.addEventListener("click", function () {
    loadTrack(currentIndex - 1, true);
  });

  elProgressBar.addEventListener("click", function (e) {
    if (!isFinite(audio.duration)) return;
    const rect = elProgressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });

  audio.addEventListener("play", showPauseIcon);
  audio.addEventListener("pause", showPlayIcon);

  audio.addEventListener("loadedmetadata", function () {
    elTimeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", function () {
    elTimeCurrent.textContent = formatTime(audio.currentTime);
    if (isFinite(audio.duration) && audio.duration > 0) {
      elProgressFill.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    }
  });

  audio.addEventListener("ended", function () {
    loadTrack(currentIndex + 1, true);
  });

  fetch("./playlist.json")
    .then((res) => res.json())
    .then((files) => {
      console.log("[player] playlist loaded:", files);
      if (!files.length) return;
      playlist = files;
      loadTrack(0, false);
    })
    .catch((err) => {
      elTitle.textContent = "Unknown";
      elArtist.textContent = "Unknown";
      console.log("[player] lỗi đọc playlist.json:", err);
    });

  const welcomeScreen = document.getElementById("welcome-screen");

  const clockEl = welcomeScreen.querySelector(".welcome-clock");
  const digitEls = clockEl.querySelectorAll(".digit");
  let lastDigits = ["0", "0", "0", "0", "0", "0"];

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const newDigits = (h + m + s).split("");

    newDigits.forEach((d, i) => {
      if (d !== lastDigits[i]) {
        digitEls[i].textContent = d;
        digitEls[i].classList.remove("tick");
        void digitEls[i].offsetWidth;
        digitEls[i].classList.add("tick");
      }
    });
    lastDigits = newDigits;
  }
  updateClock();
  setInterval(updateClock, 1000);

  const starsContainer = welcomeScreen.querySelector(".shooting-stars");
  for (let i = 0; i < 6; i++) {
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.style.top = Math.random() * 50 + "%";
    star.style.left = Math.random() * 60 + "%";
    star.style.animationDuration = 3 + Math.random() * 3 + "s";
    star.style.animationDelay = Math.random() * 5 + "s";
    starsContainer.appendChild(star);
  }

  welcomeScreen.addEventListener("click", function () {
    welcomeScreen.style.display = "none";
    audio.play();
  });
})();
