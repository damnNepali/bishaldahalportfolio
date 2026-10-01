import logging

from django.middleware.csrf import get_token
from django.templatetags.static import static

from django.conf import settings
from django.contrib import messages
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from .forms import ContactForm
from .models import (Achievement, Business, ContactMessage, ContentItem, Leadership, Mission, Profile, Project,
                     Role, Skill, Stat, Experience)
from blog.models import Post

log = logging.getLogger(__name__)


def home(request):
    grouped = {}
    for key, label in Skill.CATEGORIES:  # keep Frontend → Backend → Data → Tools order
        items = list(Skill.objects.filter(is_active=True, category=key).order_by("order", "id"))
        if items:
            grouped[label] = items
    ctx = {
        "roles": Role.objects.filter(is_active=True),
        "businesses": Business.objects.filter(is_active=True),
        "projects": Project.objects.filter(is_active=True),
        "skill_groups": grouped,
        "leadership": Leadership.objects.filter(is_active=True),
        "content_items": ContentItem.objects.filter(is_active=True)[:6],
        "achievements": Achievement.objects.filter(is_active=True),
        "missions": Mission.objects.filter(is_active=True),
        "stats": Stat.objects.filter(is_active=True),
        "experiences": Experience.objects.filter(is_active=True),
        "experience_kinds": [k for k in Experience.KINDS if Experience.objects.filter(is_active=True, kind=k[0]).exists()],
        "latest_posts": Post.published.prefetch_related("tags")[:3],
        "form": ContactForm(),
    }
    return render(request, "portfolio/home.html", ctx)


def _notify(msg):
    to = settings.CONTACT_NOTIFY_EMAIL
    if not to:
        return
    try:
        send_mail(
            subject=f"New portfolio message: {msg.get_topic_display()} — {msg.name}",
            message=f"{msg.message}\n\nFrom: {msg.name} <{msg.email}>",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to],
        )
    except Exception:  # never block the visitor because email failed
        log.exception("Contact notification failed")


@require_POST
def contact(request):
    form = ContactForm(request.POST)
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"
    if form.is_valid():
        if not form.cleaned_data.get("website"):  # honeypot empty = human
            _notify(form.save())
        text = "Message sent. I'll reply within a few days."
        if is_ajax:
            return JsonResponse({"ok": True, "message": text})
        messages.success(request, text)
    else:
        if is_ajax:
            return JsonResponse({"ok": False, "errors": form.errors}, status=400)
        messages.error(request, "Check the highlighted fields and send again.")
    return redirect(reverse("home") + "#contact")


def _url(f):
    return f.url if f else ""


def tour(request):
    """The 3D guided tour (home page). All content comes from the database."""
    p = Profile.load()
    exps = Experience.objects.filter(is_active=True)
    groups = []
    for key, label in Skill.CATEGORIES:
        names = list(Skill.objects.filter(is_active=True, category=key).values_list("name", flat=True))
        if names:
            groups.append({"group": label, "items": names})
    mission = Mission.objects.filter(is_active=True).first()
    data = {
        "profile": {
            "name": p.name, "headline": p.headline, "tagline": p.tagline, "intro": p.intro, "bio": p.bio,
            "location": p.location, "education": p.education, "email": p.email, "phone": p.phone,
            "photo": p.photo.url if p.photo else static("images/bishal-portrait.jpg"),
            "links": {"linkedin": p.linkedin, "github": p.github, "instagram": p.instagram,
                      "facebook": p.facebook, "youtube": p.youtube},
            "pkr_intro": p.pkr_intro, "pkr_url": p.pkr_url,
        },
        "urls": {
            "classic": reverse("home"), "blog": reverse("blog:list"), "contact": reverse("contact"),
            "avatar": _url(p.avatar_model), "music": _url(p.tour_music),
        },
        "experiences": [{
            "kind": e.kind, "kind_label": e.get_kind_display(), "title": e.title, "org": e.organization,
            "location": e.location, "period": e.period, "description": e.description, "highlights": e.highlight_list,
        } for e in exps],
        "skills": groups,
        "projects": [{"title": x.title, "summary": x.summary, "tech": x.tech_list, "live": x.live_url,
                      "github": x.github_url, "image": _url(x.image)} for x in Project.objects.filter(is_active=True)],
        "businesses": [{"name": b.name, "role": b.role, "category": b.category, "description": b.description,
                        "website": b.website, "logo": _url(b.logo), "initials": b.initials}
                       for b in Business.objects.filter(is_active=True)],
        "achievements": [{"title": a.title, "event": a.event, "year": a.year or "", "category": a.get_category_display(),
                          "description": a.description} for a in Achievement.objects.filter(is_active=True)],
        "leadership": [{"org": l.organization, "role": l.role, "period": l.period, "description": l.description}
                       for l in Leadership.objects.filter(is_active=True)],
        "mission": {"title": mission.title, "description": mission.description, "status": mission.status,
                    "progress": mission.progress, "milestones": mission.milestone_list} if mission else None,
        "stats": [{"value": s.value, "suffix": s.suffix, "label": s.label} for s in Stat.objects.filter(is_active=True)],
        "posts": [{"title": x.title, "url": x.get_absolute_url(), "date": x.published_at.strftime("%b %d, %Y")}
                  for x in Post.published.all()[:3]],
        "topics": ContactMessage.TOPICS,
        "csrf": get_token(request),
    }
    return render(request, "portfolio/tour.html", {"tour_data": data})
