import json
import os
from functools import lru_cache

from google import genai
from google.genai import types

from recommender import MOVIES

# Gemini fills in description/directors/cast on the movie page.
# Without GEMINI_API_KEY the endpoint returns 503 and the page just skips that section.
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


@lru_cache(maxsize=1024)
def _ask_gemini(title):
    prompt = f"""
    Provide the following details for the movie "{title}". The description should not be more than 100 words.
    {{
        "title": "{title}",
        "description": "<desc>",
        "directors": ["<director1>", "<director2>", ..],
        "actors": ["<actor1>", "<actor2>", "<actor3>", ..]
    }}
    """
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type='application/json'),
    )
    return json.loads(response.text)


def get_movie_details(movie_id):
    """Returns (body, http_status)."""
    movie = MOVIES.get(movie_id)
    if not movie:
        return {"error": "Movie not found"}, 404

    if client is None:
        return {"error": "Movie details are disabled: GEMINI_API_KEY is not set"}, 503

    try:
        details = _ask_gemini(movie['title'])
    except json.JSONDecodeError:
        return {"error": "Could not parse response as JSON"}, 502
    except Exception as e:
        print(f"Gemini request failed for {movie_id}: {e!r}")
        return {"error": "Movie details are unavailable"}, 502

    details.setdefault('directors', [])
    details.setdefault('actors', [])
    return details, 200
