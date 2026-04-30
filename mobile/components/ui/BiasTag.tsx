import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Font } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  bias:        string | null
  confidence?: number | null
}

const LABEL: Record<string, string> = {
  left:           'Left',
  'center-left':  'C-Left',
  center:         'Center',
  'center-right': 'C-Right',
  right:          'Right',
  neutral:        'Neutral',
}

export function BiasTag({ bias, confidence }: Props) {
  const { colors } = useTheme()
  if (!bias || bias === 'neutral') return null
  const color = colors.bias[bias] ?? colors.muted

  return (
    <View style={[styles.wrap, { backgroundColor: `${color}18` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>
        {LABEL[bias] ?? bias}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      99,
  },
  dot: {
    width: 5, height: 5, borderRadius: 3,
  },
  text: {
    fontSize:   Font.size.xs,
    fontWeight: '600',
  },
})
