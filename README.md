# MovieConx
- MovieConx is a full-stack movie recommender built on the MERN stack (React client, Express + MongoDB server) and a Flask service that serves recommendations from sentence embeddings of the MovieLens 32M catalogue.
- The main page recommends movies that match the genres the user picked, plus a "Based on your recent searches" row built from their last few searches.
- Search embeds the query with `all-MiniLM-L6-v2` and ranks movies by cosine similarity against title embeddings (boosted by word overlap with the title) and combined title/genre/year embeddings.

## How recommendations work
| Where | What it does |
| --- | --- |
| Genre picks | Each movie has a one-hot genre vector. Movies are ranked by cosine similarity to the user's chosen genres; ties keep popularity order. |
| Recent searches | The user's last 5 searches are embedded and averaged; the movies closest to that average are shown. Search history is stored per user in MongoDB (last 20 queries). |
| Movie page | Other movies with the most similar genres. |

There is no collaborative filtering (no user-to-user similarity); recommendations come from the movie embeddings and each user's own genres and searches.

## Project layout
```
src/, public/    React client (Create React App)
backend/         Express API: signup/login (bcrypt + JWT), preferences, settings, search history
AI/              Flask recommender: search, genre recommendations, movie details
  movies.json          preprocessed MovieLens 32M catalogue
  build_embeddings.py  generates AI/embeddings.npz from movies.json
merge_stats.csv  raw per-movie stats the catalogue was built from
```

## Running locally
Requires Node 18+, Python 3.10+ and a MongoDB database (Atlas or local).

**1. Flask recommender (port 3001)**
```bash
pip install -r AI/requirements.txt
python AI/build_embeddings.py   # one-time, a few minutes on CPU; writes AI/embeddings.npz
cp AI/.env.example AI/.env      # optional: add GEMINI_API_KEY for movie descriptions/cast
python AI/app.py
```

**2. Express API (port 5000)**
```bash
cd backend
npm install
cp .env.example .env            # set MONGO_URI and JWT_SECRET
npm start
```

**3. React client (port 3000)**
```bash
npm install
cp .env.example .env            # only needed if the API/AI URLs differ from the defaults
npm start
```

## Configuration
All settings come from environment variables; nothing secret is committed. Each part has a `.env.example`.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `MONGO_URI` | backend | MongoDB connection string (required) |
| `JWT_SECRET` | backend | Secret used to sign login tokens (required) |
| `JWT_EXPIRES_IN` | backend | Token lifetime, default `7d` |
| `CLIENT_ORIGIN` | backend, AI | Allowed CORS origin(s), default `http://localhost:3000` |
| `AI_SERVICE_URL` | backend | Flask service URL, default `http://localhost:3001` |
| `GEMINI_API_KEY` | AI | Enables the description/directors/cast section on movie pages (optional) |
| `GEMINI_MODEL` | AI | Gemini model, default `gemini-2.5-flash` |
| `ENABLE_TRAILERS` | AI | Scrape IMDb trailers with headless Chrome, default `false` (the scraper's selectors no longer match IMDb) |
| `CHROMEDRIVER_PATH` | AI | Optional ChromeDriver override; Selenium finds one by default |
| `REACT_APP_API_URL` | client | Express API URL, default `http://localhost:5000` |
| `REACT_APP_AI_URL` | client | Flask service URL, default `http://localhost:3001` |

## Security
- Passwords are hashed with bcrypt. Accounts created before hashing was added are re-hashed on their next login.
- Login returns a JWT. Every user route (`/preferences`, `/settings`, `/search-history`) identifies the user from the token, never from the URL, so a user can only read or change their own account. Deleting an account also requires the password.

## Technologies used

### **MongoDb Atlas**
MongoDb is a NoSQL database for storing data in a flexible JSON-like format.
- **Role in this project**: Stores user data: username, email, password hash, preferred genres and search history.

### **Express.js**
Express.js is a web application framework for Node.js used for building the API and routing of the web server.
- **Role in this project**: Backend API server for authentication, preferences, settings and search history.

### **React**
React is a JS library for building user interfaces of web applications.
- **Role in this project**: The web client.

### **Node.js**
Node.js provides a JavaScript runtime environment on the server side outside a web browser.
- **Role in this project**: Server side runtime for Express.js

### **Python Flask**
Flask is a lightweight Python web framework.
- **Role in this project**: Hosts the recommender.
- Loads the movie catalogue and precomputed embeddings once at startup and serves search, genre-based and search-history-based recommendations.
- Gets details of a specific movie from `movies.json`, and optionally a description and cast from Gemini.

## Dataset Used
- The dataset is MovieLens 32M, preprocessed into `AI/movies.json` (title, genres, year, rating count, average rating, IMDb/TMDB ids and poster URL for each movie).
