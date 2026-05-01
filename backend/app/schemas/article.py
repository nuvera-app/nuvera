from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ArticleOut(BaseModel):
    id:              int
    title:           str
    url:             str
    summary:         Optional[str]
    source_name:     str
    category:        str
    region:          str
    language:        str
    bias:            Optional[str]
    bias_confidence: Optional[int]
    bias_reason:     Optional[str]
    tags:            Optional[str]
    read_time:       int
    published_at:    Optional[datetime]
    created_at:      datetime
    summarized:      bool = False
    author:          Optional[str]
    rss_summary:     Optional[str]
    source_tags:     Optional[str]
    state:           Optional[str] = None
    image_url:       Optional[str] = None

    model_config = {"from_attributes": True}


class HomeSection(BaseModel):
    label:    str
    articles: list[ArticleOut]


class HomeFeed(BaseModel):
    breaking:   list[ArticleOut]
    for_you:    list[ArticleOut]
    local:      Optional[HomeSection]
    trending:   list[ArticleOut]
    global_top: list[ArticleOut]
