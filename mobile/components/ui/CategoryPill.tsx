import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { Font } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  label:    string
  active?:  boolean
  onPress?: () => void
  small?:   boolean
}

export function CategoryPill({ label, active, onPress, small }: Props) {
  const { colors } = useTheme()
  const color   = label === 'all' ? colors.accent : (colors.category[label] ?? colors.muted)
  const display = label.charAt(0).toUpperCase() + label.slice(1)

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.pill,
        small && styles.pillSmall,
        active
          ? { backgroundColor: color }
          : { backgroundColor: `${color}18` },
      ]}
    >
      <Text style={[
        styles.text,
        small && styles.textSmall,
        { color: active ? '#fff' : color },
      ]}>
        {display}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      99,
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  text: {
    fontSize:   Font.size.sm,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: Font.size.xs,
  },
})
