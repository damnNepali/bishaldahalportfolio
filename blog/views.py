from django.core.paginator import Paginator
from django.http import Http404
from django.shortcuts import get_object_or_404, render

from .models import Post, Tag


def post_list(request, tag=None):
    posts = Post.published.prefetch_related("tags")
    active_tag = None
    if tag:
        active_tag = get_object_or_404(Tag, slug=tag)
        posts = posts.filter(tags=active_tag)
    q = request.GET.get("q", "").strip()
    if q:
        posts = posts.filter(title__icontains=q) | posts.filter(excerpt__icontains=q)
    page = Paginator(posts.distinct(), 9).get_page(request.GET.get("page"))
    tags = Tag.objects.filter(posts__status=Post.PUBLISHED).distinct()
    return render(request, "blog/list.html", {"page": page, "tags": tags, "active_tag": active_tag, "q": q})


def post_detail(request, slug):
    post = get_object_or_404(Post.objects.prefetch_related("tags"), slug=slug)
    if not post.is_live and not request.user.is_staff:
        raise Http404
    live = Post.published
    newer = live.filter(published_at__gt=post.published_at).order_by("published_at").first()
    older = live.filter(published_at__lt=post.published_at).first()
    related = live.filter(tags__in=post.tags.all()).exclude(pk=post.pk).distinct()[:3]
    return render(request, "blog/detail.html", {"post": post, "newer": newer, "older": older, "related": related})
