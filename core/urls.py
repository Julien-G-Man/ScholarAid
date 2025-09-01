from django.urls import path
from core import views

urlpatterns = [
   path('', views.home, name='home'),
   path('scholarships/', views.scholarships, name='scholarships.html'),
   path('about/', views.about, name='about.html'),
   path('contact/', views.contact, name='contact.html'),
]