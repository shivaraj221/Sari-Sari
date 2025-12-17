# test_langgraph.py
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from core.utils import analyze_feedback_sentiment

print("🧪 Testing LangGraph Sentiment Analysis with OpenRouter...\n")

test_feedbacks = [
    "This app is amazing! Very user-friendly and helpful.",
    "Terrible experience, crashes all the time.",
    "The application works as expected, nothing special.",
    "I love how easy it is to submit feedback!"
]

for i, feedback in enumerate(test_feedbacks, 1):
    print(f"Test {i}: '{feedback[:50]}...'")
    print("─" * 60)
    
    result = analyze_feedback_sentiment(feedback)
    
    print(f"✅ Sentiment: {result['sentiment']}")
    print(f"✅ Confidence: {result['confidence']:.2f}")
    print(f"✅ Reasoning: {result['reasoning']}")
    print()