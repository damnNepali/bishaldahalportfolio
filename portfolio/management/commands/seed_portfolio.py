"""Fill the database with Bishal Dahal's starting content.

    python manage.py seed_portfolio          # add missing content
    python manage.py seed_portfolio --reset  # wipe and re-create (keeps contact messages)
"""
from django.core.management.base import BaseCommand

from portfolio.models import (Achievement, Business, ContentItem, Experience, Leadership, Mission,
                              Profile, Project, Role, Skill)

ROLES = [
    # title, organization, description, piece, size, accent
    ("Full-stack developer", "MERN · Django · PHP", "IT student building web products end to end, from interface to database.", "q", "wide", False),
    ("Founder & MD", "Courier Spot", "International courier and logistics.", "r", "sm", False),
    ("Founder & MD", "Rangichangi Production", "Photography, videography and creative production.", "n", "sm", False),
    ("Chess champion", "Strategy player", "Think first, then move. The board taught me how to run a business.", "n", "tall", False),
    ("Chief Technical Officer", "Tesla Investment", "Technology leadership for an investment venture.", "b", "sm", False),
    ("Former CEO", "MeroParty", "Led an online banquet and event booking platform.", "k", "sm", False),
    ("Founder & President", "Janata Hope Foundation", "A foundation working with and for communities.", "k", "sm", False),
    ("Community leader", "Lions & Leo clubs", "Secretary, Lions Club of Namobuddha City · IPP, Leo Club of Kathmandu Classic Imperial.", "b", "wide", False),
    ("Founder", "Paisa ko Rahasya", "Content on money, business and financial thinking.", "p", "sm", False),
    ("Next move: EV Charging Spot", "Coming next", "Charging infrastructure for Nepal's electric future. Planning is under way.", "p", "full", True),
]

BUSINESSES = [
    ("Courier Spot", "Founder & Managing Director", "Logistics", "International courier and logistics, shipping from Nepal to the world.", "r"),
    ("Rangichangi Production", "Founder & Managing Director", "Media", "Photography, videography and creative production for brands and events.", "n"),
    ("MeroParty", "Former CEO", "Events", "An online platform for booking banquets, venues and events.", "q"),
    ("Tesla Investment", "Chief Technical Officer", "Investment", "Technology leadership for an investment venture.", "b"),
    ("Paisa ko Rahasya", "Founder", "Education", "“The secret of money” — content on money, business and financial thinking.", "p"),
    ("Janata Hope Foundation", "Founder & President", "Nonprofit", "A foundation working with and for communities.", "k"),
]

SKILLS = {
    "frontend": ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS", "Bootstrap"],
    "backend": ["Node.js", "Express", "Python", "Django", "PHP", "Java"],
    "data": ["MongoDB", "MySQL", "PostgreSQL", "SQLite"],
    "tools": ["Git", "REST APIs"],
}

PROJECTS = [
    ("Courier Spot Platform", "Logistics management system for bookings, shipment tracking and operations.", "Django, Python, SQLite", True, "r"),
    ("MeroParty", "Online booking platform for banquets, venues and events.", "", True, "q"),
    ("Shop Credit Manager", "Multi-tenant SaaS for shops to track customer credit and payments.", "Django, PostgreSQL, JavaScript", False, "b"),
    ("This portfolio", "Database-driven portfolio with an auto-playing chessboard and a CMS in Django admin.", "Django, HTML, CSS, JavaScript", False, "n"),
]

LEADERSHIP = [
    ("Janata Hope Foundation", "Founder & President", "Founded and lead a foundation focused on community welfare and social programs."),
    ("Lions Club of Namobuddha City", "Secretary", "Coordinating club administration, service projects and member activities."),
    ("Leo Club of Kathmandu Classic Imperial", "Immediate Past President", "Led the club's youth service programs as President; now guiding the new board."),
]

EXPERIENCES = [
    # kind, title, organization, description, piece, is_current
    ("education", "BCA student", "Bachelor of Computer Applications", "Programming, databases, web development and software engineering.", "p", True),
    ("business", "Founder & Managing Director", "Courier Spot", "Founded and run an international courier and logistics business.", "r", True),
    ("business", "Founder & Managing Director", "Rangichangi Production", "Founded and run a photography, videography and creative production company.", "n", True),
    ("work", "Chief Technical Officer", "Tesla Investment", "Leading technology for an investment venture.", "b", True),
    ("work", "Chief Executive Officer", "MeroParty", "Led an online banquet and event booking platform.", "k", False),
    ("business", "Founder", "Paisa ko Rahasya", "Content on money, business and financial thinking.", "p", True),
    ("leadership", "Founder & President", "Janata Hope Foundation", "Founded and lead a community foundation.", "k", True),
    ("leadership", "Secretary", "Lions Club of Namobuddha City", "", "b", True),
    ("leadership", "Immediate Past President", "Leo Club of Kathmandu Classic Imperial", "", "b", True),
]

MISSION = {
    "title": "EV Charging Spot",
    "description": "Nepal's roads are going electric. The next venture is the infrastructure that keeps them moving — a reliable charging spot for EV drivers.",
    "status": "Planning",
    "progress": 10,
    "milestones": "[x] Idea and market research\nLocation scouting\nEquipment and power partners\nPermits and setup\nLaunch",
}


class Command(BaseCommand):
    help = "Seed the portfolio with starting content."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing content first.")

    def handle(self, *args, **opts):
        models = [Role, Business, Skill, Project, Leadership, Achievement, Mission, ContentItem, Experience]
        if opts["reset"]:
            for m in models:
                m.objects.all().delete()

        p = Profile.load()
        if not p.intro:
            p.name = "Bishal Dahal"
            p.headline = "Developer. Founder. Strategist."
            p.tagline = "Every move calculated."
            p.intro = ("I'm an IT student and full-stack developer who founded and runs Courier Spot and "
                       "Rangichangi Production — and I play business the way I play chess.")
            p.bio = ("From Kathmandu. Studying BCA, building with MERN and Django, leading companies as "
                     "Founder & MD, serving with the Lions and Leos, and planning my next move: an EV charging spot.")
            p.location = "Kathmandu, Nepal"
            p.education = "Bachelor of Computer Applications (BCA)"
            p.pkr_intro = ("Paisa ko Rahasya — “the secret of money” — is where I share what I learn about "
                           "money, business and financial thinking,.")
            p.save()

        if not Role.objects.exists():
            for i, (t, o, d, pc, sz, ac) in enumerate(ROLES):
                Role.objects.create(title=t, organization=o, description=d, piece=pc, size=sz, accent=ac, order=i,
                                    link="#mission" if ac else "")
        if not Business.objects.exists():
            for i, (n, r, c, d, pc) in enumerate(BUSINESSES):
                Business.objects.create(name=n, role=r, category=c, description=d, piece=pc, order=i)
        if not Skill.objects.exists():
            for cat, names in SKILLS.items():
                for i, n in enumerate(names):
                    Skill.objects.create(name=n, category=cat, order=i)
        if not Project.objects.exists():
            for i, (t, s, tech, feat, pc) in enumerate(PROJECTS):
                Project.objects.create(title=t, summary=s, tech=tech, featured=feat, piece=pc, order=i)
        if not Leadership.objects.exists():
            for i, (o, r, d) in enumerate(LEADERSHIP):
                Leadership.objects.create(organization=o, role=r, description=d, order=i)
        if not Achievement.objects.exists():
            Achievement.objects.create(title="Chess Champion", event="",
                                       category="chess", order=0)
        if not Experience.objects.exists():
            for i, (k, t, o, d, pc, cur) in enumerate(EXPERIENCES):
                Experience.objects.create(kind=k, title=t, organization=o, description=d, piece=pc, is_current=cur, order=i)
        if not Mission.objects.exists():
            Mission.objects.create(**MISSION)

        self.stdout.write(self.style.SUCCESS("Portfolio content ready. Edit everything at /admin/."))
