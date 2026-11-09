import { send, readJson, onlyPost } from "./_lib/http.js";
import { passwordMatches, sessionCookie } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    const { password } = await readJson(req, 10_000);
    if (!passwordMatches(password)) {
      await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
      return send(res, 401, { error: "Wrong password." });
    }
    res.setHeader("Set-Cookie", sessionCookie());
    send(res, 200, { ok: true });
  } catch (err) {
    send(res, err.status || 500, { error: err.message || "Login failed." });
  }
}
