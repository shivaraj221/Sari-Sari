# main/core/views.py - CLEANED UP VERSION
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework import status

from .models import Feedback
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    FeedbackSerializer
)
from .tasks import analyze_sentiment_background

# ✅ REGISTER
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ LOGIN
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if not user:
                return Response({"error": "Invalid credentials"}, status=401)

            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username
            })
        return Response(serializer.errors, status=400)

# ✅ FEEDBACK - UPDATED TO TRIGGER LANGGRAPH ANALYSIS
class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            # Create feedback (sentiment defaults to 'PENDING')
            feedback = serializer.save(user=request.user)
            
            # 🔥 Start LangGraph sentiment analysis in background
            analyze_sentiment_background(feedback.id)
            
            # Return normal response (frontend sees no changes)
            return Response(
                FeedbackSerializer(feedback).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=400)

    def get(self, request):
        # Return normal feedback list (no sentiment data)
        feedbacks = Feedback.objects.filter(user=request.user)
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data)