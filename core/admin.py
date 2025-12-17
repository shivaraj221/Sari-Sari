# main/core/admin.py - UPDATED
from django.contrib import admin
from .models import Feedback

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    # Show sentiment in admin list
    list_display = ('user', 'message_preview', 'sentiment', 'confidence', 'created_at', 'analyzed_at')
    list_filter = ('sentiment', 'created_at', 'user')
    search_fields = ('user__username', 'message')
    readonly_fields = ('created_at', 'analyzed_at')
    
    # Add fields for detailed view
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'message')
        }),
        ('Sentiment Analysis', {
            'fields': ('sentiment', 'confidence', 'reasoning', 'analyzed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    def message_preview(self, obj):
        return obj.message[:100] + "..." if len(obj.message) > 100 else obj.message
    message_preview.short_description = 'Message'