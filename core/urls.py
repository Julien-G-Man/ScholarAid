from django.urls import path
from core import views

urlpatterns = [
   path('', views.home, name='home'),
   path('home/', views.home, name='home'),
   path('scholarships/', views.scholarships, name='scholarships'),
   path('scholarships/<int:pk>/', views.scholarship_detail, name='scholarship_detail'),
   path('about/', views.about, name='about'),
   path('contact/', views.contact, name='contact'),
   path('subscribe/', views.newsletter_subscribe, name='newsletter_subscribe'),
]