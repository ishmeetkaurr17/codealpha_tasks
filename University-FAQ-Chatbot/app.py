from flask import Flask, render_template, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from langdetect import detect
from deep_translator import GoogleTranslator
from functools import lru_cache
import re
import time

from faq_data import faq_data

app = Flask(__name__)


# Languages supported by the chatbot
LANGUAGE_CODES = {
    "en": "en",
    "hi": "hi",
    "pa": "pa",
    "bn": "bn",
    "gu": "gu",
    "mr": "mr",
    "ta": "ta",
    "te": "te",
    "kn": "kn",
    "ml": "ml",
    "fr": "fr",
    "es": "es",
    "de": "de",
    "it": "it",
    "pt": "pt"
}


def preprocess_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# Get all FAQ questions
questions = [
    preprocess_text(item["question"])
    for item in faq_data
]


# Convert FAQ questions into TF-IDF vectors
vectorizer = TfidfVectorizer()
question_vectors = vectorizer.fit_transform(questions)


def find_answer(user_question):
    """Find the FAQ answer that best matches the user's question."""

    user_question = preprocess_text(user_question)

    user_vector = vectorizer.transform([user_question])

    similarities = cosine_similarity(
        user_vector,
        question_vectors
    )

    best_match = similarities.argmax()
    best_score = similarities[0][best_match]

    print("Match score:", best_score)
    print("Matched FAQ:", faq_data[best_match]["question"])

    # If the question is not similar enough to any FAQ
    if best_score < 0.40:
        return "I'm sorry, I don't have an answer for that question yet."

    return faq_data[best_match]["answer"]


@lru_cache(maxsize=200)
def translate_text(text, source_language, target_language):
    """
    Translate text with caching and retry support.
    """

    if source_language == target_language:
        return text

    for attempt in range(3):

        try:
            translator = GoogleTranslator(
                source=source_language,
                target=target_language
            )

            translated = translator.translate(text)

            if translated:
                return translated

        except Exception as error:
            print(
                f"Translation attempt {attempt + 1} failed:",
                error
            )

            # Wait before trying again
            if attempt < 2:
                time.sleep(2)

    # If translation completely fails,
    # return the original text instead of crashing.
    print("Translation failed after 3 attempts.")

    return text


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():

    data = request.get_json()

    user_question = data.get("question", "").strip()
    selected_language = data.get("language", "auto")

    # Check if the user entered a question
    if not user_question:
        return jsonify({
            "answer": "Please enter a question."
        })

    try:

        # Detect language automatically
        if selected_language == "auto":

            detected_language = detect(user_question)

            target_language = LANGUAGE_CODES.get(
                detected_language,
                "en"
            )

        # Use language selected by user
        else:

            target_language = LANGUAGE_CODES.get(
                selected_language,
                "en"
            )

        print("Target language:", target_language)

        # Translate question into English
        english_question = translate_text(
            user_question,
            target_language,
            "en"
        )

        print("Translated question:", english_question)

        # Find answer using TF-IDF
        answer = find_answer(english_question)

        # Translate answer back to user's language
        final_answer = translate_text(
            answer,
            "en",
            target_language
        )

        return jsonify({
            "answer": final_answer
        })

    except Exception as error:

        print("Error:", error)

        return jsonify({
            "answer": "Sorry, I could not understand the question. Please try again."
        })


if __name__ == "__main__":
    app.run(debug=True)