import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Font, Radius, Spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

function Row({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.muted }]}>{value}</Text>
    </View>
  )
}

export default function SettingsScreen() {
  const { colors, isDark, toggle } = useTheme()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <TouchableOpacity onPress={toggle} style={styles.themeBtn} activeOpacity={0.7}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>About</Text>
        <Row label="Version"    value="1.0.0"                    colors={colors} />
        <Row label="License"    value="MIT — Free & Open Source" colors={colors} />
        <Row label="AI Model"   value="Llama 3.2 via Ollama"     colors={colors} />
        <Row label="Ads"        value="Zero. Forever."           colors={colors} />
        <Row label="Tracking"   value="None. Your data is yours."colors={colors} />
        <Row label="Appearance" value={isDark ? 'Dark' : 'Light'}colors={colors} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>Links</Text>
        <TouchableOpacity
          style={[styles.link, { borderTopColor: colors.border }]}
          onPress={() => Linking.openURL('https://github.com/nuvera-app/nuvera')}
        >
          <Text style={[styles.linkText, { color: colors.accent }]}>GitHub — nuvera-app/nuvera</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.mission, { color: colors.muted }]}>
        Less noise. More truth.{'\n'}
        Free. Open. Forever.
      </Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.sm,
    paddingBottom:     Spacing.sm,
  },
  title:  { fontSize: Font.size.xxl, fontWeight: Font.weight.bold },
  themeBtn: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
    borderRadius:     Radius.lg,
    overflow:         'hidden',
  },
  sectionTitle: {
    fontSize:          Font.size.xs,
    fontWeight:        Font.weight.semibold,
    textTransform:     'uppercase',
    letterSpacing:     0.8,
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.xs,
  },
  row: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    borderTopWidth:    1,
  },
  rowLabel: { fontSize: Font.size.md },
  rowValue: { fontSize: Font.size.sm },
  link: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    borderTopWidth:    1,
  },
  linkText: { fontSize: Font.size.md, fontWeight: Font.weight.medium },
  mission:  {
    textAlign:  'center',
    fontSize:   Font.size.sm,
    lineHeight: Font.size.sm * 1.8,
    marginTop:  Spacing.xl,
  },
})
