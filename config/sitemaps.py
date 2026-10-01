from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from blog.models import Post


class StaticSitemap(Sitemap):
    priority = 1.0

    def items(self):
        return ["tour", "home", "blog:list"]

    def location(self, item):
        return reverse(item)


class PostSitemap(Sitemap):
    changefreq = "monthly"

    def items(self):
        return Post.published.all()

    def lastmod(self, obj):
        return obj.updated_at
