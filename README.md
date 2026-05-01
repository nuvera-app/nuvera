# Verax

Latin: *truth-teller*

> Less noise. More truth. Free. Open. Forever.

---

## The Problem

Every news app today has the same flaws:

| Problem | Reality |
|---|---|
| **Ads everywhere** | Your attention is the product |
| **Information overload** | 500-word articles for a 2-sentence story |
| **Hidden bias** | Left or right — rarely disclosed |
| **Paywalls** | Important news locked behind subscriptions |
| **Tracking** | Your reading habits sold to advertisers |

People don't need *more* news. They need news that's **clear, honest, and fast**.

---

## The Solution

Verax is an **open-source, ad-free AI news aggregator** that:

- **Summarises every article** into 3 clear sentences using a local AI model
- **Detects political bias** (Left → Right) and explains why
- **Categorises automatically** — Tech, Science, Health, Politics, Business, and more
- **Covers all regions** — Global, India, US, UK with more coming
- **Runs free forever** — local AI (Ollama) means zero API costs
- **Respects your privacy** — no accounts, no tracking, no analytics

---

## How It Works

```
RSS Feeds → Scraper → SQLite → AI (Ollama/Groq) → FastAPI → React Native App
```

1. The scheduler fetches headlines from 10+ RSS sources every 30 minutes
2. For each article, it extracts the full text from the source URL
3. The AI model reads the text and returns: summary, category, bias score, tags, read time
4. The FastAPI backend serves results via cursor-based pagination (no duplicate articles)
5. The React Native app displays cards with lazy loading and pull-to-refresh

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ · FastAPI · SQLAlchemy |
| AI (local) | Ollama · Llama 3.2 — free, runs on your machine |
| AI (cloud) | Groq free tier — switch via one env var |
| Database | SQLite (dev) · PostgreSQL (prod) |
| Mobile | React Native · Expo SDK 54 · TypeScript |
| Navigation | Expo Router v6 (file-based) |
| Data fetching | TanStack React Query · infinite scroll |
| Theming | Light + Dark mode · follows system default · persisted |

---

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

### AI Setup (free — no API key needed)

```bash
# Install Ollama — https://ollama.com
brew install ollama             # Mac

# Pull the model (one-time, ~2 GB)
ollama pull llama3.2

# Ollama runs automatically in the background
# Verax connects to it at http://localhost:11434
```

To use Groq instead (faster, cloud-based free tier), add to `backend/.env`:

```
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
```

### Mobile

```bash
cd mobile
npm install

# Set your machine's local IP in mobile/.env
echo "EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api" > .env

npx expo start --go
# Scan the QR code with Expo Go on your phone
```

---

## Project Structure

```
verax/
├── backend/
│   ├── app/
│   │   ├── api/            FastAPI route handlers
│   │   ├── models/         SQLAlchemy ORM models
│   │   ├── schemas/        Pydantic response schemas
│   │   ├── services/
│   │   │   ├── scraper.py      RSS fetcher + text extractor
│   │   │   ├── summarizer.py   AI summarisation + bias detection
│   │   │   └── scheduler.py    APScheduler background jobs
│   │   ├── config.py       Environment settings
│   │   ├── database.py     SQLAlchemy engine + session
│   │   └── main.py         FastAPI app entry point
│   └── requirements.txt
└── mobile/
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx       News feed screen
    │   │   └── settings.tsx
    │   ├── article/[id].tsx    Article detail screen
    │   └── _layout.tsx         Root layout + providers
    ├── components/ui/          ArticleCard · BiasTag · CategoryPill · Skeleton
    ├── context/                ThemeContext (light/dark/system)
    ├── constants/              theme.ts — colors, fonts, spacing
    ├── hooks/                  useNews — infinite query
    └── lib/                    api.ts — typed API client
```

---

## Configuration

All backend settings are controlled via environment variables (or `backend/.env`):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./verax.db` | Database connection string |
| `AI_PROVIDER` | `ollama` | `ollama` or `groq` |
| `OLLAMA_MODEL` | `llama3.2` | Any model pulled in Ollama |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server address |
| `GROQ_API_KEY` | *(empty)* | Required only when `AI_PROVIDER=groq` |
| `FETCH_INTERVAL_MINUTES` | `30` | How often to pull RSS feeds |
| `SUMMARIZE_INTERVAL_MINUTES` | `2` | How often to process unsummarised articles |
| `ARTICLES_PER_FEED` | `10` | Articles to ingest per RSS source per run |
| `BATCH_SUMMARIZE` | `10` | Articles to summarise per scheduler tick |

---

## License

```
MIT License

Copyright (c) 2025 Verax Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


---

## Contributing

Issues and pull requests welcome at [github.com/verax-app/verax](https://github.com/verax-app/verax).

---

*Built with the belief that truth should be free.*
