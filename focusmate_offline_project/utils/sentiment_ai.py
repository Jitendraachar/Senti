# utils/sentiment_ai.py
"""
AI Sentiment Analysis Module for FocusMate
-----------------------------------------
Performs sentiment classification using Hugging Face Transformers.
Falls back to simple keyword-based sentiment if model unavailable.
"""

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lightweight fallback sentiment analyzer
def simple_sentiment(text: str):
    """
    Rule-based sentiment analysis (fallback).
    Returns (label, score) as tuple.
    """
    text_lower = text.lower()
    positives = ["good", "happy", "great", "calm", "okay", "fine", "focused", "relaxed", "motivated"]
    negatives = ["sad", "anxious", "stressed", "overwhelmed", "bad", "angry", "tired", "panic", "depressed"]

    score = 0
    for p in positives:
        if p in text_lower:
            score += 1
    for n in negatives:
        if n in text_lower:
            score -= 1

    if score > 0:
        return "positive", min(score / 5.0, 1.0)
    elif score < 0:
        return "negative", min(abs(score) / 5.0, 1.0)
    else:
        return "neutral", 0.0


# Attempt to load Hugging Face sentiment model
try:
    from transformers import pipeline

    logger.info("Loading Hugging Face sentiment model...")
    sentiment_pipe = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

    def analyze_sentiment(text: str):
        """
        Use Hugging Face model for sentiment analysis.
        Returns (label, score)
        """
        try:
            result = sentiment_pipe(text[:512])[0]  # Limit to 512 tokens
            label = result["label"].lower()
            score = float(result["score"])
            logger.info(f"AI Sentiment: {label} ({score:.2f})")
            return label, score
        except Exception as e:
            logger.warning(f"Error during Hugging Face inference: {e}")
            return simple_sentiment(text)

except Exception as e:
    logger.warning(f"Hugging Face pipeline unavailable: {e}")
    def analyze_sentiment(text: str):
        """
        Fallback to rule-based sentiment when Transformers unavailable.
        """
        return simple_sentiment(text)
