from django.core.validators import FileExtensionValidator, MaxValueValidator
from django.db import models
from django.utils.text import slugify

PIECES = [
    ("k", "King"), ("q", "Queen"), ("r", "Rook"),
    ("b", "Bishop"), ("n", "Knight"), ("p", "Pawn"),
]


class Ordered(models.Model):
    order = models.PositiveIntegerField(default=0, help_text="Lower numbers show first.")
    is_active = models.BooleanField(default=True, help_text="Untick to hide from the website.")

    class Meta:
        abstract = True
        ordering = ["order", "id"]


class Profile(models.Model):
    """Single profile record; edit it in the admin."""
    name = models.CharField(max_length=100, default="Bishal Dahal")
    headline = models.CharField(max_length=160, default="Developer. Founder. Strategist.")
    tagline = models.CharField(max_length=160, default="Every move calculated.")
    intro = models.TextField(blank=True, help_text="Short hero paragraph.")
    bio = models.TextField(blank=True, help_text="Longer text for the About card.")
    location = models.CharField(max_length=100, default="Kathmandu, Nepal")
    education = models.CharField(max_length=160, blank=True)
    photo = models.ImageField(upload_to="profile/", blank=True, help_text="Leave empty to use the default photo.")
    resume = models.FileField(upload_to="resume/", blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    linkedin = models.URLField(blank=True)
    github = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    youtube = models.URLField(blank=True)
    manifesto = models.TextField(
        blank=True,
        default="I'm an IT student who writes code, a founder who runs companies and a Lion who serves "
                "the community. I play every one of them like chess — think first, then move.",
        help_text="Big statement that lights up word by word as visitors scroll.")
    avatar_model = models.FileField(
        upload_to="avatar/", blank=True,
        validators=[FileExtensionValidator(["glb"])],
        help_text="Optional .glb 3D model of you for the 3D tour (e.g. from Avaturn + Mixamo). "
                  "Leave empty to use the built-in avatar.")
    tour_music = models.FileField(
        upload_to="audio/", blank=True,
        validators=[FileExtensionValidator(["mp3", "ogg", "m4a"])],
        help_text="Optional background music for the 3D tour (royalty-free!). Leave empty for the built-in tune.")
    pkr_intro = models.TextField("Paisa ko Rahasya intro", blank=True)
    pkr_url = models.URLField("Paisa ko Rahasya link", blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Stat(Ordered):
    """Proof numbers, e.g. 500+ deliveries. Only add numbers you can back up."""
    value = models.PositiveIntegerField()
    suffix = models.CharField(max_length=6, blank=True, help_text="e.g. + or %")
    label = models.CharField(max_length=80)

    class Meta(Ordered.Meta):
        pass

    def __str__(self):
        return f"{self.value}{self.suffix} {self.label}"


class Role(Ordered):
    SIZES = [("sm", "Small"), ("wide", "Wide"), ("tall", "Tall"), ("lg", "Large"), ("full", "Full width")]
    title = models.CharField(max_length=100)
    organization = models.CharField(max_length=120, blank=True)
    description = models.CharField(max_length=220, blank=True)
    piece = models.CharField(max_length=1, choices=PIECES, default="p")
    size = models.CharField(max_length=5, choices=SIZES, default="sm")
    accent = models.BooleanField(default=False, help_text="Highlight in electric blue.")
    link = models.CharField(max_length=200, blank=True, help_text="URL or #section")

    class Meta(Ordered.Meta):
        pass

    def __str__(self):
        return f"{self.title} — {self.organization}" if self.organization else self.title


class Business(Ordered):
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=120)
    category = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="logos/", blank=True)
    website = models.URLField(blank=True)
    piece = models.CharField(max_length=1, choices=PIECES, default="r")

    class Meta(Ordered.Meta):
        verbose_name_plural = "Businesses"

    def __str__(self):
        return self.name

    @property
    def initials(self):
        return "".join(w[0] for w in self.name.split()[:2]).upper()


class Skill(Ordered):
    CATEGORIES = [("frontend", "Frontend"), ("backend", "Backend"), ("data", "Data"), ("tools", "Tools")]
    name = models.CharField(max_length=60)
    category = models.CharField(max_length=10, choices=CATEGORIES)

    class Meta:
        ordering = ["category", "order", "id"]

    def __str__(self):
        return self.name


class Project(Ordered):
    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True, blank=True)
    summary = models.TextField()
    image = models.ImageField(upload_to="projects/", blank=True)
    tech = models.CharField(max_length=200, blank=True, help_text="Comma separated, e.g. Django, Python, SQLite")
    live_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    featured = models.BooleanField(default=False)
    piece = models.CharField(max_length=1, choices=PIECES, default="q")

    class Meta(Ordered.Meta):
        pass

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def tech_list(self):
        return [t.strip() for t in self.tech.split(",") if t.strip()]


class Leadership(Ordered):
    organization = models.CharField(max_length=140)
    role = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    start_year = models.PositiveIntegerField(null=True, blank=True)
    end_year = models.PositiveIntegerField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    image = models.ImageField(upload_to="leadership/", blank=True)

    class Meta(Ordered.Meta):
        verbose_name_plural = "Leadership & impact"

    def __str__(self):
        return f"{self.role}, {self.organization}"

    @property
    def period(self):
        if not self.start_year:
            return "Current" if self.is_current else ""
        end = "Present" if self.is_current else (self.end_year or "")
        return f"{self.start_year} – {end}"


class ContentItem(Ordered):
    PLATFORMS = [("youtube", "YouTube"), ("facebook", "Facebook"), ("instagram", "Instagram"),
                 ("tiktok", "TikTok"), ("article", "Article")]
    title = models.CharField(max_length=160)
    platform = models.CharField(max_length=10, choices=PLATFORMS, default="youtube")
    url = models.URLField()
    thumbnail = models.ImageField(upload_to="content/", blank=True)
    published_on = models.DateField(null=True, blank=True)

    class Meta(Ordered.Meta):
        verbose_name = "Paisa ko Rahasya post"
        verbose_name_plural = "Paisa ko Rahasya posts"

    def __str__(self):
        return self.title


class Achievement(Ordered):
    CATEGORIES = [("chess", "Chess"), ("award", "Award"), ("other", "Other")]
    title = models.CharField(max_length=140)
    event = models.CharField(max_length=160, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    category = models.CharField(max_length=6, choices=CATEGORIES, default="award")
    description = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ["order", "-year", "id"]

    def __str__(self):
        return self.title


class Mission(Ordered):
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=60, default="Planning")
    progress = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)], help_text="0–100")
    milestones = models.TextField(blank=True, help_text="One per line. Start a line with [x] to mark it done.")

    class Meta(Ordered.Meta):
        pass

    def __str__(self):
        return self.title

    @property
    def milestone_list(self):
        items = []
        for line in self.milestones.splitlines():
            line = line.strip()
            if not line:
                continue
            done = line.lower().startswith("[x]")
            items.append({"text": line[3:].strip() if done else line, "done": done})
        return items


class ContactMessage(models.Model):
    TOPICS = [("dev", "Web development project"), ("biz", "Business partnership"), ("invest", "Investment"),
              ("community", "Community or speaking"), ("chess", "A game of chess"), ("other", "Something else")]
    name = models.CharField(max_length=100)
    email = models.EmailField()
    topic = models.CharField(max_length=10, choices=TOPICS, default="dev")
    message = models.TextField(max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_topic_display()}"


class Experience(Ordered):
    """Your journey: jobs, businesses, education, leadership. Add new entries as time goes on."""
    KINDS = [("work", "Work"), ("business", "Business"), ("education", "Education"),
             ("leadership", "Leadership"), ("achievement", "Achievement")]
    kind = models.CharField(max_length=12, choices=KINDS, default="work")
    title = models.CharField(max_length=120, help_text="Your role or degree, e.g. Founder & MD, BCA")
    organization = models.CharField(max_length=140)
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True, help_text="Any day in the start month works.")
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False, help_text="Shows 'Present' as the end date.")
    description = models.TextField(blank=True)
    highlights = models.TextField(blank=True, help_text="One achievement per line.")
    logo = models.ImageField(upload_to="experience/", blank=True)
    link = models.URLField(blank=True)
    piece = models.CharField(max_length=1, choices=PIECES, default="p")

    class Meta:
        ordering = ["order", "-is_current", "-start_date", "id"]
        verbose_name = "Experience & education"
        verbose_name_plural = "Experience & education"

    def __str__(self):
        return f"{self.title} — {self.organization}"

    @property
    def period(self):
        if not self.start_date:
            return "Present" if self.is_current else ""
        start = self.start_date.strftime("%b %Y")
        if self.is_current:
            return f"{start} – Present"
        return f"{start} – {self.end_date.strftime('%b %Y')}" if self.end_date else start

    @property
    def highlight_list(self):
        return [h.strip() for h in self.highlights.splitlines() if h.strip()]
