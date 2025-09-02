from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def base(request):
   return render(request, 'base.html')

def home(request):
#   return HttpResponse("<h1>Hello World. <br>How are you doing?</h1>")
   return render(request, 'core/home.html')

def scholarships(request):
   return render(request, 'core/scholarships.html')

def about(request):
   return render(request, 'core/about.html')

def contact(request): 
   return render(request, 'core/contact.html')


