import os
import requests
import yt_dlp

url = input("🔗 Nhập link SoundCloud: ").strip()

output_dir = "/sdcard/Download/SoundCloud"
os.makedirs(output_dir, exist_ok=True)

# Lấy metadata
print("🔍 Đang lấy thông tin bài hát...")

opts = {
    "quiet": True,
    "skip_download": True,
}

with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info(url, download=False)

title = info.get("title", "Unknown")
artist = info.get("artist") or info.get("uploader") or "Unknown"
artwork = info.get("thumbnail")

print(f"🎵 {title}")
print(f"👤 {artist}")

# Tên file an toàn
filename = "".join(
    c for c in title
    if c not in '/\\:*?"<>|'
).strip()

# Tải audio
print("⬇️ Đang tải nhạc...")

audio_opts = {
    "format": "bestaudio/best",
    "outtmpl": f"{output_dir}/{filename}.%(ext)s",
    "quiet": False,
    "noplaylist": True,

    "postprocessors": [{
        "key": "FFmpegExtractAudio",
        "preferredcodec": "mp3",
        "preferredquality": "320",
    }],
}

with yt_dlp.YoutubeDL(audio_opts) as ydl:
    ydl.download([url])

# Tải cover
if artwork:
    print("🖼️ Đang tải ảnh bìa...")

    image = requests.get(
        artwork,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    if image.ok:
        with open(f"{output_dir}/{filename} - Cover.jpg", "wb") as f:
            f.write(image.content)

print("\n✅ Xong!")
print(f"📁 {output_dir}")