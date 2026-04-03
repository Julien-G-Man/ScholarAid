from django.shortcuts import render

# Create your views here.
def ai_review(request, scholarship_id):
   # Your logic for the AI review page will go here.
   # For now, we can return a simple placeholder to test.

   context = {
        'scholarship_id': scholarship_id
   }
   return render (request, 'ai_review/ai_review.html', context)