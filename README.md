# MarineVision AI — SIH26057

End-to-end Side-Scan Sonar marine anomaly console with MongoDB, Cesium globe, historical references, AI training/evaluation, and FRIDAY voice control.

## Demo login
- Admin: `admin@marinevision.ai` / `Admin@12345`
- Operator: `operator@marinevision.ai` / `Operator@12345`

Demo users are **MongoDB records**, not frontend hardcoded accounts. On non-production startup, `AUTO_SEED_DEMO=true` creates them if missing.

## 1. Configure MongoDB
Copy `backend/.env.example` to `backend/.env` and set your own Atlas URI:

```powershell
cd backend
copy .env.example .env
```

Use a MongoDB database user with read/write permissions. Do not commit the real `.env`.

The previous archive contained live-looking credentials/API tokens. This upgraded package intentionally removes those secrets; enter your own credentials.

## 2. Redis
BullMQ background jobs require Redis. Start Redis locally or set `REDIS_URL` to a reachable Redis instance.

## 3. Start backend
```powershell
cd backend
npm install
npm run build
npm run seed:historical
npm run start:dev
```

The API is `http://127.0.0.1:4000/api` and Swagger is `/api/docs`.

## 4. Start frontend
```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## FRIDAY
FRIDAY now uses a **server-side ElevenLabs gateway**:
- Voice → Scribe v2 transcription → intent parsing → permission-aware command execution.
- Text → ElevenLabs TTS.
- Voice → command → ElevenLabs female voice response.
- Typed commands remain supported.
- Browser TTS is only a fallback if ElevenLabs is unavailable.
- The API key is never exposed in the frontend.

Set `ELEVENLABS_API_KEY` and optionally replace `ELEVENLABS_VOICE_ID` with a female voice from your ElevenLabs account.

## Globe data model
The globe reads its markers from MongoDB. Historical records are explicitly labelled `HISTORICAL_REFERENCE`; they are not presented as fresh AI detections.

The seed contains:
- Titanic wreck reference and coordinates from NOAA expedition material.
- 2021–2025 documented marine debris / lost-container / sunken-vessel references.
- Ghost-net / derelict-fishing-gear concepts are represented as the `FISHING_GEAR` class where a documented coordinate source is available.
- Every historical marker stores source organization, source URL, year, coordinate accuracy, quantity when available, and notes.

The 5-year historical layer is a **2021–2025 reference collection**, while Titanic is kept as a separate heritage/wreck reference because it predates that window.

## AI pipeline
1. Upload sonar images/logs.
2. Quality checks + grayscale/median/normalization preprocessing.
3. Tiled inference for large sonar images.
4. Real ONNX YOLO-family inference when `ONNX_MODEL_PATH` points to a trained model.
5. If no model is installed, the system explicitly labels the pixel heuristic as a baseline; it is never claimed to be AI accuracy.
6. Detection confidence + shadow/noise fusion + risk classification.
7. Coordinates are sourced from navigation metadata or explicitly marked estimated/unavailable.
8. Reports export structured geotagged anomalies.

### 1000+ image evaluation
The dataset UI accepts selecting 1000+ images in one browser action. Upload is automatically chunked into small requests to avoid exhausting browser/server RAM. Labelled datasets can be split 70/15/15 and trained/evaluated in MongoDB-backed jobs.

The resulting accuracy, macro precision/recall/F1, confusion matrix, per-class support, and latency are computed from the held-out images. The current built-in trainer is a lightweight whole-image classifier; it does **not** fabricate mAP. For true bounding-box mAP50/mAP50-95, provide a trained YOLO ONNX model and matching detection annotations.

## Important distinction
A historical marker is a documented reference, not proof that an object is currently on the seafloor. An AI detection is only created from an uploaded/processed sonar frame. This prevents demo data from being confused with current observations.
