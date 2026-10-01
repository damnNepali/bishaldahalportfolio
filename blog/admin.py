from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Post, PostImage, Tag


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 1
    fields = ("image", "caption", "snippet")
    readonly_fields = ("snippet",)

    @admin.display(description="Paste this into the body")
    def snippet(self, obj):
        if not obj.pk or not obj.image:
            return "Save the post to get the snippet"
        return format_html('<code style="user-select:all">{}</code>', obj.markdown)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "status_badge", "published_at", "reading_minutes", "featured")
    list_filter = ("status", "featured", "tags")
    search_fields = ("title", "excerpt", "body")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("tags",)
    date_hierarchy = "published_at"
    inlines = [PostImageInline]
    actions = ["publish_now", "move_to_draft"]
    fieldsets = (
        (None, {"fields": ("title", "slug", "excerpt", "cover", "body")}),
        ("Publishing", {"fields": ("status", "published_at", "featured", "tags")}),
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        if obj.status == Post.DRAFT:
            return format_html('<b style="color:#888">Draft</b>')
        if obj.published_at > timezone.now():
            return format_html('<b style="color:#bf6a02">Scheduled</b>')
        return format_html('<b style="color:#0071e3">Live</b>')

    @admin.action(description="Publish now")
    def publish_now(self, request, queryset):
        for p in queryset:
            p.status, p.published_at = Post.PUBLISHED, min(p.published_at, timezone.now())
            p.save()

    @admin.action(description="Move to draft")
    def move_to_draft(self, request, queryset):
        queryset.update(status=Post.DRAFT)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
