(() => {
  const logo = document.getElementById("site-logo");
  if (logo) {
    logo.onerror = () => {
      logo.onerror = null;
      logo.src = "./assets/img/logo_blue.jpg";
    };
    logo.src = "./assets/img/logo_blue.png";
  }

  const pageBackground = document.getElementById("page-bg");
  if (pageBackground) {
    const loadBackground = (extension, fallback) => {
      const image = new Image();
      image.onload = () => (pageBackground.style.backgroundImage = `url('./assets/img/background.${extension}')`);
      image.onerror = fallback;
      image.src = `./assets/img/background.${extension}`;
    };
    loadBackground("gif", () => loadBackground("jpg", () => loadBackground("png")));
  }

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
    welcomeScreen.style.display = "none";
    document.getElementById("music-audio")?.play();
  });
})();
