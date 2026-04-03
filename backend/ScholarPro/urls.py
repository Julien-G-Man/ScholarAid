from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic.base import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Legacy template-based routes (kept for reference)
    path('', include('core.urls')),
    path('ai/', include('ai_review.urls')),
    path('base/', RedirectView.as_view(url='/', permanent=True)),
    path('home/', RedirectView.as_view(url='/', permanent=True)),

    # REST API v1
    path('api/v1/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
