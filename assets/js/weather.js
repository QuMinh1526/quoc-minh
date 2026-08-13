(() => {
  const icons = {
    sunny: "☀️",
    cloudy: "☁️",
    fog: "🌫️",
    rain: "🌧️",
    snow: "❄️",
    storm: "⛈️",
  };

  function weatherType(code) {
    if (code === 0) return "sunny";
    if ([45, 48].includes(code)) return "fog";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([95, 96, 99].includes(code)) return "storm";
    return "cloudy";
  }

  function weatherText(code) {
    if (code === 0) return "Trời trong xanh, nắng đẹp hết nấc";
    if ([1, 2, 3].includes(code)) return "Trời nhiều mây, hơi lười nắng";
    if ([45, 48].includes(code)) return "Sương mù mờ ảo kiểu ngôn tình";
    if ([51, 53, 55, 56, 57].includes(code)) return "Mưa lâm thâm, buồn man mác";
    if ([61, 63, 65, 66, 67].includes(code)) return "Mưa to, ở nhà cho lành";
    if ([80, 81, 82].includes(code)) return "Mưa rào bất chợt, đi cẩn thận";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Có tuyết, lạnh xỉu";
    if ([95, 96, 99].includes(code)) return "Dông sét, tránh xa ra kẻo bay nón";
    return "Thời tiết bí ẩn, chưa đọc được vibe";
  }

  function compass(degrees) {
    const directions = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
    return directions[Math.round(degrees / 45) % directions.length];
  }

  function setMarquee(text, loading = false) {
    const inner = document.getElementById("weather-marquee-inner");
    if (!inner) return;
    inner.classList.toggle("is-loading", loading);
    inner.querySelectorAll(".weather-marquee-seg").forEach((segment) => (segment.textContent = text));
  }

  function renderWeather(current) {
    const description = weatherText(current.weather_code);
    const temp = Math.round(current.temperature_2m);
    const feels = Math.round(current.apparent_temperature);
    const details = [
      description,
      `${temp}°C (cảm giác ${feels}°C)`,
      `ẩm ${Math.round(current.relative_humidity_2m)}%`,
      `gió ${Math.round(current.wind_speed_10m)}km/h hướng ${compass(current.wind_direction_10m)}, giật ${Math.round(current.wind_gusts_10m)}km/h`,
      `mây che ${Math.round(current.cloud_cover)}%`,
      `áp suất ${Math.round(current.pressure_msl)}hPa`,
    ];
    if (current.rain > 0) details.push(`mưa ${current.rain}mm, mang dù nha 🌂`);
    if (current.showers > 0) details.push(`mưa rào ${current.showers}mm`);
    if (current.snowfall > 0) details.push(`tuyết rơi ${current.snowfall}cm ❄️`);
    details.push("✨");

    const icon = document.getElementById("weather-marquee-icon");
    if (icon) icon.textContent = icons[weatherType(current.weather_code)];
    window.dispatchEvent(new CustomEvent("weather:loaded", {
      detail: {
        description,
        temp,
        feels,
        weather_code: current.weather_code,
        is_day: current.is_day,
        marqueeText: details.join("\u00A0\u00A0\u00A0\u00A0\u00A0"),
      },
    }));
  }

  function showWeatherError(error) {
    setMarquee(`Error: ${error.message || String(error)}`, false);
  }

  function fetchWeather(latitude, longitude) {
    const fields = "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day";
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${fields}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Weather request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!data.current) throw new Error("Weather data is unavailable");
        renderWeather(data.current);
      })
      .catch(showWeatherError);
  }

  if (!navigator.geolocation) {
    fetchWeather(10.7769, 106.7009);
  } else {
    navigator.geolocation.getCurrentPosition(
      (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
      () => fetchWeather(10.7769, 106.7009),
      { timeout: 8000 }
    );
  }
})();
