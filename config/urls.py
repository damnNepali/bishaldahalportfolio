from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap

from .sitemaps import PostSitemap, StaticSitemap
from django.urls import include, path

admin.site.site_header = "Bishal Dahal · Portfolio CMS"
admin.site.site_title = "Portfolio CMS"
admin.site.index_title = "Manage your portfolio"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("blog/", include("blog.urls")),
    path("sitemap.xml", sitemap, {"sitemaps": {"static": StaticSitemap, "posts": PostSitemap}}, name="sitemap"),
    path("", include("portfolio.urls")),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
