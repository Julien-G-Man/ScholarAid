from django.db import models


class Scholarships(models.Model):
    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=100)
    institution = models.CharField(max_length=100, blank=True, null=True)
    level = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    description = models.TextField()
    eligibility = models.TextField(blank=True, null=True)
    essay_prompt = models.TextField(blank=True, null=True)
    deadline = models.DateField(blank=True, null=True)
    link = models.URLField(max_length=300, blank=True, null=True)
    logo_url = models.CharField(max_length=300, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Scholarships'


class NewsletterSubscription(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField(max_length=5000)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} — {self.subject or "(no subject)"}'

    class Meta:
        ordering = ['-created_at']
