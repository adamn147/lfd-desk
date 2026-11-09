import { send, readJson, onlyPost } from "./_lib/http.js";
import { isLoggedIn } from "./_lib/auth.js";
import { claude, BASE, textOf, friendlyError } from "./_lib/claude.js";

const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FIELDS = ["container_no", "size_type", "carrier", "terminal", "vessel_voyage", "discharge_date",
  "last_free_day", "customer", "reference", "pieces", "weight", "seal_no", "doc_type", "notes"];

function prompt(today) {
  return `You are reading a shipping document (delivery order, arrival notice, freight release, bill of lading or similar) that was photographed or scanned at a warehouse in Southern California. Today is ${today}.

Extract these fields and reply with only one JSON object, no other text:
{"doc_type": string,
 "container_no": string (ISO container number: 4 letters + 7 digits, no spaces),
 "size_type": short code such as "20GP", "40GP", "40HC", "45HC" (convert "40' HIGH CUBE" to "40HC", "40DV" to "40GP", "20' DRY" to "20GP"),
 "carrier": steamship line name,
 "terminal": terminal or pier name,
 "vessel_voyage": string,
 "discharge_date": "YYYY-MM-DD" or "",
 "last_free_day": "YYYY-MM-DD" or "" (also called LFD, free time expires, last free date),
 "customer": consignee / customer company name only,
 "reference": PO or customer reference number,
 "pieces": string with unit, "weight": string with unit, "seal_no": string,
 "unclear": [names of fields above you could not read confidently],
 "notes": one short sentence about anything unusual, or ""}
Use "" for anything that is not on the document. Convert every date to YYYY-MM-DD; a two-digit year like 26 means 2026. If several containers appear, use the first and list the others in "notes". If the image is not a shipping document, return all fields as "" and say so in "notes".`;
}

function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(body);
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    if (!isLoggedIn(req)) return send(res, 401, { error: "Please log in again." });
    const { image, mediaType, today } = await readJson(req);
    if (typeof image !== "string" || !image || image.length > 6_000_000) return send(res, 400, { error: "Send one photo under 4 MB." });
    if (!TYPES.has(mediaType)) return send(res, 400, { error: "Use a JPG, PNG, WebP or GIF image." });
    const day = /^\d{4}-\d{2}-\d{2}$/.test(today || "") ? today : new Date().toISOString().slice(0, 10);

    const message = await claude().beta.messages.create({
      ...BASE,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: prompt(day) },
        ],
      }],
    });

    if (message.stop_reason === "refusal") return send(res, 422, { error: "The AI declined to read this image. Try a different photo." });
    let data;
    try { data = parseJson(textOf(message)); }
    catch { return send(res, 502, { error: "The answer came back in the wrong shape. Try again." }); }

    const out = {};
    for (const f of FIELDS) out[f] = typeof data[f] === "string" ? data[f].slice(0, 200) : "";
    out.unclear = Array.isArray(data.unclear) ? data.unclear.filter((x) => typeof x === "string").slice(0, 20) : [];
    send(res, 200, out);
  } catch (err) {
    console.error("extract failed:", err?.message);
    const e = friendlyError(err);
    send(res, e.status, { error: e.error });
  }
}
