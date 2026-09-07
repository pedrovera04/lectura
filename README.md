# 📖 Lectura oral — monorepo para Vercel

Frontend (React + Vite) **y** backend (Express + Azure Speech) en un solo
repositorio, desplegados juntos en Vercel bajo el mismo dominio:

```
/                       → frontend estático (frontend/dist)
/api/health             → Serverless Function (Express)
/api/reading/evaluate   → Serverless Function (Express)
```

El backend es la **misma app** de `backend/src`: `api/index.ts` importa
`backend/dist/app.js` y la exporta como handler. `vercel.json` reescribe
`/api/*` hacia esa función.

---

## Estructura

```
.
├── api/
│   └── index.ts          # entrada serverless: envuelve la app Express
├── backend/              # app Express (idéntica al repo original)
│   └── src/…
├── frontend/             # app React + Vite (idéntica al repo original)
│   └── src/…
├── vercel.json           # build + rutas + maxDuration
├── package.json          # deps del backend (para la función) + scripts
└── .env.example          # variables que van en el panel de Vercel
```

---

## Desarrollo local

```bash
npm run install:all        # instala raíz + backend + frontend

cp backend/.env.example backend/.env   # y completa AZURE_SPEECH_KEY / REGION

# dos terminales:
npm run dev:backend        # http://localhost:3001
npm run dev:frontend       # http://localhost:5173  (proxy /api → :3001)
```

En local **no** se usa `api/index.ts`; se usa el servidor Express normal
(`backend/src/index.ts`). `api/index.ts` es solo para Vercel.

---

## Desplegar en Vercel

### 1. Sube este directorio a un repo de GitHub

```bash
git init -b main
git add -A
git commit -m "Monorepo lectura oral para Vercel"
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

### 2. Importa el repo en Vercel

- **New Project → Import** el repo.
- **Framework Preset:** `Other` (lo fuerza `vercel.json`).
- **Root Directory:** `.` (la raíz; no cambies nada).
- Build & Output los toma de `vercel.json`:
  - Build Command: `npm run build`
  - Output Directory: `frontend/dist`

### 3. Variables de entorno (Settings → Environment Variables)

Para *Production* y *Preview*:

| Variable              | Valor                                   | Obligatoria |
| --------------------- | --------------------------------------- | ----------- |
| `AZURE_SPEECH_KEY`    | KEY 1 del recurso Speech en Azure       | ✅          |
| `AZURE_SPEECH_REGION` | p. ej. `eastus`                         | ✅          |
| `DEFAULT_LANGUAGE`    | `es-CL` (o `es-MX`, `es-ES`…)           | ➖          |
| `MAX_AUDIO_MB`        | `4`                                     | ➖          |
| `ANTHROPIC_API_KEY`   | si quieres el feedback redactado por Claude | ➖       |
| `ANTHROPIC_MODEL`     | `claude-haiku-4-5-20251001`             | ➖          |
| `CORS_ORIGIN`         | normalmente vacío (mismo dominio)       | ➖          |

> Sin `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION`, la función responde
> `500` con un mensaje explicando qué falta.

### 4. Deploy

Vercel ejecuta `npm install` (raíz) → `npm run build` (compila
`backend/dist` y `frontend/dist`) → publica el estático y la función.

Prueba: `https://<tu-app>.vercel.app/api/health` debe devolver
`{"status":"ok","azure":true,…}`.

---

## Límites de Vercel que afectan a esta app

| Límite                          | Efecto aquí                                                        |
| ------------------------------- | ----------------------------------------------------------------- |
| **Duración de función**         | `vercel.json` pide `maxDuration: 60`. En **Hobby** el máximo real es 60 s; en **Pro**, hasta 300 s. Una evaluación tarda ~5–20 s, así que 60 s cubre casos normales; lecturas muy largas en Hobby podrían cortar. |
| **Cuerpo de petición ~4.5 MB**  | El audio WAV de un párrafo pesa <1.5 MB. `MAX_AUDIO_MB=4` lo rechaza antes con un mensaje claro si alguien manda algo enorme. |
| **Sin disco persistente**       | No afecta: el audio se procesa en memoria (`multer.memoryStorage`). |
| **Cold start**                  | La primera petición tras inactividad tarda 1–3 s extra en cargar el SDK de Azure. |

Si necesitas lecturas largas garantizadas o audios grandes, despliega el
`backend/` en Railway/Render (servidor persistente) y deja en Vercel solo el
`frontend/` con `VITE_API_BASE_URL=https://TU-BACKEND/api`.

---

## Cómo encaja `api/index.ts`

```ts
const mod = await import('../backend/dist/app.js');
export default mod.createApp();   // la app Express es (req, res) => …
```

- `npm run build:backend` genera `backend/dist/` con `tsc` (ESM, mismos
  imports `.js`).
- Vercel empaqueta la función trazando las dependencias desde
  `package.json` de la raíz (por eso están ahí `express`, `zod`,
  `microsoft-cognitiveservices-speech-sdk`, etc.).
- `vercel.json` → `rewrites: /api/(.*) → /api`, y Express resuelve la ruta
  original (`/api/health`, `/api/reading/evaluate`).
