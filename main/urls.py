from core.views import index, login_page, register_page
from core.views import RegisterView, LoginView, FeedbackView

urlpatterns = [
    path("", index, name="index"),
    path("login/", login_page, name="login"),
    path("register/", register_page, name="register"),

    path("api/register/", RegisterView.as_view()),
    path("api/login/", LoginView.as_view()),
    path("api/feedback/", FeedbackView.as_view()),
]
