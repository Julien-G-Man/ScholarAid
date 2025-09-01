from django.apps import AppConfig


class coreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cores'

class ai_reviewConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_review'
    
class usersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'     