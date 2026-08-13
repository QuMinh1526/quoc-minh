(() => {
  const audio = document.getElementById("music-audio");
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
  const avatarFallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect width='90' height='90' fill='%23333c37'/><text x='50%25' y='55%25' font-size='36' fill='%23888' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>?</text></svg>";

  let playlist = [];
  let currentIndex = 0;
  let notificationTimer;
  let notificationHideTimer;
  let shouldAutoplay = false;
  audio.volume = 0.4;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;
  };

  function setAvatar(avatar) {
    elAvatar.onerror = () => {
      elAvatar.onerror = null;
      elAvatar.src = avatarFallback;
    };
    elAvatar.src = encodeURI(avatar);
  }

  function createNowPlayingNotification() {
    let notification = document.getElementById("now-playing-notification");
    if (notification) return notification;

    notification = document.createElement("aside");
    notification.id = "now-playing-notification";
    notification.className = "now-playing-notification";
    notification.setAttribute("role", "status");
    notification.setAttribute("aria-live", "polite");
    notification.innerHTML = `
      <div class="now-playing-main">
        <img class="now-playing-avatar" alt="" />
        <div class="now-playing-details">
          <strong class="now-playing-title"></strong>
          <span class="now-playing-artist"></span>
        </div>
      </div>
      <div class="now-playing-timeline">
        <span class="now-playing-current">0:00</span>
        <div class="now-playing-progress"><div class="now-playing-progress-fill"></div></div>
        <span class="now-playing-total">0:00</span>
      </div>`;
    document.body.appendChild(notification);
    return notification;
  }

  function showNowPlayingNotification(track) {
    const notification = createNowPlayingNotification();
    const avatar = notification.querySelector(".now-playing-avatar");
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = avatarFallback;
    };
    avatar.src = encodeURI(track.avatar);
    notification.querySelector(".now-playing-title").textContent = track.title;
    notification.querySelector(".now-playing-artist").textContent = track.artist;
    syncNotificationTimeline();
    window.clearTimeout(notificationHideTimer);
    notification.classList.remove("is-hiding");
    notification.classList.remove("is-visible");
    void notification.offsetWidth;
    notification.classList.add("is-visible");
    window.clearTimeout(notificationTimer);
    notificationTimer = window.setTimeout(() => {
      notification.classList.remove("is-visible");
      notification.classList.add("is-hiding");
      notificationHideTimer = window.setTimeout(() => notification.classList.remove("is-hiding"), 320);
    }, 3000);

    showBrowserNotification(track);
  }

  function showBrowserNotification(track) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(track.title, { body: track.artist, icon: encodeURI(track.avatar), image: encodeURI(track.avatar), tag: "now-playing" });
    }
  }

  function requestNotificationPermission() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    Notification.requestPermission().then((permission) => {
      if (permission === "granted" && playlist[currentIndex]) showBrowserNotification(playlist[currentIndex]);
    });
  }

  function syncNotificationTimeline() {
    const current = document.querySelector(".now-playing-current");
    const total = document.querySelector(".now-playing-total");
    const fill = document.querySelector(".now-playing-progress-fill");
    if (current) current.textContent = formatTime(audio.currentTime);
    if (total) total.textContent = formatTime(audio.duration);
    if (fill) fill.style.width = Number.isFinite(audio.duration) && audio.duration > 0 ? `${(audio.currentTime / audio.duration) * 100}%` : "0%";
  }

  function loadTrack(index, autoPlay) {
    if (!playlist.length) return;
    currentIndex = (index + playlist.length) % playlist.length;
    const track = playlist[currentIndex];
    shouldAutoplay = autoPlay;
    audio.pause();
    audio.src = encodeURI(track.file);
    audio.load();
    elTitle.textContent = track.title;
    elArtist.textContent = track.artist;
    setAvatar(track.avatar);
    elTimeCurrent.textContent = "0:00";
    elProgressFill.style.width = "0%";
  }

  function playLoadedTrack() {
    if (!shouldAutoplay) return;
    shouldAutoplay = false;
    audio.play().catch((error) => {
      elArtist.textContent = `Playback error: ${error.message}`;
      console.warn("[music-player] Không phát được bài nhạc:", error);
    });
  }

  btnPlay.addEventListener("click", () => {
    requestNotificationPermission();
    audio.paused ? audio.play() : audio.pause();
  });
  btnNext.addEventListener("click", () => {
    requestNotificationPermission();
    loadTrack(currentIndex + 1, true);
  });
  btnPrev.addEventListener("click", () => {
    requestNotificationPermission();
    loadTrack(currentIndex - 1, true);
  });
  elProgressBar.addEventListener("click", (event) => {
    if (!Number.isFinite(audio.duration)) return;
    const rect = elProgressBar.getBoundingClientRect();
    audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
  });
  audio.addEventListener("play", () => {
    iconPlay.style.display = "none";
    iconPause.style.display = "block";
    if (playlist[currentIndex]) showNowPlayingNotification(playlist[currentIndex]);
  });
  audio.addEventListener("pause", () => {
    iconPlay.style.display = "block";
    iconPause.style.display = "none";
  });
  audio.addEventListener("loadedmetadata", () => (elTimeTotal.textContent = formatTime(audio.duration)));
  audio.addEventListener("canplay", playLoadedTrack);
  audio.addEventListener("timeupdate", () => {
    elTimeCurrent.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) elProgressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    syncNotificationTimeline();
  });
  audio.addEventListener("ended", () => loadTrack(currentIndex + 1, true));

  fetch("./playlist.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((tracks) => {
      if (!Array.isArray(tracks) || !tracks.length) throw new Error("playlist.json không có bài nhạc nào");
      playlist = tracks
        .map((track) => ({ ...track, id: Number(track.id) }))
        .sort((first, second) => first.id - second.id);
      playlist.forEach((track, index) => {
        if (track.id !== index + 1) throw new Error("Số id trong playlist.json phải liên tiếp từ 1");
        if (!track.title || !track.avatar || !track.artist || !track.file) {
          throw new Error(`Bài id ${track.id} thiếu title, avatar, artist hoặc file`);
        }
      });
      loadTrack(0, false);
    })
    .catch((error) => {
      elTitle.textContent = "Playlist error";
      elArtist.textContent = error.message;
      console.warn("[music-player] Không đọc được playlist:", error);
    });
})();
