import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from flask import Flask, jsonify, request
from flask_cors import CORS
from video_scrapper import get_video
from LLM import get_movie_details
from recommender import MOVIES, recommend_movies, search_movies, recommend_from_queries

app = Flask(__name__)
CORS(app, origins=os.environ.get('CLIENT_ORIGIN', 'http://localhost:3000').split(','))

TRAILERS_ENABLED = os.environ.get('ENABLE_TRAILERS', 'false').lower() == 'true'


def page(movie_ids, offset=0, limit=14):
    """Slice of the given ids as the {movie_id: movie} object the client expects."""
    return {movie_id: MOVIES[movie_id] for movie_id in movie_ids[offset:offset + limit]}


def filter_movies_by_genre(genres, offset=0, limit=14):
    return page(recommend_movies(genres), offset, limit)


def paging_args():
    offset = max(int(request.args.get('offset', 0)), 0)
    limit = min(max(int(request.args.get('limit', 14)), 1), 100)
    return offset, limit


@app.route('/')
def yes():
    return "server is running"

@app.route('/stats')
def stats():
    return jsonify(MOVIES)

@app.route('/filter', methods=['POST'])
def filter_movies():
    data = request.get_json(silent=True) or {}
    genres = data.get('genre', [])
    offset, limit = paging_args()

    return jsonify(filter_movies_by_genre(genres, offset, limit))

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '').strip()
    offset, limit = paging_args()

    if not query:
        return jsonify({})

    return jsonify(page(search_movies(query), offset, limit))

@app.route('/history-recommendations', methods=['POST'])
def history_recommendations():
    data = request.get_json(silent=True) or {}
    queries = [q for q in data.get('queries', []) if isinstance(q, str) and q.strip()]
    limit = min(int(data.get('limit', 14)), 50)

    if not queries:
        return jsonify({})

    return jsonify(page(recommend_from_queries(queries, limit), 0, limit))

@app.route('/movie/<movie_id>', methods=['GET'])
def get_movie(movie_id):
    if movie_id not in MOVIES:
        return jsonify({"error": "Movie not found"}), 404

    movie = dict(MOVIES[movie_id])
    movie['video_link'] = None
    if TRAILERS_ENABLED:
        try:
            movie['video_link'] = get_video(str(movie['imdbId']))
        except Exception as e:
            print(f"Error getting video for {movie_id}: {e!r}")
    return jsonify(movie)

@app.route('/movie_details/<movie_id>',methods=['GET'])
def movie_details(movie_id):
    details, status = get_movie_details(movie_id)
    return jsonify(details), status

@app.route('/movie-recommendations/<movie_id>')
def get_movie_recommendations(movie_id):
    current_movie = MOVIES.get(movie_id)
    if not current_movie:
        return jsonify({"error": "Movie not found"}), 404

    # Same genre-based ranking as the main page, minus the movie itself
    ranked = [m for m in recommend_movies(current_movie.get('genres', [])) if m != movie_id]
    return jsonify(page(ranked, 0, 7))

if __name__ == '__main__':
    app.run(port=int(os.environ.get('AI_PORT', 3001)))
