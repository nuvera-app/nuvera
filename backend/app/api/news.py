from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleOut

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=list[ArticleOut])
def list_news(
    language:  str = Query("en"),
    region:    str = Query("global"),
    category:  Optional[str] = Query(None),
    before_id: Optional[int] = Query(None),
    limit:     int = Query(15, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(Article)
    if region != "global":
        q = q.filter(Article.region == region)
    if category:
        q = q.filter(Article.category == category)
    if before_id is not None:
        q = q.filter(Article.id < before_id)
    return q.order_by(Article.id.desc()).limit(limit).all()


@router.get("/{article_id}", response_model=ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
