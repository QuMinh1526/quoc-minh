/*
 * Gemini-powered Gen Z headline for the weather marquee.
 *
 * This file calls the same-origin Cloudflare Pages Function at /api/gemini.
 * Keep GEMINI_API_KEY only in the function's server-side environment.
 */
(function () {
  const CACHE_PREFIX = "genz-weather-marquee:";
  const CACHE_DURATION = 30 * 60 * 1000;

  function cacheKey(weather) {
    return `${CACHE_PREFIX}${weather.weather_code}-${weather.is_day ? "day" : "night"}`;
  }

  function getCachedHeadline(weather) {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey(weather)) || "null");
      if (cached && Date.now() - cached.createdAt < CACHE_DURATION) return cached.headline;
    } catch (_) {
      // Storage can be unavailable in private browsing; generating still works.
    }
    return "";
  }

  function saveHeadline(weather, headline) {
    try {
      localStorage.setItem(cacheKey(weather), JSON.stringify({ headline, createdAt: Date.now() }));
    } catch (_) {}
  }

  function cleanHeadline(text) {
    return text
      .replace(/^['"“”]|['"“”]$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  async function generateHeadline(weather) {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weather),
    });

    if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
    const data = await response.json();
    return cleanHeadline(data.headline);
  }

  function setMarqueeText(text, isLoading) {
    const marqueeInner = document.getElementById("weather-marquee-inner");
    if (!marqueeInner) return;

    marqueeInner.classList.toggle("is-loading", isLoading);
    marqueeInner.querySelectorAll(".weather-marquee-seg").forEach((segment) => (segment.textContent = text));
  }

  function updateMarquee(headline, weatherText) {
    if (!headline) return;
    const separator = "\u00A0\u00A0\u00A0\u00A0\u00A0";
    setMarqueeText(`${headline}${separator}${weatherText || ""}`.trim(), false);
  }

  function startLoadingProgress() {
    const startedAt = Date.now();
    let timer;

    const render = () => {
      // The Gemini API does not expose real generation progress. This progress
      // reflects the request lifecycle and remains below 100% until it returns.
      const elapsed = Date.now() - startedAt;
      const percent = Math.min(95, Math.floor(elapsed / 100));
      setMarqueeText(`A.I Gemini đang nghĩ tiêu đề: ${percent}%`, true);
    };

    render();
    timer = window.setInterval(render, 100);
    return () => window.clearInterval(timer);
  }

  window.addEventListener("weather:loaded", async (event) => {
    const weather = event.detail;
    const stopLoadingProgress = startLoadingProgress();
    const cached = getCachedHeadline(weather);
    if (cached) {
      stopLoadingProgress();
      return updateMarquee(cached, weather.marqueeText);
    }

    try {
      const headline = await generateHeadline(weather);
      if (!headline) throw new Error("Gemini returned an empty headline.");
      saveHeadline(weather, headline);
      stopLoadingProgress();
      updateMarquee(headline, weather.marqueeText);
    } catch (error) {
      stopLoadingProgress();
      setMarqueeText("A.I Gemini chưa tạo được tiêu đề, đang thử lại...", true);
      console.warn("[gemini-marquee] Không tạo được headline:", error);
    }
  });
})();
