// Uses the Gemini API's current Flash alias rather than pinning an older release.
const GEMINI_MODEL = "gemini-flash-latest";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

function cleanHeadline(text) {
  return String(text || "")
    .replace(/^['"“”]|['"“”]$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function getGeneratedText(geminiData) {
  const parts = geminiData?.candidates?.[0]?.content?.parts || [];
  // Newer Gemini models can return an internal thinking part before the
  // visible response. Only use visible text when building the marquee.
  return parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join(" ");
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: "GEMINI_API_KEY is not configured on the server." }, 500);
  }

  let weather;
  try {
    weather = await request.json();
  } catch (_) {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const description = String(weather.description || "").slice(0, 180);
  const temp = Number(weather.temp);
  const feels = Number(weather.feels);
  if (!description || !Number.isFinite(temp) || !Number.isFinite(feels)) {
    return json({ error: "Weather data is incomplete." }, 400);
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Viết đúng MỘT câu tiếng Việt cho thanh marquee thời tiết, kiểu Gen Z tự nhiên và vui vừa phải. BẮT BUỘC nêu đúng nhiệt độ ${temp}°C và nhắc ngắn gọn tình trạng "${description}". Cảm giác thực tế là ${feels}°C, chỉ nhắc khi làm câu tự nhiên hơn. Câu cần giống lời than thở/cập nhật đời thường, ví dụ phong cách: "Trời nay nắng 31° độ lười chả muốn làm giề." Không sao chép nguyên ví dụ; hãy viết câu mới theo dữ liệu hiện tại. Tối đa 18 từ, có thể có 1 emoji. Không hashtag, không ngoặc kép, không giải thích.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 1, maxOutputTokens: 40 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      const message = String(errorData?.error?.message || "Unknown Gemini API error").slice(0, 240);
      console.error("Gemini error:", geminiResponse.status, message);
      return json({ error: `Gemini API error (${geminiResponse.status}): ${message}` }, 502);
    }

    const geminiData = await geminiResponse.json();
    const headline = cleanHeadline(getGeneratedText(geminiData));
    if (!headline) {
      const reason = geminiData?.candidates?.[0]?.finishReason || geminiData?.promptFeedback?.blockReason || "no visible text";
      console.error("Gemini returned no headline:", reason);
      return json({ error: `Gemini returned no headline (${reason}).` }, 502);
    }

    return json({ headline });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return json({ error: "Could not generate a headline." }, 502);
  }
}
