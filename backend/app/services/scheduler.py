import threading
from apscheduler.schedulers.background import BackgroundScheduler
from app.config import settings
from app.services.scraper import fetch_all_feeds
from app.services.summarizer import summarize_pending

_scheduler = BackgroundScheduler(timezone="UTC")


def _seed() -> None:
    fetch_all_feeds()
    summarize_pending()


def start_scheduler() -> None:
    _scheduler.add_job(fetch_all_feeds,   "interval", minutes=settings.fetch_interval_minutes,     id="fetch")
    _scheduler.add_job(summarize_pending, "interval", minutes=settings.summarize_interval_minutes, id="summarize")
    _scheduler.start()
    threading.Thread(target=_seed, daemon=True).start()
