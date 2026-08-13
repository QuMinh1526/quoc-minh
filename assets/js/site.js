(() => {
  const logo = document.getElementById("site-logo");
  if (logo) {
    logo.onerror = () => {
      logo.onerror = null;
      logo.src = "./assets/img/logo_blue.jpg";
    };
    logo.src = "./assets/img/logo_blue.png";
  }

  const MEDIA_INTERVAL = 10000;
  const mediaExtensions = /\.(avif|bmp|gif|jpe?g|png|svg|webp|mp4|webm|mov|m4v|ogg)$/i;

  function createMediaElement(url, label) {
    const isVideo = /\.(mp4|webm|mov|m4v|ogg)$/i.test(url);
    const media = document.createElement(isVideo ? "video" : "img");
    media.src = url;
    media.className = label;
    media.alt = "";
    if (isVideo) {
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
    }
    return media;
  }

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  async function loadMediaFolder(folder, target, className) {
    if (!target) return;
    try {
      const response = await fetch(`${folder}/manifest.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Không đọc được ${folder}/manifest.json`);
      const files = (await response.json())
        .filter((file) => typeof file === "string" && mediaExtensions.test(file))
        .map((file) => `${folder}/${encodeURIComponent(file).replace(/%2F/g, "/")}`);
      if (!files.length) throw new Error(`Thư mục ${folder} không có media hợp lệ`);

      let order = shuffle(files);
      let index = 0;
      const showNext = () => {
        const media = createMediaElement(order[index], className);
        media.addEventListener("error", () => media.remove(), { once: true });
        target.replaceChildren(media);
        if (order.length > 1) {
          index = (index + 1) % order.length;
          if (index === 0) order = shuffle(files);
        }
      };
      showNext();
      if (files.length > 1) window.setInterval(showNext, MEDIA_INTERVAL);
    } catch (error) {
      console.warn(`[media] ${error.message}`);
    }
  }

  loadMediaFolder("./assets/img/background", document.getElementById("page-bg"), "site-background-media");
  loadMediaFolder("./assets/img/banner", document.getElementById("site-banner-media"), "site-banner-media");

  const welcomeScreen = document.getElementById("welcome-screen");
  if (!welcomeScreen) return;
  const digits = welcomeScreen.querySelectorAll(".welcome-clock .digit");
  let previous = [];
  const updateClock = () => {
    const now = new Date();
    const values = [now.getHours(), now.getMinutes(), now.getSeconds()].map((value) => String(value).padStart(2, "0")).join("").split("");
    values.forEach((value, index) => {
      if (value === previous[index]) return;
      digits[index].textContent = value;
      digits[index].classList.remove("tick");
      void digits[index].offsetWidth;
      digits[index].classList.add("tick");
    });
    previous = values;
  };
  updateClock();
  window.setInterval(updateClock, 1000);

  const stars = welcomeScreen.querySelector(".shooting-stars");
  for (let index = 0; stars && index < 6; index += 1) {
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.style.top = `${Math.random() * 50}%`;
    star.style.left = `${Math.random() * 60}%`;
    star.style.animationDuration = `${3 + Math.random() * 3}s`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    stars.appendChild(star);
  }
  welcomeScreen.addEventListener("click", () => {
    document.body.classList.add("site-entered");
    welcomeScreen.classList.add("is-leaving");
    window.setTimeout(() => (welcomeScreen.style.display = "none"), 520);
    document.getElementById("music-audio")?.play();
  }, { once: true });
})();
