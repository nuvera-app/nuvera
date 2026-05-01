import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Font, Spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  title:     string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: Props) {
  const { colors } = useTheme()
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.sub, { color: colors.muted }]}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap:  { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: Font.size.xl, fontWeight: Font.weight.bold, letterSpacing: -0.5 },
  sub:   { fontSize: Font.size.xs, marginTop: 2 },
})
