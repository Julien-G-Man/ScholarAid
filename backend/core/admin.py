from django.contrib import admin
from .models import Scholarships

# Register your models here.
@admin.register(Scholarships)
class ScholarshipsAdmin(admin.ModelAdmin):
   list_display = ('name', 'provider', 'deadline', 'created_at')
   list_filter = ('provider', 'deadline')
   search_fields = ('name', 'description')
   ordering = ('-created_at', )