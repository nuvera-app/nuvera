import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArticleCard } from '../../components/ui/ArticleCard'
import { ArticleSkeleton } from '../../components/ui/Skeleton'
import { BreakingCard } from '../../components/ui/BreakingCard'
import { CategoryPill } from '../../components/ui/CategoryPill'
import { NewArticlesBanner } from '../../components/ui/NewArticlesBanner'
import { Font, Spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useHomeFeed, useRecommendedNews } from '../../hooks/useNews'
import { Article, HomeFeed, RecommendedParams } from '../../lib/api'
import {
  getPreferences, getViewedIds, getViewedAuthors,
  getUserState, UserPreferences,
} from '../../lib/preferences'

const ALL_CATEGORIES = ['general','tech','science','health','business','sports','politics','environment','entertainment','gaming','crypto']
const ALL_REGIONS    = ['global','us','uk','india','australia','canada','europe','middle-east','africa','latam','asia']
const POLL_MS        = 30_000

// ─────────────────────────────────────────────────────────────────────────────
// Root screen — loads prefs then mounts Feed
// ─────────────────────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const { colors } = useTheme()
  const [prefs,         setPrefs        ] = useState<UserPreferences | null>(null)
  const [viewedIds,     setViewedIds    ] = useState<number[]>([])
  const [viewedAuthors, setViewedAuthors] = useState<string[]>([])
  const [userState,     setUserState    ] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPreferences(), getViewedIds(), getViewedAuthors(), getUserState()])
      .then(([p, ids, authors, st]) => {
        setPrefs(p); setViewedIds(ids); setViewedAuthors(authors); setUserState(st)
      })
  }, [])

  if (!prefs) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <FlatList
          data={Array(6).fill(null)}
          keyExtractor={(_, i) => `sk-${i}`}
          renderItem={() => <ArticleSkeleton />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    )
  }

  return (
    <Feed
      prefs={prefs}
      viewedIds={viewedIds}
      viewedAuthors={viewedAuthors}
      userState={userState}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed
// ─────────────────────────────────────────────────────────────────────────────
function Feed({ prefs, viewedIds, viewedAuthors, userState }: {
  prefs: UserPreferences
  viewedIds: number[]
  viewedAuthors: string[]
  userState: string | null
}) {
  const { colors, isDark, toggle } = useTheme()
  const queryClient = useQueryClient()
  const listRef = useRef<FlatList>(null)

  const [activeCategory, setActiveCategory] = useState<string | undefined>()
  const [activeRegion,   setActiveRegion  ] = useState<string | undefined>()
  const [refreshing,     setRefreshing    ] = useState(false)

  // Two-layer state: displayedFeed shown now, pendingFeed waiting for user approval.
  const [displayedFeed, setDisplayedFeed] = useState<HomeFeed | null>(null)
  const [pendingFeed,   setPendingFeed  ] = useState<HomeFeed | null>(null)
  const [newCount,      setNewCount     ] = useState(0)
  const displayedTopId = useRef<number | null>(null)

  const isPillActive = !!activeCategory || !!activeRegion
  const hasPrefs     = prefs.categories.length > 0 || prefs.regions.some(r => r !== 'global')

  // IDs shown in the header sections (breaking + local + trending).
  // Passed as extra viewed_ids to the body feed so articles don't repeat.
  const headerIds = useMemo(() => {
    if (!displayedFeed) return []
    return [
      ...displayedFeed.breaking.map(a => a.id),
      ...(displayedFeed.local?.articles ?? []).map(a => a.id),
      ...displayedFeed.trending.map(a => a.id),
    ]
  }, [displayedFeed])

  // ── Home / sections feed (header data + polling) ─────────────────────────
  const homeParams = useMemo(() => ({
    categories:     prefs.categories.join(','),
    regions:        prefs.regions.join(','),
    user_state:     userState ?? undefined,
    viewed_ids:     viewedIds.join(','),
    viewed_authors: viewedAuthors.join('|||'),
  }), [prefs, userState, viewedIds, viewedAuthors])

  const {
    data: latestFeed, isLoading: homeLoading, isError: homeError,
    refetch: homeRefetch,
  } = useHomeFeed(homeParams, { enabled: !isPillActive, refetchInterval: POLL_MS })

  useEffect(() => {
    if (!latestFeed) return
    if (!displayedFeed) {
      setDisplayedFeed(latestFeed)
      displayedTopId.current = latestFeed.breaking[0]?.id ?? null
      return
    }
    const newIds  = latestFeed.breaking.map(a => a.id)
    const topId   = displayedTopId.current
    const nNew    = topId !== null ? newIds.filter(id => id > topId).length : 0
    if (nNew > 0) { setPendingFeed(latestFeed); setNewCount(nNew) }
    else          { setDisplayedFeed(latestFeed) }
  }, [latestFeed])

  const applyPending = useCallback(() => {
    if (!pendingFeed) return
    setDisplayedFeed(pendingFeed)
    displayedTopId.current = pendingFeed.breaking[0]?.id ?? null
    setPendingFeed(null); setNewCount(0)
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [pendingFeed])

  // ── Body: infinite recommended feed (powers load more) ───────────────────
  const bodyParams = useMemo<RecommendedParams>(() => ({
    filter_region:   activeRegion || undefined,
    filter_category: activeCategory && (!activeRegion || activeRegion === 'global') ? activeCategory : undefined,
    categories:      activeCategory ? activeCategory : prefs.categories.join(','),
    regions:         activeRegion   ? activeRegion   : prefs.regions.join(','),
    // Merge real viewed history with header-displayed IDs to avoid repetition
    viewed_ids:      [...viewedIds, ...headerIds].join(','),
    viewed_authors:  viewedAuthors.join('|||'),
    user_state:      userState ?? undefined,
  }), [prefs, viewedIds, viewedAuthors, activeCategory, activeRegion, userState, headerIds])

  const {
    data: bodyData, isLoading: bodyLoading, isError: bodyError,
    refetch: bodyRefetch,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useRecommendedNews(bodyParams)

  const bodyArticles = useMemo<Article[]>(() => {
    const seen = new Set<number>([...headerIds])
    return (bodyData?.pages.flatMap(p => p) ?? []).filter(a => {
      if (seen.has(a.id)) return false; seen.add(a.id); return true
    })
  }, [bodyData, headerIds])

  const canLoadMore = useRef(false)
  canLoadMore.current = !!hasNextPage && !isFetchingNextPage

  const onEndReached = useCallback(() => {
    if (canLoadMore.current) fetchNextPage()
  }, [fetchNextPage])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (isPillActive) {
        // Reset infinite query back to page 0, then refetch fresh
        await queryClient.resetQueries({ queryKey: ['news', 'recommended', bodyParams] })
      } else {
        // Run both in parallel — home sections + body feed
        const [homeRes] = await Promise.all([
          homeRefetch(),
          queryClient.resetQueries({ queryKey: ['news', 'recommended', bodyParams] }),
        ])
        if (homeRes.data) {
          setDisplayedFeed(homeRes.data)
          displayedTopId.current = homeRes.data.breaking[0]?.id ?? null
          setPendingFeed(null)
          setNewCount(0)
        }
      }
    } catch {
      // network error — spinner dismisses, user sees existing content
    } finally {
      setRefreshing(false)
    }
  }, [isPillActive, homeRefetch, bodyParams, queryClient])

  const isLoading = isPillActive ? bodyLoading : homeLoading && !displayedFeed
  const isError   = isPillActive ? bodyError   : homeError && !displayedFeed

  // ── Pills ─────────────────────────────────────────────────────────────────
  const feedLabel = activeCategory
    ? activeCategory
    : activeRegion ? activeRegion
    : hasPrefs ? 'for you' : 'top stories'

  const visibleCategories = hasPrefs
    ? ['all', ...prefs.categories, ...ALL_CATEGORIES.filter(c => !prefs.categories.includes(c))]
    : ['all', ...ALL_CATEGORIES]

  const visibleRegions = hasPrefs && prefs.regions.some(r => r !== 'global')
    ? ['for you', ...ALL_REGIONS]
    : ALL_REGIONS

  // ── ListHeaderComponent — breaking + local + trending ────────────────────
  const ListHeader = useCallback(() => {
    if (isPillActive || !displayedFeed) return null
    const feed = displayedFeed
    return (
      <View>
        {/* Breaking hero */}
        {feed.breaking.length > 0 && (
          <>
            <SectionChip label="⚡ Breaking" />
            <BreakingCard article={feed.breaking[0]} hero />
            {feed.breaking.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.breakingRow}
              >
                {feed.breaking.slice(1).map(a => <BreakingCard key={a.id} article={a} />)}
                <View style={{ width: Spacing.md }} />
              </ScrollView>
            )}
          </>
        )}

        {/* Local news */}
        {feed.local && feed.local.articles.length > 0 && (
          <>
            <SectionChip label={`📍 ${feed.local.label}`} />
            {feed.local.articles.slice(0, 3).map(a => <ArticleCard key={a.id} article={a} />)}
          </>
        )}

        {/* Trending */}
        {feed.trending.length > 0 && (
          <>
            <SectionChip label="🔥 Trending" />
            {feed.trending.slice(0, 3).map(a => <ArticleCard key={a.id} article={a} />)}
          </>
        )}

        {/* Body divider */}
        <SectionChip label="✦ Your Feed" accent />
      </View>
    )
  }, [isPillActive, displayedFeed, colors])

  const ListFooter = useCallback(() =>
    isFetchingNextPage
      ? <View style={styles.footerLoader}><ActivityIndicator color={colors.accent} size="small" /></View>
      : null
  , [isFetchingNextPage, colors.accent])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Top bar */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: colors.accent }]}>verax</Text>
          <Text style={[styles.feedLabel, { color: colors.muted }]}>{feedLabel}</Text>
        </View>
        <TouchableOpacity onPress={toggle} style={styles.themeBtn} activeOpacity={0.7}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <View style={styles.pillWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {visibleCategories.map(c => {
            const isAll    = c === 'all'
            const isActive = isAll ? !activeCategory : activeCategory === c
            return (
              <CategoryPill key={c} label={c} active={isActive}
                onPress={() => setActiveCategory(isAll || activeCategory === c ? undefined : c)} />
            )
          })}
        </ScrollView>
      </View>

      {/* Region pills */}
      <View style={styles.pillWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {visibleRegions.map(r => {
            const isForYou = r === 'for you'
            const isActive = isForYou ? !activeRegion : activeRegion === r
            return (
              <CategoryPill key={r} label={r} small active={isActive}
                onPress={() => setActiveRegion(isForYou || activeRegion === r ? undefined : r)} />
            )
          })}
        </ScrollView>
      </View>

      <View style={[styles.rule, { backgroundColor: colors.border }]} />

      {/* Inline banner — no absolute positioning, slides open like an accordion */}
      {!isPillActive && <NewArticlesBanner count={newCount} onPress={applyPending} />}

      {/* Feed */}
      {isLoading ? (
        <FlatList
          data={Array(6).fill(null)}
          keyExtractor={(_, i) => `sk-${i}`}
          renderItem={() => <ArticleSkeleton />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚡</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Cannot reach backend</Text>
          <Text style={[styles.errorSub, { color: colors.muted }]}>Make sure the backend is running on port 8000</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={bodyArticles}
          keyExtractor={item => `a-${item.id}`}
          renderItem={({ item }) => <ArticleCard article={item} />}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No articles yet.{'\n'}Check back in a moment.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section chip divider — thin inline label between sections
// ─────────────────────────────────────────────────────────────────────────────
function SectionChip({ label, accent = false }: { label: string; accent?: boolean }) {
  const { colors } = useTheme()
  return (
    <View style={styles.chipRow}>
      <View style={[styles.chipLine, { backgroundColor: colors.border }]} />
      <View style={[styles.chipBadge, { backgroundColor: accent ? colors.accent + '18' : colors.card, borderColor: accent ? colors.accent + '40' : colors.border }]}>
        <Text style={[styles.chipText, { color: accent ? colors.accent : colors.muted }]}>{label}</Text>
      </View>
      <View style={[styles.chipLine, { backgroundColor: colors.border }]} />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
  },
  logo:      { fontSize: Font.size.xxl, fontWeight: Font.weight.bold, letterSpacing: -1 },
  feedLabel: { fontSize: Font.size.xs, marginTop: 2, letterSpacing: 0.3, textTransform: 'uppercase' },
  themeBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillWrap:  { paddingVertical: Spacing.xs + 2 },
  pillRow:   { paddingHorizontal: Spacing.md, gap: Spacing.xs + 2, alignItems: 'center' },
  rule:      { height: 1, marginHorizontal: Spacing.md, marginBottom: 2 },
  list:         { paddingTop: Spacing.sm, paddingBottom: Spacing.xl + 20 },
  breakingRow:  { paddingBottom: Spacing.sm, paddingTop: Spacing.xs },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
  chipRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  chipLine:  { flex: 1, height: 1 },
  chipBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  chipText:  { fontSize: Font.size.xs, fontWeight: Font.weight.semibold, letterSpacing: 0.3 },
  center:      { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl * 2 },
  errorIcon:   { fontSize: 36, marginBottom: Spacing.sm },
  errorTitle:  { fontSize: Font.size.lg, fontWeight: Font.weight.semibold, marginBottom: Spacing.xs },
  errorSub:    { fontSize: Font.size.sm, textAlign: 'center' },
  emptyText:   { fontSize: Font.size.md, textAlign: 'center', lineHeight: Font.size.md * 1.6 },
})
