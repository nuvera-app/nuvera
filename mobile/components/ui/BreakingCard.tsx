import { useRouter } from 'expo-router'
import React from 'react'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Font, Radius, Spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { Article } from '../../lib/api'

const W = Dimensions.get('window').width
const HERO_W  = W - Spacing.md * 2
const CARD_W  = W * 0.72

function timeAgo(iso: string | null | undefined) {
  if (!iso) return ''
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z'
  const m = Math.floor((Date.now() - new Date(utc).getTime()) / 60_000)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

interface Props { article: Article; hero?: boolean }

export function BreakingCard({ article, hero = false }: Props) {
  const router     = useRouter()
  const { colors } = useTheme()
  const catColor   = colors.category[article.category] ?? colors.muted

  return (
    <TouchableOpacity
      style={[
        hero ? styles.heroCard : styles.card,
        { backgroundColor: colors.card },
      ]}
      activeOpacity={0.8}
      onPress={() => router.push(`/article/${article.id}`)}
    >
      <View style={[styles.bar, { backgroundColor: catColor, height: hero ? 4 : 3 }]} />
      <View style={[styles.body, hero && styles.heroBody]}>
        <View style={styles.meta}>
          <View style={[styles.dot, { backgroundColor: catColor }]} />
          <Text style={[styles.source, { color: colors.muted }]} numberOfLines={1}>
            {article.source_name}
          </Text>
          <Text style={[styles.time, { color: colors.muted }]}>
            {' · '}{timeAgo(article.published_at ?? article.created_at)}
          </Text>
        </View>
        <Text
          style={[styles.title, { color: colors.text, fontSize: hero ? Font.size.xl : Font.size.md }]}
          numberOfLines={hero ? 4 : 3}
        >
          {article.title}
        </Text>
        {hero && article.summary && (
          <Text style={[styles.summary, { color: colors.muted }]} numberOfLines={2}>
            {article.summary}
          </Text>
        )}
        <View style={[styles.badge, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
          <Text style={[styles.badgeText, { color: catColor }]}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    width:        HERO_W,
    alignSelf:    'center',
    borderRadius: Radius.lg,
    overflow:     'hidden',
    marginBottom: Spacing.sm,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity:0.10,
    shadowRadius: 8,
    elevation:    4,
  },
  card: {
    width:        CARD_W,
    borderRadius: Radius.lg,
    overflow:     'hidden',
    marginLeft:   Spacing.md,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity:0.08,
    shadowRadius: 6,
    elevation:    3,
  },
  bar:      { },
  body:     { padding: Spacing.md, gap: 8 },
  heroBody: { padding: Spacing.md + 2, gap: 10 },
  meta:     { flexDirection: 'row', alignItems: 'center' },
  dot:      { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  source:   { fontSize: Font.size.xs, fontWeight: Font.weight.semibold, flexShrink: 1 },
  time:     { fontSize: Font.size.xs, flexShrink: 0 },
  title:    { fontWeight: Font.weight.bold, lineHeight: Font.size.xl * 1.3, letterSpacing: -0.3 },
  summary:  { fontSize: Font.size.sm, lineHeight: Font.size.sm * 1.5 },
  badge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  badgeText:{ fontSize: Font.size.xs, fontWeight: Font.weight.semibold },
})
