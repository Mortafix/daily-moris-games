# Daily Moris Games

Una piccola raccolta di giochi daily da browser, pensata per partite veloci una volta al giorno.

## Giochi

- **Angly**: indovina i gradi dell'angolo del giorno.
- **Colory**: ricrea il colore del giorno usando i valori RGB.
- **Timely**: ordina cinque eventi accaduti oggi nella storia dal più antico al più recente.
- **Movly**: indovina il film del giorno tramite livelli progressivi di emoji.

Angly, Colory e Timely hanno modalità facile e difficile. Movly ha due pool giornalieri, Best e Trending. I progressi sono salvati localmente e le statistiche giornaliere restano sul dispositivo.

## Stack

Il frontend usa HTML, CSS e JavaScript vanilla. Movly usa un backend FastAPI con MongoDB per generare e salvare i film daily condivisi.

## Avvio locale

Configura le variabili in `.env` o `.env.local`:

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=daily_moris_games
TMDB_BEARER_TOKEN=...
OPENAI_API_KEY=...
OPENAI_EMOJI_MODEL=gpt-4.1-mini
STATIC_ROOT=..
```

Poi avvia il backend:

```bash
python -m venv .venv
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Apri `http://localhost:8000/movly.html`. Anche gli altri giochi restano disponibili dallo stesso host.

## API Movly

- `GET /api/health`
- `GET /api/movly/daily?pool=best|trending&lang=it|en`
- `GET /api/movly/search?q=titanic&lang=it`
- `POST /api/movly/guess`
