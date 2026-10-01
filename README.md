# Bishal Dahal — Portfolio (Django)

**Home page (`/`) is a 3D guided tour.** A 3D Bishal welcomes visitors on a giant chessboard and walks them
through Education, Technology, Businesses, Strategy, Service, Journey, the EV mission and Contact — with a
funny scene, sound effects and music at each stop. The classic page is at `/portfolio/`, the blog at `/blog/`.

A database-driven portfolio: an auto-playing chessboard hero (Morphy's Opera Game), a roles bento grid,
businesses, projects, tech stack, leadership & impact, Paisa ko Rahasya, achievements, the EV charging
mission and a contact form that saves messages to the database.

Everything on the page is editable from **Django admin** — no HTML changes needed.

## Design & animation

Light, Apple-inspired UI with gold chess pieces and an EV-blue accent. Animations use
**GSAP + ScrollTrigger** and **Lenis** smooth scrolling, all self-hosted in `static/vendor/`
(no CDN needed, fast on slow connections):

- Hero: letters rise into place, the chessboard card floats in and tilts with the mouse, gold pieces drift.
- About statement lights up word by word as you scroll.
- Section titles rise out of a mask; cards reveal with a soft scale.
- Businesses stack on top of each other like Apple product cards.
- Projects scroll sideways on desktop (pinned) and swipe on mobile.
- The event photo expands from a rounded card to full screen.
- The EV ring charges to your real progress value.
- 3D tilt + spotlight on cards, magnetic buttons, sliding nav pill, hide-on-scroll nav.

Visitors with "reduce motion" turned on get a calm, static version automatically.

## The 3D tour

- **Content** comes from the same admin data (experience, skills, projects, businesses, leadership, mission, posts),
  so updating admin updates the tour too.
- **Your own 3D model:** make a .glb from your photos (e.g. Avaturn), add Mixamo animations named Idle / Walk /
  Wave / Dance, then upload it in *Admin → Profile → 3D tour → Avatar model*. Leave it empty to use the built-in
  stylised avatar (black blazer, white tee, beard, clear-frame sunglasses).
- **Music:** the playful tune and all sound effects are generated in the browser (no copyright issues).
  Upload a royalty-free .mp3 in *Profile → Tour music* to use your own track.
- **Controls:** Next/Back buttons, arrow keys, scroll wheel, swipe, or click a piece in the dock.
  "Skip scene" skips a joke; each joke auto-plays only on the first visit ("Replay scene" plays it again).
- Visitors with reduced motion get calm transitions; browsers without 3D support are sent to the classic page.

### Editing the 3D code
Source lives in `frontend/tour/` (`main.js` stops & panels, `avatar.js` the character, `gags.js` the funny scenes,
`world.js` board & props, `audio.js` sounds & music). After editing, rebuild the bundle:

```bash
npm install
npm run build      # writes static/js/bd-tour.min.js
```
Then bump `?v=` in `templates/portfolio/tour.html` so browsers fetch the new file.

## Run it locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional
python manage.py migrate
python manage.py seed_portfolio  # loads your starting content
python manage.py createsuperuser
python manage.py runserver
```

Open http://127.0.0.1:8000 for the site and http://127.0.0.1:8000/admin/ for the CMS.

## What to edit first (in /admin/)

1. **Profile** – email, phone, social links, CV file, your photo, the scrolling manifesto text, Paisa ko Rahasya link.
2. **Businesses** – upload each logo and add the website URL.
3. **Projects** – add screenshots, live demo and GitHub links (buttons appear only when a link exists).
4. **Achievements** – add the tournament name and year for your chess title, plus any awards.
5. **Mission** – update the EV charging status, progress (0–100) and milestones (`[x]` marks a step done).
6. **Paisa ko Rahasya posts** – add videos/articles; they show as cards.
7. **Stats** – proof numbers (e.g. 500+ deliveries). The stats band only appears once you add some.
8. **Contact messages** – new messages arrive here (and by email if configured in `.env`).

Roles in the bento grid have a *size* (small, wide, tall, large), a chess *piece* and an *order*.

## Writing blog posts (Admin → Blog → Posts → Add)

1. Write a **title** and a one-line **excerpt** (shown on cards and in Google).
2. Add a **cover image** (optional — a chess pattern shows if empty).
3. Write the **body in Markdown**:
   `## Heading` · `**bold**` · `*italic*` · `- list item` · `[link](https://…)` · `> quote` · ``` for code.
4. Need pictures inside the post? Upload them in **Post images** at the bottom, click **Save and continue**,
   then copy the snippet shown next to each image into your text.
5. Pick **tags**, set **status = Published** and save. Set a future **publish date** to schedule a post.
   Drafts and scheduled posts are visible only to you when logged in (handy for previewing).

Your blog lives at `/blog/`, the 3 newest posts appear on the home page, and there's an RSS feed at
`/blog/feed/` plus a `/sitemap.xml` for Google.

## Adding experience as time goes on (Admin → Experience & education → Add)

Choose the type (Work, Business, Education, Leadership, Achievement), your role or degree, the organization,
start date, and either an end date or **Is current**. Add highlights one per line. New entries appear
automatically on the **Journey** timeline, newest first (use *Order* to pin something to the top).
Fill in the real start dates for the entries the seed created.

## Project structure

```
config/                 settings (SQLite by default, PostgreSQL via .env), urls
portfolio/
  models.py             Profile, Role, Business, Skill, Project, Leadership,
                        ContentItem, Achievement, Mission, ContactMessage
  admin.py              CMS configuration
  views.py              home page + contact endpoint (AJAX + normal POST)
  forms.py              contact form with honeypot spam protection
  management/commands/seed_portfolio.py
blog/                   Post, Tag, PostImage · list, tag, search, detail, RSS feed
frontend/tour/          3D tour source (Three.js) → npm run build → static/js/bd-tour.min.js
templates/
  base.html
  portfolio/home.html
  portfolio/partials/   pieces_sprite, piece, nav, footer
static/
  css/bd-portfolio.css
  js/bd-board.js          the animated chessboard
  js/bd-main.js           all scroll/hover animations, menu, nav, contact form
  vendor/               gsap, ScrollTrigger, lenis (self-hosted)
  images/               default portrait + event photo
```

## Deploying

- Set `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` and
  `DJANGO_CSRF_TRUSTED_ORIGINS` (e.g. `https://bishaldahal.com.np`).
- Set `POSTGRES_*` variables to use PostgreSQL.
- `python manage.py collectstatic` (WhiteNoise serves static files).
- Run with `gunicorn config.wsgi`.
- Uploaded media (logos, screenshots) needs persistent storage on your host.

## Troubleshooting: page looks unstyled or dark with giant chess pieces

That means the browser isn't getting `bd-portfolio.css`.

1. Open http://127.0.0.1:8000/static/css/bd-portfolio.css — you should see CSS starting with "Light, Apple-inspired".
2. Keep `DJANGO_DEBUG=True` locally (Django only serves static files in debug mode), or run `python manage.py runserver --insecure`.
3. Stop any old server (Ctrl+C) and start it from this folder.
4. Hard refresh: Safari → Option+Cmd+E (empty caches), then Cmd+R.
5. If you merged into another project, run `python manage.py findstatic css/bd-portfolio.css` to check which file is served.
