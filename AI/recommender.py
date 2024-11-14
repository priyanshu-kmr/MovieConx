"""Movie data, embeddings and the similarity searches served by app.py.

All paths are resolved relative to this file, so the service runs the same
from any working directory and on case-sensitive filesystems.
"""
import json
import os

import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIES_PATH = os.path.join(BASE_DIR, 'movies.json')
EMBEDDINGS_PATH = os.path.join(BASE_DIR, 'embeddings.npz')
MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'

genres_list = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western']

model = SentenceTransformer(MODEL_NAME)


def load_movies():
    with open(MOVIES_PATH, encoding='utf-8') as f:
        return json.load(f)


def encode_genres(genres):
    encoding = [1 if genre in genres else 0 for genre in genres_list]
    return encoding


def combined_text(movie):
    """Text embedded for the combined (title + genres + year) search."""
    genres = ' '.join(movie.get('genres', [])).lower()
    return f"{movie['title'].lower()} {genres} {movie.get('year', '')}"


def normalize(vectors):
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    return vectors / np.where(norms == 0, 1, norms)


def encode_query(text):
    return normalize(model.encode(text.lower()))


def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


MOVIES = load_movies()

if not os.path.exists(EMBEDDINGS_PATH):
    raise SystemExit(
        f"{EMBEDDINGS_PATH} not found. Build it once with: python AI/build_embeddings.py"
    )

with np.load(EMBEDDINGS_PATH) as data:
    MOVIE_IDS = data['movie_ids'].tolist()
    TITLE_VECTORS = data['title']        # unit length
    COMBINED_VECTORS = data['combined']  # unit length
    GENRE_VECTORS = normalize(data['genres'].astype(np.float32))


def recommend_movies(input_genres):
    """All movie ids ordered by cosine similarity to the given genres.

    The sort is stable, so ties keep the popularity order of movies.json.
    """
    input_embedding = normalize(np.array(encode_genres(input_genres), dtype=np.float32))
    similarities = GENRE_VECTORS @ input_embedding
    order = np.argsort(-similarities, kind='stable')
    return [MOVIE_IDS[i] for i in order]


def search_movies(query, similarity_threshold=0.5):
    """Movie ids matching a free-text query, best match first.

    Title matches are boosted by how many query words appear in the title;
    the combined title/genre/year embedding catches the rest.
    """
    query_embedding = encode_query(query)
    query_words = set(query.lower().split())
    scores = {}

    title_similarities = TITLE_VECTORS @ query_embedding
    for i in np.flatnonzero(title_similarities >= similarity_threshold):
        movie_id = MOVIE_IDS[i]
        title_words = set(MOVIES[movie_id]['title'].lower().split())
        word_overlap = len(query_words & title_words) / len(query_words) if query_words else 0
        scores[movie_id] = title_similarities[i] * (1 + word_overlap)

    combined_similarities = COMBINED_VECTORS @ query_embedding
    for i in np.flatnonzero(combined_similarities >= similarity_threshold):
        scores.setdefault(MOVIE_IDS[i], combined_similarities[i])

    return sorted(scores, key=scores.get, reverse=True)


def recommend_from_queries(queries, limit=14):
    """Movie ids closest to the average of several past search queries."""
    query_embeddings = np.stack([encode_query(q) for q in queries])
    profile = normalize(query_embeddings.mean(axis=0))
    similarities = COMBINED_VECTORS @ profile
    top = np.argsort(-similarities)[:limit]
    return [MOVIE_IDS[i] for i in top]
