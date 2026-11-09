import crypto from "node:crypto";

// One shared password (APP_PASSWORD) protects the app. A successful login gets a
// signed, HttpOnly cookie that lasts 30 days. Changing APP_PASSWORD logs everyone out.
const COOKIE = "lfd_session";
const MAX_AGE_S = 30 * 24 * 60 * 60;

function key() {
  const pw = process.env.APP_PASSWORD;
  if (!pw) throw Object.assign(new Error("APP_PASSWORD is not set on the server."), { status: 500 });
  return crypto.createHash("sha256").update("lfd-session:" + pw).digest();
}

const mac = (value) => crypto.createHmac("sha256", key()).update(value).digest("base64url");
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();

export function passwordMatches(input) {
  const pw = process.env.APP_PASSWORD;
  if (!pw) throw Object.assign(new Error("APP_PASSWORD is not set on the server."), { status: 500 });
  return crypto.timingSafeEqual(sha(input ?? ""), sha(pw));
}

export function sessionCookie() {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  return `${COOKIE}=${exp}.${mac(exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_S}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function isLoggedIn(req) {
  const raw = req.headers.cookie || "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!hit) return false;
  const [exp, sig] = hit.slice(COOKIE.length + 1).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Date.now() > Number(exp)) return false;
  const want = Buffer.from(mac(exp));
  const got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
