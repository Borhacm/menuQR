const libreUrl = process.env.LIBRETRANSLATE_URL || "http://127.0.0.1:5001/translate";
const languageUrl = libreUrl.replace(/\/translate\/?$/, "/languages");

async function checkLanguagesEndpoint() {
  const response = await fetch(languageUrl);
  if (!response.ok) {
    throw new Error(`Languages endpoint failed with ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Languages endpoint returned an empty payload");
  }
  return payload;
}

async function checkTranslateEndpoint() {
  const response = await fetch(libreUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: "Hola mundo",
      source: "es",
      target: "en",
      format: "text",
    }),
  });
  if (!response.ok) {
    throw new Error(`Translate endpoint failed with ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.translatedText || typeof payload.translatedText !== "string") {
    throw new Error("Translate endpoint returned an invalid payload");
  }
  return payload.translatedText;
}

try {
  const languages = await checkLanguagesEndpoint();
  const translatedText = await checkTranslateEndpoint();
  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: "libretranslate",
        libreUrl,
        languageCount: languages.length,
        sample: translatedText,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        provider: "libretranslate",
        libreUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}
