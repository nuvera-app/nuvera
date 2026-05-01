import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BiasTag } from '../../components/ui/BiasTag'
import { ArticleSkeleton } from '../../components/ui/Skeleton'
import { Font, Radius, Spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useArticle } from '../../hooks/useNews'
import { recordView } from '../../lib/preferences'

const { width: W } = Dimensions.get('window')
const IMAGE_H = 260

const BIAS_COLOR: Record<string, string> = {
  left:           '#3b82f6',
  'center-left':  '#60a5fa',
  center:         '#6b7280',
  'center-right': '#f97316',
  right:          '#ef4444',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z'
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Split RSS summary into readable paragraphs. */
function splitContent(raw: string): string[] {
  return raw
    .split(/\n{2,}|\n/)
    .map(p => p.trim())
    .filter(p => p.length > 30)
}

export default function ArticleScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>()
  const router     = useRouter()
  const { colors } = useTheme()
  const insets     = useSafeAreaInsets()
  const { data, isLoading } = useArticle(Number(id))
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (data?.id) recordView(data.id, data.author)
  }, [data?.id])

  const hasImage  = !!data?.image_url && !imgError
  const catColor  = data ? (colors.category[data.category] ?? colors.muted) : colors.muted
  const biasColor = data?.bias ? (BIAS_COLOR[data.bias] ?? colors.muted) : colors.muted

  const onShare = async () => {
    if (!data) return
    await Share.share({ title: data.title, url: data.url, message: `${data.title}\n${data.url}` })
  }

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
          {Array(3).fill(null).map((_, i) => <ArticleSkeleton key={i} />)}
        </ScrollView>
      </View>
    )
  }

  if (!data) return null

  const catLabel   = data.category.charAt(0).toUpperCase() + data.category.slice(1)
  const tags       = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const rssContent = data.rss_summary?.trim() ?? null
  const paragraphs = rssContent ? splitContent(rssContent) : []

  /* AI state:
     summarized=true  + summary present  → show AI card
     summarized=false                    → still in queue, show processing pill
     summarized=true  + no summary       → AI had no text to process, show nothing */
  const aiReady    = data.summarized && !!data.summary
  const aiPending  = !data.summarized
  const aiSkipped  = data.summarized && !data.summary

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Floating action bar (absolute over hero, relative otherwise) ── */}
      <View style={[
        styles.topBar,
        {
          paddingTop:        insets.top + 4,
          backgroundColor:   hasImage ? 'transparent' : colors.background,
          borderBottomColor: hasImage ? 'transparent' : colors.border,
          position:          hasImage ? 'absolute' : 'relative',
          zIndex:            20,
          width:             '100%',
        },
      ]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, hasImage && styles.iconBtnGlass]}
        >
          <Ionicons name="arrow-back" size={22} color={hasImage ? '#fff' : colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onShare}
          style={[styles.iconBtn, hasImage && styles.iconBtnGlass]}
        >
          <Ionicons name="share-outline" size={22} color={hasImage ? '#fff' : colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>

        {/* ── Hero image or gradient placeholder ── */}
        {hasImage ? (
          <View style={{ width: W, height: IMAGE_H }}>
            <Image
              source={{ uri: data.image_url! }}
              style={{ width: W, height: IMAGE_H }}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.5)']}
              locations={[0, 0.38, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroBadges}>
              <View style={[styles.catPill, { backgroundColor: catColor }]}>
                <Text style={styles.catPillText}>{catLabel}</Text>
              </View>
              {data.bias && data.bias !== 'neutral' && (
                <View style={[styles.catPill, { backgroundColor: biasColor }]}>
                  <Text style={styles.catPillText}>{data.bias.replace('-', ' ')}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={[catColor + 'dd', catColor + '55', colors.background]}
            style={styles.gradientHero}
          >
            <View style={[styles.gradientCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.gradientLetter}>{data.source_name.charAt(0)}</Text>
            </View>
            <View style={styles.heroBadges}>
              <View style={[styles.catPill, { backgroundColor: 'rgba(0,0,0,0.28)' }]}>
                <Text style={styles.catPillText}>{catLabel}</Text>
              </View>
              {data.bias && data.bias !== 'neutral' && (
                <View style={[styles.catPill, { backgroundColor: biasColor + 'cc' }]}>
                  <Text style={styles.catPillText}>{data.bias.replace('-', ' ')}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        )}

        <View style={styles.body}>

          {/* Bias tag (no-image path already shows in gradient; show for clarity below) */}
          {!hasImage && data.bias && data.bias !== 'neutral' && (
            <View style={{ marginTop: Spacing.sm }}>
              <BiasTag bias={data.bias} confidence={data.bias_confidence} />
            </View>
          )}

          {/* ── Title ── */}
          <Text style={[styles.title, { color: colors.text }]}>{data.title}</Text>

          {/* ── Byline ── */}
          <View style={[styles.byline, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <View style={[styles.sourceAvatar, { backgroundColor: catColor + '22' }]}>
              <Text style={[styles.sourceAvatarLetter, { color: catColor }]}>
                {data.source_name.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sourceName, { color: colors.text }]}>{data.source_name}</Text>
              {data.author && (
                <Text style={[styles.authorLine, { color: colors.muted }]}>by {data.author}</Text>
              )}
            </View>
            <View style={styles.bylineRight}>
              <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(data.published_at)}</Text>
              <View style={[styles.readTimePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={11} color={colors.muted} />
                <Text style={[styles.readTimeText, { color: colors.muted }]}>
                  {Math.ceil(data.read_time / 60)} min
                </Text>
              </View>
            </View>
          </View>

          {/* ── AI Summary (only when Ollama has finished and produced a summary) ── */}
          {aiReady && (
            <>
              <SectionLabel label="AI Summary" icon="sparkles" color={colors.accent} />
              <View style={[styles.summaryCard, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '35' }]}>
                <View style={[styles.summaryCardHeader, { borderBottomColor: colors.accent + '25' }]}>
                  <View style={[styles.aiDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.summaryCardLabel, { color: colors.accent }]}>Summarised by Verax AI</Text>
                </View>
                <Text style={[styles.summaryText, { color: colors.text }]}>{data.summary}</Text>
              </View>
            </>
          )}

          {/* ── Article content (from RSS — always accurate) ── */}
          {paragraphs.length > 0 && (
            <>
              <SectionLabel
                label={aiReady ? 'Full Story' : 'Article'}
                icon={aiReady ? 'newspaper-outline' : 'document-text-outline'}
                color={colors.text}
              />
              {paragraphs.map((para, i) => (
                <Text key={i} style={[styles.paragraph, { color: colors.text }]}>
                  {para}
                </Text>
              ))}
              {/* Show processing pill only if AI hasn't run yet */}
              {aiPending && (
                <View style={styles.aiPendingRow}>
                  <View style={[styles.aiPendingPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="hourglass-outline" size={11} color={colors.muted} />
                    <Text style={[styles.aiPendingText, { color: colors.muted }]}>AI summary processing…</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── Bias Analysis ── */}
          {data.bias_reason && (
            <>
              <SectionLabel label="Bias Analysis" icon="analytics-outline" color={biasColor} />
              <View style={[styles.biasCard, { backgroundColor: biasColor + '0D', borderColor: biasColor + '30' }]}>
                <View style={styles.biasCardHeader}>
                  <View style={[styles.biasDot, { backgroundColor: biasColor }]} />
                  <Text style={[styles.biasRating, { color: biasColor }]}>
                    {data.bias?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    {data.bias_confidence ? ` · ${data.bias_confidence}% confidence` : ''}
                  </Text>
                </View>
                <Text style={[styles.biasReason, { color: colors.muted }]}>{data.bias_reason}</Text>
              </View>
            </>
          )}

          {/* ── Tags ── */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(t => (
                <View key={t} style={[styles.tagPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.muted }]}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Source card ── */}
          <SectionLabel label="Source" icon="globe-outline" color={colors.text} />
          <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sourceCardTop}>
              <View style={[styles.sourceCardAvatar, { backgroundColor: catColor + '18' }]}>
                <Text style={[styles.sourceCardAvatarLetter, { color: catColor }]}>
                  {data.source_name.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sourceCardName, { color: colors.text }]}>{data.source_name}</Text>
                <View style={styles.sourceCardBadges}>
                  <View style={[styles.badge, { backgroundColor: colors.border }]}>
                    <Text style={[styles.badgeText, { color: colors.muted }]}>{data.region.toUpperCase()}</Text>
                  </View>
                  {data.language && (
                    <View style={[styles.badge, { backgroundColor: colors.border }]}>
                      <Text style={[styles.badgeText, { color: colors.muted }]}>{data.language.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.readOriginalBtn, { backgroundColor: colors.accent }]}
              onPress={() => Linking.openURL(data.url)}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={15} color="#1a1a2e" />
              <Text style={styles.readOriginalText}>Read full article</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, { color: colors.border }]}>
            Verax · The truth-teller
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

function SectionLabel({ label, icon, color }: { label: string; icon: string; color: string }) {
  const { colors } = useTheme()
  return (
    <View style={labelStyles.row}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[labelStyles.text, { color }]}>{label}</Text>
      <View style={[labelStyles.line, { backgroundColor: colors.border }]} />
    </View>
  )
}

const labelStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  text: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, textTransform: 'uppercase', letterSpacing: 0.9 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
})

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },
  iconBtnGlass: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  heroBadges: {
    position: 'absolute', bottom: Spacing.md, left: Spacing.md,
    flexDirection: 'row', gap: 6,
  },
  catPill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  catPillText: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, color: '#fff' },

  gradientHero: {
    width: W, height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  gradientCircle: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  gradientLetter: { fontSize: 30, fontWeight: Font.weight.bold, color: '#fff' },

  body: { paddingHorizontal: Spacing.md },

  title: {
    fontSize:      Font.size.xxl,
    fontWeight:    Font.weight.bold,
    lineHeight:    Font.size.xxl * 1.28,
    letterSpacing: -0.5,
    marginTop:     Spacing.md,
    marginBottom:  Spacing.md,
  },

  byline: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingVertical:   Spacing.sm + 2,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom:      Spacing.xs,
  },
  sourceAvatar:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sourceAvatarLetter: { fontSize: Font.size.md, fontWeight: Font.weight.bold },
  sourceName:         { fontSize: Font.size.sm, fontWeight: Font.weight.bold },
  authorLine:         { fontSize: Font.size.xs, marginTop: 1 },
  bylineRight:        { alignItems: 'flex-end', gap: 4 },
  dateText:           { fontSize: Font.size.xs },
  readTimePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  readTimeText: { fontSize: Font.size.xs },

  summaryCard: {
    borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.xs,
  },
  summaryCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: Spacing.sm + 2, borderBottomWidth: 1,
  },
  aiDot:            { width: 8, height: 8, borderRadius: 4 },
  summaryCardLabel: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryText:      { fontSize: Font.size.md, lineHeight: Font.size.md * 1.75, padding: Spacing.md },

  paragraph: {
    fontSize:     Font.size.md + 1,
    lineHeight:   (Font.size.md + 1) * 1.8,
    marginBottom: Spacing.md,
    letterSpacing: 0.1,
  },

  aiPendingRow:  { flexDirection: 'row', marginTop: -Spacing.xs, marginBottom: Spacing.sm },
  aiPendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  aiPendingText: { fontSize: Font.size.xs },

  biasCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  biasCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  biasDot:        { width: 8, height: 8, borderRadius: 4 },
  biasRating:     { fontSize: Font.size.sm, fontWeight: Font.weight.semibold },
  biasReason:     { fontSize: Font.size.sm, lineHeight: Font.size.sm * 1.6 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  tagPill: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.sm },
  tagText: { fontSize: Font.size.xs },

  sourceCard: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: Spacing.md },
  sourceCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  sourceCardAvatar: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceCardAvatarLetter: { fontSize: Font.size.xl, fontWeight: Font.weight.bold },
  sourceCardName:   { fontSize: Font.size.md, fontWeight: Font.weight.bold, marginBottom: 4 },
  sourceCardBadges: { flexDirection: 'row', gap: 6 },
  badge:            { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm },
  badgeText:        { fontSize: Font.size.xs, fontWeight: Font.weight.semibold },

  readOriginalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    margin: Spacing.md, marginTop: 0,
    paddingVertical: Spacing.sm + 4, borderRadius: Radius.md,
  },
  readOriginalText: { fontSize: Font.size.sm, fontWeight: Font.weight.bold, color: '#1a1a2e' },

  footer: { textAlign: 'center', fontSize: Font.size.xs, marginTop: Spacing.xs, marginBottom: Spacing.md },
})
