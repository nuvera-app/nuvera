import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { Font, Radius } from '../../constants/theme'

interface Props {
  count:   number
  onPress: () => void
}

export function NewArticlesBanner({ count, onPress }: Props) {
  const heightAnim  = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const visible = count > 0

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heightAnim,  { toValue: visible ? 46 : 0, bounciness: 5, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: visible ? 1  : 0, duration: 180, useNativeDriver: false }),
    ]).start()
  }, [visible])

  return (
    <Animated.View style={[styles.wrap, { height: heightAnim, opacity: opacityAnim }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.pill}>
        <Ionicons name="arrow-up" size={13} color="#1a1a2e" />
        <Text style={styles.text}>
          {count} new {count === 1 ? 'story' : 'stories'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
  },
  pill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    backgroundColor:  '#e8b84b',
    paddingVertical:  8,
    paddingHorizontal:16,
    borderRadius:     Radius.full,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.18,
    shadowRadius:     6,
    elevation:        6,
  },
  text: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, color: '#1a1a2e' },
})
