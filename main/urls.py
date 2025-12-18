from django.contrib import admin
from django.urls import path   # ✅ THIS WAS MISSING

from core.views import (
    index,
    login_page,
    register_page,
    RegisterView,
    LoginView,
    FeedbackView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Frontend pages
    path("", index, name="index"),
    path("login/", login_page, name="login"),
    path("register/", register_page, name="register"),

    # API endpoints
    path("api/register/", RegisterView.as_view()),
    path("api/login/", LoginView.as_view()),
    path("api/feedback/", FeedbackView.as_view()),
]
