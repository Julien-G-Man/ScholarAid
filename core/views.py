from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from django.views import generic
from django.contrib import messages
from .models import NewsletterSubscription
from .models import Scholarships

# Create your views here.   
def home(request):
   featured_scholarships = Scholarships.objects.order_by('-created_at')[:3]
   context = {
      'featured_scholarships': featured_scholarships
   }
   return render(request, 'core/home.html', context)

# Using Generic
"""
class home(generic.ListView):
   template_name = 'core/home.html'
   
   def get_queryset(self):
      return Scholarships.objects.all()
      
"""
# here we use class instead of function
# remove comments and replace the home function
# you'll need to exchange the "featured_scholarships" in home.html, 
# and "all_scholarships" inn scholarships.html with object_list

def scholarships(request):
   all_scholarships = Scholarships.objects.all()
   context = {
      'all_scholarships': all_scholarships
   }
   return render(request, 'core/scholarships.html', context)

def scholarship_detail(request):
   return render(request, 'scholarships.html')

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