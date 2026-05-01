import feedparser
import httpx
from bs4 import BeautifulSoup
from app.config import settings
from app.database import SessionLocal
from app.models.article import Article

RSS_SOURCES = [
    {"name": "BBC News",   "url": "http://feeds.bbci.co.uk/news/rss.xml",              "region": "global", "lang": "en", "category": "general"},
    {"name": "Reuters",    "url": "https://feeds.reuters.com/reuters/topNews",          "region": "global", "lang": "en", "category": "general"},
    {"name": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml",         "region": "global", "lang": "en", "category": "general"},
    {"name": "HackerNews", "url": "https://hnrss.org/frontpage",                       "region": "global", "lang": "en", "category": "tech"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/",                      "region": "global", "lang": "en", "category": "tech"},
    {"name": "Wired",      "url": "https://www.wired.com/feed/rss",                    "region": "global", "lang": "en", "category": "tech"},
    {"name": "The Hindu",  "url": "https://www.thehindu.com/feeder/default.rss",       "region": "india",  "lang": "en", "category": "general"},
    {"name": "NDTV",       "url": "https://feeds.feedburner.com/ndtvnews-top-stories", "region": "india",  "lang": "en", "category": "general"},
    {"name": "NPR",        "url": "https://feeds.npr.org/1001/rss.xml",                "region": "us",     "lang": "en", "category": "general"},
    {"name": "NASA",       "url": "https://www.nasa.gov/rss/dyn/breaking_news.rss",    "region": "global", "lang": "en", "category": "science"},
]

_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; Verax/1.0)"}


def _extract_text(url: str) -> str:
    try:
        with httpx.Client(timeout=10, follow_redirects=True) as client:
            r = client.get(url, headers=_HEADERS)
            soup = BeautifulSoup(r.text, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            return " ".join(p.get_text(strip=True) for p in soup.find_all("p"))[:3000]
    except Exception:
        return ""


def fetch_all_feeds() -> None:
    db = SessionLocal()
    try:
        for source in RSS_SOURCES:
            _fetch_feed(source, db)
    finally:
        db.close()


def _fetch_feed(source: dict, db) -> None:
    try:
        feed = feedparser.parse(source["url"])
        for entry in feed.entries[:settings.articles_per_feed]:
            url = entry.get("link", "").strip()
            if not url or db.query(Article).filter(Article.url == url).first():
                continue
            db.add(Article(
                title=entry.get("title", "")[:500],
                url=url,
                text=_extract_text(url),
                source_name=source["name"],
                region=source["region"],
                language=source["lang"],
                category=source["category"],
            ))
        db.commit()
    except Exception:
        db.rollback()
