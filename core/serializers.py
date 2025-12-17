# main/core/serializers.py - SIMPLIFIED
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Feedback

# ✅ REGISTER
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

# ✅ LOGIN
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

# ✅ FEEDBACK - Only basic fields for frontend
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']