from django.contrib.syndication.views import Feed

from portfolio.models import Profile

from .models import Post


class LatestPostsFeed(Feed):
    link = "/blog/"

    def title(self):
        return f"{Profile.load().name} — Blog"

    def description(self):
        return "New writing on business, technology, strategy and money."

    def items(self):
        return Post.published.all()[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt

    def item_pubdate(self, item):
        return item.published_at
