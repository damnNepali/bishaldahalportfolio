from django.contrib import admin
from django.utils.html import format_html

from .models import (Achievement, Business, ContactMessage, ContentItem, Leadership,
                     Mission, Profile, Project, Role, Skill, Stat, Experience)


class OrderedAdmin(admin.ModelAdmin):
    list_editable = ("order", "is_active")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Identity", {"fields": ("name", "headline", "tagline", "intro", "manifesto", "bio", "location", "education", "photo", "resume")}),
        ("Contact & social", {"fields": ("email", "phone", "linkedin", "github", "instagram", "facebook", "youtube")}),
        ("Paisa ko Rahasya", {"fields": ("pkr_intro", "pkr_url")}),
        ("3D tour", {"fields": ("avatar_model", "tour_music")}),
    )

    def has_add_permission(self, request):
        return not Profile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Role)
class RoleAdmin(OrderedAdmin):
    list_display = ("title", "organization", "piece", "size", "accent", "order", "is_active")


@admin.register(Business)
class BusinessAdmin(OrderedAdmin):
    list_display = ("name", "role", "category", "website", "order", "is_active")


@admin.register(Skill)
class SkillAdmin(OrderedAdmin):
    list_display = ("name", "category", "order", "is_active")
    list_filter = ("category",)


@admin.register(Project)
class ProjectAdmin(OrderedAdmin):
    list_display = ("title", "featured", "live_url", "github_url", "order", "is_active")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Leadership)
class LeadershipAdmin(OrderedAdmin):
    list_display = ("organization", "role", "is_current", "order", "is_active")


@admin.register(ContentItem)
class ContentItemAdmin(OrderedAdmin):
    list_display = ("title", "platform", "published_on", "order", "is_active")


@admin.register(Achievement)
class AchievementAdmin(OrderedAdmin):
    list_display = ("title", "event", "year", "category", "order", "is_active")
    list_filter = ("category",)


@admin.register(Mission)
class MissionAdmin(OrderedAdmin):
    list_display = ("title", "status", "progress", "order", "is_active")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "topic", "created_at", "read_badge")
    list_filter = ("is_read", "topic")
    search_fields = ("name", "email", "message")
    readonly_fields = ("name", "email", "topic", "message", "created_at")
    actions = ["mark_read"]

    @admin.display(description="Status")
    def read_badge(self, obj):
        return format_html('<b style="color:{}">{}</b>', "#888" if obj.is_read else "#0a84ff",
                           "Read" if obj.is_read else "New")

    @admin.action(description="Mark selected as read")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    def change_view(self, request, object_id, form_url="", extra_context=None):
        ContactMessage.objects.filter(pk=object_id).update(is_read=True)
        return super().change_view(request, object_id, form_url, extra_context)

    def has_add_permission(self, request):
        return False


@admin.register(Stat)
class StatAdmin(OrderedAdmin):
    list_display = ("value", "suffix", "label", "order", "is_active")


@admin.register(Experience)
class ExperienceAdmin(OrderedAdmin):
    list_display = ("title", "organization", "kind", "start_date", "end_date", "is_current", "order", "is_active")
    list_filter = ("kind", "is_current")
    search_fields = ("title", "organization")
    fieldsets = (
        (None, {"fields": ("kind", "title", "organization", "location", "piece")}),
        ("Dates", {"fields": ("start_date", "end_date", "is_current")}),
        ("Details", {"fields": ("description", "highlights", "logo", "link")}),
        ("Display", {"fields": ("order", "is_active")}),
    )
