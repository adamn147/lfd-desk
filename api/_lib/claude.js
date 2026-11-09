import Anthropic from "@anthropic-ai/sdk";

// The key is read from the ANTHROPIC_API_KEY environment variable (set in Vercel).
// It never reaches the browser.
let client;
export function claude() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY is not set on the server."), { status: 500 });
  }
  client ??= new Anthropic();
  return client;
}

export const MODEL = "claude-opus-5-5";

// Shared request options. "fallbacks: default" lets the API retry on a fallback model
// if a safety check ever declines a request, instead of failing outright.
export const BASE = {
  model: MODEL,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

export function textOf(message) {
  return message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Map SDK errors to messages a warehouse user can act on.
export function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError)
    return { status: 500, error: "The Claude API key on the server is wrong or revoked. Update ANTHROPIC_API_KEY in Vercel." };
  if (err instanceof Anthropic.PermissionDeniedError)
    return { status: 500, error: "The Claude API account can't use this model. Check the account in console.anthropic.com." };
  if (err instanceof Anthropic.RateLimitError)
    return { status: 429, error: "Too many requests, or the API account is out of credit. Wait a minute or top up at console.anthropic.com." };
  if (err instanceof Anthropic.BadRequestError)
    return { status: 400, error: "The AI service couldn't use that image. Try a clearer JPG or PNG photo." };
  if (err instanceof Anthropic.APIConnectionError)
    return { status: 502, error: "Couldn't reach the AI service. Check the connection and try again." };
  if (err instanceof Anthropic.APIError)
    return { status: 502, error: "The AI service had a problem. Try again in a moment." };
  return { status: err?.status || 500, error: err?.message || "Something went wrong." };
}
