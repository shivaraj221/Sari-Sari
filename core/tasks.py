# main/core/tasks.py - UPDATED
import threading
from .models import Feedback
from .utils import analyze_feedback_sentiment
from django.utils import timezone

def analyze_sentiment_background(feedback_id: int):
    """
    Run sentiment analysis in background thread
    """
    def task():
        print(f"🔍 Starting LangGraph sentiment analysis for feedback {feedback_id}")
        
        try:
            feedback = Feedback.objects.get(id=feedback_id)
            print(f"📝 Feedback text preview: '{feedback.message[:100]}...'")
            
            # Call LangGraph analysis function
            result = analyze_feedback_sentiment(feedback.message)
            
            print(f"📊 Analysis result: {result['sentiment']} (Confidence: {result['confidence']:.2f})")
            
            # Update feedback with results
            feedback.sentiment = result['sentiment']
            feedback.confidence = result['confidence']
            feedback.reasoning = result['reasoning']
            feedback.analyzed_at = timezone.now()
            feedback.save()
            
            print(f"✅ Successfully saved sentiment for feedback {feedback_id}")
            
        except Feedback.DoesNotExist:
            print(f"⚠️ Feedback {feedback_id} not found in database")
        except Exception as e:
            print(f"❌ Error analyzing feedback {feedback_id}: {str(e)}")
            # Mark as error
            try:
                feedback.sentiment = 'ERROR'
                feedback.reasoning = f"Analysis failed: {str(e)[:200]}"
                feedback.save()
            except:
                print(f"❌ Could not update feedback {feedback_id} with error status")
    
    # Start background thread
    thread = threading.Thread(target=task)
    thread.daemon = True  # Thread will exit when main program exits
    thread.start()