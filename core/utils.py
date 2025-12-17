# main/core/utils.py - WORKING VERSION
import os
import json
import re
from typing import TypedDict
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

class SentimentState(TypedDict):
    feedback_text: str
    sentiment: str
    confidence: float
    reasoning: str

def analyze_feedback_sentiment(feedback_text: str) -> dict:
    """
    Analyze sentiment using LangGraph workflow with OpenRouter
    """
    try:
        # Import here to avoid circular imports
        from openai import OpenAI
        
        # Initialize OpenRouter client
        client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )
        
        # Define LangGraph nodes
        def extract_feedback(state: SentimentState):
            """Node 1: Prepare feedback for analysis"""
            return {"feedback_text": state["feedback_text"]}
        
        def analyze_with_openrouter(state: SentimentState):
            """Node 2: Call OpenRouter API for sentiment analysis"""
            prompt = f"""
            Analyze the sentiment of this feedback text.
            
            Return ONLY a valid JSON object with this EXACT structure:
            {{
                "sentiment": "POSITIVE", "NEGATIVE", or "NEUTRAL",
                "confidence": a number between 0.0 and 1.0,
                "reasoning": "brief explanation in one sentence"
            }}
            
            Feedback text: "{state['feedback_text']}"
            
            IMPORTANT: Return ONLY the JSON object, nothing else.
            """
            
            response = client.chat.completions.create(
                model="qwen/qwen-2.5-vl-7b-instruct:free",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=200
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            try:
                result = json.loads(content)
                
                # Validate required fields
                required = ["sentiment", "confidence", "reasoning"]
                if not all(k in result for k in required):
                    raise ValueError("Missing required JSON fields")
                
                # Validate sentiment value
                sentiment = str(result["sentiment"]).upper()
                if sentiment not in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
                    sentiment = "NEUTRAL"
                
                # Ensure confidence is valid float
                confidence = float(result.get("confidence", 0.5))
                confidence = max(0.0, min(1.0, confidence))  # Clamp between 0-1
                
                reasoning = str(result.get("reasoning", "No reasoning provided"))
                
                return {
                    "sentiment": sentiment,
                    "confidence": confidence,
                    "reasoning": reasoning[:500]  # Limit length
                }
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"JSON parse error: {e}")
                return fallback_sentiment_analysis(state["feedback_text"])
        
        def finalize_results(state: SentimentState):
            """Node 3: Finalize and return results"""
            return {
                "sentiment": state["sentiment"],
                "confidence": state["confidence"],
                "reasoning": state["reasoning"]
            }
        
        # Build LangGraph workflow
        workflow = StateGraph(SentimentState)
        
        # Add nodes
        workflow.add_node("extract", extract_feedback)
        workflow.add_node("analyze", analyze_with_openrouter)
        workflow.add_node("finalize", finalize_results)
        
        # Define workflow edges
        workflow.set_entry_point("extract")
        workflow.add_edge("extract", "analyze")
        workflow.add_edge("analyze", "finalize")
        workflow.add_edge("finalize", END)
        
        # Compile and run the graph
        app = workflow.compile()
        initial_state = {"feedback_text": feedback_text}
        result = app.invoke(initial_state)
        
        print(f"✅ LangGraph analysis complete: {result['sentiment']} ({result['confidence']:.2f})")
        return result
        
    except Exception as e:
        print(f"❌ LangGraph analysis failed: {e}")
        return fallback_sentiment_analysis(feedback_text)

def fallback_sentiment_analysis(text: str) -> dict:
    """
    Simple keyword-based fallback when API fails
    """
    text_lower = text.lower()
    
    positive_words = [
        'good', 'great', 'excellent', 'awesome', 'amazing', 'fantastic',
        'love', 'like', 'nice', 'helpful', 'useful', 'perfect', 'best',
        'recommend', 'enjoy', 'happy', 'satisfied', 'works', 'easy'
    ]
    
    negative_words = [
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
        'dislike', 'poor', 'useless', 'broken', 'crash', 'bug',
        'problem', 'issue', 'error', 'fail', 'slow', 'difficult',
        'confusing', 'disappointed'
    ]
    
    pos_count = sum(1 for word in positive_words if word in text_lower)
    neg_count = sum(1 for word in negative_words if word in text_lower)
    
    if pos_count > neg_count:
        sentiment = "POSITIVE"
        confidence = min(0.7 + (pos_count * 0.05), 0.95)
    elif neg_count > pos_count:
        sentiment = "NEGATIVE"
        confidence = min(0.7 + (neg_count * 0.05), 0.95)
    else:
        sentiment = "NEUTRAL"
        confidence = 0.5
    
    reasoning_map = {
        "POSITIVE": "Positive keywords detected in feedback",
        "NEGATIVE": "Negative keywords detected in feedback",
        "NEUTRAL": "Mixed or neutral sentiment based on keywords"
    }
    
    return {
        "sentiment": sentiment,
        "confidence": confidence,
        "reasoning": reasoning_map.get(sentiment, "Keyword-based analysis")
    }