"""Build the search indexes in AI/ from AI/movies.json.

Run once after cloning (takes a few minutes on CPU):

    python AI/build_embeddings.py

Writes:
    title.faiss     FAISS index of title embeddings
    combined.faiss  FAISS index of combined title/genres/year embeddings
    embeddings.npz  movie ids (row order of both indexes) and one-hot genre vectors

Embeddings are all-MiniLM-L6-v2 and unit length, so the indexes' inner
product is cosine similarity.
"""
import json
import os

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIES_PATH = os.path.join(BASE_DIR, 'movies.json')
EMBEDDINGS_PATH = os.path.join(BASE_DIR, 'embeddings.npz')
TITLE_INDEX_PATH = os.path.join(BASE_DIR, 'title.faiss')
COMBINED_INDEX_PATH = os.path.join(BASE_DIR, 'combined.faiss')
MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'

# Kept in sync with recommender.py (imported there would load the model twice)
genres_list = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western']


def main():
    with open(MOVIES_PATH, encoding='utf-8') as f:
        movies = json.load(f)

    movie_ids = [movie_id for movie_id, movie in movies.items() if movie and movie.get('title')]
    print(f"Embedding {len(movie_ids)} movies (skipped {len(movies) - len(movie_ids)} without a title)")

    titles = [movies[m]['title'].lower() for m in movie_ids]
    combined = [
        f"{movies[m]['title'].lower()} {' '.join(movies[m].get('genres', [])).lower()} {movies[m].get('year', '')}"
        for m in movie_ids
    ]
    genres = np.array(
        [[1 if g in movies[m].get('genres', []) else 0 for g in genres_list] for m in movie_ids],
        dtype=np.int8,
    )

    model = SentenceTransformer(MODEL_NAME)
    encode = lambda texts: model.encode(
        texts, batch_size=256, show_progress_bar=True, normalize_embeddings=True
    ).astype(np.float32)

    for path, texts in ((TITLE_INDEX_PATH, titles), (COMBINED_INDEX_PATH, combined)):
        vectors = encode(texts)
        # Exact inner-product index; row i is movie_ids[i]
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        faiss.write_index(index, path)
        print(f"Wrote {path} ({index.ntotal} vectors)")

    np.savez(EMBEDDINGS_PATH, movie_ids=np.array(movie_ids), genres=genres)
    print(f"Wrote {EMBEDDINGS_PATH}")


if __name__ == '__main__':
    main()
