# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2025-04-30

### Added
- RSS aggregation from 10 sources across Global, India, US, and Science categories
- AI summarisation via Ollama (local, free) and Groq (cloud free tier) — switchable via `AI_PROVIDER` env var
- Political bias detection with confidence score and reason per article
- Auto-categorisation into Tech, Science, Health, Sports, Politics, Business, Entertainment, Environment, General
- Tag extraction and estimated read time per article
- FastAPI backend with cursor-based pagination (immune to feed drift)
- APScheduler background jobs — RSS fetch every 30 min, summarise every 2 min
- React Native app for iOS and Android (Expo SDK 54)
- Article feed with infinite scroll and pull-to-refresh
- Article detail screen with AI summary box and bias analysis
- Category and region filter pills
- Light and dark theme — follows system default, user preference persisted via AsyncStorage
- MIT License

---

## [Unreleased]

### Planned
- Multi-language support (Hindi, Tamil, Spanish, French, Arabic)
- Bookmarks — save articles offline
- Search across headlines and summaries
- Push notifications for breaking news
- User-defined RSS sources
- PostgreSQL + Supabase production setup
- iOS App Store and Google Play release
