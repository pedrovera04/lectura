# 📖 ¡Hora de leer! — Evaluación de lectura oral infantil

Aplicación web educativa que muestra un párrafo a un niño de ~8 años, lo graba
leyéndolo en voz alta y evalúa la **calidad de su lectura** usando
**Azure AI Speech – Pronunciation Assessment**.

No es una simple transcripción de voz a texto: Azure compara el audio contra el
**texto de referencia** para calcular precisión, fluidez, completitud, prosodia
y pronunciación, además de detectar palabras omitidas, agregadas y mal
pronunciadas. Opcionalmente, **Claude** convierte esas métricas en un feedback
educativo y cariñoso para el niño.

```
Frontend (React) → captura audio → Backend (Express) → Azure Pronunciation
Assessment → resultados estructurados → (Claude, opcional) → Frontend muestra
los resultados
```

---

## 1) Requisitos

- **Node.js 18.17+** (recomendado 20+) y npm.
- Una cuenta de **Microsoft Azure** con un recurso **Speech** (nivel gratuito F0
  es suficiente para probar).
- (Opcional) Una **API key de Anthropic** si quieres el feedback redactado por
  Claude. Sin ella, la app genera un feedback con reglas y funciona igual.
- Un navegador moderno con micrófono (Chrome, Edge, Firefox o Safari).

---

## 2) Instalación

```bash
# En la raíz del proyecto
cd backend  && npm install
cd ../frontend && npm install
```

---

## 3) Crear el recurso de Azure Speech

1. Entra al [portal de Azure](https://portal.azure.com).
2. **Crear un recurso → "Speech"** (categoría *AI + Machine Learning*).
3. Elige tu suscripción, un grupo de recursos y una **región**
   (ej. `eastus`, `brazilsouth`, `westus2`). Anótala.
4. Nivel de precios: **F0 (gratis)** para pruebas, o **S0** para producción.
5. Una vez creado, ve a **"Claves y punto de conexión"** y copia:
   - **KEY 1** → será `AZURE_SPEECH_KEY`
   - **Ubicación/Región** → será `AZURE_SPEECH_REGION` (el identificador corto,
     p. ej. `eastus`).

> La evaluación de **prosodia** y de errores (miscue) está disponible en varios
> locales de español. Este proyecto usa `es-CL` por defecto; puedes cambiarlo.

---

## 4) Configurar las variables de entorno

### Backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173

AZURE_SPEECH_KEY=tu_clave_de_azure
AZURE_SPEECH_REGION=eastus
DEFAULT_LANGUAGE=es-CL
MAX_AUDIO_MB=10

# Opcional (feedback con Claude). Si lo dejas vacío se usa feedback por reglas.
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

### Frontend

En desarrollo no necesitas configurar nada: Vite hace de proxy de `/api` hacia
el backend. Si quieres personalizarlo:

```bash
cd frontend
cp .env.example .env
```

```env
# En producción, apunta a la URL pública de tu backend + /api
VITE_API_BASE_URL=/api
```

> 🔒 **Seguridad:** la clave de Azure vive **solo en el backend**. El frontend
> nunca la ve ni habla directamente con Azure.

---

## 5) Ejecutar el backend

```bash
cd backend
npm run dev      # modo desarrollo con recarga automática
# o
npm run build && npm start
```

Deberías ver:

```
🚀 Backend escuchando en http://localhost:3001
```

Comprueba el estado: <http://localhost:3001/api/health>

---

## 6) Ejecutar el frontend

```bash
cd frontend
npm run dev
```

Abre <http://localhost:5173>.

---

## 7) Cómo hacer una prueba

1. Con **ambos** servidores corriendo, abre <http://localhost:5173>.
2. Pulsa **"Comenzar lectura"**.
3. Pulsa **"🎙️ Comenzar a leer"** y **acepta el permiso del micrófono**.
4. Lee el párrafo en voz alta.
5. Pulsa **"Terminar lectura"**.
6. Espera la pantalla *"Estamos revisando tu lectura..."* y verás los resultados:
   puntajes, velocidad (PPM), tu texto con las palabras coloreadas y consejos.
7. Toca una palabra resaltada para ver su detalle (puntuación y fonemas).

**Prueba rápida del endpoint** (con un WAV mono 16 kHz):

```bash
curl -X POST http://localhost:3001/api/reading/evaluate \
  -F "audio=@lectura.wav;type=audio/wav" \
  -F "referenceText=Tomás encontró una pequeña caja de madera debajo de un árbol." \
  -F "language=es-CL"
```

---

## 8) Cómo desplegar

La app está pensada para separar frontend y backend.

### Backend → Railway / Render / Azure

- Comando de build: `npm run build`
- Comando de inicio: `npm start`
- Variables de entorno: las mismas de `backend/.env`
  (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, etc.).
- Ajusta `CORS_ORIGIN` a la URL pública de tu frontend.

No requiere **ffmpeg** ni binarios extra: el audio ya llega como WAV desde el
navegador (ver *Decisiones técnicas*).

### Frontend → Vercel

- Framework: **Vite**
- Build: `npm run build` · Output: `dist`
- Variable de entorno: `VITE_API_BASE_URL=https://TU-BACKEND/api`

---

## Estructura del proyecto

```
backend/
  src/
    config/        env.ts               (carga y valida variables de entorno)
    routes/        reading.routes.ts
    controllers/   reading.controller.ts
    services/      azurePronunciation.service.ts   (integración con Azure)
                   feedback.service.ts             (Claude + respaldo por reglas)
                   wav.service.ts                  (parser WAV sin ffmpeg)
    middleware/    upload.ts, errorHandler.ts
    types/         assessment.types.ts
    utils/         text.ts
frontend/
  src/
    components/    StartScreen, ReadingScreen, ProcessingScreen, ResultsScreen,
                   ScoreBar, HighlightedText, WordDetailModal, RecordButton
    services/      api.ts               (llamadas REST al backend)
                   recorder.ts          (graba WAV 16 kHz en el navegador)
    hooks/         useRecorder.ts
    lib/           passages.ts, scores.ts
    types/         assessment.ts
```

---

## Métricas y evaluación

Se usan **exactamente** los valores que entrega Azure; nada es aleatorio ni
inventado:

| Métrica            | Origen                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Precisión          | `AccuracyScore` de Azure                                         |
| Fluidez            | `FluencyScore` de Azure                                          |
| Completitud        | palabras de referencia efectivamente leídas (según omisiones)    |
| Prosodia           | `ProsodyScore` de Azure (si el locale la entrega; si no, oculta) |
| Pronunciación      | puntaje global compuesto                                          |
| Errores por palabra| `AccuracyScore` + `ErrorType` por palabra, de Azure             |
| Velocidad (PPM)    | palabras leídas ÷ (duración del audio en minutos)               |

### Decisiones técnicas

1. **Grabación WAV en el navegador.** En vez de `MediaRecorder` (WebM/Opus, que
   obligaría a transcodificar con ffmpeg en el servidor), se captura PCM con la
   Web Audio API y se genera un **WAV mono 16 kHz / 16 bits** — el formato que
   Azure prefiere. Resultado: backend sin ffmpeg y despliegue mucho más simple.

2. **Reconocimiento continuo.** El párrafo tiene varias oraciones;
   `recognizeOnceAsync` se detendría en la primera pausa larga. Usamos
   reconocimiento continuo y agregamos los segmentos.

3. **Puntajes globales agregados.** Cuando el niño hace pausas, Azure devuelve
   varios segmentos. Los combinamos siguiendo el método del ejemplo oficial de
   Microsoft (accuracy y fluency ponderados por duración; prosodia como
   promedio; completitud a partir de las omisiones). **Los datos por palabra se
   devuelven tal cual, sin modificar.**

4. **`enableMiscue = true`.** Permite que Azure marque palabras **omitidas**
   (`Omission`) e **insertadas** (`Insertion`) comparando contra el texto.

5. **Feedback opcional con Claude.** Claude **no** evalúa el audio: solo recibe
   las métricas de Azure y redacta un mensaje positivo (máx. 2–3 consejos). Si
   no hay `ANTHROPIC_API_KEY`, se usa un feedback equivalente por reglas.

---

## Cambiar el idioma

- Cambia `DEFAULT_LANGUAGE` en `backend/.env` (p. ej. `es-MX`, `es-ES`).
- O envía `language` en la petición `POST /api/reading/evaluate`.
- Para agregar textos, edita `frontend/src/lib/passages.ts`.

---

## Solución de problemas

- **"No pudimos escuchar la lectura"**: revisa el micrófono y lee más fuerte;
  confirma que el permiso del navegador está concedido.
- **Error de Azure / 502**: verifica `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`
  y que el recurso sea de tipo *Speech* en esa región.
- **CORS**: en producción, `CORS_ORIGIN` (backend) debe ser la URL exacta del
  frontend.
```
