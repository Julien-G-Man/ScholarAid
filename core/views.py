from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from django.contrib import messages
from .models import NewsletterSubscription

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


# Handling newsletter subscriptions
@require_POST
def newsletter_subscribe(request):
    email = request.POST.get('email')
    if email:
        try:
            NewsletterSubscription.objects.create(email=email)
            messages.success(request, 'Thank you for subscribing to our newsletter!')
        except:
            messages.error(request, 'This email is already subscribed.')
    return redirect('home')