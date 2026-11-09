import { send, readJson, onlyPost } from "./_lib/http.js";
import { isLoggedIn } from "./_lib/auth.js";
import { claude, BASE, textOf, friendlyError } from "./_lib/claude.js";

const KEYS = ["today", "container", "size", "customer", "reference", "pieces", "steamship_line",
  "terminal", "last_free_day", "days_until_lfd", "status"];

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    if (!isLoggedIn(req)) return send(res, 401, { error: "Please log in again." });
    const { facts = {} } = await readJson(req, 20_000);
    // Only known fields, short values: the page can't turn this into a general chatbot.
    const clean = {};
    for (const k of KEYS) if (facts[k] !== undefined && facts[k] !== null) clean[k] = String(facts[k]).slice(0, 120);

    const message = await claude().beta.messages.create({
      ...BASE,
      max_tokens: 4000,
      output_config: { effort: "low" },
      messages: [{
        role: "user",
        content: `Write a short, friendly, professional status email from a Southern California warehouse/drayage team to their customer about one import container. Facts (JSON): ${JSON.stringify(clean)}
Put a subject line first ("Subject: ..."). State where the container is and the last free day in plain words. If the container is still at the terminal and the LFD is within 2 days or past, say we are scheduling pickup and that demurrage may apply after the LFD. Keep the body under 120 words. Sign off as "[Your Warehouse] Operations". Plain text only, no markdown.`,
      }],
    });

    if (message.stop_reason === "refusal") return send(res, 422, { error: "The AI declined to draft this email." });
    send(res, 200, { text: textOf(message) });
  } catch (err) {
    console.error("draft failed:", err?.message);
    const e = friendlyError(err);
    send(res, e.status, { error: e.error });
  }
}
