from django.urls import path
from . import views

urlpatterns = [
   # The <> characters define a path converter, capturing an integer and passing it to the view.
   path('ai_review/<int:scholarship_id>', views.ai_review, name="ai_review"),
]