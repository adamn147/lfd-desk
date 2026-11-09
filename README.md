# LFD Desk

Container & paperwork assistant for small warehouses. Take a photo of a delivery order, AI reads the
container number and last free day, and the board flags demurrage risk.

## How it fits together

```
Phone / laptop  →  your site on Vercel  →  password check  →  Claude API (key stays on the server)
```

- `index.html` – the app (board, scanning, alerts, email drafts). The board is saved in each device's browser.
- `login.html` – the password page.
- `api/` – the server: `login`, `logout`, `session`, `extract` (reads a photo), `draft` (writes a customer email).
- `dev/` – local testing only; not deployed.

## Settings (Vercel → Project → Settings → Environment Variables)

| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |
| `APP_PASSWORD` | The password you'll type to log in. Use 12+ characters. Changing it logs everyone out. |

After adding or changing a setting, redeploy (Deployments → ⋯ → Redeploy).

## Cost

Each document read uses Claude Opus 5.5 and costs roughly 4–5 cents; each email draft about 1 cent.
Set a monthly spend limit in console.anthropic.com → Limits.

## Run it on your own computer (optional)

```
npm install
APP_PASSWORD=pick-one ANTHROPIC_API_KEY=your-key npm run dev
```
Then open http://localhost:3000
