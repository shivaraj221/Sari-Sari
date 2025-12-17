# main/core/models.py - UPDATED
from django.db import models
from django.contrib.auth.models import User

class Feedback(models.Model):
    SENTIMENT_CHOICES = [
        ('POSITIVE', 'Positive'),
        ('NEGATIVE', 'Negative'),
        ('NEUTRAL', 'Neutral'),
        ('PENDING', 'Pending Analysis'),
        ('ERROR', 'Analysis Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    message = models.TextField()
    
    # NEW SENTIMENT FIELDS (will be visible in admin)
    sentiment = models.CharField(
        max_length=10,
        choices=SENTIMENT_CHOICES,
        default='PENDING'
    )
    confidence = models.FloatField(default=0.0)
    reasoning = models.TextField(blank=True, null=True)
    analyzed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        # Show sentiment in admin display
        return f"{self.user.username} - {self.sentiment} - {self.message[:50]}"