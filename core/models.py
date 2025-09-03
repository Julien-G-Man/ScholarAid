from django.db import models

# Create your models here.
# A model is a class that represents a database table
# Each attribute (field) of the class = a column in the table.
# Each instance (object) of the class = a row in the table.

class Scholarships(models.Model):
   name = models.CharField(max_length=200)
   provider = models.CharField(max_length=100)
   institution = models.CharField(max_length=100, blank=True, null=True)
   level = models.CharField(max_length=100, blank=True, null=True)
   description = models.TextField()
   eligibility = models.TextField(blank=True, null=True)
   essay_prompt = models.TextField(blank=True, null=True)
   deadline = models.DateField(blank=True, null=True)
   link = models.URLField(max_length=300, blank=True, null=True)
   logo_url = models.CharField(max_length=300, blank=True, null=True)
   created_at = models.DateTimeField(auto_now_add=True)
   
   def __str__(self):
      return self.name
   
   class Meta:
      verbose_name_plural = "Scholarships"

# Handles newsletter subscriptions      
class NewsletterSubscription(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email      