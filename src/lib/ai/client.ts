import OpenAI from "openai";

let singleton: OpenAI | null = null;

/** Lazy singleton — avoids instantiating OpenAI during Next.js build when env is unset. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' })."
    );
  }
  singleton ??= new OpenAI({ apiKey });
  return singleton;
}
