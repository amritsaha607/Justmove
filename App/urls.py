from . import views
from django.urls import path

app_name = 'App'

urlpatterns = [
    path('', views.home, name='home'),
]
