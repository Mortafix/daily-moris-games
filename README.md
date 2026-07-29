# Moris Games

Una raccolta di giochi da browser: sfide daily in singolo e party game da fare in compagnia.

## Daily games

- **Angly**: indovina i gradi dell'angolo del giorno.
- **Colory**: ricrea il colore del giorno usando i valori RGB.
- **Timely**: ordina cinque eventi accaduti oggi nella storia dal più antico al più recente.
- **Movly**: indovina il film del giorno tramite livelli progressivi di emoji.
- **Quizly**: rispondi a domande trivia giornaliere a risposta multipla.

Angly, Colory, Timely e Quizly hanno modalità facile e difficile. Movly ha due pool giornalieri, Best e Trending. I progressi sono salvati localmente e le statistiche giornaliere restano sul dispositivo.

## Party games

- **Taboo**: fai indovinare una parola alla tua squadra senza usare quelle vietate. Il gioco vive su [taboo.moris.dev](https://taboo.moris.dev).

## Stack

Il frontend usa HTML, CSS e JavaScript vanilla. Movly e Quizly usano un backend FastAPI con MongoDB per generare e salvare i daily condivisi.

## Struttura

```text
frontend/
  pages/    HTML dei giochi e della home
  scripts/  JavaScript vanilla dei giochi
  styles/   CSS condiviso
  assets/   icone e immagini statiche
backend/
  app/      FastAPI, API Movly e servizi
  tests/    test backend
```

## Avvio locale

Configura le variabili in `.env` o `.env.local`:

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=daily_moris_games
TMDB_BEARER_TOKEN=...
OPENAI_API_KEY=...
OPENAI_EMOJI_MODEL=gpt-4.1-mini
STATIC_ROOT=../frontend
```

Poi avvia il backend:

```bash
python -m venv .venv
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Apri `http://localhost:8000/movly`. Anche gli altri giochi restano disponibili dallo stesso host con URL puliti: `/angly`, `/colory`, `/timely`, `/movly` e `/quizly`.

Il frontend vive in `frontend/`; se `STATIC_ROOT` non e impostata, FastAPI la risolve automaticamente dalla root del repo. Il vecchio `STATIC_ROOT=..` resta compatibile.

## Reset daily backend

Movly e Quizly salvano il daily condiviso in MongoDB. Per cancellare i puzzle generati della giornata e permettere al backend di rigenerarli alla prossima apertura:

```bash
python -m backend.app.admin reset-daily
```

Puoi limitare il reset a una data, gioco, pool o modalità:

```bash
python -m backend.app.admin reset-daily --date 2026-06-26 --game movly --pool best
python -m backend.app.admin reset-daily --game quizly --mode hard
python -m backend.app.admin reset-daily --dry-run
```

Il reset backend rimuove solo i puzzle condivisi salvati in MongoDB. I progressi e le statistiche del browser restano locali: Quizly interroga comunque il backend a ogni apertura e riparte pulito quando il puzzle rigenerato cambia versione, data, modalita, lingua o domande. Per cancellare manualmente anche il progresso locale di Quizly, rimuovi le chiavi `localStorage` con prefisso `quizly-daily:v2`.

## API Movly

- `GET /api/health`
- `GET /api/movly/daily?pool=best|trending&lang=it|en`
- `GET /api/movly/search?q=titanic&lang=it`
- `POST /api/movly/guess`

## API Quizly

- `GET /api/quizly/daily?mode=easy|hard&lang=it|en`
