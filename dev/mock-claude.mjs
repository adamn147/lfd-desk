// Fake Claude API for local testing without spending credit.
// Run it, then start the dev server with ANTHROPIC_BASE_URL=http://localhost:4010
import http from "node:http";
http.createServer((req, res) => {
  let body = ""; req.on("data", (c) => body += c); req.on("end", () => {
    const j = JSON.parse(body || "{}");
    const hasImage = JSON.stringify(j.messages).includes('"type":"image"');
    console.log("mock got", req.method, req.url, "model", j.model, "effort", j.output_config?.effort, "fallbacks", j.fallbacks, "beta", req.headers["anthropic-beta"]);
    const text = hasImage
      ? '```json\n{"doc_type":"Delivery order","container_no":"HRLU4829130","size_type":"40HC","carrier":"Meridian Ocean Lines","terminal":"Harbor Terminal 3","vessel_voyage":"MERIDIAN CRESTA / 047E","discharge_date":"2026-11-06","last_free_day":"2026-11-10","customer":"Sunrise Home Goods LLC","reference":"SHG-55120","pieces":"1,240 CTNS","weight":"18,450 LBS","seal_no":"ML7731904","unclear":["seal_no"],"notes":""}\n```'
      : "Subject: Container update\n\nHello, your container is at the terminal.\n\n[Your Warehouse] Operations";
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ id: "msg_mock", type: "message", role: "assistant", model: j.model, stop_reason: "end_turn", stop_sequence: null,
      content: [{ type: "text", text }], usage: { input_tokens: 10, output_tokens: 10 } }));
  });
}).listen(4010, () => console.log("mock Claude on 4010"));
