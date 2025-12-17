# main/core/urls.py - SIMPLIFIED
from django.urls import path
from .views import RegisterView, LoginView, FeedbackView
# Remove SentimentSummaryView and FilterBySentimentView since you don't want frontend

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('feedback/', FeedbackView.as_view()),
    # Remove sentiment endpoints since you only want admin access
]