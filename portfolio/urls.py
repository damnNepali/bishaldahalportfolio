from django.urls import path

from . import views

urlpatterns = [
    path("", views.tour, name="tour"),
    path("portfolio/", views.home, name="home"),
    path("contact/", views.contact, name="contact"),
]
