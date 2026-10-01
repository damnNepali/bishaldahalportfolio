from django.urls import path

from . import views
from .feeds import LatestPostsFeed

app_name = "blog"
urlpatterns = [
    path("", views.post_list, name="list"),
    path("feed/", LatestPostsFeed(), name="feed"),
    path("tag/<slug:tag>/", views.post_list, name="tag"),
    path("<slug:slug>/", views.post_detail, name="detail"),
]
