import { send } from "./_lib/http.js";
import { isLoggedIn } from "./_lib/auth.js";

export default function handler(req, res) {
  try {
    send(res, isLoggedIn(req) ? 200 : 401, { loggedIn: isLoggedIn(req) });
  } catch (err) {
    send(res, err.status || 500, { error: err.message });
  }
}
