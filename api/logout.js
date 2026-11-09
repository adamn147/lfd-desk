import { send } from "./_lib/http.js";
import { clearCookie } from "./_lib/auth.js";

export default function handler(req, res) {
  res.setHeader("Set-Cookie", clearCookie());
  send(res, 200, { ok: true });
}
