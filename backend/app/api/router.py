from fastapi import APIRouter
from app.api import news

router = APIRouter()
router.include_router(news.router)
