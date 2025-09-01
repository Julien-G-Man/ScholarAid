from django.db import models

# Create your models here.
# A model is a class that represents a database table
# Each attribute (field) of the class = a column in the table.
# Each instance (object) of the class = a row in the table.

class Scholarships(models.Model):
   title = models.CharField(max_length=200)
   provider = models.CharField(max_length=100)
   description = models.TextField()
   deadline = models.DateField()
   link = models.URLField()
   
   def __str__(self):
      return self.title
   