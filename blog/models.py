import math

import markdown
import nh3
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

ALLOWED_TAGS = {
    "p", "br", "hr", "h2", "h3", "h4", "strong", "em", "del", "a", "ul", "ol", "li",
    "blockquote", "code", "pre", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
}
ALLOWED_ATTRS = {
    "a": {"href", "title"},
    "img": {"src", "alt", "title", "loading"},
    "code": {"class"},
    "th": {"align"}, "td": {"align"},
}


def render_markdown(text):
    html = markdown.markdown(text or "", extensions=["fenced_code", "tables", "sane_lists"])
    html = html.replace("<img ", '<img loading="lazy" ')
    return nh3.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, link_rel="noopener noreferrer")


class Tag(models.Model):
    name = models.CharField(max_length=40, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status=Post.PUBLISHED, published_at__lte=timezone.now())


class Post(models.Model):
    DRAFT, PUBLISHED = "draft", "published"
    STATUS = [(DRAFT, "Draft"), (PUBLISHED, "Published")]

    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    excerpt = models.CharField(max_length=300, help_text="One or two sentences shown on cards and in Google.")
    cover = models.ImageField(upload_to="blog/covers/", blank=True)
    body = models.TextField(help_text="Write in Markdown: ## Heading, **bold**, *italic*, - lists, [link](url), "
                                      "![image](url). Upload images below and copy their snippet.")
    body_html = models.TextField(editable=False, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts")
    status = models.CharField(max_length=10, choices=STATUS, default=DRAFT)
    featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(default=timezone.now, help_text="Set a future date to schedule the post.")
    updated_at = models.DateTimeField(auto_now=True)
    reading_minutes = models.PositiveIntegerField(default=1, editable=False)

    objects = models.Manager()
    published = PublishedManager()

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:170] or "post"
            slug, n = base, 2
            while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f"{base}-{n}", n + 1
            self.slug = slug
        self.body_html = render_markdown(self.body)
        self.reading_minutes = max(1, math.ceil(len(self.body.split()) / 200))
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("blog:detail", args=[self.slug])

    @property
    def is_live(self):
        return self.status == self.PUBLISHED and self.published_at <= timezone.now()


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="blog/images/")
    caption = models.CharField(max_length=160, blank=True)

    def __str__(self):
        return self.caption or self.image.name

    @property
    def markdown(self):
        return f"![{self.caption}]({self.image.url})" if self.image else ""
